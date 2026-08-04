import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TutorialTooltip, cardPosition } from "@/features/tutorial/ui/tutorial-tooltip";
import type { TutorialStep } from "@/features/tutorial/model/tutorial.types";

const step: TutorialStep = {
  id: "dos",
  title: "Personas registradas",
  body: "Administra las cuentas de la plataforma.",
  order: 2,
  target: "nav-admin-usuarios",
  placement: "right",
};

function renderTooltip(overrides: Partial<React.ComponentProps<typeof TutorialTooltip>> = {}) {
  const props: React.ComponentProps<typeof TutorialTooltip> = {
    step,
    stepNumber: 2,
    totalSteps: 5,
    rect: { top: 120, left: 40, width: 200, height: 44 },
    notice: null,
    canAdvance: true,
    isLast: false,
    reducedMotion: true,
    interactive: false,
    showRetry: false,
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    onSkip: jest.fn(),
    onClose: jest.fn(),
    onRetry: jest.fn(),
    ...overrides,
  };
  return { props, ...render(<TutorialTooltip {...props} />) };
}

describe("tarjeta del paso — accesibilidad y controles", () => {
  it("es un diálogo con nombre y descripción accesibles", () => {
    renderTooltip();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Personas registradas");
    expect(dialog).toHaveAccessibleDescription("Administra las cuentas de la plataforma.");
  });

  it("comunica el progreso con texto, no solo con color", () => {
    renderTooltip();
    expect(screen.getByText("Paso 2 de 5")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Paso 2 de 5");
  });

  it("atrapa el foco cuando el paso no pide tocar la página", async () => {
    renderTooltip();
    expect(screen.getByRole("dialog")).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("se cierra con Escape y avanza o retrocede con las flechas", () => {
    const { props } = renderTooltip();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(props.onNext).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(props.onPrevious).toHaveBeenCalledTimes(1);
  });

  it("no avanza con el teclado cuando falta la acción pedida", () => {
    const { props } = renderTooltip({ canAdvance: false });
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(props.onNext).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeDisabled();
  });

  it("muestra la ayuda de la acción pendiente y el error del objetivo ausente", () => {
    const { unmount } = renderTooltip({ notice: { tone: "ayuda", text: "Pulsa el elemento resaltado." } });
    expect(screen.getByText("Pulsa el elemento resaltado.")).toBeInTheDocument();
    unmount();

    renderTooltip({ notice: { tone: "error", text: "No encontramos ese elemento." }, showRetry: true });
    expect(screen.getByText("No encontramos ese elemento.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("el último paso ofrece finalizar en vez de siguiente", () => {
    renderTooltip({ isLast: true, stepNumber: 5 });
    expect(screen.getByRole("button", { name: /finalizar/i })).toBeInTheDocument();
  });

  it("el primer paso no ofrece retroceder", () => {
    renderTooltip({ stepNumber: 1 });
    expect(screen.queryByRole("button", { name: /atrás/i })).not.toBeInTheDocument();
  });

  it("permite omitir el tutorial completo", async () => {
    const { props } = renderTooltip();
    await userEvent.click(screen.getByRole("button", { name: /omitir tutorial/i }));
    expect(props.onSkip).toHaveBeenCalledTimes(1);
  });

  it("solo ofrece «no volver a mostrar» cuando se le pasa la acción", async () => {
    const { unmount } = renderTooltip();
    expect(screen.queryByRole("button", { name: /no volver a mostrarme/i })).not.toBeInTheDocument();
    unmount();

    const onDismiss = jest.fn();
    renderTooltip({ onDismiss });
    await userEvent.click(screen.getByRole("button", { name: /no volver a mostrarme/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("devuelve el foco a donde estaba al desmontarse", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = renderTooltip();
    expect(screen.getByRole("dialog")).toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
  });
});

describe("colocación de la tarjeta", () => {
  const viewport = { width: 1280, height: 800 };

  it("centra la tarjeta cuando no hay elemento resaltado", () => {
    const position = cardPosition(null, "center", viewport);
    expect(position.left).toBeGreaterThan(400);
    expect(position.top).toBeGreaterThan(200);
  });

  it("coloca la tarjeta a la derecha del elemento cuando hay sitio", () => {
    const position = cardPosition({ top: 200, left: 20, width: 200, height: 40 }, "right", viewport);
    expect(position.left).toBeGreaterThan(220);
  });

  it("nunca deja la tarjeta fuera de la ventana", () => {
    const position = cardPosition({ top: 780, left: 1260, width: 200, height: 40 }, "right", { width: 360, height: 640 });
    expect(position.left).toBeGreaterThanOrEqual(16);
    expect(position.top).toBeGreaterThanOrEqual(16);
    expect(position.top).toBeLessThan(640);
  });
});
