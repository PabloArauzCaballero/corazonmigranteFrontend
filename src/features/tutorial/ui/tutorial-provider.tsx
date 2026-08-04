"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { env } from "@/config/env";
import { usePrefersReducedMotion } from "@/shared/hooks/use-media-query";
import { useSession } from "@/shared/auth/use-session";
import { tutorialRegistry } from "@/features/tutorial/catalog";
import {
  defaultAnalytics,
  type TutorialAnalyticsAdapter,
} from "@/features/tutorial/analytics/tutorial-analytics";
import { useTutorialRun, type TutorialRun, type TutorialRunOrigin } from "@/features/tutorial/engine/use-tutorial-run";
import {
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
} from "@/features/tutorial/engine/tutorial-progress";
import type {
  TutorialAccessContext,
  TutorialDefinition,
  TutorialProgressMap,
  TutorialProgressRecord,
  TutorialViewStatus,
} from "@/features/tutorial/model/tutorial.types";
import {
  createTutorialStorage,
  type TutorialStorageAdapter,
} from "@/features/tutorial/storage/tutorial-storage";
import { TutorialTour } from "@/features/tutorial/ui/tutorial-tour";

/**
 * Punto de unión del módulo: catálogo filtrado por rol, progreso persistido y el
 * recorrido en curso. Se monta una sola vez en `AppProviders`, de modo que cualquier
 * pantalla puede lanzar un tutorial sin montar su propio motor.
 */

