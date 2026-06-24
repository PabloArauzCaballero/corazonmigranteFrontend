// src/modules/vistas_publicas/public/components/landing/sections/ImpactPanelSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

function safeStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return [v];
}

/**
 * Contrato esperado (desde DB / JSON público):
 * content.presentation_section
 * {
 *   badge: { icon, text },
 *   title, subtitle,
 *   description: string[],
 *   primary_cta: { label, action, href },
 *   secondary_cta: { label, action, href },
 *   // Nuevo: carrusel
 *   imgs: { id_ui_list?: number[], id_uis?: number[], alt, fallback_src },
 *   // Legacy: imagen única
 *   img: { id_ui, alt, fallback_src },
 *   img_footer_text
 * }
 */

function SlideImage({
  src,
  alt,
  eager = false,
  className = "",
  onLoaded,
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // si cambia src, resetea estados
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loader local mientras carga */}
      {!loaded && !failed ? (
        <>
          <div className="absolute inset-0 animate-pulse bg-black/5 dark:bg-white/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-9 w-9 rounded-full border-2 border-black/20 border-t-black/60 dark:border-white/20 dark:border-t-white/70 animate-spin" />
          </div>
        </>
      ) : null}

      {/* Fallback visual si falla (sin romper layout) */}
      {failed ? (
        <div className="absolute inset-0 bg-black/5 dark:bg-white/10" />
      ) : null}

      <img
        src={src}
        alt={alt}
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded && !failed ? "opacity-100" : "opacity-0"
          }`}
        onLoad={() => {
          setLoaded(true);
          onLoaded?.();
        }}
        onError={() => {
          setFailed(true);
        }}
      />
    </div>
  );
}

export default function ImpactPanelSection({ data, onAction, resolveUiUrl }) {
  const d = data || null;
  if (!d) return null;

  const badgeText = safeStr(d?.badge?.text);
  const badgeIcon = safeStr(d?.badge?.icon) || "favorite";

  const title = safeStr(d?.title);
  const subtitle = safeStr(d?.subtitle);

  const bullets = useMemo(() => {
    return asArray(d?.description)
      .map((x) => safeStr(x).trim())
      .filter(Boolean)
      .slice(0, 6);
  }, [d]);

  const primary = d?.primary_cta || null;
  const secondary = d?.secondary_cta || null;

  const primaryLabel = safeStr(primary?.label || "Agendar una cita");
  const primaryAction = safeStr(primary?.action || "scroll_to_contacto");
  const primaryHref = safeStr(primary?.href || "#contacto");

  const secondaryLabel = safeStr(secondary?.label || "Conocer emociones");
  const secondaryAction = safeStr(secondary?.action || "scroll_to_emociones");
  const secondaryHref = safeStr(secondary?.href || "#emociones");

  // =========================
  // Carrusel (imgs.id_uis | imgs.id_ui_list)
  // =========================
  const idsFromNew =
    (Array.isArray(d?.imgs?.id_ui_list) && d.imgs.id_ui_list) ||
    (Array.isArray(d?.imgs?.id_uis) && d.imgs.id_uis) ||
    [];

  const idsFromOld = d?.img?.id_ui ? [d.img.id_ui] : [];

  const ids = (idsFromNew.length ? idsFromNew : idsFromOld)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x > 0);

  const idsKey = useMemo(() => ids.join("|"), [ids]);

  const imgAlt =
    safeStr(d?.imgs?.alt) || safeStr(d?.img?.alt) || "Imagen de presentación";

  const imgFallback =
    safeStr(d?.imgs?.fallback_src) || safeStr(d?.img?.fallback_src);

  const slides = useMemo(() => {
    const out = [];
    if (typeof resolveUiUrl === "function") {
      for (const id of ids) {
        const url = safeStr(resolveUiUrl(id)).trim();
        if (url) out.push(url);
      }
    }
    if (!out.length && imgFallback) out.push(imgFallback);
    return out;
  }, [idsKey, resolveUiUrl, imgFallback]);

  const [idx, setIdx] = useState(0);
  const pausedRef = useRef(false);

  // Si cambian slides, resetea y/o ajusta idx para evitar “fuera de rango”
  useEffect(() => {
    setIdx((p) => {
      if (!slides.length) return 0;
      if (p < 0) return 0;
      if (p > slides.length - 1) return 0;
      return p;
    });
  }, [slides.length, idsKey]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = window.setInterval(() => {
      if (pausedRef.current) return;
      setIdx((p) => (p + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const goPrev = () => {
    if (!slides.length) return;
    setIdx((p) => (p - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    if (!slides.length) return;
    setIdx((p) => (p + 1) % slides.length);
  };

  const footerText = safeStr(d?.img_footer_text);

  return (
    <section id="impacto" className="relative overflow-hidden">
      {/* Fondo clean */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background-light dark:bg-background-dark" />
        <div
          className="absolute inset-0 opacity-70 dark:opacity-50
          bg-[radial-gradient(900px_circle_at_15%_20%,rgba(116,47,56,0.12),transparent_60%),radial-gradient(700px_circle_at_85%_30%,rgba(209,167,58,0.10),transparent_55%)]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(247,246,246,1)_0%,rgba(247,246,246,0.7)_35%,rgba(247,246,246,1)_100%)] dark:bg-[linear-gradient(to_bottom,rgba(29,21,22,1)_0%,rgba(29,21,22,0.55)_40%,rgba(29,21,22,1)_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 md:pt-16 pb-10 md:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mt-14 w-full justify-items-center lg:justify-items-stretch">
          {/* Copy */}
          <div className="lg:col-span-5 w-full justify-self-start">
            {badgeText || badgeIcon ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-white/60 dark:bg-white/5 dark:border-white/10 text-[12px] tracking-wide text-text-muted-light dark:text-gray-300">
                <span className="material-symbols-outlined text-[18px] text-primary dark:text-white">
                  {badgeIcon || "favorite"}
                </span>
                {badgeText}
              </div>
            ) : null}

            {title ? (
              <h2 className="mt-5 font-display text-3xl md:text-4xl leading-[1.08] text-primary dark:text-white">
                {title}
              </h2>
            ) : null}

            {subtitle ? (
              <p className="mt-4 font-body text-base md:text-lg text-text-muted-light dark:text-gray-300 leading-relaxed">
                {subtitle}
              </p>
            ) : null}

            {bullets.length ? (
              <ul className="mt-6 space-y-3">
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-primary dark:text-brand-gold mt-[2px]">
                      check_circle
                    </span>
                    <span className="font-body text-sm md:text-base text-text-main-light dark:text-gray-200">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => onAction?.(primaryAction, primaryHref)}
                className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-light transition-smooth shadow-soft font-body font-semibold button-press hover-glow"
              >
                {primaryLabel}
              </button>

              <button
                type="button"
                onClick={() => onAction?.(secondaryAction, secondaryHref)}
                className="px-6 py-3 rounded-lg bg-white/70 hover:bg-white transition-smooth border border-primary/15 text-primary dark:text-white dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 shadow-soft font-body font-semibold button-press"
              >
                {secondaryLabel}
              </button>
            </div>
          </div>

          {/* Visual */}
          <div className="lg:col-span-7 w-full justify-self-center">
            <div className="relative rounded-2xl overflow-hidden shadow-soft border border-primary/10 dark:border-white/10 bg-white/40 dark:bg-white/5">
              {slides.length ? (
                <div
                  className="relative w-full h-[260px] sm:h-[340px] md:h-[420px]"
                  onMouseEnter={() => (pausedRef.current = true)}
                  onMouseLeave={() => (pausedRef.current = false)}
                >
                  {/* Track */}
                  <div
                    className="absolute inset-0 flex transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-${idx * 100}%)` }}
                  >
                    {slides.map((src, i) => (
                      <div
                        key={`${src}-${i}`}
                        className="w-full h-full flex-none"
                      >
                        <SlideImage
                          src={src}
                          alt={i === 0 ? imgAlt : ""} // alt solo para la 1ra
                          eager={i === 0}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Controles */}
                  {slides.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 hover:bg-black/45 text-white flex items-center justify-center backdrop-blur border border-white/15 transition"
                        aria-label="Imagen anterior"
                      >
                        <span className="material-symbols-outlined">
                          chevron_left
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 hover:bg-black/45 text-white flex items-center justify-center backdrop-blur border border-white/15 transition"
                        aria-label="Siguiente imagen"
                      >
                        <span className="material-symbols-outlined">
                          chevron_right
                        </span>
                      </button>

                      {/* Dots */}
                      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
                        {slides.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setIdx(i)}
                            className={`h-2.5 rounded-full transition-all border border-white/25 ${i === idx
                                ? "w-8 bg-white/90"
                                : "w-2.5 bg-white/40 hover:bg-white/60"
                              }`}
                            aria-label={`Ir a imagen ${i + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="w-full h-[260px] sm:h-[340px] md:h-[420px] bg-black/5 dark:bg-white/10" />
              )}

              {footerText ? (
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 bg-[linear-gradient(to_top,rgba(0,0,0,0.55),transparent)]">
                  <div className="text-white/90 text-sm md:text-base font-body max-w-[54ch]">
                    {footerText}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
