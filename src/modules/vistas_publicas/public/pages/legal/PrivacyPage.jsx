import React, { useMemo } from "react";
import LegalLayout from "../../components/legal/LegalLayout.jsx";
import LegalTOC from "../../components/legal/LegalTOC.jsx";
import LegalSection from "../../components/legal/LegalSection.jsx";

import { PRIVACY_UPDATED_AT, privacySections } from "./legalContent.js";

export default function PrivacyPage() {
  const toc = useMemo(
    () => privacySections.map((s) => ({ id: s.id, label: s.title })),
    []
  );

  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle={`Última actualización: ${PRIVACY_UPDATED_AT}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4">
          <LegalTOC items={toc} />

          <div className="mt-6 rounded-2xl bg-white/70 dark:bg-white/5 border border-primary/10 dark:border-white/10 shadow-soft p-6">
            <div className="text-sm font-semibold text-text-main-light dark:text-gray-100">
              Nota importante
            </div>
            <p className="mt-3 text-sm text-text-muted-light dark:text-gray-300 leading-relaxed">
              Este documento es informativo y puede adaptarse según el alcance final del producto y la normativa aplicable.
            </p>
          </div>
        </aside>

        <div className="lg:col-span-8 space-y-10">
          {privacySections.map((s) => (
            <LegalSection key={s.id} id={s.id} title={s.title}>
              {s.body.map((p, idx) => (
                <p key={s.id + "-p-" + idx}>{p}</p>
              ))}
            </LegalSection>
          ))}
        </div>
      </div>
    </LegalLayout>
  );
}
