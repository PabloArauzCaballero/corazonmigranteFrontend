// src/modules/vistas_publicas/public/components/landing/sections/MapSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useMouseTilt } from "../../../hooks/useMouseParallax";
import { renderStrong } from "../../../../../../helpers/renderStrong.jsx";

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

export default function MapSection({ data, uiById, onAction }) {
  if (!data) return null;

  const id = data?.id || "";
  const badge = data?.badge || {};
  const title = data?.title || "";
  const subtitle = data?.subtitle || "";

  const paragraphs_main = Array.isArray(data?.paragraphs?.main)
    ? data.paragraphs.main.filter(Boolean)
    : [];

  // Puede venir string o array (lo normalizamos a array)
  const paragraphs_aditional_raw = data?.paragraphs?.aditional;
  const paragraphs_aditional = useMemo(() => {
    if (Array.isArray(paragraphs_aditional_raw))
      return paragraphs_aditional_raw.map(String).map((s) => s.trim()).filter(Boolean);

    if (typeof paragraphs_aditional_raw === "string") {
      const t = paragraphs_aditional_raw.trim();
      return t ? [t] : [];
    }

    return [];
  }, [paragraphs_aditional_raw]);

  // ✅ conclusion_phrase como objeto (titulo -> [parrafos])
  const conclusionItems = useMemo(() => {
    const raw = data?.paragraphs?.conclusion_phrase;

    if (isPlainObject(raw)) {
      return Object.entries(raw)
        .map(([k, v]) => {
          const tTitle = String(k ?? "").trim();
          const arr = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
          const body = arr.map((x) => String(x ?? "").trim()).filter(Boolean);
          return { title: tTitle, body };
        })
        .filter((x) => x.title && x.body.length);
    }

    if (Array.isArray(raw)) {
      const titles = raw.map((s) => String(s ?? "").trim()).filter(Boolean);
      return titles.map((t) => ({ title: t, body: [] }));
    }

    return [];
  }, [data?.paragraphs?.conclusion_phrase]);

  // ✅ testimonios como objeto (titulo -> { paragraph:[], image:{id_ui,alt} })
  const testimonialItems = useMemo(() => {
    const raw = data?.paragraphs?.testimonios ?? data?.testimonios;
    if (!isPlainObject(raw)) return [];

    return Object.entries(raw)
      .map(([k, v]) => {
        const tTitle = String(k ?? "").trim();

        const bodyRaw = v?.paragraph ?? v?.paragraphs ?? v?.body ?? [];
        const bodyArr = Array.isArray(bodyRaw)
          ? bodyRaw
          : typeof bodyRaw === "string"
            ? [bodyRaw]
            : [];
        const body = bodyArr.map((x) => String(x ?? "").trim()).filter(Boolean);

        const img = v?.image || {};
        const imgIdUi = img?.id_ui ?? img?.id ?? img?.ui_id;
        const imgAlt = String(img?.alt ?? "").trim();

        return { title: tTitle, body, image: { id_ui: imgIdUi, alt: imgAlt } };
      })
      .filter((x) => x.title && x.body.length);
  }, [data?.paragraphs?.testimonios, data?.testimonios]);

  const image = data?.image || {};
  const link = data?.link || {};

  const imgAlt = image?.alt || "";
  const imgIdUi = image?.id_ui;
  const imgSrc = image?.src || "";
  const imgFallback = image?.fallback_src || "";

  const resolveUiUrl = (id_ui) => {
    const id = Number(id_ui);
    if (!Number.isFinite(id)) return "";
    return uiById?.[id]?.link || uiById?.[id]?.metadata?.url || "";
  };

  const resolvedMainSrc = resolveUiUrl(imgIdUi) || imgSrc;

  const mapTiltRef = useMouseTilt(5);

  const [showMore, setShowMore] = useState(false);

  const [openPhraseKeys, setOpenPhraseKeys] = useState(() => new Set());
  const [openTestKeys, setOpenTestKeys] = useState(() => new Set());

  const canExpand =
    paragraphs_aditional.length > 0 ||
    conclusionItems.length > 0 ||
    testimonialItems.length > 0;

  // Abrir 1 item por defecto cuando se habilita el panel
  useEffect(() => {
    if (!showMore) return;

    if (conclusionItems.length && openPhraseKeys.size === 0) {
      setOpenPhraseKeys(new Set([conclusionItems[0].title]));
    }
    if (testimonialItems.length && openTestKeys.size === 0) {
      setOpenTestKeys(new Set([testimonialItems[0].title]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMore, conclusionItems.length, testimonialItems.length]);

  const handleLinkClick = () => {
    if (!canExpand) {
      if (link?.action || link?.href) onAction?.(link?.action, link?.href);
      return;
    }

    setShowMore((v) => {
      const next = !v;
      if (!next) {
        setOpenPhraseKeys(new Set());
        setOpenTestKeys(new Set());
      }
      return next;
    });
  };

  const togglePhrase = (t) =>
    setOpenPhraseKeys((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const toggleTestimonial = (t) =>
    setOpenTestKeys((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  return (
    <section
      id={id}
      className="min-h-screen flex items-center justify-center py-24 lg:py-0 px-6 lg:px-12 relative overflow-hidden"
    >
      {/* Decor letter (textura editorial) */}
      <div className="absolute -left-28 top-0 text-[20rem] font-display text-primary/5 dark:text-white/5 select-none pointer-events-none z-0 floating blur-[0.2px]">
        {data?.decor_letter || ""}
      </div>

      <div className="max-w-7xl w-full mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Copy */}
          <div className="order-2 lg:order-1 text-left lg:pr-10 fade-in-up delay-100 flex flex-col justify-center relative">
            {/* Halo suave */}
            <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-60 dark:opacity-30 pointer-events-none" />

            {/* Ruta simbólica */}
            <div className="hidden lg:block absolute -left-6 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-primary/15 to-transparent dark:via-white/10" />
            <div className="hidden lg:block absolute -left-[29px] top-24 w-3 h-3 rounded-full border border-primary/20 dark:border-white/15 bg-white/80 dark:bg-white/10 shadow-soft" />
            <div className="hidden lg:block absolute -left-[27px] top-44 w-2 h-2 rounded-full bg-primary/20 dark:bg-white/15" />
            <div className="hidden lg:block absolute -left-[27px] top-72 w-2 h-2 rounded-full bg-primary/15 dark:bg-white/10" />

            {(badge?.text || badge?.icon) ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-white/60 dark:bg-white/5 dark:border-white/10 text-[12px] tracking-wide text-text-muted-light dark:text-gray-300">
                <span className="material-symbols-outlined text-[18px] text-primary dark:text-white">
                  {badge?.icon || ""}
                </span>
                {badge?.text || ""}
              </div>
            ) : null}

            <h2 className="mt-6 font-display text-4xl lg:text-5xl xl:text-6xl text-primary dark:text-white leading-[1.1] mb-6 font-light">
              {renderStrong(title)}
            </h2>

            {subtitle ? (
              <p className="font-body text-xl lg:text-2xl font-semibold text-text-main-light dark:text-gray-200 mb-4 leading-snug max-w-[54ch]">
                {renderStrong(subtitle)}
              </p>
            ) : null}

            <p className="font-body text-sm lg:text-base text-text-muted-light dark:text-gray-300 mb-8 max-w-[54ch]">
              Si migrar te removió por dentro, este espacio es para vos.
            </p>

            {paragraphs_main.length ? (
              <div className="space-y-6 text-text-muted-light dark:text-gray-300 font-body text-[15px] lg:text-lg font-light leading-[1.85] max-w-[62ch]">
                {paragraphs_main.map((p, idx) => (
                  <p
                    key={p + idx}
                    className={[
                      "fade-in-up",
                      idx === 0 ? "delay-200" : idx === 1 ? "delay-300" : "delay-400",
                    ].join(" ")}
                  >
                    {renderStrong(p)}
                  </p>
                ))}
              </div>
            ) : null}

            {/* CTA */}
            {link?.label ? (
              <div className="mt-10 fade-in-up delay-400">
                <button
                  type="button"
                  onClick={handleLinkClick}
                  className="group inline-flex items-center text-primary dark:text-white font-body font-semibold text-base border-b border-primary/30 dark:border-white/25 pb-1 hover:border-primary dark:hover:border-white transition-colors"
                >
                  <span>
                    {canExpand
                      ? showMore
                        ? "Ver menos"
                        : renderStrong(link.label)
                      : renderStrong(link.label)}
                  </span>

                  <span
                    className={[
                      "material-symbols-outlined text-[18px] ml-2 transition-transform",
                      canExpand && showMore ? "rotate-90" : "group-hover:translate-x-1",
                    ].join(" ")}
                  >
                    {canExpand ? (showMore ? "expand_more" : "arrow_forward") : "arrow_forward"}
                  </span>
                </button>
              </div>
            ) : null}
          </div>

          {/* Right side */}
          <div className="relative order-1 lg:order-2 fade-in-up w-full">
            <div className="perspective-container">
              <div
                ref={mapTiltRef}
                className="relative overflow-hidden rounded-[2rem] shadow-soft border border-primary/10 dark:border-white/10 group transition-slow preserve-3d"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent opacity-40 group-hover:opacity-20 transition-opacity z-10" />

                <img
                  alt={imgAlt || uiById?.[Number(imgIdUi)]?.metadata?.alt || ""}
                  className="w-full h-[360px] lg:h-[480px] object-cover transform transition-transform duration-700 group-hover:scale-105"
                  src={resolvedMainSrc}
                  onError={(e) => {
                    if (imgFallback) e.currentTarget.src = imgFallback;
                  }}
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                />
              </div>

              <div className="absolute -bottom-6 -right-6 w-[92%] h-full border border-primary/15 dark:border-white/10 -z-10 hidden lg:block rounded-[2rem]" />
            </div>
          </div>
        </div>

        {showMore && paragraphs_aditional.length > 0 ? (
          <div className="mt-10 fade-in-up">
            <div
              className={[
                "text-text-muted-light dark:text-gray-300 font-body",
                "text-[15px] lg:text-base font-light leading-[1.9]",
                "lg:columns-2 lg:gap-12 [column-fill:balance]",
              ].join(" ")}
            >
              {paragraphs_aditional.map((p, idx) => (
                <p
                  key={p + idx}
                  className="mb-5 break-inside-avoid text-justify"
                >
                  <span className="first-letter:text-2xl first-letter:font-semibold first-letter:text-primary dark:first-letter:text-white">
                    {renderStrong(p)}
                  </span>
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {showMore ? (
          <div className="mt-12 rounded-[2rem] border border-primary/10 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-soft p-6 lg:p-8 xl:p-10 relative overflow-hidden w-full fade-in-up">
            <div className="absolute -top-16 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl opacity-60 dark:opacity-30 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 relative">
              <span className="material-symbols-outlined text-primary dark:text-white text-[28px]">
                auto_awesome
              </span>
              <div className="flex flex-col">
                <h3 className="font-body font-semibold text-lg lg:text-xl text-text-main-light dark:text-gray-100">
                  Descubrimientos
                </h3>
                <p className="text-xs lg:text-sm text-text-muted-light dark:text-gray-300">
                  Frases y testimonios para ponerle orden a lo que sentís.
                </p>
              </div>
            </div>

            {/* Quote mini */}
            <div className="relative mb-6 lg:mb-8 rounded-2xl border border-primary/10 dark:border-white/10 bg-white/75 dark:bg-white/5 px-5 py-4">
              <div className="absolute -top-6 -left-1 text-[64px] leading-none text-primary/10 dark:text-white/10 select-none pointer-events-none">
                "
              </div>
              <p className="font-body text-sm lg:text-base text-text-muted-light dark:text-gray-300 pl-7 pr-2 leading-relaxed italic">
                A veces no necesitamos respuestas, sino palabras que ordenen lo que sentimos.
              </p>
            </div>

            {/* Testimonios */}
            {testimonialItems.length ? (
              <div className="mb-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary dark:text-white text-[22px]">
                      forum
                    </span>
                    <h4 className="font-body font-semibold text-base lg:text-lg text-text-main-light dark:text-gray-100">
                      Crónicas migrantes
                    </h4>
                  </div>
                  <span className="text-xs text-text-muted-light dark:text-gray-300 bg-primary/10 dark:bg-white/10 px-2.5 py-1 rounded-full">
                    {testimonialItems.length} historias
                  </span>
                </div>

                <div className="columns-1 lg:columns-2 gap-3 lg:gap-4 [column-fill:_balance]">
                  {testimonialItems.map((t) => {
                    const isOpen = openTestKeys.has(t.title);
                    const img = t.image || {};
                    const testImgUrl = resolveUiUrl(img?.id_ui);
                    const hasImg = Boolean(testImgUrl);

                    return (
                      <div
                        key={t.title}
                        className="mb-3 lg:mb-4 break-inside-avoid rounded-2xl border border-primary/10 dark:border-white/10 bg-white/80 dark:bg-white/5 overflow-hidden transition-shadow hover:shadow-md"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTestimonial(t.title)}
                          className="w-full flex items-start justify-between gap-4 px-4 py-3.5 text-left hover:bg-primary/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-primary dark:text-white font-body font-semibold text-[15px] lg:text-base leading-snug">
                              {renderStrong(t.title)}
                            </div>
                            <p className="mt-1 text-xs lg:text-sm text-text-muted-light dark:text-gray-300">
                              {isOpen ? "Ocultar historia" : "Leer historia"}
                            </p>
                          </div>

                          <span
                            className={[
                              "material-symbols-outlined text-[20px] text-primary/70 dark:text-white/70 transition-transform shrink-0 mt-0.5",
                              isOpen ? "rotate-180" : "",
                            ].join(" ")}
                          >
                            expand_more
                          </span>
                        </button>

                        <div
                          className={[
                            "overflow-hidden transition-[max-height,opacity] duration-400 ease-out",
                            isOpen ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0",
                          ].join(" ")}
                          aria-hidden={!isOpen}
                        >
                          <div className="px-4 pb-4">
                            <div className="h-px w-full bg-primary/10 dark:bg-white/10 mb-3" />

                            <div className="space-y-4">
                              <div className="space-y-2.5 text-text-muted-light dark:text-gray-300 font-body text-sm lg:text-[15px] leading-relaxed">
                                {t.body.map((p, i) => (
                                  <p key={p + i}>{renderStrong(p)}</p>
                                ))}
                              </div>

                              {hasImg ? (
                                <div className="pt-1">
                                  <div className="relative overflow-hidden rounded-xl border border-primary/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
                                    <img
                                      src={testImgUrl}
                                      alt={img.alt || uiById?.[Number(img?.id_ui)]?.metadata?.alt || "Testimonio"}
                                      className="w-full h-[280px] sm:h-[400px] object-cover"
                                      loading="lazy"
                                      decoding="async"
                                      fetchpriority="low"
                                    />
                                  </div>
                                </div>
                              ) : null}

                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => onAction?.("explore_emotions", "#emociones")}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 transition-colors font-body font-semibold text-xs lg:text-sm"
                                >
                                  Explorar emociones
                                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleTestimonial(t.title)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 text-primary hover:bg-primary/5 dark:border-white/15 dark:text-white dark:hover:bg-white/5 transition-colors font-body font-semibold text-xs lg:text-sm"
                                >
                                  Cerrar
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {conclusionItems.length ? (
              <div>
                {testimonialItems.length ? (
                  <div className="h-px w-full bg-primary/10 dark:bg-white/10 mb-6" />
                ) : null}

                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary dark:text-white text-[22px]">
                    format_quote
                  </span>
                  <h4 className="font-body font-semibold text-base lg:text-lg text-text-main-light dark:text-gray-100">
                    Frases que resuenan
                  </h4>
                </div>

                <div className="columns-1 lg:columns-2 gap-3 lg:gap-4 [column-fill:_balance]">
                  {conclusionItems.map((item) => {
                    const isOpen = openPhraseKeys.has(item.title);

                    return (
                      <div
                        key={item.title}
                        className="mb-3 lg:mb-4 break-inside-avoid rounded-2xl border border-primary/10 dark:border-white/10 bg-white/80 dark:bg-white/5 overflow-hidden transition-shadow hover:shadow-md"
                      >
                        <button
                          type="button"
                          onClick={() => togglePhrase(item.title)}
                          className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-primary/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          <div
                            className="text-primary dark:text-white flex-1"
                            style={{
                              fontFamily: '"Caveat", cursive',
                              fontSize: "20px",
                              lineHeight: "1.2",
                            }}
                          >
                            {renderStrong(item.title)}
                          </div>

                          <span
                            className={[
                              "material-symbols-outlined text-[20px] text-primary/70 dark:text-white/70 transition-transform shrink-0",
                              isOpen ? "rotate-180" : "",
                            ].join(" ")}
                          >
                            expand_more
                          </span>
                        </button>

                        <div
                          className={[
                            "overflow-hidden transition-[max-height,opacity] duration-400 ease-out",
                            isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
                          ].join(" ")}
                          aria-hidden={!isOpen}
                        >
                          <div className="px-4 pb-4">
                            <div className="h-px w-full bg-primary/10 dark:bg-white/10 mb-3" />
                            <div className="space-y-2.5 text-text-muted-light dark:text-gray-300 font-body text-sm lg:text-[15px] leading-relaxed">
                              {item.body.map((t, i) => (
                                <p key={t + i}>{renderStrong(t)}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* CTA final */}
            <div className="mt-8 pt-6 border-t border-primary/10 dark:border-white/10">
              <div className="max-w-3xl mx-auto text-center">
                <p className="font-body text-sm lg:text-base text-text-muted-light dark:text-gray-300 leading-relaxed mb-4">
                  No tenés que entender todo hoy. A veces el primer paso es simplemente no estar
                  solo.
                </p>

                <button
                  type="button"
                  onClick={() => onAction?.("explore_emotions", "#emociones")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white hover:bg-primary/90 dark:bg-white dark:text-primary dark:hover:bg-white/90 transition-all shadow-md hover:shadow-lg font-body font-semibold text-sm lg:text-base"
                >
                  Explorar emociones
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-primary/15 to-transparent dark:via-white/10" />
      </div>
    </section>
  );
}
