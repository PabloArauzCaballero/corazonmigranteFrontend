import React, { useMemo } from "react";
import LegalLayout from "../../components/legal/LegalLayout.jsx";
import LegalTOC from "../../components/legal/LegalTOC.jsx";
import LegalSection from "../../components/legal/LegalSection.jsx";

import { TERMS_UPDATED_AT, termsSections } from "./legalContent.js";

export default function TermsPage() {
  const toc = useMemo(
    () => termsSections.map((s) => ({ id: s.id, label: s.title })),
    []
  );

  return (
    <LegalLayout
      title="Términos y Condiciones"
      subtitle={`Última actualización: ${TERMS_UPDATED_AT}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4">
          <LegalTOC items={toc} />
        </aside>

        <div className="lg:col-span-8 space-y-10">
          {termsSections.map((s) => (
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
