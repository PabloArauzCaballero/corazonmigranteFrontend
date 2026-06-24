import { useEffect, useMemo, useState } from "react";

const URL =
  "https://storage.googleapis.com/vistas_publicas_assets/admin_portal/options/PAISES_CIUDADES.json";

/**
 * Carga un JSON con la forma: { "Bolivia": ["Santa Cruz de la Sierra", ...], ... }
 * - Cache simple en sessionStorage
 * - Sin hard reload
 */
export function usePaisesCiudadesOptions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const cacheKey = "cm_paises_ciudades_v1";
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (alive) setData(parsed);
          setLoading(false);
          return;
        }

        const res = await fetch(URL, { cache: "force-cache" });
        if (!res.ok) throw new Error("No se pudo cargar países/ciudades");
        const json = await res.json();

        if (alive) setData(json);
        sessionStorage.setItem(cacheKey, JSON.stringify(json));
      } catch (e) {
        if (alive) setError(e?.message || "Error al cargar opciones");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  const paises = useMemo(() => {
    if (!data || typeof data !== "object") return [];
    return Object.keys(data).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const getCiudades = (pais) => {
    if (!data || typeof data !== "object") return [];
    const arr = data[pais];
    return Array.isArray(arr) ? arr : [];
  };

  return { data, paises, getCiudades, loading, error };
}
