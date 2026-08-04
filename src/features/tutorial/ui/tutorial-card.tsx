"use client";

import { CheckCircle2, Clock3, Lock, PlayCircle, RefreshCcw, SkipForward, Sparkles } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  TUTORIAL_CATEGORY_LABELS,
  TUTORIAL_LEVEL_LABELS,
  type TutorialDefinition,
  type TutorialViewStatus,
} from "@/features/tutorial/model/tutorial.types";

/**
 * Tarjeta de un tutorial dentro del Centro de ayuda.
 *
 * El estado se comunica con icono + texto + color, nunca solo con color: quien no
 * distingue matices sigue viendo «Completado» o «En progreso» escrito.
 */

const STATUS_LABEL: Record<TutorialViewStatus, string> = {
  sin_empezar: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
  omitido: "Omitido",
  desactualizado: "Actualizado",
};

const STATUS_VARIANT: Record<TutorialViewStatus, "muted" | "secondary" | "success" | "warning"> = {
  sin_empezar: "muted",
  en_progreso: "secondary",
  completado: "success",
  omitido: "warning",
  desactualizado: "warning",
};

const STATUS_ICON: Record<TutorialViewStatus, typeof CheckCircle2> = {
  sin_empezar: PlayCircle,
  en_progreso: Clock3,
  completado: CheckCircle2,
  omitido: SkipForward,
  desactualizado: Sparkles,
};

export type TutorialCardProps = {
  tutorial: TutorialDefinition;
  status: TutorialViewStatus;
  completion: number;
  /** Prerrequisitos aún sin completar. */
  blockedBy: TutorialDefinition[];
  onStart: () => void;
  onRestart: () => void;
};

export function TutorialCard({ tutorial, status, completion, blockedBy, onStart, onRestart }: TutorialCardProps) {
  const StatusIcon = STATUS_ICON[status];
  const primaryLabel =
    status === "en_progreso"
      ? "Continuar"
      : status === "completado"
        ? "Repetir"
        : status === "desactualizado"
          ? "Ver novedades"
          : status === "omitido"
            ? "Retomar"
            : "Comenzar";
  const primaryAction = status === "completado" || status === "desactualizado" ? onRestart : onStart;

  return (
    <Card className="flex h-full flex-col hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[status]} className="gap-1">
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {STATUS_LABEL[status]}
          </Badge>
          {tutorial.required ? <Badge variant="default">Obligatorio</Badge> : null}
          {!tutorial.required && tutorial.recommended ? <Badge variant="secondary">Recomendado</Badge> : null}
        </div>

        <div>
          <h3 className="text-base font-bold leading-snug">{tutorial.title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{tutorial.description}</p>
        </div>

        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <dt className="font-semibold">Módulo:</dt>
            <dd>{TUTORIAL_CATEGORY_LABELS[tutorial.category]}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-semibold">Nivel:</dt>
            <dd>{TUTORIAL_LEVEL_LABELS[tutorial.level]}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-semibold">Duración:</dt>
            <dd>{tutorial.estimatedMinutes ?? Math.max(1, Math.round(tutorial.steps.length / 2))} min</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-semibold">Pasos:</dt>
            <dd>{tutorial.steps.length}</dd>
          </div>
        </dl>

        {status === "en_progreso" ? (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Avance</span>
              <span>{completion}%</span>
            </div>
            <div
              className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion}
              aria-label={`Avance de ${tutorial.title}`}
            >
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${completion}%` }} />
            </div>
          </div>
        ) : null}

        {blockedBy.length > 0 ? (
          <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Te recomendamos completar antes: {blockedBy.map((item) => item.title).join(", ")}.
            </span>
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button type="button" size="sm" onClick={primaryAction}>
            <PlayCircle className="h-4 w-4" aria-hidden="true" /> {primaryLabel}
          </Button>
          {status === "en_progreso" || status === "omitido" ? (
            <Button type="button" size="sm" variant="outline" onClick={onRestart}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
