// src/modules/terapia/paciente/pages/AuthPacientePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePacienteAuth } from "../hooks/usePacienteAuth";
import { usePaisesCiudadesOptions } from "../../hooks/usePaisesCiudadesOptions";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
import ActionResultModal from "../components/modals/ActionResultModal";
import { createPortal } from "react-dom";
import { ROUTES_FILE_SERVER } from "../../../../../config/ROUTES_FILE_SERVER";
import { useDynamicLogo } from "../../../../../hooks/useDynamicLogo";

/* =========================
   Small helpers
========================= */
function normalizeStr(s) {
  return String(s || "").trim();
}

function uniq(arr) {
  const set = new Set();
  const out = [];
  for (const x of arr) {
    const v = normalizeStr(x);
    if (!v) continue;
    if (set.has(v)) continue;
    set.add(v);
    out.push(v);
  }
  return out;
}

function parseCommaString(value) {
  const raw = String(value || "");
  const parts = raw
    .split(",")
    .map((s) => normalizeStr(s))
    .filter(Boolean);
  return uniq(parts);
}

function toCommaString(arr) {
  return uniq(Array.isArray(arr) ? arr : []).join(", ");
}

/* =========================
   Theme Toggle (fixed button)
   - uses html.dark class
========================= */
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme"); // "dark" | "light" | null
    const initialDark =
      saved === "dark" ||
      (!saved && document.documentElement.classList.contains("dark"));

    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        "fixed top-6 right-6 z-[80]",
        "inline-flex items-center gap-2",
        "rounded-xl px-3 py-2 shadow-soft",
        "bg-white/70 dark:bg-black/30 backdrop-blur",
        "border border-black/5 dark:border-white/10",
        "text-slate-700 dark:text-slate-100",
        "hover:scale-[1.02] active:scale-[0.98] transition",
      ].join(" ")}
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
      <span className="text-sm font-semibold">{isDark ? "Claro" : "Oscuro"}</span>
    </button>
  );
}

