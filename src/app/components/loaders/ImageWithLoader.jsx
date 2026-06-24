import React, { useEffect, useRef, useState } from "react";

/**
 * Imagen con estado visual de carga dentro de su recuadro.
 * - Muestra skeleton mientras carga.
 * - Si falla, usa fallbackSrc (si existe) o deja el recuadro con ícono.
 * - Mantiene layout: wrapper "relative" + img ocupa todo el espacio si quieres.
 */
export default function ImageWithLoader({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  fallbackSrc = "",
  imgProps = {},
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef(null);

  const finalSrc = !errored ? src : fallbackSrc || src;

  useEffect(() => {
    // Reset cuando cambia src.
    setLoaded(false);
    setErrored(false);
  }, [src]);

  useEffect(() => {
    // Si viene del cache, onLoad puede no disparar en algunos casos.
    const el = imgRef.current;
    if (!el) return;

    if (el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [finalSrc]);

  return (
    <div className={"relative overflow-hidden " + (wrapperClassName || "")}>
      {/* Skeleton */}
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-black/5 dark:bg-white/10" />
      ) : null}

      {/* Fallback visual si falla y no hay fallbackSrc */}
      {errored && !fallbackSrc ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/10">
          <span className="text-xs text-slate-500 dark:text-slate-300">Imagen</span>
        </div>
      ) : null}

      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        className={className}
        loading={imgProps.loading || "lazy"}
        decoding={imgProps.decoding || "async"}
        onLoad={(e) => {
          setLoaded(true);
          if (typeof imgProps.onLoad === "function") imgProps.onLoad(e);
        }}
        onError={(e) => {
          // Si falló con src, intentamos fallback si existe; si también falla, marcamos error igual.
          if (!errored) setErrored(true);
          if (typeof imgProps.onError === "function") imgProps.onError(e);
        }}
        {...imgProps}
      />
    </div>
  );
}
