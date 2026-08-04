import {
  isOutdated,
  markCompleted,
  markDismissed,
  markReset,
  markSkipped,
  markStarted,
  markStep,
  overallCompletion,
  pendingPrerequisites,
  resumeIndex,
  tutorialCompletion,
  viewStatus,
  type Clock,
} from "@/features/tutorial/engine/tutorial-progress";
import type { TutorialDefinition, TutorialProgressMap } from "@/features/tutorial/model/tutorial.types";

const clock: Clock = () => new Date("2026-08-03T10:00:00.000Z");

function build(id: string, version = "1.0.0", extra: Partial<TutorialDefinition> = {}): TutorialDefinition {
  return {
    id,
    version,
    title: id,
    description: "Prueba",
    category: "navegacion",
    level: "basico",
    steps: [
      { id: "uno", title: "Uno", body: "Cuerpo", order: 1 },
      { id: "dos", title: "Dos", body: "Cuerpo", order: 2 },
      { id: "tres", title: "Tres", body: "Cuerpo", order: 3 },
      { id: "cuatro", title: "Cuatro", body: "Cuerpo", order: 4 },
    ],
    ...extra,
  };
}

describe("progreso de tutoriales", () => {
  const definition = build("demo");

  it("iniciar deja el registro en progreso sobre el primer paso", () => {
    const record = markStarted({ definition, clock });
    expect(record.status).toBe("en_progreso");
    expect(record.currentStepId).toBe("uno");
    expect(record.startedAt).toBe("2026-08-03T10:00:00.000Z");
    expect(record.repetitions).toBe(0);
  });

  it("completar marca la fecha de fin y suma una repetición", () => {
    const started = markStarted({ definition, clock });
    const completed = markCompleted({ definition, previous: started, clock });
    expect(completed.status).toBe("completado");
    expect(completed.completedAt).toBe("2026-08-03T10:00:00.000Z");
    expect(completed.repetitions).toBe(1);

    const again = markCompleted({ definition, previous: completed, clock });
    expect(again.repetitions).toBe(2);
  });

  it("omitir conserva el paso donde se dejó", () => {
    const record = markSkipped({ definition, previous: markStarted({ definition, clock }), clock }, "tres");
    expect(record.status).toBe("omitido");
    expect(record.currentStepId).toBe("tres");
  });

  it("reiniciar borra el avance pero conserva el histórico de repeticiones", () => {
    const completed = markCompleted({ definition, previous: markStarted({ definition, clock }), clock });
    const reset = markReset({ definition, previous: completed, clock });
    expect(reset.status).toBe("sin_empezar");
    expect(reset.currentStepId).toBeUndefined();
    expect(reset.completedAt).toBeUndefined();
    expect(reset.repetitions).toBe(1);
  });

  it("marcar como no mostrar más conserva el resto del registro", () => {
    const dismissed = markDismissed({ definition, previous: markStarted({ definition, clock }), clock });
    expect(dismissed.dismissed).toBe(true);
    expect(dismissed.status).toBe("en_progreso");
  });

  it("un cambio de versión mayor marca el tutorial como desactualizado", () => {
    const completed = markCompleted({ definition, previous: markStarted({ definition, clock }), clock });
    const progress: TutorialProgressMap = { demo: completed };

    expect(isOutdated(completed, build("demo", "1.1.0"))).toBe(false);
    expect(viewStatus(build("demo", "1.4.2"), progress)).toBe("completado");

    expect(isOutdated(completed, build("demo", "2.0.0"))).toBe(true);
    expect(viewStatus(build("demo", "2.0.0"), progress)).toBe("desactualizado");
  });

  it("calcula el porcentaje según el paso alcanzado", () => {
    const atThird = markStep({ definition, previous: markStarted({ definition, clock }), clock }, "tres");
    expect(tutorialCompletion(definition, { demo: atThird })).toBe(50);
    expect(tutorialCompletion(definition, {})).toBe(0);

    const completed = markCompleted({ definition, previous: atThird, clock });
    expect(tutorialCompletion(definition, { demo: completed })).toBe(100);
  });

  it("el avance global cuenta solo los completados y al día", () => {
    const uno = build("uno");
    const dos = build("dos");
    const progress: TutorialProgressMap = {
      uno: markCompleted({ definition: uno, clock }),
      dos: markStarted({ definition: dos, clock }),
    };
    expect(overallCompletion([uno, dos], progress)).toBe(50);
    expect(overallCompletion([], progress)).toBe(0);
  });

  it("reanuda desde el paso guardado y vuelve al inicio si ya no existe", () => {
    const atThird = markStep({ definition, previous: markStarted({ definition, clock }), clock }, "tres");
    expect(resumeIndex(definition, { demo: atThird })).toBe(2);

    const removed = { ...atThird, currentStepId: "paso-que-ya-no-existe" };
    expect(resumeIndex(definition, { demo: removed })).toBe(0);
    expect(resumeIndex(definition, {})).toBe(0);
  });

  it("lista los prerrequisitos que faltan por completar", () => {
    const base = build("base");
    const avanzado = build("avanzado", "1.0.0", { prerequisites: ["base"] });
    expect(pendingPrerequisites(avanzado, [base, avanzado], {})).toHaveLength(1);

    const progress: TutorialProgressMap = { base: markCompleted({ definition: base, clock }) };
    expect(pendingPrerequisites(avanzado, [base, avanzado], progress)).toHaveLength(0);
  });
});
