import React, { useMemo } from "react";
import HeaderAdmin from "../../../terapia/admin/components/HeaderAdmin";

import CuentaPage from "./CuentaPage";
import GrupoCuentaPage from "./GrupoCuentaPage";
import CentroCostoPage from "./CentroCostoPage";
import TransaccionPage from "./TransaccionPage";

export default function ContabilidadDashboard({
    session,
    onLogout,
    activeTab,
    onNavigate,

    // vienen desde App.jsx
    contaModule = "cuenta",
    setContaModule,
}) {
    const Current = useMemo(() => {
        switch (contaModule) {
            case "grupo_cuenta":
                return <GrupoCuentaPage session={session} />;
            case "centro_costo":
                return <CentroCostoPage session={session} />;
            case "transaccion":
                return <TransaccionPage session={session} />;
            case "cuenta":
            default:
                return <CuentaPage session={session} />;
        }
    }, [contaModule, session]);

    return (
        <div className="min-h-screen bg-background-soft text-slate-800 antialiased">
            <HeaderAdmin
                session={session}
                onLogout={onLogout}
                activeTab={activeTab}
                onNavigate={onNavigate}
                contaModule={contaModule}
                setContaModule={setContaModule}
            />

            <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-6">
                {Current}
            </div>
        </div>
    );
}
