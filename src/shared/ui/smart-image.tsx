"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Imagen robusta para la landing y el contenido público.
 *
 * Cubre los requisitos de "reparación de imágenes caídas":
 *  - Estado de carga (placeholder shimmer) para evitar huecos vacíos.
 *  - Estado de error con imagen de respaldo (fallback) configurable.
 *  - Relación de aspecto conocida para evitar saltos de layout (CLS).
 *  - Carga prioritaria opcional para el hero (fetchPriority / loading eager).
 *  - Protección frente a URLs vacías o inválidas.
 *  - onError seguro que solo intenta el fallback una vez (sin bucles).
 */
export type SmartImageProps = {
  src?: string | null;
  /** Imagen de respaldo cuando `src` falla o está vacía. */
  fallbackSrc?: string;
  alt: string;
  /** Relación de aspecto CSS (p.ej. "16 / 9", "3 / 4"). Evita CLS. */
  aspectRatio?: string;
  className?: string;
  imgClassName?: string;
  /** Hero: carga inmediata y prioridad alta. */
  priority?: boolean;
  rounded?: string;
  onLoaded?: () => void;
  onErrored?: () => void;
};

const GENERIC_FALLBACK =
  "https://res.cloudinary.com/sfyimi9x/image/upload/corazon-migrante/landing_page/media/carrusel-1.webp";

function isValidSrc(src?: string | null): src is string {
  if (!src) return false;
  const s = src.trim();
  if (!s) return false;
  // Rechaza valores claramente inválidos.
  if (/^(null|undefined|about:blank)$/i.test(s)) return false;
  return /^(https?:)?\/\//.test(s) || s.startsWith("/") || s.startsWith("data:");
}

export function SmartImage({
  src,
  fallbackSrc = GENERIC_FALLBACK,
  alt,
  aspectRatio,
  className,
  imgClassName,
  priority = false,
  rounded,
  onLoaded,
  onErrored,
}: SmartImageProps) {
  const resolved = isValidSrc(src) ? src : fallbackSrc;
  const [current, setCurrent] = useState(resolved);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  // Si cambia la prop `src`, se reinicia el estado durante el render. Hacerlo en un
  // useEffect provocaba un render intermedio en el que el <img> seguía apuntando a
  // la imagen anterior ya marcada como "loaded": se veía la foto vieja durante un
  // frame antes de cargar la nueva.
  const [lastResolved, setLastResolved] = useState(resolved);
  if (resolved !== lastResolved) {
    setLastResolved(resolved);
    setCurrent(resolved);
    setStatus("loading");
  }

  return (
    <div
      className={cn("relative overflow-hidden bg-line", rounded, className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Placeholder shimmer mientras carga */}
      {status === "loading" && (
        <div className="skeleton absolute inset-0" aria-hidden="true" />
      )}

      <img
        src={current}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
          status === "loaded" ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
        onLoad={() => {
          setStatus("loaded");
          onLoaded?.();
        }}
        onError={() => {
          // `current !== fallbackSrc` ya garantiza que el fallback se intenta una sola
          // vez por cada `src`: en cuanto se cambia a él, esta rama deja de entrar.
          if (fallbackSrc && current !== fallbackSrc) {
            setCurrent(fallbackSrc);
            setStatus("loading");
            return;
          }
          setStatus("error");
          onErrored?.();
        }}
      />

      {/* Estado de error definitivo: degradado suave con la marca */}
      {status === "error" && (
        <div
          className="absolute inset-0 grid place-items-center bg-gradient-to-br from-line to-line-strong text-ink-subtle"
          aria-hidden="true"
        >
          <span className="text-xs font-semibold uppercase tracking-widest">Corazón Migrante</span>
        </div>
      )}
    </div>
  );
}
