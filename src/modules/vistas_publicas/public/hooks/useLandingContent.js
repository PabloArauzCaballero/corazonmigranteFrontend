import { useEffect, useMemo, useState } from "react";

import { UI_ENDPOINTS } from "../../../../config/UI_ENDPOINTS";
import { createApiConn } from "../../../../helpers/api_conn_factory";

function toIntOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function normalizeUiById(uiById) {
  const out = {};
  Object.entries(uiById || {}).forEach(([k, v]) => {
    const id = toIntOrNull(k) ?? toIntOrNull(v?.id_elemento);
    if (!id) return;

    const metadata = v?.metadata && typeof v.metadata === "object" ? { ...v.metadata } : {};
    const link = safeStr(v?.link) || safeStr(v?.url) || safeStr(metadata?.url) || "";
    const alt = safeStr(v?.alt) || safeStr(metadata?.alt) || "";
    if (alt && !metadata.alt) metadata.alt = alt;
    if (link && !metadata.url) metadata.url = link;

    out[id] = {
      id_elemento: id,
      tipo: safeStr(v?.tipo),
      link,
      valor: safeStr(v?.valor),
      metadata,
    };
  });
  return out;
}

function resolveUiUrl(uiById, id_ui) {
  const id = toIntOrNull(id_ui);
  if (!id) return "";
  const row = uiById?.[id];
  if (!row) return "";
  return safeStr(row?.link) || safeStr(row?.url) || safeStr(row?.metadata?.url) || "";
}

let _cache = null;

export function useLandingContent() {
  const [state, setState] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (_cache) return;

      try {
        setLoading(true);
        setError(null);

        // Endpoint público: ya trae content + uiById (sin actor/sesión)
        const id_pagina = toIntOrNull(import.meta.env.VITE_PUBLIC_PAGE_ID) ?? 1;
        const cod_pagina = safeStr(import.meta.env.VITE_PUBLIC_PAGE_COD).trim();

        const query = cod_pagina
          ? { cod_pagina }
          : { id_pagina };

        const bundle = await createApiConn(
          UI_ENDPOINTS.UI_PAGINA_PUBLICA_BUNDLE,
          query,
          "GET"
        );

        const content = bundle?.content || bundle?.data?.content || null;
        const uiByIdRaw = bundle?.uiById || bundle?.data?.uiById || {};
        const uiById = normalizeUiById(uiByIdRaw);

        if (!content) throw new Error("PUBLIC_PAGE_CONTENT_MISSING");

        const data = { content, uiById };
        _cache = data;
        if (alive) setState(data);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    const content = state?.content || null;
    const uiById = state?.uiById || {};

    return {
      content,
      uiById,
      resolveUiUrl: (id_ui) => resolveUiUrl(uiById, id_ui),
      loading,
      error,
    };
  }, [state, loading, error]);
}
