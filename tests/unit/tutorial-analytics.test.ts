import {
  composeAnalytics,
  consoleAnalytics,
  defaultAnalytics,
  silentAnalytics,
  telemetryAnalytics,
  type TutorialAnalyticsAdapter,
  type TutorialAnalyticsEvent,
} from "@/features/tutorial/analytics/tutorial-analytics";

const event: TutorialAnalyticsEvent = {
  name: "tutorial_paso",
  tutorialId: "paciente-navegacion",
  version: "1.0.0",
  stepId: "citas",
};

describe("analítica de tutoriales", () => {
  it("el adaptador silencioso no hace nada", () => {
    expect(() => silentAnalytics.track(event)).not.toThrow();
  });

  it("el adaptador de telemetría es inerte cuando la telemetría está apagada", () => {
    expect(() => telemetryAnalytics.track(event)).not.toThrow();
    expect(() => telemetryAnalytics.track({ ...event, name: "tutorial_objetivo_ausente" })).not.toThrow();
  });

  it("reenvía el evento a todos los adaptadores", () => {
    const uno = { track: jest.fn() };
    const dos = { track: jest.fn() };
    composeAnalytics(uno, dos).track(event);
    expect(uno.track).toHaveBeenCalledWith(event);
    expect(dos.track).toHaveBeenCalledWith(event);
  });

  it("un adaptador que falla no impide que los demás reciban el evento", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const roto: TutorialAnalyticsAdapter = {
      track: () => {
        throw new Error("proveedor caído");
      },
    };
    const sano = { track: jest.fn() };

    expect(() => composeAnalytics(roto, sano).track(event)).not.toThrow();
    expect(sano.track).toHaveBeenCalledWith(event);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("nunca registra datos personales: solo identificadores del catálogo", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => {});
    consoleAnalytics.track(event);
    const [, payload] = info.mock.calls[0] as [string, TutorialAnalyticsEvent];
    expect(Object.keys(payload).sort()).toEqual(["name", "stepId", "tutorialId", "version"]);
    info.mockRestore();
  });

  it("el adaptador por defecto no lanza con ningún evento del motor", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => {});
    const names = [
      "tutorial_iniciado",
      "tutorial_paso",
      "tutorial_completado",
      "tutorial_omitido",
      "tutorial_reiniciado",
      "tutorial_objetivo_ausente",
    ] as const;
    for (const name of names) {
      expect(() => defaultAnalytics.track({ ...event, name })).not.toThrow();
    }
    info.mockRestore();
  });
});
