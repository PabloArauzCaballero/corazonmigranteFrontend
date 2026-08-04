import { act, renderHook, waitFor } from "@testing-library/react";
import { useTutorialRun } from "@/features/tutorial/engine/use-tutorial-run";
import type { TutorialDefinition } from "@/features/tutorial/model/tutorial.types";

/**
 * jsdom devuelve un rectángulo de ceros para cualquier elemento, y el motor solo
 * considera «visible» lo que tiene tamaño. Se le da uno realista a lo que esté en el
 * documento para poder ejercitar la resolución de objetivos.
 */
function giveElementsSize() {
  Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: Element) {
    const visible = this.isConnected && !(this as HTMLElement).hidden;
    const size = visible ? { width: 120, height: 40 } : { width: 0, height: 0 };
    return { top: 100, left: 50, right: 170, bottom: 140, x: 50, y: 100, ...size, toJSON: () => ({}) } as DOMRect;
  };
}

function tutorial(overrides: Partial<TutorialDefinition> = {}): TutorialDefinition {
  return {
    id: "demo",
    version: "1.0.0",
    title: "Demo",
    description: "Prueba",
    category: "navegacion",
    level: "basico",
    steps: [
      { id: "uno", title: "Uno", body: "Cuerpo", order: 1, target: "objetivo-uno", waitForMs: 200 },
      { id: "dos", title: "Dos", body: "Cuerpo", order: 2, placement: "center" },
    ],
    ...overrides,
  };
}

function addTarget(id: string) {
  const element = document.createElement("button");
  element.setAttribute("data-tutorial-id", id);
  element.textContent = id;
  document.body.appendChild(element);
  return element;
}

function setup(options: { pathname?: string; navigate?: (route: string) => void } = {}) {
  const navigate = options.navigate ?? jest.fn();
  const result = renderHook(() =>
    useTutorialRun({ pathname: options.pathname ?? "/admin", navigate, reducedMotion: true }),
  );
  return { ...result, navigate };
}

