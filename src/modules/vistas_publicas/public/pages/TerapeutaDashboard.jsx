import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../../../app/auth/SessionContext";

/**
 * Dashboard del Terapeuta autenticado
 * - Muestra información del terapeuta
 * - Lista de citas programadas
 * - Acceso a gestión de horarios
 */
export default function TerapeutaDashboard() {
    const navigate = useNavigate();
    const { session, logout } = useSession();

    const [citas, setCitas] = useState([]);

    const handleLogout = () => {
        logout();
        navigate("/paciente/login");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950 font-display">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-black/50 border-b border-black/5 dark:border-white/10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-2xl">psychology</span>
                            <span className="font-bold text-lg text-slate-800 dark:text-white">Portal Terapeuta</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    TERAPEUTA
                                </span>
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    #{session?.user_id || "---"}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Card */}
                <div className="rounded-3xl bg-gradient-to-r from-indigo-100 via-purple-50 to-transparent dark:from-indigo-900/30 dark:via-purple-900/20 p-8 mb-8 border border-indigo-200/50 dark:border-indigo-700/30">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">
                                Bienvenido al Portal del Terapeuta
                            </h1>
                            <p className="text-slate-600 dark:text-slate-300 max-w-xl">
                                Gestiona tus citas, horarios y pacientes desde un solo lugar.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined">schedule</span>
                                Mis Horarios
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">calendar_today</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Citas Hoy</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">event</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Esta Semana</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">pending</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Pendientes</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600 dark:text-green-400">groups</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Pacientes</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Citas Section */}
                <div className="rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                        <h2 className="font-bold text-lg text-slate-800 dark:text-white">Próximas Citas</h2>
                        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                            Ver todas
                        </button>
                    </div>

                    <div className="p-6">
                        {citas.length > 0 ? (
                            <div className="space-y-4">
                                {citas.map((cita, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">person</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800 dark:text-white">Paciente #{cita.id_paciente}</p>
                                            <p className="text-sm text-slate-500">{cita.fecha} • {cita.hora_inicio} - {cita.hora_fin}</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            {cita.estado || "PENDIENTE"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-indigo-400 text-3xl">event_available</span>
                                </div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">No tienes citas próximas</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Las citas programadas por tus pacientes aparecerán aquí.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-black/5 dark:border-white/10 mt-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-xs text-slate-400 dark:text-slate-600">
                        © 2026 Corazón de Migrante. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
