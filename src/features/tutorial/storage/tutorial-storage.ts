import { z } from "zod";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { apiRequest } from "@/shared/api/client";
import type {
  TutorialProgressMap,
  TutorialProgressRecord,
} from "@/features/tutorial/model/tutorial.types";

/**
 * Persistencia del progreso.
 *
 * Estrategia: **backend cuando existe, local siempre**. El adaptador compuesto lee del
 * backend (fuente de verdad para poder continuar desde otro dispositivo) y mantiene una
 * copia local que sirve de respuesta inmediata y de respaldo si la red falla. Mientras
 * el backend no exponga el contrato (ver `docs/api/api-contracts.md`), el adaptador
 * remoto queda desactivado por configuración y el local es la única fuente.
 */

export interface TutorialStorageAdapter {
  load(): Promise<TutorialProgressMap>;
  save(record: TutorialProgressRecord): Promise<void>;
  remove(tutorialId: string): Promise<void>;
  clear(): Promise<void>;
}

const progressRecordSchema = z.object({
  tutorialId: z.string().min(1),
  version: z.string().min(1),
  status: z.enum(["sin_empezar", "en_progreso", "completado", "omitido"]),
  currentStepId: z.string().min(1).optional(),
  startedAt: z.string().min(1).optional(),
  completedAt: z.string().min(1).optional(),
  lastInteractionAt: z.string().min(1),
  repetitions: z.number().int().nonnegative(),
  dismissed: z.boolean().optional(),
});

const progressListSchema = z.array(progressRecordSchema);

function toMap(records: readonly TutorialProgressRecord[]): TutorialProgressMap {
  return Object.fromEntries(records.map((record) => [record.tutorialId, record]));
}

/** Clave por usuario: dos cuentas en el mismo navegador no comparten progreso. */
export function localStorageKey(userId: string | undefined): string {
  return `cm.tutoriales.progreso.${userId ?? "anonimo"}`;
}

export class LocalTutorialStorage implements TutorialStorageAdapter {
  constructor(private readonly userId?: string) {}

  private read(): TutorialProgressMap {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(localStorageKey(this.userId));
    if (!raw) return {};
    try {
      const parsed = progressListSchema.safeParse(JSON.parse(raw));
      // Un registro corrupto (edición manual, versión antigua del formato) se descarta
      // en vez de propagar datos inválidos al motor.
      return parsed.success ? toMap(parsed.data) : {};
    } catch {
      return {};
    }
  }

  private write(map: TutorialProgressMap): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(localStorageKey(this.userId), JSON.stringify(Object.values(map)));
    } catch (error) {
      // Cuota llena o modo privado: el tutorial sigue funcionando, solo se pierde el
      // recuerdo del avance. Se deja rastro para poder diagnosticarlo.
      console.warn("[tutoriales] no se pudo guardar el progreso local", error);
    }
  }

  async load(): Promise<TutorialProgressMap> {
    return this.read();
  }

  async save(record: TutorialProgressRecord): Promise<void> {
    this.write({ ...this.read(), [record.tutorialId]: record });
  }

  async remove(tutorialId: string): Promise<void> {
    const map = this.read();
    delete map[tutorialId];
    this.write(map);
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(localStorageKey(this.userId));
  }
}

/**
 * Adaptador de backend. Las operaciones son idempotentes: `save` es un PUT del registro
 * completo identificado por `tutorialId`, de modo que repetir la llamada no altera el
 * resultado. El backend es quien decide de qué usuario es el progreso (a partir del
 * JWT); el cliente nunca envía un identificador de usuario.
 */
export class RemoteTutorialStorage implements TutorialStorageAdapter {
  async load(): Promise<TutorialProgressMap> {
    const payload = await apiRequest<unknown>(ENDPOINTS.tutorials.progress);
    const parsed = progressListSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error("El backend devolvió un progreso de tutoriales con formato inesperado");
    }
    return toMap(parsed.data);
  }

  async save(record: TutorialProgressRecord): Promise<void> {
    await apiRequest<unknown>(ENDPOINTS.tutorials.progressById.replace(":tutorialId", encodeURIComponent(record.tutorialId)), {
      method: "PUT",
      body: record,
    });
  }

  async remove(tutorialId: string): Promise<void> {
    await apiRequest<unknown>(ENDPOINTS.tutorials.progressById.replace(":tutorialId", encodeURIComponent(tutorialId)), {
      method: "DELETE",
    });
  }

  async clear(): Promise<void> {
    await apiRequest<unknown>(ENDPOINTS.tutorials.progress, { method: "DELETE" });
  }
}

/**
 * Local primero para responder al instante, remoto como fuente de verdad.
 *
 * Si el remoto falla (sin red, backend sin el módulo desplegado) se degrada al local y
 * se avisa por `onRemoteError` — nunca se pierde el avance ni se bloquea la interfaz.
 */
export class CompositeTutorialStorage implements TutorialStorageAdapter {
  constructor(
    private readonly local: TutorialStorageAdapter,
    private readonly remote: TutorialStorageAdapter,
    private readonly onRemoteError?: (error: unknown) => void,
  ) {}

  private handle(error: unknown): void {
    if (this.onRemoteError) this.onRemoteError(error);
    else console.warn("[tutoriales] el progreso remoto no está disponible; se usa el local", error);
  }

  async load(): Promise<TutorialProgressMap> {
    const local = await this.local.load();
    try {
      const remote = await this.remote.load();
      // El remoto manda, pero se conserva lo que solo exista en local (avance hecho
      // sin conexión que todavía no se ha sincronizado).
      const merged = { ...local, ...remote };
      return merged;
    } catch (error) {
      this.handle(error);
      return local;
    }
  }

  async save(record: TutorialProgressRecord): Promise<void> {
    await this.local.save(record);
    try {
      await this.remote.save(record);
    } catch (error) {
      this.handle(error);
    }
  }

  async remove(tutorialId: string): Promise<void> {
    await this.local.remove(tutorialId);
    try {
      await this.remote.remove(tutorialId);
    } catch (error) {
      this.handle(error);
    }
  }

  async clear(): Promise<void> {
    await this.local.clear();
    try {
      await this.remote.clear();
    } catch (error) {
      this.handle(error);
    }
  }
}

export function createTutorialStorage(options: {
  userId?: string;
  remoteEnabled: boolean;
  onRemoteError?: (error: unknown) => void;
}): TutorialStorageAdapter {
  const local = new LocalTutorialStorage(options.userId);
  // Sin sesión no hay a quién asociar el progreso en el backend: solo local.
  if (!options.remoteEnabled || !options.userId) return local;
  return new CompositeTutorialStorage(local, new RemoteTutorialStorage(), options.onRemoteError);
}
