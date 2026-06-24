import React from "react";
import { useScrollReveal } from "../../../hooks/useScrollReveal";

function EmotionCard({ delayClass = "", item, index, uiById }) {
  const title = item?.title || "";
  const body = item?.body || "";
  const imgIdUi = item?.image?.id_ui;
  const imgSrc = item?.image?.src || "";
  const imgAlt = item?.image?.alt || "";
  const imgFallback = item?.image?.fallback_src || "";

  const resolvedSrc = (() => {
    const idNum = Number(imgIdUi);
    if (Number.isFinite(idNum)) {
      return uiById?.[idNum]?.link || uiById?.[idNum]?.metadata?.url || "";
    }
    return "";
  })() || imgSrc;

  const resolvedAlt = imgAlt || (Number.isFinite(Number(imgIdUi)) ? (uiById?.[Number(imgIdUi)]?.metadata?.alt || "") : "");

  const revealRef = useScrollReveal({ threshold: 0.2 });

  return (
    <div
      ref={revealRef}
      className={`flex flex-col items-center text-center group fade-in-up ${delayClass}`}
    // ✅ IMPORTANTE: NO pongas style={{ opacity: 0 }}
    >
      <div className="w-full aspect-square mb-8 relative overflow-hidden bg-surface-light dark:bg-surface-dark shadow-soft rounded p-4 card-3d perspective-container">
        <div className="w-full h-full relative overflow-hidden rounded transform transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2">
          {resolvedSrc ? (
            <img
              alt={resolvedAlt}
              className="w-full h-full object-cover"
              src={resolvedSrc}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (imgFallback && e.currentTarget.src !== imgFallback) {
                  e.currentTarget.src = imgFallback;
                }
              }}
            />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
      </div>

      <h3 className="font-display text-2xl text-primary dark:text-white font-semibold mb-2 transition-smooth group-hover:text-primary-light">
        {title}
      </h3>
      <p className="font-body text-text-muted-light dark:text-gray-300 leading-relaxed text-base font-light px-2">
        {body}
      </p>
    </div>
  );
}

export default function EmotionsSection({ data, uiById }) {
  if (!data) return null;

  const id = data?.id || "";
  const title = data?.title || "";
  const items = Array.isArray(data?.items) ? data.items : [];

  if (!id) return null;

  return (
    <section
      id={id}
      className="min-h-screen py-24 lg:py-32 px-6 lg:px-12 relative overflow-hidden flex flex-col justify-center"
    >
      <div className="absolute -left-20 top-40 text-[20rem] font-display text-primary/5 dark:text-white/5 select-none pointer-events-none z-0 rotate-12 floating">
        {data?.decor_letter || ""}
      </div>

      <div className="max-w-7xl w-full mx-auto relative z-10">
        <div className="text-center mb-20 fade-in-up">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-primary dark:text-white font-bold leading-tight">
            {title}
          </h2>
          <div className="h-1 w-24 bg-primary/20 dark:bg-white/20 mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 items-start">
          {items.map((it, idx) => (
            <EmotionCard
              key={`${it?.title || "item"}-${idx}`}
              delayClass={["delay-100", "delay-200", "delay-300", "delay-400"][idx] || ""}
              item={it}
              index={idx}
              uiById={uiById}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
