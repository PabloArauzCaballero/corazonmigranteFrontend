import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROUTES_FILE_SERVER } from "../../../../config/ROUTES_FILE_SERVER";

// In-memory cache (persiste mientras la SPA está viva)
const mem = {
  profesiones: null,
  especialidades: null,
  paisesCiudades: null,
};

const CACHE_KEYS = {
  profesiones: "cm_profesiones_v1",
  especialidades: "cm_especialidades_v1",
  paisesCiudades: "cm_paises_ciudades_v1",
};

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`No se pudo cargar: ${url}`);
  return res.json();
}

async function loadCached(key, url) {
  // 1) memoria
  if (mem[key] != null) return mem[key];

  // 2) sessionStorage
  const sk = CACHE_KEYS[key];
  const cached = safeJsonParse(sessionStorage.getItem(sk));
  if (cached != null) {
    mem[key] = cached;
    return cached;
  }

  // 3) red
  const json = await fetchJson(url);
  mem[key] = json;
  sessionStorage.setItem(sk, JSON.stringify(json));
  return json;
}

const Ctx = createContext(null);

export function AdminOptionsProvider({ children, enabled = true }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profesiones, setProfesiones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [paisesCiudades, setPaisesCiudades] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!enabled) {
      setLoading(false);
      return;
    }

    async function run() {
      try {
        setLoading(true);
        setError("");

        const [prof, esp, pc] = await Promise.all([
          loadCached("profesiones", ROUTES_FILE_SERVER.URL_PROFESIONES),
          loadCached("especialidades", ROUTES_FILE_SERVER.URL_ESPECIALIDADES),
          loadCached("paisesCiudades", ROUTES_FILE_SERVER.URL_PAIS_CIUDAD),
        ]);

        const profArr = Array.isArray(prof) ? prof : Array.isArray(prof?.items) ? prof.items : [];
        const espArr = Array.isArray(esp) ? esp : Array.isArray(esp?.items) ? esp.items : [];

        if (!alive) return;
        setProfesiones(profArr);
        setEspecialidades(espArr);
        setPaisesCiudades(pc);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Error al cargar opciones");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [enabled]);

  const paises = useMemo(() => {
    if (!paisesCiudades || typeof paisesCiudades !== "object" || Array.isArray(paisesCiudades)) return [];
    return Object.keys(paisesCiudades).sort((a, b) => a.localeCompare(b));
  }, [paisesCiudades]);

  const getCiudades = (pais) => {
    if (!paisesCiudades || typeof paisesCiudades !== "object" || Array.isArray(paisesCiudades)) return [];
    const arr = paisesCiudades[pais];
    return Array.isArray(arr) ? arr : [];
  };

  const value = useMemo(
    () => ({
      loading,
      error,
      profesiones,
      especialidades,
      paisesCiudades,
      paises,
      getCiudades,
    }),
    [loading, error, profesiones, especialidades, paisesCiudades, paises]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminOptions() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      loading: false,
      error: "",
      profesiones: [],
      especialidades: [],
      paisesCiudades: null,
      paises: [],
      getCiudades: () => [],
    };
  }
  return ctx;
}
