import React from "react";

export default function LegalSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-display text-xl md:text-2xl text-primary dark:text-white">
        {title}
      </h2>
      <div className="mt-3 text-sm md:text-base text-text-muted-light dark:text-gray-300 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
