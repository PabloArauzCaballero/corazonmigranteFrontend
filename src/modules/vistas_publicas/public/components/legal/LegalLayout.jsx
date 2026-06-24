import React from "react";
import { useNavigate } from "react-router-dom";

export default function LegalLayout({ title, subtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="px-6 lg:px-12 pt-10 pb-8">
        <div className="max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm text-text-muted-light dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al inicio
          </button>

          <h1 className="mt-6 font-display text-3xl md:text-4xl text-primary dark:text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-base text-text-muted-light dark:text-gray-300 leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>

      <main className="px-6 lg:px-12 pb-16">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
