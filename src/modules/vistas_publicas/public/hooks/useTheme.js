// src/modules/vistas_publicas/public/hooks/useTheme.js
import { useCallback, useEffect, useMemo, useState } from "react";


export function useTheme(storageKey = "cm_theme") {
  const getInitial = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved === "dark" || saved === "light") return saved;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getInitial);

  const apply = useCallback((next) => {
    const html = document.documentElement;
    if (next === "dark") html.classList.add("dark");
    else html.classList.remove("dark");
    localStorage.setItem(storageKey, next);
    setTheme(next);
  }, [storageKey]);

  const toggle = useCallback(() => apply(theme === "dark" ? "light" : "dark"), [apply, theme]);

  useEffect(() => {
    apply(theme);
  }, [apply, theme]);

  return useMemo(() => ({ theme, setTheme: apply, toggle }), [theme, apply, toggle]);
}
