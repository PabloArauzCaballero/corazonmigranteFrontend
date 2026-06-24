import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function clampText(s, max = 140) {
  const t = String(s || "").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function joinStory(story) {
  if (Array.isArray(story)) return story.filter(Boolean).join("\n\n");
  return String(story || "");
}

function useLockBodyScroll(isLocked) {
  useEffect(() => {
    if (!isLocked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isLocked]);
}

function Modal({ open, onClose, title, children }) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      {/* backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      {/* panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title || "Detalle"}
          className={[
            "w-full max-w-3xl",
            "rounded-2xl shadow-2xl",
            "bg-white text-slate-800",
            "dark:bg-[#0b0f14] dark:text-slate-100",
            "border border-black/5 dark:border-white/10",
            "overflow-hidden",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-black/5 dark:border-white/10">
            <div className="min-w-0">
              <p className="text-sm text-slate-500 dark:text-slate-300/70 truncate">
                Nuestros especialistas
              </p>
              <h3 className="text-lg sm:text-xl font-semibold truncate">{title}</h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={[
                "shrink-0",
                "rounded-xl px-3 py-2",
                "bg-slate-100 hover:bg-slate-200 text-slate-700",
                "dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-100",
                "transition",
              ].join(" ")}
            >
              Cerrar
            </button>
          </div>

          <div className="max-h-[75vh] overflow-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TagPill({ children }) {
  return (
    <span
      className={[
        "inline-flex items-center px-3 py-1 rounded-full text-xs",
        "border border-slate-200 text-slate-600 bg-white",
        "dark:border-white/10 dark:text-slate-200/90 dark:bg-white/5",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function ArrowIcon({ open }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      className={[
        "ml-1 transition-transform duration-200",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 10l5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PsychologistsSection({ data }) {
  if (!data) return null;

  const id = data?.id || "psicologos";
  const title = data?.title || "";
  const subtitle = data?.subtitle || "";
  const items = Array.isArray(data?.items) ? data.items : [];

  const [openIndex, setOpenIndex] = useState(null);

  const selected = openIndex != null ? items[openIndex] : null;

  const selectedTitle = useMemo(() => {
    if (!selected) return "";
    const n = selected?.name || "";
    const r = selected?.role || "";
    return r ? `${n} — ${r}` : n;
  }, [selected]);

  return (
    <section
      id={id}
      className={[
        "relative overflow-hidden",
        "py-20 sm:py-24",
        "px-6 lg:px-12",
      ].join(" ")}
    >
      {/* fondo suave */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl dark:bg-white/5" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-slate-200/40 blur-3xl dark:bg-white/5" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs tracking-[0.25em] uppercase text-slate-400 dark:text-slate-300/60 mb-3">
            Equipo
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-4 text-slate-600 dark:text-slate-200/80 leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((p, idx) => {
            const name = p?.name || "";
            const role = p?.role || "";
            const tags = Array.isArray(p?.tags) ? p.tags : [];
            const story = joinStory(p?.story);
            const preview = clampText(story.replace(/\s+/g, " "), 160);

            const imgSrc = p?.image?.src || "";
            const imgAlt = p?.image?.alt || name || "Foto";

            return (
              <article
                key={`${name}-${idx}`}
                className={[
                  "group",
                  "rounded-3xl overflow-hidden",
                  "bg-white dark:bg-[#0b0f14]",
                  "border border-black/5 dark:border-white/10",
                  "shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)]",
                  "transition-transform duration-300",
                  "hover:-translate-y-1",
                ].join(" ")}
              >
                {/* imagen (altura fija + object-top para evitar cortar caras) */}
                {imgSrc ? (
                  <div className="relative h-56 sm:h-[400px] overflow-hidden bg-slate-100 dark:bg-white/5">
                    <img
                      src={imgSrc}
                      alt={imgAlt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    {/* degradado suave para que se sienta integrado */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent dark:from-black/30" />
                  </div>
                ) : null}

                {/* contenido estable (NO se expande en el grid) */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {name}
                      </h3>
                      <p className="mt-1 text-slate-500 dark:text-slate-300/70">
                        {role}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenIndex(idx)}
                      className={[
                        "shrink-0",
                        "inline-flex items-center gap-1",
                        "rounded-full px-4 py-2",
                        "bg-slate-100 hover:bg-slate-200 text-slate-700",
                        "dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-100",
                        "transition",
                      ].join(" ")}
                    >
                      Leer <ArrowIcon open={false} />
                    </button>
                  </div>

                  {/* tags */}
                  {tags.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {tags.map((t, i) => (
                        <TagPill key={`${t}-${i}`}>{t}</TagPill>
                      ))}
                    </div>
                  ) : null}

                  {/* preview fijo para mantener estética */}
                  {preview ? (
                    <p className="mt-5 text-slate-600 dark:text-slate-200/80 leading-relaxed">
                      {preview}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal detalle */}
      <Modal
        open={openIndex != null}
        onClose={() => setOpenIndex(null)}
        title={selectedTitle}
      >
        {selected ? (
          <div className="p-5 sm:p-6">
            {/* header del modal con imagen */}
            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-5">
              {selected?.image?.src ? (
                <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="relative h-56 sm:h-full sm:min-h-[220px]">
                    <img
                      src={selected.image.src}
                      alt={selected.image?.alt || selected?.name || "Foto"}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <h4 className="text-2xl font-semibold">
                  {selected?.name || ""}
                </h4>
                <p className="mt-1 text-slate-600 dark:text-slate-200/80">
                  {selected?.role || ""}
                </p>

                {Array.isArray(selected?.tags) && selected.tags.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selected.tags.map((t, i) => (
                      <TagPill key={`${t}-${i}`}>{t}</TagPill>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* historia */}
            <div className="mt-6 space-y-4">
              {(Array.isArray(selected?.story) ? selected.story : [])
                .filter(Boolean)
                .map((para, i) => (
                  <p
                    key={`p-${i}`}
                    className="text-slate-700 dark:text-slate-200/85 leading-relaxed"
                  >
                    {para}
                  </p>
                ))}
            </div>

            {/* CTA inferior */}
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className={[
                  "rounded-xl px-4 py-2",
                  "bg-slate-100 hover:bg-slate-200 text-slate-700",
                  "dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-100",
                  "transition",
                ].join(" ")}
              >
                Listo
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
