// src/modules/vistas_publicas/public/components/landing/LandingFooter.jsx
import React from "react";
import { Link } from "react-router-dom";

function normalizeLabel(s) {
  return (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveLegalHref({ href, label }) {
  const raw = (href ?? "").toString().trim();

  // ✅ Si el JSON trae "#privacidad" / "#terminos", lo tratamos como "no definido"
  // para que entre al mapeo a /privacidad o /terminos.
  const h = raw.startsWith("#") ? "" : raw;

  // Si ya viene un href real (externo o ruta interna), lo respetamos.
  if (h && h !== "#") return h;

  const l = normalizeLabel(label);

  // Mapeos por texto (cuando el JSON todavía no trae href válido)
  if (l.includes("privacidad") || l.includes("privacy")) return "/privacidad";

  if (l.includes("termin") || l.includes("condicion") || l.includes("terms")) {
    return "/terminos";
  }

  return "#";
}

function isInternalHref(href) {
  if (!href) return false;
  // rutas internas tipo /privacidad
  return href.startsWith("/");
}

export default function LandingFooter({ data }) {
  if (!data) return null;

  const brand = data?.brand || {};
  const tagline = Array.isArray(data?.tagline) ? data.tagline : [];
  const quickLinks = Array.isArray(data?.quick_links) ? data.quick_links : [];
  const notice = data?.notice || {};
  const legal = data?.legal || {};

  const year = new Date().getFullYear();
  const copyrightTemplate = legal?.copyright_template || "";
  const copyrightText = copyrightTemplate
    ? copyrightTemplate.replace("{year}", String(year))
    : "";

  const legalLinks = Array.isArray(legal?.links) ? legal.links : [];

  return (
    <footer className="px-6 lg:px-12 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[2rem] bg-primary text-white overflow-hidden shadow-soft">
          <div className="p-10 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">
                  {brand?.icon || ""}
                </span>
                <span className="font-display text-2xl">
                  {brand?.label || ""}
                </span>
              </div>

              {tagline.length ? (
                <p className="mt-4 text-white/85 font-body leading-relaxed">
                  {tagline.join(" ")}
                </p>
              ) : null}

              {quickLinks.length ? (
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  {quickLinks.map((l, idx) => {
                    const label = l?.label || "";
                    const href = resolveLegalHref({ label, href: l?.href });
                    const key = (href || "") + label + idx;

                    if (isInternalHref(href)) {
                      return (
                        <Link
                          key={key}
                          className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
                          to={href}
                        >
                          {label}
                        </Link>
                      );
                    }

                    return (
                      <a
                        key={key}
                        className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
                        href={href || "#"}
                        target={href?.startsWith("http") ? "_blank" : undefined}
                        rel={href?.startsWith("http") ? "noreferrer" : undefined}
                      >
                        {label}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="md:col-span-5">
              <div className="rounded-2xl bg-white/10 border border-white/15 p-6">
                <div className="text-sm font-body font-semibold">
                  {notice?.title || ""}
                </div>
                <p className="mt-2 text-sm text-white/85 leading-relaxed">
                  {notice?.body || ""}
                </p>

                {notice?.note?.text || notice?.note?.icon ? (
                  <div className="mt-5 flex items-center gap-2 text-xs text-white/80">
                    <span className="material-symbols-outlined text-[18px]">
                      {notice?.note?.icon || ""}
                    </span>
                    {notice?.note?.text || ""}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="px-10 md:px-12 py-5 border-t border-white/15 flex flex-col md:flex-row justify-between gap-4 text-sm text-white/75">
            <p>{copyrightText}</p>
            <div className="flex gap-6">
              {legalLinks.map((l, idx) => {
                const label = l?.label || "";
                const href = resolveLegalHref({ label, href: l?.href });
                const key = href + label + idx;

                if (isInternalHref(href)) {
                  return (
                    <Link key={key} className="hover:underline" to={href}>
                      {label}
                    </Link>
                  );
                }

                return (
                  <a
                    key={key}
                    className="hover:underline"
                    href={href || "#"}
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={href?.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
