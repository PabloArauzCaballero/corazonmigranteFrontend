// src/modules/vistas_publicas/public/components/landing/sections/MissionSection.jsx
import React, { useMemo } from "react";
import { useMouseTilt } from "../../../hooks/useMouseParallax";
import { renderStrong } from "../../../../../../helpers/renderStrong.jsx";

export default function MissionSection({ data, uiById, onAction }) {
  if (!data) return null;

  const id = data?.id || "";
  const badge = data?.badge || {};
  const title = data?.title || "";
  const paragraphs = Array.isArray(data?.paragraphs) ? data.paragraphs : [];
  const features = Array.isArray(data?.feature_cards) ? data.feature_cards : [];
  const link = data?.link || {};
  const image = data?.image || {};


  const imgAlt = image?.alt || "";
  const imgIdUi = image?.id_ui;
  const imgSrc = image?.src || "";
  const imgFallback = image?.fallback_src || "";

  const resolveUiUrl = (id_ui) => {
    const idNum = Number(id_ui);
    if (!Number.isFinite(idNum)) return "";
    return uiById?.[idNum]?.link || uiById?.[idNum]?.metadata?.url || "";
  };

  const resolvedImgSrc = resolveUiUrl(imgIdUi) || imgSrc;


  // 3D tilt effect on image
  const imageTiltRef = useMouseTilt(6);

  // Micro-validación emocional (puede venir en data, si no, usamos fallback)
  const microValidation = data?.micro_validation || "No estás exagerando. Migrar remueve más de lo que se dice.";

  // Puente emocional (pausa visual entre bloques). Si no viene, fallback.
  const bridgeLine =
    data?.bridge_line ||
    "No se trata de olvidar lo que fuiste, sino de darle un lugar sano en lo que sos hoy.";

  // Construimos un render “editorial” para los párrafos:
  // - Mantiene el orden
  // - Inserta una pausa/puente después del primer bloque, si hay suficiente contenido
  const renderedParagraphs = useMemo(() => {
    if (!paragraphs.length) return [];

    // Si hay 2+ párrafos, metemos el puente después del primero.
    if (paragraphs.length >= 2) {
      return [
        { type: "p", text: paragraphs[0] },
        { type: "bridge", text: bridgeLine },
        ...paragraphs.slice(1).map((t) => ({ type: "p", text: t })),
      ];
    }

    // Si solo hay 1, solo lo dejamos
    return paragraphs.map((t) => ({ type: "p", text: t }));
  }, [paragraphs, bridgeLine]);

  const ctaLabel = link?.label ? String(link.label) : "";
  const warmCtaLabel =
    data?.cta_warm_label ||
    (ctaLabel ? "Conocer a quienes pueden acompañarte" : "");

  return (
    <section
      id={id}
      className="min-h-screen flex items-center justify-center py-24 lg:py-0 px-6 lg:px-12 relative overflow-hidden"
    >
      <div className="absolute -right-28 top-0 text-[20rem] font-display text-primary/5 dark:text-white/5 select-none pointer-events-none z-0 floating blur-[0.2px]">
        {data?.decor_letter || ""}
      </div>

      <div className="max-w-7xl w-full mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1 fade-in-up perspective-container">
            <div
              ref={imageTiltRef}
              className="relative overflow-hidden rounded-[2rem] shadow-soft border border-primary/10 dark:border-white/10 group transition-slow preserve-3d"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent opacity-40 group-hover:opacity-20 transition-opacity z-10" />

              {resolvedImgSrc ? (
                <img
                  alt={imgAlt || uiById?.[Number(imgIdUi)]?.metadata?.alt || ""}
                  className="w-full h-[460px] lg:h-[640px] object-cover transform transition-transform duration-700 group-hover:scale-105"
                  src={resolvedImgSrc}
                  onError={(e) => {
                    if (imgFallback) e.currentTarget.src = imgFallback;
                  }}
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                />
              ) : null}
            </div>

            <div className="absolute -bottom-6 -left-6 w-full h-full border border-primary/15 dark:border-white/10 -z-10 hidden lg:block rounded-[2rem]" />
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2 text-left lg:pl-10 fade-in-up delay-100 relative">
            {/* Halo suave (atmósfera emocional) */}
            <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-60 dark:opacity-30 pointer-events-none" />

            {(badge?.text || badge?.icon) ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-white/60 dark:bg-white/5 dark:border-white/10 text-[12px] tracking-wide text-text-muted-light dark:text-gray-300 w-full mt-6">
                <span className="material-symbols-outlined text-[18px] text-primary dark:text-white">
                  {badge?.icon || ""}
                </span>
                {renderStrong(badge?.text || "")}
              </div>
            ) : null}

            <h2 className="mt-6 font-display text-4xl lg:text-5xl xl:text-6xl text-primary dark:text-white leading-[1.08] mb-5 font-medium">
              {renderStrong(title)}
            </h2>

            {/* Micro-validación emocional (ancla de seguridad) */}
            {microValidation ? (
              <p className="font-body text-sm lg:text-base text-text-muted-light dark:text-gray-300 mb-7 max-w-[56ch] leading-relaxed">
                {renderStrong(microValidation)}
              </p>
            ) : null}

            {renderedParagraphs.length ? (
              <div className="space-y-6 text-text-muted-light dark:text-gray-300 font-body text-[15px] lg:text-lg font-light leading-[1.85] max-w-[62ch]">
                {renderedParagraphs.map((item, idx) => {
                  const delay =
                    idx === 0 ? "delay-200" : idx === 1 ? "delay-300" : "delay-400";

                  if (item.type === "bridge") {
                    return (
                      <p
                        key={"bridge-" + idx}
                        className={`fade-in-up ${delay} text-text-main-light/80 dark:text-gray-200/90 font-medium`}
                      >
                        {renderStrong(item.text)}
                      </p>
                    );
                  }

                  return (
                    <p key={String(item.text) + idx} className={`fade-in-up ${delay}`}>
                      {renderStrong(item.text)}
                    </p>
                  );
                })}
              </div>
            ) : null}

            {features.length ? (
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 fade-in-up delay-400">
                {features.slice(0, 2).map((f, idx) => (
                  <div
                    key={(f?.title || "") + idx}
                    className="rounded-2xl bg-white/70 dark:bg-white/5 border border-primary/10 dark:border-white/10 p-5 shadow-soft hover-lift cursor-interactive transition-smooth"
                  >
                    <div className="flex items-center gap-2 text-primary dark:text-white">
                      <span className="material-symbols-outlined">{f?.icon || ""}</span>
                      <span className="font-body font-semibold">
                        {renderStrong(f?.title || "")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-muted-light dark:text-gray-300 leading-relaxed">
                      {renderStrong(f?.body || "")}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {link?.label ? (
              <div className="mt-10 fade-in-up delay-400">
                <button
                  type="button"
                  onClick={() => onAction?.(link?.action, link?.href)}
                  className="group inline-flex items-center text-primary dark:text-white font-body font-semibold text-base border-b border-primary/30 dark:border-white/25 pb-1 hover:border-primary dark:hover:border-white transition-colors"
                >
                  <span>{renderStrong(warmCtaLabel || link.label)}</span>
                  <span className="material-symbols-outlined text-[18px] ml-2 transform group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-primary/15 to-transparent dark:via-white/10" />
      </div>
    </section>
  );
}
