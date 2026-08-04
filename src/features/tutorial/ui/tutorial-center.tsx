"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState, LoadingState } from "@/shared/ui/state";
import { PageHeader } from "@/shared/ui/page-header";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { TutorialCard } from "@/features/tutorial/ui/tutorial-card";
import { useTutorials } from "@/features/tutorial/ui/tutorial-provider";
import {
  TUTORIAL_CATEGORY_LABELS,
  TUTORIAL_LEVELS,
  TUTORIAL_LEVEL_LABELS,
  type TutorialCategory,
  type TutorialDefinition,
  type TutorialLevel,
  type TutorialViewStatus,
} from "@/features/tutorial/model/tutorial.types";

/**
 * Centro de tutoriales: el catálogo de aprendizaje de la plataforma.
 *
 * Solo muestra lo que la sesión actual puede ver (el catálogo ya llega filtrado por rol
 * y permisos), y cada tutorial se ejecuta sobre la interfaz real, navegando si hace
 * falta a la pantalla donde ocurre.
 */

type StatusFilter = "todos" | TutorialViewStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "sin_empezar", label: "Pendientes" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completado", label: "Completados" },
  { value: "omitido", label: "Omitidos" },
  { value: "desactualizado", label: "Actualizados" },
];

const SELECT_CLASS =
  "focus-ring h-11 rounded-xl border bg-background px-3 text-sm font-medium text-foreground";

export function TutorialCenter({ title, description }: { title: string; description: string }) {
  const { ready, catalog, overall, statusOf, completionOf, blockedBy, startTutorial, restartTutorial } = useTutorials();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"todas" | TutorialCategory>("todas");
  const [level, setLevel] = useState<"todos" | TutorialLevel>("todos");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const debouncedSearch = useDebounce(search, 200);

  const categories = useMemo(
    () => [...new Set(catalog.map((item) => item.category))].sort((a, b) =>
      TUTORIAL_CATEGORY_LABELS[a].localeCompare(TUTORIAL_CATEGORY_LABELS[b], "es"),
    ),
    [catalog],
  );

  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return catalog.filter((item) => {
      if (category !== "todas" && item.category !== category) return false;
      if (level !== "todos" && item.level !== level) return false;
      if (status !== "todos" && statusOf(item.id) !== status) return false;
      if (!needle) return true;
      return `${item.title} ${item.description}`.toLowerCase().includes(needle);
    });
  }, [catalog, category, level, status, debouncedSearch, statusOf]);

  const groups = useMemo(() => {
    const required = filtered.filter((item) => item.required && statusOf(item.id) !== "completado");
    const inProgress = filtered.filter((item) => statusOf(item.id) === "en_progreso" && !required.includes(item));
    const suggested = filtered.filter(
      (item) => item.recommended && !required.includes(item) && !inProgress.includes(item) && statusOf(item.id) !== "completado",
    );
    const completed = filtered.filter((item) => statusOf(item.id) === "completado");
    const grouped = new Set([...required, ...inProgress, ...suggested, ...completed]);
    const others = filtered.filter((item) => !grouped.has(item));
    return [
      { key: "obligatorios", title: "Obligatorios para tu rol", items: required },
      { key: "en-progreso", title: "Continúa donde lo dejaste", items: inProgress },
      { key: "recomendados", title: "Recomendados", items: suggested },
      { key: "resto", title: "Todo el catálogo", items: others },
      { key: "completados", title: "Completados", items: completed },
    ].filter((group) => group.items.length > 0);
  }, [filtered, statusOf]);

  if (!ready) return <LoadingState title="Cargando tu progreso de tutoriales" />;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Centro de ayuda" title={title} description={description} />

      <Card data-tutorial-id="centro-resumen">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Tu avance general</p>
              <p className="text-xs text-muted-foreground">
                {catalog.filter((item) => statusOf(item.id) === "completado").length} de {catalog.length} tutoriales
                completados
              </p>
            </div>
          </div>
          <div className="flex min-w-48 flex-1 items-center gap-3 sm:max-w-xs">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={overall}
              aria-label="Avance general de tutoriales"
            >
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${overall}%` }} />
            </div>
            <span className="text-sm font-bold tabular-nums">{overall}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3" data-tutorial-id="centro-filtros">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar un tutorial"
            aria-label="Buscar un tutorial"
            className="pl-9"
            data-tutorial-id="centro-buscador"
          />
        </div>
        <select
          className={SELECT_CLASS}
          value={category}
          aria-label="Filtrar por módulo"
          onChange={(event) => setCategory(event.target.value as "todas" | TutorialCategory)}
        >
          <option value="todas">Todos los módulos</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {TUTORIAL_CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={level}
          aria-label="Filtrar por nivel"
          onChange={(event) => setLevel(event.target.value as "todos" | TutorialLevel)}
        >
          <option value="todos">Todos los niveles</option>
          {TUTORIAL_LEVELS.map((item) => (
            <option key={item} value={item}>
              {TUTORIAL_LEVEL_LABELS[item]}
            </option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={status}
          aria-label="Filtrar por estado"
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
        >
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            setCategory("todas");
            setLevel("todos");
            setStatus("todos");
          }}
        >
          Limpiar filtros
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin tutoriales que coincidan"
          description="Ajusta la búsqueda o los filtros para ver otros recorridos disponibles para tu cuenta."
        />
      ) : (
        groups.map((group) => (
          <section key={group.key} aria-labelledby={`grupo-${group.key}`} className="grid gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground" id={`grupo-${group.key}`}>
              {group.title}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((tutorial: TutorialDefinition) => (
                <TutorialCard
                  key={tutorial.id}
                  tutorial={tutorial}
                  status={statusOf(tutorial.id)}
                  completion={completionOf(tutorial.id)}
                  blockedBy={blockedBy(tutorial.id)}
                  onStart={() => startTutorial(tutorial.id, { origin: "centro" })}
                  onRestart={() => restartTutorial(tutorial.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
