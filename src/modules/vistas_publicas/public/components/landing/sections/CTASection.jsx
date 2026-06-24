import React, { useMemo } from "react";

function normalizePhoneForWhatsApp(raw) {
  const s = String(raw || "");
  const digits = s.replace(/\D+/g, "");
  return digits.length ? digits : "";
}

export default function CTASection({ data, onAction, telefono }) {
  if (!data) return null;

  const id = data?.id || "";
  const title = data?.title || "";
  const body = data?.body || "";
  const bullets = Array.isArray(data?.bullets) ? data.bullets : [];

  const badge = data?.badge || {};
  const cardBody = data?.card_body || "";
  const primary = data?.primary_cta || {};
  const note = data?.note || {};

  const waPhone = useMemo(() => normalizePhoneForWhatsApp(telefono), [telefono]);
  const whatsappHref = useMemo(() => {
    if (!waPhone) return "";
    const text = encodeURIComponent("Quiero agendar una cita");
    return `https://wa.me/${waPhone}?text=${text}`;
  }, [waPhone]);

  return (
    <section id={id} className="py-20 px-6 lg:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-soft hover-lift">
          <div className="absolute inset-0 -z-10 opacity-90 gradient-shift
            bg-[radial-gradient(900px_circle_at_20%_20%,rgba(116,47,56,0.16),transparent_55%),radial-gradient(700px_circle_at_85%_40%,rgba(116,47,56,0.10),transparent_55%)]" />

          <div className="p-10 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 fade-in-up">
              <h3 className="font-display text-3xl md:text-4xl text-primary dark:text-white leading-tight">
                {title}
              </h3>
              <p className="mt-4 font-body text-lg text-text-muted-light dark:text-gray-300 leading-relaxed">
                {body}
              </p>

              {bullets.length ? (
                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-text-muted-light dark:text-gray-300">
                  {bullets.map((b, idx) => (
                    <li key={(b?.text || "") + idx} className="flex items-start gap-2 stagger-item">
                      <span className="material-symbols-outlined text-primary dark:text-white text-[18px] mt-[1px]">
                        {b?.icon || ""}
                      </span>
                      {b?.text || ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="lg:col-span-4 fade-in-up delay-200">
              <div className="rounded-2xl bg-primary text-white p-8 shadow-soft pulse-soft hover-scale cursor-interactive transition-smooth">
                {(badge?.text || badge?.icon) ? (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined">{badge?.icon || ""}</span>
                    <span className="font-body font-semibold">{badge?.text || ""}</span>
                  </div>
                ) : null}

                <p className="mt-3 text-sm opacity-90">
                  {cardBody}
                </p>

                {primary?.label ? (
                  <button
                    type="button"
                    onClick={() => onAction?.(primary?.action, primary?.href)}
                    className="mt-6 w-full px-5 py-3 rounded-xl bg-white text-primary font-body font-semibold hover:bg-white/90 transition-smooth button-press hover-glow"
                  >
                    {primary.label}
                  </button>
                ) : null}

                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/15 text-white font-body font-semibold hover:bg-white/20 transition-smooth button-press"
                  >
                    <svg viewBox="0 0 32 32" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                      <path d="M19.11 17.26c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.23-.65.08-.3-.15-1.25-.46-2.38-1.46-.88-.78-1.48-1.74-1.66-2.04-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.48-.5-.68-.5h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.07-.13-.27-.2-.57-.35z" />
                      <path d="M16.01 2.67c-7.37 0-13.33 5.96-13.33 13.33 0 2.36.62 4.57 1.7 6.49L3.2 29.33l6.99-1.83c1.86 1.02 4 1.6 6.32 1.6 7.37 0 13.33-5.96 13.33-13.33S23.38 2.67 16.01 2.67zm0 24.18c-2.07 0-3.99-.61-5.6-1.66l-.4-.25-4.15 1.09 1.11-4.04-.26-.41a11.12 11.12 0 01-1.77-5.96c0-6.16 5-11.16 11.16-11.16 6.16 0 11.16 5 11.16 11.16 0 6.16-5 11.23-11.25 11.23z" />
                    </svg>
                    Agendar por WhatsApp
                  </a>
                ) : null}

                {(note?.text || note?.icon) ? (
                  <div className="mt-4 text-xs opacity-80 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">{note?.icon || ""}</span>
                    {note?.text || ""}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-primary/15 to-transparent dark:via-white/10" />
      </div>
    </section>
  );
}
