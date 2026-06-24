import React, { useEffect, useMemo, useRef, useState } from "react";
import { computeAdminAccess } from "../../../../app/auth/adminAccess";
import { useDynamicLogo } from "../../../../hooks/useDynamicLogo";

export default function HeaderAdmin({
    session,
    onLogout,
    activeTab = "solicitudes",
    onNavigate,

    contaModule = "cuenta",
    setContaModule = null,
}) {

    const { logoUrl } = useDynamicLogo({ idElemento: 1 });

    const adminName = useMemo(() => {
        const u = session?.user || session?.usuario || session?.data || {};
        return u?.nombre_completo || u?.nombre || u?.email || "Admin";
    }, [session]);

    const access = useMemo(() => {
        return session?.admin_access || computeAdminAccess(session);
    }, [session]);
    const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
    const productsMenuRef = useRef(null);

    const [isContaMenuOpen, setIsContaMenuOpen] = useState(false);
    const contaMenuRef = useRef(null);


    useEffect(() => {
        const onDocClick = (e) => {
            // Close Productos menu when clicking outside
            if (
                isProductsMenuOpen &&
                productsMenuRef.current &&
                !productsMenuRef.current.contains(e.target)
            ) {
                setIsProductsMenuOpen(false);
            }

            // Close Contabilidad menu when clicking outside
            if (
                isContaMenuOpen &&
                contaMenuRef.current &&
                !contaMenuRef.current.contains(e.target)
            ) {
                setIsContaMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [isProductsMenuOpen, isContaMenuOpen]);

    const tabClass = (key) =>
        key === activeTab
            ? "px-4 py-2 text-primary bg-primary/5 text-sm font-bold rounded-lg border border-primary/10"
            : "px-4 py-2 text-slate-500 hover:text-primary text-sm font-semibold transition-colors";

    const CONTABILIDAD_OPTIONS = [
        { value: "cuenta", label: "Cuenta" },
        { value: "grupo_cuenta", label: "Grupo cuenta" },
        { value: "centro_costo", label: "Centro de costo" },
        { value: "transaccion", label: "Transacción" },
    ];

    return (
        <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <img
                            src={logoUrl}
                            alt="Logo Corazón Migrante"
                            className="w-10 h-10 object-contain"
                            style={{ borderRadius: "25%" }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-primary font-display text-xl leading-tight font-bold tracking-tight">
                            Corazón de Migrante
                        </span>
                        <span className="text-slate-400 text-[9px] uppercase tracking-[0.2em] font-bold">
                            Portal administrativo
                        </span>
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-1">
                    {access?.solicitudes ? (
                        <button
                            type="button"
                            className={tabClass("solicitudes")}
                            onClick={() => onNavigate?.("solicitudes")}
                        >
                            Solicitudes
                        </button>
                    ) : null}

                    {access?.terapeutas ? (
                        <button
                            type="button"
                            className={tabClass("terapeutas")}
                            onClick={() => onNavigate?.("terapeutas")}
                        >
                            Terapeutas
                        </button>
                    ) : null}

                    {access?.usuarios ? (
                        <button
                            type="button"
                            className={tabClass("usuarios")}
                            onClick={() => onNavigate?.("usuarios")}
                        >
                            Usuarios
                        </button>
                    ) : null}

                    {access?.miPerfil ? (
                        <button
                            type="button"
                            className={tabClass("miPerfil")}
                            onClick={() => onNavigate?.("miPerfil")}
                        >
                            Mi perfil
                        </button>
                    ) : null}

                    {/* Contabilidad (con submenú: Cuenta / Grupo / Centro / Transacción) */}
                    {access?.contabilidad ? (
                        <div className="relative" ref={contaMenuRef}>
                            <button
                                type="button"
                                className={tabClass("contabilidad")}
                                onClick={() => {
                                // Keep only one dropdown open at a time
                                setIsProductsMenuOpen(false);

                                // If we are coming from another module, navigate first so the Contabilidad pages mount
                                if (activeTab !== "contabilidad") {
                                    // Navigate directly to the contabilidad sub-route
                                    const nextModule = contaModule || "cuenta";
                                    onNavigate?.(`contabilidad/${nextModule}`);
                                    setIsContaMenuOpen(true);
                                    return;
                                }

                                // If already in contabilidad, just toggle the dropdown
                                setIsContaMenuOpen((v) => !v);
                                }}
                            >
                                <span className="inline-flex items-center gap-2">
                                    Contabilidad
                                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                </span>
                            </button>

                            {isContaMenuOpen && (
                                <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50">
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm"
                                    onClick={() => {
                                        setIsContaMenuOpen(false);
                                        onNavigate?.("contabilidad/cuenta");
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[18px] text-primary">account_tree</span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">Cuenta</span>
                                        <span className="text-[11px] text-slate-500">Plan de cuentas</span>
                                    </div>
                                </button>

                                <div className="h-px bg-slate-100" />

                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm"
                                    onClick={() => {
                                        setIsContaMenuOpen(false);
                                        onNavigate?.("contabilidad/grupo_cuenta");
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[18px] text-primary">folder</span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">Grupo cuenta</span>
                                        <span className="text-[11px] text-slate-500">Clasificación contable</span>
                                    </div>
                                </button>

                                <div className="h-px bg-slate-100" />

                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm"
                                    onClick={() => {
                                        setIsContaMenuOpen(false);
                                        onNavigate?.("contabilidad/centro_costo");
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[18px] text-primary">apartment</span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">Centro de costo</span>
                                        <span className="text-[11px] text-slate-500">Áreas / centros</span>
                                    </div>
                                </button>

                                <div className="h-px bg-slate-100" />

                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm"
                                    onClick={() => {
                                        setIsContaMenuOpen(false);
                                        onNavigate?.("contabilidad/transaccion");
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[18px] text-primary">receipt_long</span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">Transacción</span>
                                        <span className="text-[11px] text-slate-500">Libro diario</span>
                                    </div>
                                </button>
                                </div>
                            )}
                        </div>
                    ) : null}


                    {access?.vistasPublicas ? (
                        <button
                            type="button"
                            className={tabClass("vistasPublicas")}
                            onClick={() => onNavigate?.("vistasPublicas")}
                        >
                            Vistas publicas
                        </button>
                    ) : null}

                    {/* Productos (con submenú: Enfoques / Productos) */}
                    {access?.productos ? (
                    <div className="relative" ref={productsMenuRef}>
                        <button
                            type="button"
                            className={tabClass("productos")}
                            onClick={() => {
                                // Keep only one dropdown open at a time
                                setIsContaMenuOpen(false);
                                setIsProductsMenuOpen((v) => !v);
                            }}
                        >
                            <span className="inline-flex items-center gap-2">
                                Productos
                                <span className="material-symbols-outlined text-[18px]">expand_more</span>
                            </span>
                        </button>

                        {isProductsMenuOpen && (
                            <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50">
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm"
                                    onClick={() => {
                                        setIsProductsMenuOpen(false);
                                        onNavigate?.("productos_enfoques");
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[18px] text-primary">spa</span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">Enfoques</span>
                                        <span className="text-[11px] text-slate-500">Gestionar enfoques</span>
                                    </div>
                                </button>

                                <div className="h-px bg-slate-100" />

                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm"
                                    onClick={() => {
                                        setIsProductsMenuOpen(false);
                                        onNavigate?.("productos_productos");
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[18px] text-primary">inventory_2</span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">Productos</span>
                                        <span className="text-[11px] text-slate-500">Gestionar productos</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                    ) : null}
                </nav>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-slate-900 text-xs font-bold leading-none">{adminName}</p>
                    <p className="text-slate-400 text-[10px] mt-1 leading-none uppercase font-medium">
                        Sesión: {session?.id_sesion}
                    </p>
                </div>

                <button
                    onClick={onLogout}
                    className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-2"
                    title="Cerrar sesión"
                    type="button"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Salir
                </button>
            </div>
        </header>
    );
}