/* =========================
   Hook: fetch options list
========================= */
function useRemoteJsonList(url) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!url) return;
      setLoading(true);
      setError("");

      try {
        const cacheKey = `cache_json_list_v1::${url}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const cleaned = uniq(parsed);
            if (alive) setItems(cleaned);
            if (alive) setLoading(false);
            return;
          }
        }

        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP_${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("INVALID_JSON_LIST");

        const cleaned = uniq(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(cleaned));
        if (alive) setItems(cleaned);
      } catch (e) {
        if (!alive) return;
        setError("No se pudieron cargar las opciones.");
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [url]);

  return { items, loading, error };
}

/* =========================
   UI atoms
========================= */
function Input({ id, type = "text", value, onChange, placeholder, leftIcon }) {
  return (
    <div className="relative">
      {leftIcon ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="material-symbols-outlined text-gray-400 text-[20px]">
            {leftIcon}
          </span>
        </div>
      ) : null}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={[
          "block w-full rounded-lg border-gray-300/80 dark:border-gray-600/80",
          "bg-white/90 dark:bg-gray-900/40 text-gray-900 dark:text-white",
          "shadow-sm focus:border-primary focus:ring-primary h-12",
          "transition-colors",
          leftIcon ? "pl-10 px-3 sm:text-sm" : "px-3 sm:text-sm",
        ].join(" ")}
      />
    </div>
  );
}

function Select({ id, value, onChange, children, disabled }) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className={[
        "block w-full rounded-lg border-gray-300/80 dark:border-gray-600/80",
        "bg-white/90 dark:bg-gray-900/40 text-gray-900 dark:text-white",
        "shadow-sm focus:border-primary focus:ring-primary h-12 px-3 sm:text-sm",
        "disabled:opacity-60 transition-colors",
      ].join(" ")}
    >
      {children}
    </select>
  );
}

/* =========================
   MultiSelectTags v2
========================= */
function MultiSelectTags({
  id,
  label,
  placeholder = "Buscar y seleccionar...",
  leftIcon,
  options = [],
  value,
  onChange,
  loading = false,
  error = "",
  disabled = false,
  maxDropdown = 10,
}) {
  const wrapRef = useRef(null);
  const controlRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const selected = useMemo(() => parseCommaString(value), [value]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const available = useMemo(() => {
    const query = normalizeStr(q).toLowerCase();
    const selectedSet = new Set(selected.map((s) => s.toLowerCase()));

    const filtered = (Array.isArray(options) ? options : [])
      .map((x) => normalizeStr(x))
      .filter(Boolean)
      .filter((x) => !selectedSet.has(x.toLowerCase()))
      .filter((x) => (query ? x.toLowerCase().includes(query) : true));

    return filtered.slice(0, maxDropdown);
  }, [options, selected, q, maxDropdown]);

  function commit(nextArr) {
    onChange?.(toCommaString(nextArr));
  }

  function addItem(item) {
    commit(uniq([...selected, item]));
    setQ("");
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus?.());
  }

  function removeItem(item) {
    const lower = item.toLowerCase();
    commit(selected.filter((x) => x.toLowerCase() !== lower));
  }

  function clearAll() {
    commit([]);
    setQ("");
    setOpen(false);
  }

  function onKeyDown(e) {
    if (disabled) return;

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (e.key === "Backspace" && !q && selected.length > 0) {
      e.preventDefault();
      removeItem(selected[selected.length - 1]);
      return;
    }

    if (e.key === "Enter") {
      if (!open) {
        setOpen(true);
        return;
      }
      if (available.length > 0) {
        e.preventDefault();
        addItem(available[0]);
      }
    }
  }

  useEffect(() => {
    function onDocMouseDown(e) {
      const wrap = wrapRef.current;
      const drop = dropdownRef.current;
      const t = e.target;

      const insideWrap = wrap && wrap.contains(t);
      const insideDrop = drop && drop.contains(t);

      if (!insideWrap && !insideDrop) setOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePos = () => {
      const el = controlRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;

      const margin = 8;
      setPos({ top: r.bottom + margin, left: r.left, width: r.width });
    };

    updatePos();

    const onScroll = () => updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, q, selected.length]);

  const helperText = useMemo(() => {
    if (loading) return "Cargando opciones...";
    if (error) return error;
    if (!available.length && !selected.length) return "No hay opciones disponibles";
    if (!available.length && selected.length) return "No hay más opciones";
    return "Selecciona una o varias opciones";
  }, [loading, error, available.length, selected.length]);

  const canPortal = typeof document !== "undefined";

  const dropdown =
    open && canPortal
      ? createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
          }}
        >
          <div
            className={[
              "overflow-hidden rounded-2xl",
              "border border-black/5 dark:border-white/10",
              "bg-white dark:bg-gray-950 shadow-soft",
            ].join(" ")}
          >
            <div className="px-3 py-2 border-b border-black/5 dark:border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Cargando...
                </div>
              ) : error ? (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Intenta recargar la página.
                </div>
              ) : available.length ? (
                available.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={[
                      "w-full text-left px-3 py-2.5 text-sm",
                      "hover:bg-primary/10 dark:hover:bg-white/5",
                      "transition-colors flex items-center justify-between",
                    ].join(" ")}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addItem(opt)}
                  >
                    <span className="truncate pr-3">{opt}</span>
                    <span className="material-symbols-outlined text-[18px] text-gray-400">
                      add
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  Sin resultados.
                </div>
              )}
            </div>

            <div className="px-3 py-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tip: Enter agrega el primer resultado • ESC cierra
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
      : null;

  return (
    <div className="space-y-1" ref={wrapRef}>
      {label ? (
        <label
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor={id}
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        {leftIcon ? (
          <div className="pointer-events-none absolute top-3 left-3">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">
              {leftIcon}
            </span>
          </div>
        ) : null}

        <div className="pointer-events-none absolute top-3 right-3">
          <span className="material-symbols-outlined text-gray-400 text-[20px]">
            {open ? "expand_less" : "expand_more"}
          </span>
        </div>

        <div
          ref={controlRef}
          className={[
            "w-full rounded-xl border",
            "border-gray-300/70 dark:border-white/10",
            "bg-white/90 dark:bg-gray-900/30",
            "shadow-sm transition-all",
            "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/60",
            "hover:border-gray-400/70 dark:hover:border-white/20",
            leftIcon ? "pl-10 pr-10 py-2" : "px-3 pr-10 py-2",
            disabled ? "opacity-60 pointer-events-none" : "",
          ].join(" ")}
          role="combobox"
          aria-expanded={open ? "true" : "false"}
          onMouseDown={(e) => {
            if (disabled) return;
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus?.());
          }}
        >
          <div className="flex flex-wrap gap-2 items-center">
            {selected.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/10 px-2.5 py-1 text-xs font-semibold"
              >
                <span className="truncate max-w-[220px]">{t}</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full hover:bg-primary/15 p-0.5"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(t);
                  }}
                  aria-label={`Quitar ${t}`}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </span>
            ))}

            <input
              id={id}
              ref={inputRef}
              value={q}
              disabled={disabled}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => !disabled && setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={selected.length ? "" : placeholder}
              className={[
                "flex-1 min-w-[160px] h-10 rounded-lg px-3 text-sm",
                "bg-white/70 dark:bg-white/5",
                "text-slate-900 dark:text-slate-100",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "border border-slate-200/70 dark:border-white/10",
                "focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/20",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "transition",
              ].join(" ")}
            />
          </div>

          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {selected.length ? `${selected.length} seleccionados` : "Selecciona opciones"}
            </p>
            {selected.length ? (
              <button
                type="button"
                className="text-[11px] font-semibold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
              >
                Limpiar
              </button>
            ) : (
              <span className="text-[11px] text-gray-300 dark:text-gray-600"> </span>
            )}
          </div>
        </div>

        {dropdown}
      </div>
    </div>
  );
}

/* =========================
   Bottom benefits block
========================= */
function AuthBenefits() {
  return (
    <div className="w-full max-w-[740px] mt-10 mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 p-6 backdrop-blur h-full">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="material-symbols-outlined text-[26px] text-[#181112] dark:text-white">
              verified
            </span>
            <div className="text-[#181112] dark:text-white font-semibold text-lg">
              Profesional
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[18ch]">
              Equipo con enfoque clínico y humano.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 p-6 backdrop-blur h-full">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="material-symbols-outlined text-[26px] text-[#181112] dark:text-white">
              lock
            </span>
            <div className="text-[#181112] dark:text-white font-semibold text-lg">
              Confidencial
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[18ch]">
              Tu historia se queda contigo.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 p-6 backdrop-blur h-full">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="material-symbols-outlined text-[26px] text-[#181112] dark:text-white">
              language
            </span>
            <div className="text-[#181112] dark:text-white font-semibold text-lg">
              Online
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[18ch]">
              Atención desde donde estés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Left Panel (ESTÉTICA MEJORADA)
   - sticky en desktop
   - overlays (vignette + gradient) para que no se vea "gris plano"
   - card de texto con glass para que se lea bien y no quede pegado al fondo
========================= */
function LeftAuthPanel({ isRegister }) {
  const [imgOk, setImgOk] = useState(true);
  const [logoOk, setLogoOk] = useState(true);
  const { logoUrl } = useDynamicLogo({ idElemento: 1 });

  const headline = isRegister
    ? "Un nuevo comienzo\naún es posible."
    : "Volver a sentir calma\nsí es posible.";

  const sub = isRegister
    ? "Crea tu cuenta y empieza un proceso acompañado, a tu ritmo."
    : "Ingresa para continuar tu proceso con apoyo profesional.";

  return (
    <aside className="hidden md:block md:w-1/2">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Background */}
        {imgOk ? (
          <img
            src={ROUTES_FILE_SERVER.URL_AUTH}
            alt="Corazón Migrante"
            className={[
              "absolute inset-0 w-full h-full object-cover",
              "scale-[1.03] will-change-transform",
              "opacity-95",
            ].join(" ")}
            style={{ objectPosition: "center" }}
            onError={() => setImgOk(false)}
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500" />
        )}

        {/* Overlays: depth + vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />
        <div className="absolute inset-0 [background:radial-gradient(1100px_700px_at_30%_20%,rgba(255,255,255,0.10),transparent_55%)]" />
        <div className="absolute inset-0 [background:radial-gradient(900px_700px_at_70%_80%,rgba(0,0,0,0.35),transparent_60%)]" />
        <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.65)]" />

        {/* Content */}
        <div className="relative z-10 h-full p-10 lg:p-12 flex flex-col">
          {/* Top brand pill */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-white/10 border border-white/15 backdrop-blur mt-8 align-center">
              {logoOk && logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Corazón Migrante"
                  className="w-6 h-6 object-contain"
                  style={{ borderRadius: "35%" }}
                  onError={() => setLogoOk(false)}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <span className="material-symbols-outlined text-white text-[22px]">
                  favorite
                </span>
              )}
              <span className="text-white/95 font-semibold tracking-tight">
                Corazón de Migrante
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-white/80 text-xs align-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300/90 align-center" />
              <span>Online • Confidencial</span>
            </div>
          </div>

          {/* Center spacer */}
          <div className="flex-1" />

          {/* Bottom glass card */}
          <div className="max-w-xl">
            <div className="rounded-[28px] p-7 lg:p-8 bg-white/10 border border-white/15 backdrop-blur-md shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
              <h3 className="text-white text-[28px] lg:text-[34px] leading-tight font-semibold tracking-tight whitespace-pre-line">
                {headline}
              </h3>
              <p className="mt-3 text-white/85 text-base lg:text-lg leading-relaxed">
                {sub}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-black/25 border border-white/10 text-white/85 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Profesionales
                </span>
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-black/25 border border-white/10 text-white/85 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  Confidencial
                </span>
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-black/25 border border-white/10 text-white/85 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  A tu ritmo
                </span>
              </div>

              {!imgOk ? (
                <p className="mt-4 text-xs text-white/75">
                  Imagen no disponible (revisa la URL o permisos del objeto en GCS).
                </p>
              ) : null}
            </div>

            {/* subtle footer */}
            <p className="mt-4 text-[11px] text-white/55">
              Tu información se usa solo para brindarte un mejor acompañamiento.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function AuthPacientePage({ onBack, onGoLogin, initialMode } = {}) {
  const {
    mode,
    goRegister,
    goLogin,
    registerForm,
    setRegisterField,
    submitRegister,
    loginForm,
    setLoginField,
    submitLogin,
    confirm,
    result,
    loading,
    closeConfirm,
    closeResult,
  } = usePacienteAuth({ initialMode });

  const opt = usePaisesCiudadesOptions();
  const paises = opt.paises;
  const ciudades = opt.getCiudades(registerForm.pais);

  const isRegister = mode === "register";


  const ocup = useRemoteJsonList(ROUTES_FILE_SERVER.URL_OCUPACIONES);
  const sintomas = useRemoteJsonList(ROUTES_FILE_SERVER.URL_SINTOMAS);
  const objetivos = useRemoteJsonList(ROUTES_FILE_SERVER.URL_OBJETIVOS);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display">
      <ThemeToggle />

      <div className="min-h-screen flex flex-col md:flex-row w-full">
        {typeof onBack === "function" && (
          <button
            type="button"
            onClick={onBack}
            className="fixed top-6 left-6 z-[60] inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors bg-white/70 dark:bg-black/20 backdrop-blur border border-primary/10 dark:border-white/10 rounded-xl px-3 py-2 shadow-soft"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Volver</span>
          </button>
        )}

        <LeftAuthPanel isRegister={isRegister} />

        <div className="flex-1 w-full md:w-1/2 bg-cream-soft dark:bg-background-dark">
          <div className="min-h-screen flex flex-col px-6 sm:px-12 lg:px-24 py-12">
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-full max-w-[520px] space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-4xl">favorite</span>
                    <span className="text-2xl font-bold tracking-tight text-[#181112] dark:text-white">
                      Corazón de Migrante
                    </span>
                  </div>

                  <h1 className="text-[#181112] dark:text-gray-100 text-3xl font-bold tracking-tight pt-4">
                    {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    {isRegister
                      ? "Completa tus datos para unirte a la plataforma."
                      : "Ingresa tus credenciales para continuar."}
                  </p>
                </div>

                {isRegister ? (
                  <form className="space-y-6 mt-8" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          htmlFor="firstName"
                        >
                          Nombre
                        </label>
                        <Input
                          id="firstName"
                          value={registerForm.nombre}
                          onChange={(v) => setRegisterField("nombre", v)}
                          placeholder="Juan"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          htmlFor="lastName"
                        >
                          Apellido
                        </label>
                        <Input
                          id="lastName"
                          value={registerForm.apellido}
                          onChange={(v) => setRegisterField("apellido", v)}
                          placeholder="Pérez"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        htmlFor="email"
                      >
                        Correo Electrónico
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={registerForm.email}
                        onChange={(v) => setRegisterField("email", v)}
                        placeholder="ejemplo@correo.com"
                        leftIcon="mail"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        htmlFor="password"
                      >
                        Contraseña
                      </label>
                      <Input
                        id="password"
                        type="password"
                        value={registerForm.password}
                        onChange={(v) => setRegisterField("password", v)}
                        placeholder="••••••••"
                        leftIcon="lock"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        htmlFor="phone"
                      >
                        Teléfono
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={registerForm.telefono}
                        onChange={(v) => setRegisterField("telefono", v)}
                        placeholder="+52 55 1234 5678"
                        leftIcon="call"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-1">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            País
                          </label>
                          <Select
                            id="pais"
                            value={registerForm.pais}
                            onChange={(v) => {
                              setRegisterField("pais", v);
                              setRegisterField("ciudad", "");
                            }}
                            disabled={opt.loading}
                          >
                            <option value="" disabled>
                              {opt.loading ? "Cargando..." : "Seleccionar"}
                            </option>
                            {paises.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </Select>
                          {opt.error ? <p className="text-xs text-red-500">{opt.error}</p> : null}
                        </div>

                        <div className="space-y-1">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Ciudad
                          </label>
                          <Select
                            id="ciudad"
                            value={registerForm.ciudad}
                            onChange={(v) => setRegisterField("ciudad", v)}
                            disabled={!registerForm.pais || opt.loading}
                          >
                            <option value="" disabled>
                              {!registerForm.pais
                                ? "Elige un país"
                                : opt.loading
                                  ? "Cargando..."
                                  : "Seleccionar"}
                            </option>
                            {ciudades.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            htmlFor="sexo"
                          >
                            Sexo
                          </label>
                          <Select
                            id="sexo"
                            value={registerForm.sexo}
                            onChange={(v) => setRegisterField("sexo", v)}
                            disabled={loading}
                          >
                            <option value="" disabled>
                              Seleccionar
                            </option>
                            <option value="F">F</option>
                            <option value="M">M</option>
                            <option value="O">O</option>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            htmlFor="dob"
                          >
                            Fecha de Nacimiento
                          </label>
                          <Input
                            id="dob"
                            type="date"
                            value={registerForm.fecha_nacimiento}
                            onChange={(v) => setRegisterField("fecha_nacimiento", v)}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 p-4 space-y-4 mt-4 backdrop-blur">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Cuentanos un poco de ti ... (Recuerda que esta informacion es opcional)
                        </p>

                        <Input
                          id="motivo_consulta"
                          value={registerForm.motivo_consulta}
                          onChange={(v) => setRegisterField("motivo_consulta", v)}
                          placeholder="Cuéntanos un poco sobre ti"
                          leftIcon="psychology"
                        />

                        <MultiSelectTags
                          id="sintomas_principales"
                          label="Síntomas principales"
                          leftIcon="list"
                          placeholder="Ej: Ansiedad, Insomnio, Rumiación..."
                          options={sintomas.items}
                          loading={sintomas.loading}
                          error={sintomas.error}
                          disabled={loading}
                          value={registerForm.sintomas_principales}
                          onChange={(v) => setRegisterField("sintomas_principales", v)}
                        />

                        <MultiSelectTags
                          id="objetivos"
                          label="Objetivos"
                          leftIcon="target"
                          placeholder="Ej: Reducir ansiedad, Mejorar sueño..."
                          options={objetivos.items}
                          loading={objetivos.loading}
                          error={objetivos.error}
                          disabled={loading}
                          value={registerForm.objetivos}
                          onChange={(v) => setRegisterField("objetivos", v)}
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={submitRegister}
                        disabled={loading}
                        className="flex w-full justify-center rounded-xl bg-primary px-3 py-4 text-sm font-semibold leading-6 text-white shadow-soft hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 disabled:opacity-60"
                      >
                        Registrarse
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() =>
                            typeof onGoLogin === "function" ? onGoLogin() : null
                          }
                          className="text-sm font-semibold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                          ¿Ya tienes cuenta? Inicia sesión
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <form className="space-y-6 mt-8" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-1">
                      <label
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        htmlFor="loginEmail"
                      >
                        Correo Electrónico
                      </label>
                      <Input
                        id="loginEmail"
                        type="email"
                        value={loginForm.email}
                        onChange={(v) => setLoginField("email", v)}
                        placeholder="ejemplo@correo.com"
                        leftIcon="mail"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        htmlFor="loginPassword"
                      >
                        Contraseña
                      </label>
                      <Input
                        id="loginPassword"
                        type="password"
                        value={loginForm.password}
                        onChange={(v) => setLoginField("password", v)}
                        placeholder="••••••••"
                        leftIcon="lock"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={submitLogin}
                        disabled={loading}
                        className="flex w-full justify-center rounded-xl bg-primary px-3 py-4 text-sm font-semibold leading-6 text-white shadow-soft hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 disabled:opacity-60"
                      >
                        Iniciar sesión
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ¿No tienes una cuenta?
                      </p>
                      <button
                        type="button"
                        onClick={goRegister}
                        className="text-sm font-semibold text-primary hover:text-primary/80"
                      >
                        Crear cuenta
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <AuthBenefits />
            </div>

            <div className="mt-10 text-center text-xs text-gray-400 dark:text-gray-600">
              <p>© 2026 Corazón de Migrante. Todos los derechos reservados.</p>
              <div className="flex justify-center gap-4 mt-2">
                <span className="hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer">
                  Privacidad
                </span>
                <span className="hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer">
                  Términos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmText={confirm?.confirmText}
        loading={loading}
        onConfirm={confirm?.onConfirm}
        onClose={closeConfirm}
      />

      <ActionResultModal
        open={!!result}
        kind={result?.kind}
        title={result?.title}
        message={result?.message}
        onClose={closeResult}
      />
    </div>
  );
}
