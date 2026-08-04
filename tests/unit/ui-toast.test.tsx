import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast, type ToastVariant } from "@/shared/ui/toast";

/**
 * Los avisos son el canal por el que la aplicación comunica el resultado de casi toda
 * acción. Lo que se prueba aquí es su comportamiento ACCESIBLE, que estaba
 * implementado con criterio (cita WCAG 2.2.1 en el código) y sin ninguna prueba:
 *
 *  - solo los avisos urgentes interrumpen al lector de pantalla;
 *  - el auto-cierre se pausa mientras el puntero o el foco están encima.
 */
function Disparador({ variant, title = "Aviso" }: { variant?: ToastVariant; title?: string }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast({ title, variant, description: "Detalle" })}>
      Lanzar
    </button>
  );
}

function renderConProvider(ui: React.ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

async function lanzar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Lanzar" }));
}

describe("toast", () => {
  it("muestra el aviso con su título y descripción", async () => {
    const user = userEvent.setup();
    renderConProvider(<Disparador title="Guardado correctamente" />);

    await lanzar(user);

    expect(await screen.findByText("Guardado correctamente")).toBeInTheDocument();
    expect(screen.getByText("Detalle")).toBeInTheDocument();
  });

  it("los avisos de error usan role=alert y aria-live=assertive", async () => {
    // `assertive` interrumpe la lectura en curso. Es correcto para un error y molesto
    // para todo lo demás.
    const user = userEvent.setup();
    renderConProvider(<Disparador variant="danger" />);

    await lanzar(user);

    const aviso = await screen.findByRole("alert");
    expect(aviso).toHaveAttribute("aria-live", "assertive");
    expect(aviso).toHaveAttribute("aria-atomic", "true");
  });

  it("los avisos de advertencia también son urgentes", async () => {
    const user = userEvent.setup();
    renderConProvider(<Disparador variant="warning" />);

    await lanzar(user);

    expect(await screen.findByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("los avisos informativos usan role=status y aria-live=polite", async () => {
    const user = userEvent.setup();
    renderConProvider(<Disparador variant="info" />);

    await lanzar(user);

    const aviso = await screen.findByRole("status");
    expect(aviso).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("los avisos de éxito NO interrumpen al lector de pantalla", async () => {
    const user = userEvent.setup();
    renderConProvider(<Disparador variant="success" />);

    await lanzar(user);

    expect(await screen.findByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("se cierra solo pasado el tiempo de espera", async () => {
    jest.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderConProvider(<Disparador title="Efímero" />);

      await lanzar(user);
      expect(screen.getByText("Efímero")).toBeInTheDocument();

      // 6 s de auto-cierre + 220 ms de animación de salida. Se envuelve en `act` para
      // que React procese las dos actualizaciones de estado que disparan los
      // temporizadores (marcar como saliente y retirar de la cola).
      act(() => {
        jest.advanceTimersByTime(6_000 + 400);
      });

      expect(screen.queryByText("Efímero")).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("el auto-cierre se pausa con el puntero encima (WCAG 2.2.1)", async () => {
    jest.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderConProvider(<Disparador title="Persistente" />);

      await lanzar(user);
      const aviso = await screen.findByRole("status");

      await user.hover(aviso);
      act(() => {
        jest.advanceTimersByTime(20_000);
      });

      // Sin la pausa, a los 6 s habría desaparecido y no se podría leer ni pulsar.
      expect(screen.getByText("Persistente")).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("useToast fuera del provider falla de forma explícita", () => {
    // Un aviso que se pierde en silencio es peor que un error claro en desarrollo.
    const silenciarError = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Disparador />)).toThrow(/ToastProvider/);
    } finally {
      silenciarError.mockRestore();
    }
  });
});