describe("ejecución de un recorrido sobre el DOM", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    giveElementsSize();
  });

  it("resuelve un objetivo ya presente y deja el paso activo", async () => {
    addTarget("objetivo-uno");
    const { result } = setup();

    act(() => result.current.start(tutorial()));

    await waitFor(() => expect(result.current.state.phase).toBe("activo"));
    expect(result.current.rect).toEqual({ top: 100, left: 50, width: 120, height: 40 });
    expect(result.current.canAdvance).toBe(true);
  });

  it("espera a un objetivo que llega después (contenido asíncrono)", async () => {
    const { result } = setup();
    act(() => result.current.start(tutorial({ steps: [{ id: "uno", title: "Uno", body: "Cuerpo", order: 1, target: "tardio", waitForMs: 3000 }] })));

    expect(result.current.state.phase).toBe("resolviendo");
    act(() => {
      addTarget("tardio");
    });

    await waitFor(() => expect(result.current.state.phase).toBe("activo"));
  });

  it("si el objetivo no aparece nunca, avisa sin bloquear el recorrido", async () => {
    const { result } = setup();
    act(() => result.current.start(tutorial()));

    await waitFor(() => expect(result.current.state.phase).toBe("objetivo_ausente"));
    expect(result.current.state.message).toContain("No encontramos");
    // Sigue siendo posible continuar o reintentar: el tutorial no se queda colgado.
    expect(result.current.canAdvance).toBe(true);

    act(() => result.current.retry());
    expect(result.current.state.phase).toBe("resolviendo");
  });

  it("usa el mensaje de error propio del paso cuando lo declara", async () => {
    const { result } = setup();
    act(() =>
      result.current.start(
        tutorial({
          steps: [{ id: "uno", title: "Uno", body: "Cuerpo", order: 1, target: "ausente", waitForMs: 50, errorMessage: "Aún no hay datos" }],
        }),
      ),
    );
    await waitFor(() => expect(result.current.state.message).toBe("Aún no hay datos"));
  });

  it("navega a la ruta del paso antes de buscar su elemento", async () => {
    const navigate = jest.fn();
    const { result } = setup({ pathname: "/admin", navigate });

    act(() =>
      result.current.start(
        tutorial({
          route: "/admin/usuarios",
          steps: [{ id: "uno", title: "Uno", body: "Cuerpo", order: 1, target: "objetivo-uno", route: "/admin/usuarios" }],
        }),
      ),
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/admin/usuarios"));
  });

  it("un paso que espera un clic no deja avanzar hasta que ocurre", async () => {
    const element = addTarget("boton");
    const { result } = setup();

    act(() =>
      result.current.start(
        tutorial({
          steps: [
            { id: "uno", title: "Uno", body: "Cuerpo", order: 1, target: "boton", interaction: { kind: "click" }, interactiveTarget: true },
          ],
        }),
      ),
    );

    await waitFor(() => expect(result.current.state.phase).toBe("esperando_accion"));
    expect(result.current.canAdvance).toBe(false);

    act(() => element.click());
    await waitFor(() => expect(result.current.state.phase).toBe("activo"));
    expect(result.current.canAdvance).toBe(true);
  });

  it("un paso que espera escritura se cumple al alcanzar la longitud mínima", async () => {
    const input = document.createElement("input");
    input.setAttribute("data-tutorial-id", "buscador");
    document.body.appendChild(input);
    const { result } = setup();

    act(() =>
      result.current.start(
        tutorial({
          steps: [
            {
              id: "uno",
              title: "Uno",
              body: "Cuerpo",
              order: 1,
              target: "buscador",
              interaction: { kind: "escritura", minLength: 3 },
            },
          ],
        }),
      ),
    );

    await waitFor(() => expect(result.current.state.phase).toBe("esperando_accion"));

    act(() => {
      input.value = "ab";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(result.current.state.phase).toBe("esperando_accion");

    act(() => {
      input.value = "abc";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await waitFor(() => expect(result.current.state.phase).toBe("activo"));
  });

  it("un paso que espera navegación se cumple al llegar a la ruta", async () => {
    const step = {
      id: "uno",
      title: "Uno",
      body: "Cuerpo",
      order: 1,
      interaction: { kind: "navegacion" as const, route: "/admin/usuarios" },
      placement: "center" as const,
    };
    const { result, rerender } = renderHook(
      ({ pathname }: { pathname: string }) =>
        useTutorialRun({ pathname, navigate: jest.fn(), reducedMotion: true }),
      { initialProps: { pathname: "/admin" } },
    );

    act(() => result.current.start(tutorial({ steps: [step] })));
    await waitFor(() => expect(result.current.state.phase).toBe("esperando_accion"));

    rerender({ pathname: "/admin/usuarios" });
    await waitFor(() => expect(result.current.state.phase).toBe("activo"));
  });

  it("avisa al completar y al abandonar el recorrido", async () => {
    addTarget("objetivo-uno");
    const onFinished = jest.fn();
    const onAbandoned = jest.fn();
    const { result } = renderHook(() =>
      useTutorialRun({ pathname: "/admin", navigate: jest.fn(), reducedMotion: true, onFinished, onAbandoned }),
    );

    act(() => result.current.start(tutorial()));
    await waitFor(() => expect(result.current.state.phase).toBe("activo"));

    act(() => result.current.next());
    await waitFor(() => expect(result.current.state.phase).toBe("activo"));
    act(() => result.current.next());

    await waitFor(() => expect(onFinished).toHaveBeenCalledTimes(1));

    act(() => result.current.start(tutorial()));
    await waitFor(() => expect(result.current.state.phase).toBe("activo"));
    act(() => result.current.skip());
    expect(onAbandoned).toHaveBeenCalledWith(expect.objectContaining({ id: "demo" }), "uno", "omitido");
    expect(result.current.state.phase).toBe("inactivo");
  });

  it("abre el desplegable que esconde el objetivo antes de buscarlo", async () => {
    // Reproduce el menú móvil: el enlace no existe hasta que se pulsa el botón ☰.
    const toggle = document.createElement("button");
    toggle.setAttribute("data-tutorial-id", "menu-movil");
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "true");
      addTarget("nav-paciente-citas");
    });
    document.body.appendChild(toggle);

    const { result } = setup();
    act(() =>
      result.current.start(
        tutorial({
          steps: [
            {
              id: "uno",
              title: "Uno",
              body: "Cuerpo",
              order: 1,
              target: "nav-paciente-citas",
              prepare: { target: "menu-movil" },
            },
          ],
        }),
      ),
    );

    await waitFor(() => expect(result.current.state.phase).toBe("activo"));
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("no toca el desplegable si el objetivo ya está visible", async () => {
    addTarget("nav-paciente-citas");
    const toggle = document.createElement("button");
    toggle.setAttribute("data-tutorial-id", "menu-movil");
    toggle.setAttribute("aria-expanded", "false");
    const onClick = jest.fn();
    toggle.addEventListener("click", onClick);
    document.body.appendChild(toggle);

    const { result } = setup();
    act(() =>
      result.current.start(
        tutorial({
          steps: [
            {
              id: "uno",
              title: "Uno",
              body: "Cuerpo",
              order: 1,
              target: "nav-paciente-citas",
              prepare: { target: "menu-movil" },
            },
          ],
        }),
      ),
    );

    await waitFor(() => expect(result.current.state.phase).toBe("activo"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("nunca pulsa un control que no sea un desplegable", async () => {
    // Salvaguarda: sin `aria-expanded="false"` el motor no toca el elemento, así que un
    // botón de guardar o eliminar jamás puede dispararse por esta vía.
    const guardar = document.createElement("button");
    guardar.setAttribute("data-tutorial-id", "guardar");
    const onClick = jest.fn();
    guardar.addEventListener("click", onClick);
    document.body.appendChild(guardar);

    const { result } = setup();
    act(() =>
      result.current.start(
        tutorial({
          steps: [
            { id: "uno", title: "Uno", body: "Cuerpo", order: 1, target: "ausente", waitForMs: 50, prepare: { target: "guardar" } },
          ],
        }),
      ),
    );

    await waitFor(() => expect(result.current.state.phase).toBe("objetivo_ausente"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("informa cuando un objetivo no se encuentra, para poder diagnosticarlo", async () => {
    const onTargetMissing = jest.fn();
    const { result } = renderHook(() =>
      useTutorialRun({ pathname: "/admin", navigate: jest.fn(), reducedMotion: true, onTargetMissing }),
    );
    act(() => result.current.start(tutorial()));
    await waitFor(() => expect(onTargetMissing).toHaveBeenCalledWith(expect.objectContaining({ id: "demo" }), "uno"));
  });
});
