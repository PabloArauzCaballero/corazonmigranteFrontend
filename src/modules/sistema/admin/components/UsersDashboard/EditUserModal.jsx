import React, { useState, useEffect } from "react";
import { USUARIOS_ENDPOINTS } from "../../../../../config/USUARIOS_ENDPOINTS";
import { createApiConn } from "../../../../../helpers/api_conn_factory";

// Reuse the same lists as usersForm (fetched dynamically)
export default function EditUserModal({ isOpen, onClose, user, session }) {
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState(null); // "admin" | "terapeuta"

    // Result modal (reemplaza alert/confirm)
    const [resultOpen, setResultOpen] = useState(false);
    const [resultKind, setResultKind] = useState("info");
    const [resultTitle, setResultTitle] = useState("");
    const [resultMessage, setResultMessage] = useState("");

    const showResult = (kind, message, title = "") => {
        setResultKind(kind || "info");
        setResultTitle(title || "");
        setResultMessage(message || "");
        setResultOpen(true);
    };

    // Common fields
    const [email, setEmail] = useState("");
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [telefono, setTelefono] = useState("");
    const [sexo, setSexo] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");

    // Terapeuta fields
    const [tituloProfesional, setTituloProfesional] = useState("");
    const [especialidadPrinc, setEspecialidadPrinc] = useState("");
    const [descripcionPerfil, setDescripcionPerfil] = useState("");
    const [frasePersonal, setFrasePersonal] = useState("");
    const [linkVideoYoutube, setLinkVideoYoutube] = useState("");
    const [matriculaProfesional, setMatriculaProfesional] = useState("");
    const [pais, setPais] = useState("");
    const [ciudad, setCiudad] = useState("");
    const [valorSesionBase, setValorSesionBase] = useState("");

    // Admin fields
    const [privs, setPrivs] = useState({
        superAdmin: false,
        expedientes: false,
        auditoria: false,
    });

    // External lists
    const [profesionesList, setProfesionesList] = useState([]);
    const [especialidadesList, setEspecialidadesList] = useState([]);

    // Determine user type from role
    const determineUserType = (role) => {
        const adminRoles = ["SUPER_ADMIN", "ADMIN"];
        const terapeutaRoles = ["TERAPEUTA"];

        if (adminRoles.includes(role?.toUpperCase())) return "admin";
        if (terapeutaRoles.includes(role?.toUpperCase())) return "terapeuta";
        return null; // PACIENTE, USUARIO - not editable
    };

    // Fetch user data
    useEffect(() => {
        if (!isOpen || !user || !session) return;

        const type = determineUserType(user.role);
        setUserType(type);

        if (!type) {
            setLoading(false);
            return;
        }

        const fetchUserData = async () => {
            setLoading(true);
            try {
                const endpoint = type === "admin"
                    ? USUARIOS_ENDPOINTS.OBTENER_ADMIN
                    : USUARIOS_ENDPOINTS.OBTENER_TERAPEUTA;

                const payload = {
                    p_actor_user_id: session.user_id,
                    p_id_sesion: session.id_sesion,
                    p_user_id: user.id
                };

                const response = await createApiConn(endpoint, payload, "PATCH");


                if (response && response.rows && response.rows.length > 0) {
                    const row = response.rows[0];

                    // Extract nested data based on user type
                    let userData, specificData;

                    if (type === "terapeuta") {
                        const apiData = row.api_usuario_terapeuta_obtener?.data;
                        userData = apiData?.usuario || {};
                        specificData = apiData?.terapeuta || {};
                    } else if (type === "admin") {
                        const apiData = row.api_usuario_admin_obtener?.data;
                        userData = apiData?.usuario || {};
                        specificData = apiData?.admin || {};
                    }

                    // Populate common fields from usuario
                    setEmail(userData.email || "");
                    setNombre(userData.nombre || "");
                    setApellido(userData.apellido || "");
                    setTelefono(userData.telefono || "");
                    setSexo(userData.sexo || "");
                    setFechaNacimiento(userData.fecha_nacimiento ? userData.fecha_nacimiento.split('T')[0] : "");

                    if (type === "terapeuta") {
                        // Populate terapeuta-specific fields
                        setTituloProfesional(specificData.titulo_profesional || "");
                        setEspecialidadPrinc(specificData.especialidad_principal || "");
                        setDescripcionPerfil(specificData.descripcion_perfil || "");
                        setFrasePersonal(specificData.frase_personal || "");
                        setLinkVideoYoutube(specificData.link_video_youtube || "");
                        setMatriculaProfesional(specificData.matricula_profesional || "");
                        setPais(specificData.pais || "");
                        setCiudad(specificData.ciudad || "");
                        setValorSesionBase(specificData.valor_sesion_base || "");
                    }

                    if (type === "admin") {
                        // Populate admin-specific fields
                        setPrivs({
                            superAdmin: specificData.is_super_admin || false,
                            expedientes: specificData.can_manage_files || false,
                            auditoria: specificData.is_accounter || false,
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isOpen, user, session]);

    // Load external lists for terapeuta dropdowns
    useEffect(() => {
        if (!isOpen) return;

        const loadLists = async () => {
            try {
                const [profRes, espRes] = await Promise.all([
                    fetch("https://storage.googleapis.com/vistas_publicas_assets/PROFESIONES_SALUD_MENTAL.json"),
                    fetch("https://storage.googleapis.com/vistas_publicas_assets/ESPECIALIDADES_SALUD_MENTAL.json")
                ]);
                const profData = await profRes.json();
                const espData = await espRes.json();
                setProfesionesList(profData);
                setEspecialidadesList(espData);
            } catch (err) {
                console.error("Error loading lists:", err);
            }
        };
        loadLists();
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!session || !user || !userType) return;

        setLoading(true);
        try {
            const sexoNorm = (sexo === "Masculino" || sexo === "M") ? "M" : (sexo === "Femenino" || sexo === "F") ? "F" : sexo;

            if (userType === "terapeuta") {
                const payload = {
                    p_actor_user_id: session.user_id,
                    p_id_sesion: session.id_sesion,
                    p_user_id: user.id,

                    p_email: email.trim(),
                    p_nombre: nombre.trim(),
                    p_apellido: apellido.trim(),
                    p_telefono: telefono.trim(),
                    p_sexo: sexoNorm,
                    p_fecha_nacimiento: fechaNacimiento,

                    p_titulo_profesional: tituloProfesional,
                    p_especialidad_princ: especialidadPrinc,
                    p_descripcion_perfil: descripcionPerfil,
                    p_frase_personal: frasePersonal || null,
                    p_link_video_youtube: linkVideoYoutube || null,
                    p_matricula_profesional: matriculaProfesional,
                    p_pais: pais.trim(),
                    p_ciudad: ciudad.trim(),
                    p_valor_sesion_base: Number(valorSesionBase),
                };

                const response = await createApiConn(USUARIOS_ENDPOINTS.UPDATE_USUARIOS_TERAPEUTA, payload, "PATCH");

                const ok = response?.rows?.[0]?.status === "ok" || response?.status === "ok" || response?.ok === true;
                if (ok) {
                    showResult("success", "Terapeuta actualizado exitosamente.", "Listo");
                    onClose();
                    return;
                }

                const msg = response?.rows?.[0]?.message || response?.message || "Error al actualizar terapeuta.";
                showResult("error", msg, "Ocurrió un problema");
            } else if (userType === "admin") {
                const payload = {
                    p_actor_user_id: session.user_id,
                    p_id_sesion: session.id_sesion,
                    p_user_id: user.id,

                    p_email: email.trim(),
                    p_nombre: nombre.trim(),
                    p_apellido: apellido.trim(),
                    p_telefono: telefono.trim(),
                    p_sexo: sexoNorm,
                    p_fecha_nacimiento: fechaNacimiento,

                    p_is_super_admin: !!privs.superAdmin,
                    p_can_manage_files: !!privs.expedientes,
                    p_is_accounter: !!privs.auditoria,
                };

                const response = await createApiConn(USUARIOS_ENDPOINTS.UPDATE_USUARIOS_ADMIN, payload, "PATCH");

                const ok = response?.rows?.[0]?.status === "ok" || response?.status === "ok" || response?.ok === true;
                if (ok) {
                    showResult("success", "Administrador actualizado exitosamente.", "Listo");
                    onClose();
                    return;
                }

                const msg = response?.rows?.[0]?.message || response?.message || "Error al actualizar administrador.";
                showResult("error", msg, "Ocurrió un problema");
            }
        } catch (err) {
            console.error("Error en actualización:", err);
            showResult("error", err?.message || "Error al procesar la actualización.", "Ocurrió un problema");
        } finally {
            setLoading(false);
        }
    };

    const toggle = (k) => (e) => setPrivs((p) => ({ ...p, [k]: e.target.checked }));

    if (!isOpen) return null;

    return (
        <>
            <ActionResultModal
                open={resultOpen}
                kind={resultKind}
                title={resultTitle}
                message={resultMessage}
                onClose={() => setResultOpen(false)}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-7 py-5 border-b border-slate-200 bg-brand-cream flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Editar Usuario
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {userType === "admin" ? "Administrador" : userType === "terapeuta" ? "Terapeuta" : "Usuario"}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-7">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <span className="ml-3 text-slate-500">Cargando datos...</span>
                            </div>
                        ) : !userType ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">block</span>
                                <p className="text-slate-500">Este tipo de usuario no es editable.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Common fields - 2 columns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Nombres
                                        </label>
                                        <input
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Apellidos
                                        </label>
                                        <input
                                            value={apellido}
                                            onChange={(e) => setApellido(e.target.value)}
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Email
                                        </label>
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            type="email"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Teléfono
                                        </label>
                                        <input
                                            value={telefono}
                                            onChange={(e) => setTelefono(e.target.value)}
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Fecha de nacimiento
                                        </label>
                                        <input
                                            value={fechaNacimiento}
                                            onChange={(e) => setFechaNacimiento(e.target.value)}
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Sexo
                                        </label>
                                        <select
                                            value={sexo}
                                            onChange={(e) => setSexo(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:bg-white focus:border-primary appearance-none cursor-pointer"
                                        >
                                            <option>Seleccionar sexo</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Admin-specific fields */}
                                {userType === "admin" && (
                                    <div className="border-t border-dashed border-slate-200 pt-6">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">security</span>
                                            Privilegios
                                        </p>
                                        <div className="space-y-2">
                                            {[
                                                ["superAdmin", "Super Administrador"],
                                                ["expedientes", "Gestión de Archivos"],
                                                ["auditoria", "Gestión contable"],
                                            ].map(([k, label]) => (
                                                <label
                                                    key={k}
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={!!privs[k]}
                                                        onChange={toggle(k)}
                                                        className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                                                    />
                                                    <span className="text-sm text-slate-700 font-semibold">{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Terapeuta-specific fields */}
                                {userType === "terapeuta" && (
                                    <div className="border-t border-dashed border-slate-200 pt-6 space-y-4">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest">
                                            Datos Profesionales
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                    Título Profesional
                                                </label>
                                                <select
                                                    value={tituloProfesional}
                                                    onChange={(e) => setTituloProfesional(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="">Seleccionar Título</option>
                                                    {profesionesList.map((prof) => (
                                                        <option key={prof} value={prof}>{prof}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                    Especialidad Principal
                                                </label>
                                                <select
                                                    value={especialidadPrinc}
                                                    onChange={(e) => setEspecialidadPrinc(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="">Seleccionar Especialidad</option>
                                                    {especialidadesList.map((esp) => (
                                                        <option key={esp} value={esp}>{esp}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                Descripción Perfil
                                            </label>
                                            <textarea
                                                value={descripcionPerfil}
                                                onChange={(e) => setDescripcionPerfil(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none min-h-[80px]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                Frase Personal
                                            </label>
                                            <input
                                                value={frasePersonal}
                                                onChange={(e) => setFrasePersonal(e.target.value)}
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                Link Video Youtube
                                            </label>
                                            <input
                                                value={linkVideoYoutube}
                                                onChange={(e) => setLinkVideoYoutube(e.target.value)}
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                    Matrícula Profesional
                                                </label>
                                                <input
                                                    value={matriculaProfesional}
                                                    onChange={(e) => setMatriculaProfesional(e.target.value)}
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                    Valor Sesión Base
                                                </label>
                                                <input
                                                    value={valorSesionBase}
                                                    onChange={(e) => setValorSesionBase(e.target.value)}
                                                    type="number"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                    País
                                                </label>
                                                <input
                                                    value={pais}
                                                    onChange={(e) => setPais(e.target.value)}
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                    Ciudad
                                                </label>
                                                <input
                                                    value={ciudad}
                                                    onChange={(e) => setCiudad(e.target.value)}
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!loading && userType && (
                        <div className="px-7 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-black transition-all"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
