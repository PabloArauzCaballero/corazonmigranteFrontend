import React from "react";

export default function LegalTOC({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-primary/10 dark:border-white/10 shadow-soft p-6">
      <div className="text-sm font-semibold text-text-main-light dark:text-gray-100">
        Contenido
      </div>
      <ul className="mt-4 space-y-2 text-sm text-text-muted-light dark:text-gray-300">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className="hover:text-primary dark:hover:text-white transition-colors"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
