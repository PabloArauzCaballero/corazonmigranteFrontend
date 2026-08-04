import {
  canAdvance,
  currentStep,
  initialRunState,
  runProgress,
  tutorialReducer,
  type TutorialRunState,
} from "@/features/tutorial/engine/tutorial-machine";
import type { TutorialDefinition } from "@/features/tutorial/model/tutorial.types";

const tutorial: TutorialDefinition = {
  id: "demo",
  version: "1.0.0",
  title: "Demo",
  description: "Prueba",
  category: "navegacion",
  level: "basico",
  steps: [
    { id: "uno", title: "Uno", body: "Cuerpo", order: 1, placement: "center" },
    { id: "dos", title: "Dos", body: "Cuerpo", order: 2, target: "algo", interaction: { kind: "click" } },
    { id: "tres", title: "Tres", body: "Cuerpo", order: 3, placement: "center" },
  ],
};

function started(stepIndex = 0): TutorialRunState {
  return tutorialReducer(initialRunState, { type: "iniciar", tutorial, stepIndex, origin: "centro" });
}

describe("máquina de estados del recorrido", () => {
  it("arranca en el paso indicado y en fase de resolución", () => {
    const state = started(1);
    expect(state.phase).toBe("resolviendo");
    expect(currentStep(state)?.id).toBe("dos");
    expect(state.origin).toBe("centro");
  });

  it("recorta el índice inicial a los pasos existentes", () => {
    expect(started(99).stepIndex).toBe(2);
  });

  it("un paso sin acción queda activo al resolver su objetivo", () => {
    const state = tutorialReducer(started(0), { type: "objetivo_resuelto" });
    expect(state.phase).toBe("activo");
    expect(canAdvance(state)).toBe(true);
  });

  it("un paso con acción queda esperando y bloquea el avance", () => {
    const waiting = tutorialReducer(started(1), { type: "objetivo_resuelto" });
    expect(waiting.phase).toBe("esperando_accion");
    expect(canAdvance(waiting)).toBe(false);

    const done = tutorialReducer(waiting, { type: "accion_cumplida" });
    expect(done.phase).toBe("activo");
    expect(canAdvance(done)).toBe(true);
  });

  it("si el objetivo no aparece se puede continuar igualmente", () => {
    const missing = tutorialReducer(started(1), { type: "objetivo_ausente", message: "No está" });
    expect(missing.phase).toBe("objetivo_ausente");
    expect(missing.message).toBe("No está");
    expect(canAdvance(missing)).toBe(true);
  });

  it("reintentar vuelve a resolver sin cambiar de paso", () => {
    const missing = tutorialReducer(started(1), { type: "objetivo_ausente", message: "No está" });
    const retried = tutorialReducer(missing, { type: "reintentar" });
    expect(retried.phase).toBe("resolviendo");
    expect(retried.attempt).toBe(1);
    expect(retried.stepIndex).toBe(1);
    expect(retried.message).toBeNull();
  });

  it("avanza y retrocede entre pasos reiniciando la resolución", () => {
    const second = tutorialReducer(tutorialReducer(started(0), { type: "objetivo_resuelto" }), { type: "siguiente" });
    expect(second.stepIndex).toBe(1);
    expect(second.phase).toBe("resolviendo");

    const back = tutorialReducer(second, { type: "anterior" });
    expect(back.stepIndex).toBe(0);
    expect(back.phase).toBe("resolviendo");
  });

  it("no retrocede más allá del primer paso", () => {
    const state = started(0);
    expect(tutorialReducer(state, { type: "anterior" })).toBe(state);
  });

  it("avanzar en el último paso finaliza el recorrido", () => {
    const last = tutorialReducer(started(2), { type: "objetivo_resuelto" });
    const finished = tutorialReducer(last, { type: "siguiente" });
    expect(finished.phase).toBe("finalizado");
  });

  it("cerrar devuelve el estado inicial", () => {
    expect(tutorialReducer(started(1), { type: "cerrar" })).toEqual(initialRunState);
  });

  it("ignora acciones de resolución cuando no hay recorrido activo", () => {
    expect(tutorialReducer(initialRunState, { type: "objetivo_resuelto" })).toBe(initialRunState);
    expect(tutorialReducer(initialRunState, { type: "siguiente" })).toBe(initialRunState);
  });

  it("calcula el porcentaje del recorrido", () => {
    expect(runProgress(started(0))).toBe(33);
    expect(runProgress(started(2))).toBe(100);
    expect(runProgress(initialRunState)).toBe(0);
  });
});
