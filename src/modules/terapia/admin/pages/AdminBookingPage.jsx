import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

import HeaderAdmin from "../components/HeaderAdmin";
import { useBooking } from "../../../vistas_publicas/public/hooks/useBooking";

/**
 * Booking dentro del portal Admin/Terapeuta.
 * Reutiliza el mismo flujo del booking público, pero con navegación de regreso al panel.
 */
export default function AdminBookingPage({ session, onLogout, activeTab, onNavigate, basePath = "/admin" }) {
    const {
        loading,
        error,
        bootstrapData,
        disponibilidad,
        getBookingBootstrap,
        getDisponibilidad,
        registrarCita,
    } = useBooking();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        producto: null,
        terapeuta: null,
        fecha: "",
        horaInicio: "",
        horaFin: "",
        notas: "",
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        getBookingBootstrap(true).catch(console.error);
    }, []);

    useEffect(() => {
        if (formData.terapeuta?.id_usuario && step === 3) {
            getDisponibilidad(formData.terapeuta.id_usuario).catch(console.error);
        }
    }, [formData.terapeuta, step]);

    const updateForm = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const nextStep = () => setStep((s) => Math.min(s + 1, 4));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        if (!formData.terapeuta || !formData.producto || !formData.fecha || !formData.horaInicio || !formData.horaFin) {
            setSubmitError("Por favor completa todos los campos requeridos.");
            return;
        }

        setSubmitLoading(true);
        setSubmitError(null);
        try {
            await registrarCita({
                idTerapeuta: formData.terapeuta.id_usuario,
                idProducto: formData.producto.id_producto,
                fecha: formData.fecha,
                horaInicio: formData.horaInicio,
                horaFin: formData.horaFin,
                notas: formData.notas,
            });
            setSuccess(true);
        } catch (err) {
            setSubmitError(err?.message || "Error al registrar la cita.");
        } finally {
            setSubmitLoading(false);
        }
    };

    // Group disponibilidad by date
    const groupedHorarios = disponibilidad.reduce((acc, h) => {
        if (!h.fecha) return acc;
        if (!acc[h.fecha]) acc[h.fecha] = [];
        acc[h.fecha].push(h);
        return acc;
    }, {});

    const adminBackTo = `${String(basePath || "/admin").replace(/\/+$/, "")}/solicitudes`;

    if (success) {
        return (
            <div className="min-h-screen bg-background-soft text-slate-800 antialiased">
                <HeaderAdmin session={session} onLogout={onLogout} activeTab={activeTab} onNavigate={onNavigate} />

                <main className="max-w-[900px] mx-auto p-8">
                    <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-sm text-center">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-3">¡Cita Registrada!</h1>
                        <p className="text-slate-600 mb-6">La cita ha sido registrada exitosamente.</p>

                        <div className="bg-slate-50 border border-black/5 rounded-2xl p-4 mb-6 text-left">
                            <p className="text-sm text-slate-500">Fecha: <strong className="text-slate-800">{formData.fecha}</strong></p>
                            <p className="text-sm text-slate-500">Hora: <strong className="text-slate-800">{formData.horaInicio} - {formData.horaFin}</strong></p>
                            <p className="text-sm text-slate-500">Terapeuta: <strong className="text-slate-800">{formData.terapeuta?.nombre || "Asignado"}</strong></p>
                        </div>

                        <Link
                            to={adminBackTo}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Volver a Solicitudes
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-soft text-slate-800 antialiased">
            <HeaderAdmin session={session} onLogout={onLogout} activeTab={activeTab} onNavigate={onNavigate} />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <Link
                        to={adminBackTo}
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="font-medium">Volver</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">favorite</span>
                        <span className="font-bold text-slate-900">Nueva Cita</span>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center flex-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s
                                        ? "bg-primary text-white"
                                        : "bg-slate-200 text-slate-500"
                                    }`}
                            >
                                {step > s ? (
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                ) : (
                                    s
                                )}
                            </div>
                            {s < 4 && (
                                <div
                                    className={`flex-1 h-1 mx-2 rounded-full transition-colors ${step > s ? "bg-primary" : "bg-slate-200"}`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Titles */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        {step === 1 && "Elige el Servicio"}
                        {step === 2 && "Selecciona un Terapeuta"}
                        {step === 3 && "Elige Fecha y Hora"}
                        {step === 4 && "Confirma la Cita"}
                    </h1>
                    <p className="text-slate-500">
                        {step === 1 && "Selecciona el producto/servicio a reservar."}
                        {step === 2 && "Elige el terapeuta."}
                        {step === 3 && "Selecciona un horario disponible."}
                        {step === 4 && "Revisa los detalles antes de confirmar."}
                    </p>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {step === 1 && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(bootstrapData?.productos || []).map((prod) => (
                            <button
                                key={prod.id_producto}
                                onClick={() => updateForm("producto", prod)}
                                className={`text-left p-5 rounded-2xl border transition-all ${formData.producto?.id_producto === prod.id_producto
                                        ? "border-primary bg-primary/5 shadow-md"
                                        : "border-black/5 bg-white hover:border-primary/50"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.producto?.id_producto === prod.id_producto
                                            ? "bg-primary/20"
                                            : "bg-slate-100"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-primary">spa</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 mb-1">{prod.nombre}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2">{prod.descripcion || "Sesión de terapia"}</p>
                                        {prod.precio && (
                                            <p className="mt-2 text-sm font-semibold text-primary">${prod.precio}</p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(bootstrapData?.terapeutas || []).map((t) => (
                            <button
                                key={t.id_usuario}
                                onClick={() => updateForm("terapeuta", t)}
                                className={`text-left p-5 rounded-2xl border transition-all ${formData.terapeuta?.id_usuario === t.id_usuario
                                        ? "border-primary bg-primary/5 shadow-md"
                                        : "border-black/5 bg-white hover:border-primary/50"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.terapeuta?.id_usuario === t.id_usuario
                                            ? "bg-primary/20"
                                            : "bg-slate-100"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-primary">psychology</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 mb-1">{t.nombre}</h3>
                                        <p className="text-sm text-slate-500">{t.especialidad || "Terapeuta"}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {step === 3 && !loading && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha</label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => updateForm("fecha", e.target.value)}
                                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Horario</label>
                                <select
                                    value={formData.horaInicio ? `${formData.horaInicio}-${formData.horaFin}` : ""}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (!v) {
                                            updateForm("horaInicio", "");
                                            updateForm("horaFin", "");
                                            return;
                                        }
                                        const [ini, fin] = v.split("-");
                                        updateForm("horaInicio", ini);
                                        updateForm("horaFin", fin);
                                    }}
                                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Selecciona un horario</option>
                                    {(groupedHorarios[formData.fecha] || []).map((h, idx) => (
                                        <option key={idx} value={`${h.hora_inicio}-${h.hora_fin}`}>
                                            {h.hora_inicio} - {h.hora_fin}
                                        </option>
                                    ))}
                                </select>
                                {formData.fecha && (groupedHorarios[formData.fecha] || []).length === 0 && (
                                    <p className="mt-2 text-xs text-slate-500">No hay horarios para esa fecha.</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Notas (opcional)</label>
                            <textarea
                                rows={3}
                                value={formData.notas}
                                onChange={(e) => updateForm("notas", e.target.value)}
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Agrega una nota..."
                            />
                        </div>
                    </div>
                )}

                {step === 4 && !loading && (
                    <div className="bg-white border border-black/5 rounded-2xl p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Resumen</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <p><strong className="text-slate-800">Producto:</strong> {formData.producto?.nombre || "-"}</p>
                            <p><strong className="text-slate-800">Terapeuta:</strong> {formData.terapeuta?.nombre || "-"}</p>
                            <p><strong className="text-slate-800">Fecha:</strong> {formData.fecha || "-"}</p>
                            <p><strong className="text-slate-800">Hora:</strong> {formData.horaInicio && formData.horaFin ? `${formData.horaInicio} - ${formData.horaFin}` : "-"}</p>
                            {formData.notas ? (
                                <p><strong className="text-slate-800">Notas:</strong> {formData.notas}</p>
                            ) : null}
                        </div>

                        {submitError && (
                            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                                {submitError}
                            </div>
                        )}
                    </div>
                )}

                {/* Controls */}
                <div className="mt-8 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={step === 1}
                        className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border ${step === 1
                                ? "opacity-40 cursor-not-allowed border-black/10 text-slate-400"
                                : "border-black/10 text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        Atrás
                    </button>

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            disabled={
                                (step === 1 && !formData.producto) ||
                                (step === 2 && !formData.terapeuta) ||
                                (step === 3 && (!formData.fecha || !formData.horaInicio || !formData.horaFin))
                            }
                            className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitLoading}
                            className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitLoading ? "Registrando..." : "Confirmar"}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
