import {
  CompositeTutorialStorage,
  LocalTutorialStorage,
  createTutorialStorage,
  localStorageKey,
  type TutorialStorageAdapter,
} from "@/features/tutorial/storage/tutorial-storage";
import type { TutorialProgressMap, TutorialProgressRecord } from "@/features/tutorial/model/tutorial.types";

function record(overrides: Partial<TutorialProgressRecord> = {}): TutorialProgressRecord {
  return {
    tutorialId: "demo",
    version: "1.0.0",
    status: "en_progreso",
    currentStepId: "dos",
    startedAt: "2026-08-03T10:00:00.000Z",
    lastInteractionAt: "2026-08-03T10:05:00.000Z",
    repetitions: 0,
    ...overrides,
  };
}

class MemoryStorage implements TutorialStorageAdapter {
  entries: TutorialProgressMap = {};
  failures = { load: false, save: false };

  async load(): Promise<TutorialProgressMap> {
    if (this.failures.load) throw new Error("sin conexión");
    return this.entries;
  }
  async save(value: TutorialProgressRecord): Promise<void> {
    if (this.failures.save) throw new Error("sin conexión");
    this.entries[value.tutorialId] = value;
  }
  async remove(tutorialId: string): Promise<void> {
    delete this.entries[tutorialId];
  }
  async clear(): Promise<void> {
    this.entries = {};
  }
}

describe("persistencia del progreso", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("guarda y recupera el progreso por usuario", async () => {
    const storage = new LocalTutorialStorage("usuario-1");
    await storage.save(record());
    expect(await storage.load()).toEqual({ demo: record() });

    // Otra cuenta en el mismo navegador no hereda el avance.
    expect(await new LocalTutorialStorage("usuario-2").load()).toEqual({});
  });

  it("elimina un tutorial concreto y todo el progreso", async () => {
    const storage = new LocalTutorialStorage("usuario-1");
    await storage.save(record());
    await storage.save(record({ tutorialId: "otro" }));

    await storage.remove("demo");
    expect(Object.keys(await storage.load())).toEqual(["otro"]);

    await storage.clear();
    expect(await storage.load()).toEqual({});
  });

  it("descarta un almacenamiento corrupto en vez de propagarlo", async () => {
    window.localStorage.setItem(localStorageKey("usuario-1"), "{esto no es json");
    expect(await new LocalTutorialStorage("usuario-1").load()).toEqual({});

    window.localStorage.setItem(localStorageKey("usuario-1"), JSON.stringify([{ tutorialId: 42 }]));
    expect(await new LocalTutorialStorage("usuario-1").load()).toEqual({});
  });

  it("el adaptador compuesto deja mandar al remoto y conserva lo que solo hay en local", async () => {
    const local = new MemoryStorage();
    const remote = new MemoryStorage();
    local.entries = { demo: record({ status: "en_progreso" }), soloLocal: record({ tutorialId: "soloLocal" }) };
    remote.entries = { demo: record({ status: "completado" }) };

    const composite = new CompositeTutorialStorage(local, remote);
    const loaded = await composite.load();
    expect(loaded.demo.status).toBe("completado");
    expect(loaded.soloLocal).toBeDefined();
  });

  it("si el backend falla se sigue usando el local y se avisa", async () => {
    const local = new MemoryStorage();
    const remote = new MemoryStorage();
    local.entries = { demo: record() };
    remote.failures.load = true;
    remote.failures.save = true;
    const errors: unknown[] = [];

    const composite = new CompositeTutorialStorage(local, remote, (error) => errors.push(error));
    expect(await composite.load()).toEqual({ demo: record() });

    await composite.save(record({ tutorialId: "nuevo" }));
    expect(local.entries.nuevo).toBeDefined();
    expect(errors).toHaveLength(2);
  });

  it("sin usuario o sin bandera remota solo se usa el almacenamiento local", () => {
    expect(createTutorialStorage({ remoteEnabled: true })).toBeInstanceOf(LocalTutorialStorage);
    expect(createTutorialStorage({ userId: "usuario-1", remoteEnabled: false })).toBeInstanceOf(LocalTutorialStorage);
    expect(createTutorialStorage({ userId: "usuario-1", remoteEnabled: true })).toBeInstanceOf(CompositeTutorialStorage);
  });
});
