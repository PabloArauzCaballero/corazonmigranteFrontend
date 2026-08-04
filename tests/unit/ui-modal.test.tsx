import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/shared/ui/modal";

/**
 * `Modal` concentra la lógica de accesibilidad más delicada del proyecto: trampa de
 * foco, restauración de foco, cierre con Escape y filtrado de elementos ocultos.
 *
 * Era correcta y no tenía ninguna prueba. Un fallo aquí no produce un error visible:
 * produce que alguien que navega con teclado quede atrapado o pierda su posición en la
 * página. Es la clase de regresión que nadie reporta.
 *
 * NOTA SOBRE JSDOM: el componente filtra los elementos enfocables por
 * `offsetParent !== null` para descartar los que están ocultos. jsdom no calcula
 * layout y devuelve `null` SIEMPRE, así que sin el ajuste de abajo el filtro
 * eliminaría todos los controles y la trampa de foco nunca se ejercitaría: la prueba
 * pasaría sin comprobar nada. Se simula `offsetParent` para que jsdom reporte los
 * elementos como visibles y la lógica real quede bajo prueba.
 */
const offsetParentDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetParent");

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get() {
      return this.parentElement;
    }
  });
});

afterAll(() => {
  if (offsetParentDescriptor) {
    Object.defineProperty(HTMLElement.prototype, "offsetParent", offsetParentDescriptor);
  } else {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetParent;
  }
});

function Contenido() {
  return (
    <>
      <button type="button">Primero</button>
      <button type="button">Segundo</button>
    </>
  );
}

/** Orden real del DOM: el botón «Cerrar» de la cabecera precede al contenido. */
function enfocablesEnOrden() {
  return screen.getAllByRole("button");
}

describe("Modal", () => {
  it("no renderiza nada cuando open es false", () => {
    render(
      <Modal open={false} onClose={jest.fn()} title="Confirmar">
        <Contenido />
      </Modal>
    );
    expect(screen.queryByText("Confirmar")).not.toBeInTheDocument();
  });

  it("mueve el foco al primer elemento enfocable del panel al abrirse", async () => {
    render(
      <Modal open onClose={jest.fn()} title="Confirmar">
        <Contenido />
      </Modal>
    );

    const [primerEnfocable] = enfocablesEnOrden();
    // Es el botón «Cerrar» de la cabecera: va antes que el contenido en el DOM.
    expect(primerEnfocable).toHaveAccessibleName("Cerrar");
    expect(primerEnfocable).toHaveFocus();
  });

  it("Escape invoca onClose", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose} title="Confirmar">
        <Contenido />
      </Modal>
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("atrapa el foco: Tab desde el último enfocable vuelve al primero", async () => {
    const user = userEvent.setup();
    render(
      <Modal open onClose={jest.fn()} title="Confirmar">
        <Contenido />
      </Modal>
    );

    const enfocables = enfocablesEnOrden();
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];

    ultimo.focus();
    await user.tab();

    // Sin trampa de foco, aquí se habría escapado a los controles del fondo.
    expect(document.activeElement).toBe(primero);
  });

  it("atrapa el foco hacia atrás: Shift+Tab desde el primero va al último", async () => {
    const user = userEvent.setup();
    render(
      <Modal open onClose={jest.fn()} title="Confirmar">
        <Contenido />
      </Modal>
    );

    const enfocables = enfocablesEnOrden();
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];

    primero.focus();
    await user.tab({ shift: true });

    expect(document.activeElement).toBe(ultimo);
  });

  it("devuelve el foco al elemento que lo abrió al cerrarse", async () => {
    // Sin esto, al cerrar el diálogo el foco vuelve al <body> y quien navega con
    // teclado o lector de pantalla pierde por completo su posición en la página.
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Abrir diálogo</button>
          <Modal open={open} onClose={() => setOpen(false)} title="Confirmar">
            <Contenido />
          </Modal>
        </>
      );
    }

    const user = userEvent.setup();
    render(<Host />);

    const disparador = screen.getByRole("button", { name: "Abrir diálogo" });
    await user.click(disparador);

    expect(await screen.findByRole("button", { name: "Cerrar" })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(disparador).toHaveFocus();
  });

  it("asocia el título mediante aria-labelledby", async () => {
    render(
      <Modal open onClose={jest.fn()} title="Eliminar usuario" description="Esta acción no se puede deshacer">
        <Contenido />
      </Modal>
    );

    const dialogo = await screen.findByRole("dialog");
    const titulo = screen.getByText("Eliminar usuario");

    expect(dialogo).toHaveAttribute("aria-labelledby", titulo.id);
    expect(dialogo).toHaveAccessibleName("Eliminar usuario");
  });

  it("asocia la descripción mediante aria-describedby", async () => {
    render(
      <Modal open onClose={jest.fn()} title="Eliminar usuario" description="Esta acción no se puede deshacer">
        <Contenido />
      </Modal>
    );

    const dialogo = await screen.findByRole("dialog");
    const descripcion = screen.getByText("Esta acción no se puede deshacer");

    expect(dialogo).toHaveAttribute("aria-describedby", descripcion.id);
  });

  it("se marca como diálogo modal", async () => {
    render(
      <Modal open onClose={jest.fn()} title="Confirmar">
        <Contenido />
      </Modal>
    );

    expect(await screen.findByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });
});