export type TutorialContextValue = {
  /** `false` mientras se carga el progreso guardado. */
  ready: boolean;
  /** Tutoriales visibles para la sesión actual, con sus pasos ya filtrados. */
  catalog: TutorialDefinition[];
  progress: TutorialProgressMap;
  run: TutorialRun;
  /** Porcentaje global de avance sobre el catálogo visible. */
  overall: number;
  startTutorial: (id: string, options?: { origin?: TutorialRunOrigin; fromStart?: boolean }) => void;
  restartTutorial: (id: string) => void;
  dismissTutorial: (id: string) => void;
  resetProgress: () => void;
  statusOf: (id: string) => TutorialViewStatus;
  completionOf: (id: string) => number;
  blockedBy: (id: string) => TutorialDefinition[];
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

/** Retardo antes de ofrecer un tutorial automático: da tiempo a que la pantalla cargue. */
const AUTO_START_DELAY_MS = 1200;

export function TutorialProvider({
  children,
  analytics = defaultAnalytics,
  storageFactory = createTutorialStorage,
}: {
  children: ReactNode;
  analytics?: TutorialAnalyticsAdapter;
  /** Inyectable para pruebas; por defecto local + backend si está habilitado. */
  storageFactory?: typeof createTutorialStorage;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const reducedMotion = usePrefersReducedMotion();
  const { session, isReady: sessionReady } = useSession();

  const [progress, setProgress] = useState<TutorialProgressMap>({});
  const [ready, setReady] = useState(false);

  const accessContext = useMemo<TutorialAccessContext>(
    () => ({
      role: session?.role,
      permissions: session?.permissions,
      isAuthenticated: Boolean(session),
    }),
    [session],
  );

  const catalog = useMemo(() => tutorialRegistry.listFor(accessContext), [accessContext]);

  const storageRef = useRef<TutorialStorageAdapter | null>(null);
  const userId = session?.userId;

  useEffect(() => {
    if (!sessionReady) return;
    const storage = storageFactory({
      userId,
      remoteEnabled: env.NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS,
    });
    storageRef.current = storage;
    let cancelled = false;
    void storage
      .load()
      .then((loaded) => {
        if (cancelled) return;
        setProgress(loaded);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Un progreso ilegible no debe impedir usar los tutoriales: se empieza de cero
        // y se deja constancia del motivo.
        console.warn("[tutoriales] no se pudo cargar el progreso", error);
        setProgress({});
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionReady, userId, storageFactory]);

  const persist = useCallback((record: TutorialProgressRecord) => {
    setProgress((previous) => ({ ...previous, [record.tutorialId]: record }));
    void storageRef.current?.save(record);
  }, []);

  const progressRef = useRef<TutorialProgressMap>({});
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const run = useTutorialRun({
    pathname,
    navigate: useCallback((route: string) => router.push(route), [router]),
    reducedMotion,
    onStepShown: useCallback(
      (definition: TutorialDefinition, stepId: string) => {
        const previous = progressRef.current[definition.id];
        if (previous?.currentStepId === stepId && previous.status === "en_progreso") return;
        persist(markStep({ definition, previous }, stepId));
        analytics.track({ name: "tutorial_paso", tutorialId: definition.id, version: definition.version, stepId });
      },
      [persist, analytics],
    ),
    onFinished: useCallback(
      (definition: TutorialDefinition) => {
        persist(markCompleted({ definition, previous: progressRef.current[definition.id] }));
        analytics.track({ name: "tutorial_completado", tutorialId: definition.id, version: definition.version });
      },
      [persist, analytics],
    ),
    onAbandoned: useCallback(
      (definition: TutorialDefinition, stepId: string | undefined, reason: "omitido" | "cerrado") => {
        if (reason !== "omitido") return; // cerrar conserva el avance para poder reanudar
        persist(markSkipped({ definition, previous: progressRef.current[definition.id] }, stepId));
        analytics.track({ name: "tutorial_omitido", tutorialId: definition.id, version: definition.version, stepId });
      },
      [persist, analytics],
    ),
    onTargetMissing: useCallback(
      (definition: TutorialDefinition, stepId: string) => {
        analytics.track({
          name: "tutorial_objetivo_ausente",
          tutorialId: definition.id,
          version: definition.version,
          stepId,
        });
      },
      [analytics],
    ),
  });

  const { start } = run;

  const startTutorial = useCallback<TutorialContextValue["startTutorial"]>(
    (id, options) => {
      const definition = tutorialRegistry.resolve(id, accessContext);
      if (!definition) {
        console.warn(`[tutoriales] «${id}» no existe o no está disponible para este rol`);
        return;
      }
      const stepIndex = options?.fromStart ? 0 : resumeIndex(definition, progressRef.current);
      persist(
        stepIndex === 0
          ? markStarted({ definition, previous: progressRef.current[definition.id] })
          : markStep({ definition, previous: progressRef.current[definition.id] }, definition.steps[stepIndex].id),
      );
      analytics.track({ name: "tutorial_iniciado", tutorialId: definition.id, version: definition.version });
      start(definition, { stepIndex, origin: options?.origin ?? "manual" });
    },
    [accessContext, persist, analytics, start],
  );

  const restartTutorial = useCallback<TutorialContextValue["restartTutorial"]>(
    (id) => {
      const definition = tutorialRegistry.resolve(id, accessContext);
      if (!definition) return;
      persist(markReset({ definition, previous: progressRef.current[definition.id] }));
      analytics.track({ name: "tutorial_reiniciado", tutorialId: definition.id, version: definition.version });
      startTutorial(id, { origin: "centro", fromStart: true });
    },
    [accessContext, persist, analytics, startTutorial],
  );

  /**
   * «No volver a mostrarme esto»: se marca omitido y además se guarda la preferencia,
   * de modo que el tutorial nunca vuelva a ofrecerse solo aunque más adelante se
   * reinicie su progreso. Las dos marcas se escriben en un único registro para que no
   * puedan pisarse entre sí.
   */
  const dismissTutorial = useCallback<TutorialContextValue["dismissTutorial"]>(
    (id) => {
      const definition = tutorialRegistry.resolve(id, accessContext);
      if (!definition) return;
      const previous = markSkipped({ definition, previous: progressRef.current[definition.id] });
      persist(markDismissed({ definition, previous }));
      analytics.track({
        name: "tutorial_omitido",
        tutorialId: definition.id,
        version: definition.version,
        detail: "no_volver_a_mostrar",
      });
    },
    [accessContext, persist, analytics],
  );

  const resetProgress = useCallback(() => {
    setProgress({});
    void storageRef.current?.clear();
  }, []);

  // ── Tutorial automático por pantalla ──────────────────────────────────────
  const isIdle = run.state.phase === "inactivo";
  useEffect(() => {
    if (!ready || !isIdle) return;
    const candidate = tutorialRegistry.autoStartFor(pathname, accessContext);
    if (!candidate) return;
    const record = progressRef.current[candidate.id];
    // Solo se ofrece a quien no lo ha visto y no ha pedido dejar de verlo.
    if (record && (record.dismissed || record.status !== "sin_empezar")) return;
    const timer = window.setTimeout(() => startTutorial(candidate.id, { origin: "automatico" }), AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [ready, isIdle, pathname, accessContext, startTutorial]);

  const value = useMemo<TutorialContextValue>(
    () => ({
      ready,
      catalog,
      progress,
      run,
      overall: overallCompletion(catalog, progress),
      startTutorial,
      restartTutorial,
      dismissTutorial,
      resetProgress,
      statusOf: (id) => {
        const definition = catalog.find((item) => item.id === id);
        return definition ? viewStatus(definition, progress) : "sin_empezar";
      },
      completionOf: (id) => {
        const definition = catalog.find((item) => item.id === id);
        return definition ? tutorialCompletion(definition, progress) : 0;
      },
      blockedBy: (id) => {
        const definition = catalog.find((item) => item.id === id);
        return definition ? pendingPrerequisites(definition, catalog, progress) : [];
      },
    }),
    [ready, catalog, progress, run, startTutorial, restartTutorial, dismissTutorial, resetProgress],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
      <TutorialTour />
    </TutorialContext.Provider>
  );
}

export function useTutorials(): TutorialContextValue {
  const value = useContext(TutorialContext);
  if (!value) throw new Error("useTutorials debe usarse dentro de TutorialProvider");
  return value;
}

/**
 * Variante tolerante para componentes que pueden renderizarse fuera del proveedor
 * (por ejemplo en pruebas de una pantalla aislada): devuelve `null` en vez de lanzar.
 */
export function useOptionalTutorials(): TutorialContextValue | null {
  return useContext(TutorialContext);
}
