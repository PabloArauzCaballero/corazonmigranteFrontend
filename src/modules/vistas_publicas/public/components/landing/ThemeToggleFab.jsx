// src/modules/vistas_publicas/public/components/landing/ThemeToggleFab.jsx
import React from "react";
import { useTheme } from "../../hooks/useTheme";

export default function ThemeToggleFab({ labels }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const ariaLabel = labels?.aria_label || "";
  const title = labels?.title || "";

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-white shadow-soft hover:bg-primary-light transition-colors focus:outline-none z-50 dark:bg-white dark:text-primary"
      aria-label={ariaLabel}
      title={title}
    >
      <svg className={`w-6 h-6 ${isDark ? "block" : "hidden"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        />
      </svg>

      <svg className={`w-6 h-6 ${isDark ? "hidden" : "block"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        />
      </svg>
    </button>
  );
}
