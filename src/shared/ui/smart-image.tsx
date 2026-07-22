"use client";

import { useEffect, useRef, useState } from "react";
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

const GENERIC_FALLBACK = "/landing/carrusel-1.webp";

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
  const initial = isValidSrc(src) ? src : fallbackSrc;
  const [current, setCurrent] = useState(initial);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const triedFallback = useRef(current === fallbackSrc);

  // Si cambia la prop `src`, reinicia el estado.
  useEffect(() => {
    const next = isValidSrc(src) ? src : fallbackSrc;
    setCurrent(next);
    setStatus("loading");
    triedFallback.current = next === fallbackSrc;
  }, [src, fallbackSrc]);

  return (
    <div
      className={cn("relative overflow-hidden bg-[#e8ded3]", rounded, className)}
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
          if (!triedFallback.current && fallbackSrc && current !== fallbackSrc) {
            triedFallback.current = true;
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
          className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#e8ded3] to-[#d8ccbe] text-[#8a7d70]"
          aria-hidden="true"
        >
          <span className="text-xs font-semibold uppercase tracking-widest">Corazón Migrante</span>
        </div>
      )}
    </div>
  );
}
