// src/modules/vistas_publicas/public/components/landing/sections/HeroSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMouseParallax, useMouseTilt } from "../../../hooks/useMouseParallax";

export default function HeroSection({ data, onAction }) {
  if (!data) return null;

  const badge = data?.badge || {};
  const titleLine1 = data?.title_line_1 || data?.title || "";
  const titleLine2 = data?.title_line_2 || data?.subtitle || "";
  const lead = Array.isArray(data?.lead)
    ? data.lead.join(" ")
    : data?.lead || data?.description || "";

  const primary = data?.primary_cta;
  const secondary = data?.secondary_cta;
  const trust = Array.isArray(data?.trust_cards) ? data.trust_cards : [];

  const visual = data?.visual || {};
  const vHeader = visual?.header || {};
  const bubbles = Array.isArray(visual?.bubbles) ? visual.bubbles : [];
  const stats = Array.isArray(visual?.stats) ? visual.stats : [];
  const note = visual?.note || {};

  // =========================
  // Paginación de bubbles
  // =========================
  const PAGE_SIZE = 3;
  const [bubblePage, setBubblePage] = useState(0);

  const totalPages = useMemo(() => {
    const n = Math.ceil((bubbles?.length || 0) / PAGE_SIZE);
    return Math.max(1, n);
  }, [bubbles?.length]);

  // Si cambia el contenido (o baja el largo), asegurar page válida
  useEffect(() => {
    setBubblePage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const canPrev = bubblePage > 0;
  const canNext = bubblePage < totalPages - 1;

  const goPrev = () => setBubblePage((p) => Math.max(0, p - 1));
  const goNext = () => setBubblePage((p) => Math.min(totalPages - 1, p + 1));

  // =========================
  // Reduced motion
  // =========================
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // =========================
  // Animación fluida de páginas (fade + slide)
  // - displayPage: lo que se ve en pantalla
  // - bubblePage: destino
  // - phase: "idle" | "out" | "prep" | "in"
  // =========================
  const [displayPage, setDisplayPage] = useState(0);
  const [pagePhase, setPagePhase] = useState("idle");
  const [pageDir, setPageDir] = useState(1); // 1: next, -1: prev
  const animTimersRef = useRef({ t1: null, t2: null });

  // Para evitar "saltos" si el auto-slide o el usuario spamea clicks
  const clearAnimTimers = () => {
    const t = animTimersRef.current;
    if (t.t1) window.clearTimeout(t.t1);
    if (t.t2) window.clearTimeout(t.t2);
    t.t1 = null;
    t.t2 = null;
  };

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayPage(bubblePage);
      setPagePhase("idle");
      return;
    }

    if (bubblePage === displayPage) return;

    clearAnimTimers();

    const dir = bubblePage > displayPage ? 1 : -1;
    setPageDir(dir);

    // 1) Sale el contenido actual
    setPagePhase("out");

    // 2) Swap (contenido nuevo entra desde opacidad 0)
    animTimersRef.current.t1 = window.setTimeout(() => {
      setDisplayPage(bubblePage);
      setPagePhase("prep"); // lo dejamos listo en estado inicial (invisible + offset)

      // en el siguiente frame aplicamos "in"
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPagePhase("in"));
      });
    }, 180);

    // 3) Termina la animación
    animTimersRef.current.t2 = window.setTimeout(() => {
      setPagePhase("idle");
    }, 180 + 520);

    return () => clearAnimTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubblePage, prefersReducedMotion]); // displayPage se usa adentro intencionalmente

  const pageBubbles = useMemo(() => {
    const start = displayPage * PAGE_SIZE;
    return bubbles.slice(start, start + PAGE_SIZE);
  }, [bubbles, displayPage]);

  const pageMotionClass = useMemo(() => {
    if (prefersReducedMotion) return "";
    const base =
      "transform-gpu will-change-[opacity,transform] transition-[opacity,transform] duration-500 ease-out";

    // direcciones:
    // - cuando sale: se va un poquito hacia la izquierda si avanzamos, o hacia la derecha si retrocedemos
    // - cuando entra: aparece desde el lado opuesto sutilmente
    const outShift = pageDir === 1 ? "-translate-x-2" : "translate-x-2";
    const inFrom = pageDir === 1 ? "translate-x-2" : "-translate-x-2";

    if (pagePhase === "out") return `${base} opacity-0 ${outShift} blur-[1px]`;
    if (pagePhase === "prep") return `${base} opacity-0 ${inFrom} blur-[1px]`;
    if (pagePhase === "in") return `${base} opacity-100 translate-x-0 blur-0`;
    return `${base} opacity-100 translate-x-0 blur-0`;
  }, [pagePhase, pageDir, prefersReducedMotion]);

  // =========================
  // Auto-slide (cada 3s)
  // - NO si hay 1 sola página
  // - Respeta reduced motion
  // - Pausa si el usuario interactúa
  // =========================
  const [paused, setPaused] = useState(false);

  const pauseBriefly = () => {
    setPaused(true);
    window.clearTimeout(pauseBriefly._t);
    pauseBriefly._t = window.setTimeout(() => setPaused(false), 2500);
  };
  pauseBriefly._t = pauseBriefly._t || null;

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (paused) return;
    if (totalPages <= 1) return;

    const id = window.setInterval(() => {
      setBubblePage((p) => (p >= totalPages - 1 ? 0 : p + 1));
    }, 3000);

    return () => window.clearInterval(id);
  }, [totalPages, paused, prefersReducedMotion]);

  // =========================
  // Parallax / Tilt refs (FIX)
  // =========================
  const { parallaxRef } = useMouseParallax();
  const { tiltRef } = useMouseTilt();

  return (
    <header id="inicio" className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background-light dark:bg-background-dark" />
        {/* Animated gradient backdrop */}
        <div
          className="absolute inset-0 opacity-80 dark:opacity-60 gradient-shift
          bg-[radial-gradient(1200px_circle_at_10%_10%,rgba(116,47,56,0.18),transparent_60%),radial-gradient(900px_circle_at_90%_30%,rgba(116,47,56,0.10),transparent_55%),radial-gradient(700px_circle_at_30%_90%,rgba(0,0,0,0.06),transparent_55%)]"
        />
        {/* Subtle fade to content */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(247,246,246,0.5)_60%,rgba(247,246,246,1)_100%)] dark:bg-[linear-gradient(to_bottom,transparent_0%,rgba(29,21,22,0.35)_55%,rgba(29,21,22,1)_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-20 pb-16 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Copy */}
          <div className="lg:col-span-7">
            {badge?.text || badge?.icon ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/15 bg-white/60 dark:bg-white/5 dark:border-white/10 text-[12px] tracking-wide text-text-muted-light dark:text-gray-300 fade-in-up">
                <span className="material-symbols-outlined text-[18px] text-primary dark:text-white">
                  {badge?.icon || ""}
                </span>
                {badge?.text || ""}
              </div>
            ) : null}

            <h1 className="mt-6 font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-primary dark:text-white fade-in-up delay-100">
              {titleLine1}
              {titleLine2 ? (
                <span className="block font-light text-text-main-light dark:text-gray-200">
                  {titleLine2}
                </span>
              ) : null}
            </h1>

            {lead ? (
              <p className="mt-6 font-body text-lg md:text-xl text-text-muted-light dark:text-gray-300 leading-relaxed max-w-2xl fade-in-up delay-200">
                {lead}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 fade-in-up delay-300">
              {primary?.label ? (
                <button
                  type="button"
                  onClick={() => onAction?.(primary?.action, primary?.href)}
                  className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-light transition-smooth shadow-soft font-body font-semibold button-press hover-glow"
                >
                  {primary.label}
                </button>
              ) : null}

              {secondary?.label ? (
                <button
                  type="button"
                  onClick={() => onAction?.(secondary?.action, secondary?.href)}
                  className="px-6 py-3 rounded-lg bg-white/70 hover:bg-white transition-smooth border border-primary/15 text-primary dark:text-white dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 shadow-soft font-body font-semibold button-press"
                >
                  {secondary.label}
                </button>
              ) : null}
            </div>

            {/* Trust / stats */}
            {trust.length ? (
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 fade-in-up delay-400">
                {trust.map((card, idx) => (
                  <div
                    key={(card?.title || "") + idx}
                    className="rounded-xl bg-white/70 dark:bg-white/5 border border-primary/10 dark:border-white/10 p-4 shadow-soft hover-lift cursor-interactive"
                  >
                    <div className="flex items-center gap-2 text-primary dark:text-white">
                      <span className="material-symbols-outlined">{card?.icon || ""}</span>
                      <span className="font-body font-semibold">{card?.title || ""}</span>
                    </div>
                    <p className="mt-2 text-sm text-text-muted-light dark:text-gray-300">
                      {card?.body || ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Visual */}
          <div className="lg:col-span-5">
            <div className="relative perspective-container" ref={parallaxRef}>
              <div className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-2xl -z-10 floating" />

              <div
                ref={tiltRef}
                className="group rounded-[2rem] overflow-hidden border border-primary/10 dark:border-white/10 bg-white/60 dark:bg-white/5 shadow-soft preserve-3d transition-slow"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <div className="p-5 border-b border-primary/10 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary dark:text-white">
                      {vHeader?.icon || ""}
                    </span>
                    <span className="font-body text-sm text-text-main-light dark:text-gray-200 font-semibold">
                      {vHeader?.title || ""}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {/* bubbles */}
                  <div className={["space-y-4", pageMotionClass].join(" ")}>
                    {pageBubbles.map((b, i) => {
                      const isAssistant = b?.variant === "assistant";
                      return (
                        <div
                          key={(b?.text || "") + i}
                          className={`flex ${isAssistant ? "justify-start" : "justify-end"
                            } items-center`}
                        >
                          <div
                            className={[
                              "rounded-2xl p-4 shadow-soft",
                              "max-w-[85%] sm:max-w-[78%]",
                              isAssistant ? "mr-auto sm:mr-8" : "ml-auto sm:ml-8",
                              isAssistant
                                ? "bg-primary text-white"
                                : "bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10",
                            ].join(" ")}
                          >
                            <p
                              className={[
                                "text-[15px] sm:text-base leading-relaxed",
                                isAssistant ? "text-left" : "text-right",
                                isAssistant ? "" : "text-text-muted-light dark:text-gray-300",
                              ].join(" ")}
                            >
                              {b?.text || ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* pager */}
                  {bubbles.length > PAGE_SIZE ? (
                    <div className="mt-5 flex items-center justify-center gap-3">
                      {/* Prev */}
                      <button
                        type="button"
                        onClick={() => {
                          pauseBriefly();
                          goPrev();
                        }}
                        disabled={!canPrev}
                        aria-label="Anterior"
                        className={[
                          "h-9 w-9 rounded-full grid place-items-center",
                          "text-primary/70 dark:text-white/70",
                          "hover:text-primary dark:hover:text-white",
                          "hover:bg-primary/10 dark:hover:bg-white/10",
                          "transition-all",
                          "disabled:opacity-25 disabled:pointer-events-none",
                          "sm:opacity-0 sm:group-hover:opacity-100",
                        ].join(" ")}
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                      </button>

                      {/* Dots */}
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                          <button
                            key={"dot_" + idx}
                            type="button"
                            onClick={() => {
                              pauseBriefly();
                              setBubblePage(idx);
                            }}
                            aria-label={`Ir a página ${idx + 1}`}
                            className={[
                              "h-2 w-2 rounded-full transition-all",
                              idx === bubblePage ? "bg-primary" : "bg-primary/20 hover:bg-primary/40",
                              "dark:" +
                              (idx === bubblePage
                                ? "bg-white"
                                : "bg-white/20 hover:bg-white/35"),
                            ].join(" ")}
                          />
                        ))}
                      </div>

                      {/* Next */}
                      <button
                        type="button"
                        onClick={() => {
                          pauseBriefly();
                          goNext();
                        }}
                        disabled={!canNext}
                        aria-label="Siguiente"
                        className={[
                          "h-9 w-9 rounded-full grid place-items-center",
                          "text-primary/70 dark:text-white/70",
                          "hover:text-primary dark:hover:text-white",
                          "hover:bg-primary/10 dark:hover:bg-white/10",
                          "transition-all",
                          "disabled:opacity-25 disabled:pointer-events-none",
                          "sm:opacity-0 sm:group-hover:opacity-100",
                        ].join(" ")}
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </button>
                    </div>
                  ) : null}

                  {note?.text || note?.icon ? (
                    <div className="mt-6 flex items-center gap-3 text-xs text-text-muted-light dark:text-gray-300">
                      <span className="material-symbols-outlined text-[18px] text-primary dark:text-white">
                        {note?.icon || ""}
                      </span>
                      {note?.text || ""}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent dark:via-white/15" />
      </div>
    </header>
  );
}
