"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/shared/theme/use-theme";
import type { ThemePreference } from "@/shared/theme/theme";

const OPTIONS: Array<{ value: ThemePreference; label: string; Icon: typeof Sun }> = [
  { value: "system", label: "Seguir al sistema", Icon: Monitor },
  { value: "light", label: "Tema claro", Icon: Sun },
  { value: "dark", label: "Tema oscuro", Icon: Moon },
];

/**
 * Selector de tema de tres estados.
 *
 * Se usa un grupo de radio y no un interruptor de dos posiciones porque
 * «seguir al sistema» es un estado propio y el más útil por defecto: con un
 * interruptor binario, quien tiene el móvil en oscuro por la noche pierde ese
 * cambio automático en cuanto toca el control una vez.
 *
 * Accesibilidad: `role="radiogroup"` con `aria-checked` en cada opción; solo la
 * opción activa entra en el orden de tabulación (`tabIndex`), y las flechas
 * mueven la selección, que es el comportamiento esperado de un grupo de radio.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, ready, setPreference } = useTheme();

  const move = (delta: number) => {
    const current = OPTIONS.findIndex((option) => option.value === preference);
    const next = OPTIONS[(current + delta + OPTIONS.length) % OPTIONS.length];
    setPreference(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la interfaz"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface-raised p-0.5",
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        // Antes de que el efecto de montaje lea el almacenamiento no se sabe cuál
        // está activa: marcar una aquí produciría un desajuste de hidratación,
        // porque el HTML estático es el mismo para todo el mundo.
        const active = ready && preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            tabIndex={active || (!ready && value === "system") ? 0 : -1}
            onClick={() => setPreference(value)}
            className={cn(
              "focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full",
              "transition-colors duration-fast",
              active
                ? "bg-primary text-primary-foreground"
                : "text-ink-muted hover:bg-muted hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
