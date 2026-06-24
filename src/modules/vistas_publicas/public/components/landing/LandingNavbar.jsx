import React, { useMemo, useState } from "react";
import { useScrollThreshold } from "../../hooks/useScrollProgress";

export default function LandingNavbar({ data, uiById, onAction }) {
  const [open, setOpen] = useState(false);

  const brand = data?.brand;
  const links = Array.isArray(data?.links) ? data.links : [];
  const cta_sign_up = data?.cta_sign_up;
  const cta_login = data?.cta_login;

  const brandLabel = brand?.label || "";
  const brandHref = brand?.href || "#inicio";
  const brandIcon = brand?.icon;
  const brandIconId = typeof brandIcon === "number" ? brandIcon : Number(brandIcon);
  const brandIconUrl = Number.isFinite(brandIconId) ? (uiById?.[brandIconId]?.link || uiById?.[brandIconId]?.metadata?.url || "") : "";
  const brandIconText = typeof brandIcon === "string" ? brandIcon : "";

  const mobile = data?.mobile || {};
  const mobileMenuLabel = mobile?.menu_label || "";
  const mobileCloseLabel = mobile?.close_label || "";

  const onLinkClick = () => setOpen(false);

  const desktopLinks = useMemo(() => links.filter(Boolean), [links]);

  // Scroll-based navbar effects
  const isScrolled = useScrollThreshold(50);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-0'}`}>
      <div className={`absolute inset-0 transition-all duration-300 ${isScrolled
        ? 'bg-white/80 dark:bg-black/40 backdrop-blur-lg border-b border-primary/15 dark:border-white/15 shadow-md'
        : 'bg-white/70 dark:bg-black/20 backdrop-blur border-b border-primary/10 dark:border-white/10'
        }`} />
      <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href={brandHref} className="flex items-center gap-2 font-display font-bold text-xl text-primary dark:text-white">
          {brandIconUrl ? (
            <span className="flex items-center gap-2">
              <img src={brandIconUrl} alt={brandLabel || "Logo"} className="h-8 w-auto" />
              {brandLabel}
            </span>
          ) : brandIconText ? (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">{brandIconText}</span>
              {brandLabel}
            </span>
          ) : (
            <span>{brandLabel}</span>
          )}
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm font-body text-text-muted-light dark:text-gray-300">
          {desktopLinks.map((l) => (
            <a
              key={(l?.href || "") + (l?.label || "")}
              className="hover:text-primary dark:hover:text-white transition-colors"
              href={l?.href || "#"}
              onClick={onLinkClick}
            >
              {l?.label || ""}
            </a>
          ))}

          {cta_sign_up?.label ? (
            <button
              type="button"
              onClick={() => onAction?.("public_signup", cta_sign_up?.href)}
              className="ml-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-light transition-colors shadow-soft"
            >
              {cta_sign_up.label}
            </button>
          ) : null}

          {cta_login?.label ? (
            <button
              type="button"
              onClick={() => onAction?.("public_login", cta_login?.href)}
              className="ml-2 px-4 py-2 rounded-lg bg-white text-primary hover:bg-primary hover:text-white transition-colors shadow-soft"
            >
              {cta_login.label}
            </button>
          ) : null}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-primary/15 dark:border-white/10 bg-white/60 dark:bg-white/5 text-primary dark:text-white"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? mobileCloseLabel : mobileMenuLabel}
          title={open ? mobileCloseLabel : mobileMenuLabel}
        >
          <span className="material-symbols-outlined">{open ? "close" : "menu"}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div className="md:hidden relative">
          <div className="px-6 pb-4 pt-2 bg-white/80 dark:bg-black/30 backdrop-blur border-b border-primary/10 dark:border-white/10">
            <div className="flex flex-col gap-3 text-sm font-body text-text-muted-light dark:text-gray-300">
              {desktopLinks.map((l) => (
                <a
                  key={"m-" + (l?.href || "") + (l?.label || "")}
                  className="py-2 hover:text-primary dark:hover:text-white transition-colors"
                  href={l?.href || "#"}
                  onClick={onLinkClick}
                >
                  {l?.label || ""}
                </a>
              ))}

              {cta_sign_up?.label ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onAction?.("public_signup", cta_sign_up?.href);
                  }}
                  className="mt-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-light transition-colors shadow-soft"
                >
                  {cta_sign_up.label}
                </button>
              ) : null}

              {cta_login?.label ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onAction?.("public_login", cta_login?.href);
                  }}
                  className="px-4 py-2 rounded-lg bg-white text-primary hover:bg-primary hover:text-white transition-colors shadow-soft"
                >
                  {cta_login.label}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
