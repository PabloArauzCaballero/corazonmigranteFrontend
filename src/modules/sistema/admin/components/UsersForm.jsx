import React, { useEffect, useMemo, useRef, useState } from "react";
import { USUARIOS_ENDPOINTS } from "../../../../config/USUARIOS_ENDPOINTS";
import { ROUTES_FILE_SERVER } from "../../../../config/ROUTES_FILE_SERVER";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { useAdminOptions } from "../context/AdminOptionsContext";

const isBlank = (v) => (v ?? "").toString().trim().length === 0;

function normalizeSexo(sexo) {
    if (!sexo) return "";
    if (sexo === "Femenino" || sexo === "F") return "F";
    if (sexo === "Masculino" || sexo === "M") return "M";
    return "";
}

function parseOk(res) {
    if (!res) return false;
    if (res.ok === true) return true;
    if (res.status === true) return true;
    if (res.status === "ok") return true;
    if (res?.rows?.[0]?.status === "ok") return true;
    if (res?.rows?.[0]?.ok === true) return true;
    if (res?.rows?.[0]?.status === true) return true;
    return false;
}

function parseMsg(res, fallback) {
    return res?.rows?.[0]?.message || res?.message || res?.data?.message || fallback;
}

function toArraySmart(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.rows)) return payload.rows;
    return [];
}

function uniqStrings(arr) {
    const out = [];
    const set = new Set();
    for (const x of arr || []) {
        const s = (x ?? "").toString().trim();
        if (!s) continue;
        if (set.has(s)) continue;
        set.add(s);
        out.push(s);
    }
    return out;
}

function normalizePaisCiudad(raw) {
    const arr = toArraySmart(raw);

    // Caso A: array de objetos {pais, ciudades}
    if (arr.length && typeof arr[0] === "object" && !Array.isArray(arr[0])) {
        const mapped = arr
            .map((it) => {
                const pais = (it.pais || it.country || it.name || "").toString().trim();
                const ciudadesRaw = it.ciudades || it.cities || it.items || it.values || [];
                const ciudades = uniqStrings(toArraySmart(ciudadesRaw));
                if (!pais) return null;
                return { pais, ciudades };
            })
            .filter(Boolean);

        if (mapped.length) return mapped;
    }

    // Caso B: objeto { "Bolivia": ["Santa Cruz", ...], ... }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const mapped = Object.entries(raw)
            .map(([paisKey, ciudadesVal]) => ({
                pais: (paisKey ?? "").toString().trim(),
                ciudades: uniqStrings(toArraySmart(ciudadesVal)),
            }))
            .filter((x) => x.pais);

        if (mapped.length) return mapped;
    }

    return [];
}

function tagsToString(tagsArr) {
    const clean = uniqStrings(tagsArr);
    return clean.length ? clean.join(", ") : null;
}

/* =========================
   MultiSelectTag (dropdown + chips)
========================= */
function useOnClickOutside(ref, handler, when = true) {
    useEffect(() => {
        if (!when) return;
        const listener = (event) => {
            if (!ref.current) return;
            if (ref.current.contains(event.target)) return;
            handler(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler, when]);
}

function MultiSelectTags({
    label,
    optionalLabel,
    options,
    selected,
    onChange,
    placeholder = "Seleccionar...",
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const wrapRef = useRef(null);

    useOnClickOutside(wrapRef, () => setOpen(false), open);

    const normalizedOptions = useMemo(() => uniqStrings(options), [options]);

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        if (!qq) return normalizedOptions;
        return normalizedOptions.filter((x) => x.toLowerCase().includes(qq));
    }, [normalizedOptions, q]);

    const selectedSet = useMemo(() => new Set(selected || []), [selected]);

    const toggleItem = (item) => {
        if (disabled) return;
        const s = (item ?? "").toString().trim();
        if (!s) return;

        const curr = Array.isArray(selected) ? selected : [];
        if (selectedSet.has(s)) onChange(curr.filter((x) => x !== s));
        else onChange([...curr, s]);
    };

    const removeItem = (item) => {
        if (disabled) return;
        const curr = Array.isArray(selected) ? selected : [];
        onChange(curr.filter((x) => x !== item));
    };

    const clearAll = () => {
        if (disabled) return;
        onChange([]);
    };

    return (
        <div ref={wrapRef} className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                {label}{" "}
                {optionalLabel ? (
                    <span className="font-semibold normal-case tracking-normal">{optionalLabel}</span>
                ) : null}
            </label>

            <button
                type="button"
                onClick={() => !disabled && setOpen((v) => !v)}
                className={
                    "w-full text-left bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm outline-none " +
                    (disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-white hover:border-primary")
                }
            >
                <div className="flex flex-wrap gap-2">
                    {selected?.length ? (
                        selected.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                {t}
                                <span
                                    className="material-symbols-outlined text-[16px] text-slate-400 hover:text-slate-800 cursor-pointer"
                                    onClick={() => removeItem(t)}
                                    title="Quitar"
                                >
                                    close
                                </span>
                            </span>
                        ))
                    ) : (
                        <span className="text-slate-400">{placeholder}</span>
                    )}
                </div>
            </button>

            <span className="material-symbols-outlined absolute right-3 top-[38px] text-slate-400 text-sm pointer-events-none">
                expand_more
            </span>

            {open && !disabled && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                            <button
                                type="button"
                                onClick={clearAll}
                                className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800"
                                title="Limpiar"
                            >
                                Limpiar
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            {selected?.length ? `${selected.length} seleccionado(s)` : "Sin selección"}
                        </p>
                    </div>

                    <div className="max-h-56 overflow-y-auto p-2">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-sm text-slate-500">Sin resultados.</div>
                        ) : (
                            filtered.map((item) => {
                                const active = selectedSet.has(item);
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => toggleItem(item)}
                                        className={
                                            "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-left " +
                                            (active ? "bg-primary/10 text-slate-900" : "hover:bg-slate-50 text-slate-700")
                                        }
                                    >
                                        <span className="font-medium">{item}</span>
                                        <span
                                            className={
                                                "material-symbols-outlined text-[18px] " + (active ? "text-primary" : "text-slate-300")
                                            }
                                        >
                                            check_circle
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="p-2 border-t border-slate-100 bg-white">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-black"
                        >
                            Listo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UsersForm({ initialTipo = "Administrador" }) {
    const [tipo, setTipo] = useState(initialTipo);

    // base
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [telefono, setTelefono] = useState("");
    const [sexo, setSexo] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");

    // lists
    const [profesionesList, setProfesionesList] = useState([]);
    const [especialidadesList, setEspecialidadesList] = useState([]);

    const [paisCiudadList, setPaisCiudadList] = useState([]); // [{pais, ciudades}]
    const [ocupacionesList, setOcupacionesList] = useState([]);
    const [sintomasList, setSintomasList] = useState([]);
    const [objetivosList, setObjetivosList] = useState([]);

    const {
        profesiones: cachedProfesiones,
        especialidades: cachedEspecialidades,
        paisesCiudades: cachedPaisesCiudades,
    } = useAdminOptions();

    // terapeuta
    const [tituloProfesional, setTituloProfesional] = useState("");
    const [especialidadPrinc, setEspecialidadPrinc] = useState("");
    const [descripcionPerfil, setDescripcionPerfil] = useState("");
    const [frasePersonal, setFrasePersonal] = useState("");
    const [linkVideoYoutube, setLinkVideoYoutube] = useState("");
    const [matriculaProfesional, setMatriculaProfesional] = useState("");
    const [pais, setPais] = useState("");
    const [ciudad, setCiudad] = useState("");
    const [valorSesionBase, setValorSesionBase] = useState("");

    // admin
    const [privs, setPrivs] = useState({
        superAdmin: false,
        expedientes: false,
        auditoria: false,
    });

    // paciente (multi tags)
    const [motivoConsulta, setMotivoConsulta] = useState("");
    const [sintomasTags, setSintomasTags] = useState([]);
    const [objetivosTags, setObjetivosTags] = useState([]);
    const [ocupacionTags, setOcupacionTags] = useState([]);

    const [terapeutasDisponibles, setTerapeutasDisponibles] = useState([]);
    const [selectedTerapeuta, setSelectedTerapeuta] = useState("");

    // UX
    const [touched, setTouched] = useState({});
    const [didSubmit, setDidSubmit] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState({ type: "", message: "" });

    const toggle = (k) => (e) => setPrivs((p) => ({ ...p, [k]: e.target.checked }));
    const markTouched = (key) => setTouched((t) => ({ ...t, [key]: true }));

    useEffect(() => setTipo(initialTipo), [initialTipo]);

    // Listas externas (ocupaciones/síntomas/objetivos se cargan aquí).
    // Especialidades/Profesiones/Paises-Ciudades vienen cacheadas desde AdminOptionsProvider.
    useEffect(() => {
        let mounted = true;

        const loadLists = async () => {
            try {
                const [ocupRes, sintRes, objRes] = await Promise.all([
                    fetch(ROUTES_FILE_SERVER.URL_OCUPACIONES),
                    fetch(ROUTES_FILE_SERVER.URL_SINTOMAS),
                    fetch(ROUTES_FILE_SERVER.URL_OBJETIVOS),
                ]);

                const [ocupData, sintData, objData] = await Promise.all([
                    ocupRes.json(),
                    sintRes.json(),
                    objRes.json(),
                ]);

                if (!mounted) return;

                setOcupacionesList(uniqStrings(toArraySmart(ocupData)));
                setSintomasList(uniqStrings(toArraySmart(sintData)));
                setObjetivosList(uniqStrings(toArraySmart(objData)));
            } catch (err) {
                console.error("Error loading external lists", err);
            }
        };

        loadLists();
        return () => (mounted = false);
    }, []);

    // Inyectar listas cacheadas
    useEffect(() => {
        setProfesionesList(uniqStrings(toArraySmart(cachedProfesiones)));
    }, [cachedProfesiones]);

    useEffect(() => {
        setEspecialidadesList(uniqStrings(toArraySmart(cachedEspecialidades)));
    }, [cachedEspecialidades]);

    useEffect(() => {
        if (!cachedPaisesCiudades) return;
        setPaisCiudadList(normalizePaisCiudad(cachedPaisesCiudades));
    }, [cachedPaisesCiudades]);

    // País/Ciudad derivadas
    const paisOptions = useMemo(() => {
        return uniqStrings(paisCiudadList.map((x) => x.pais)).sort((a, b) => a.localeCompare(b));
    }, [paisCiudadList]);

    const ciudadOptions = useMemo(() => {
        if (isBlank(pais)) return [];
        const found = paisCiudadList.find((x) => x.pais === pais);
        return uniqStrings(found?.ciudades || []).sort((a, b) => a.localeCompare(b));
    }, [paisCiudadList, pais]);

    useEffect(() => {
        if (isBlank(pais)) {
            setCiudad("");
            return;
        }
        if (ciudad && !ciudadOptions.includes(ciudad)) setCiudad("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pais]);

    // Terapeutas disponibles (solo Admin)
    useEffect(() => {
        if (tipo !== "Administrador") return;

        let mounted = true;
        const fetchTerapeutas = async () => {
            try {
                const response = await createApiConn(USUARIOS_ENDPOINTS.TERAPEUTAS_SIN_ADMIN_LISTAR, {}, "GET");

                let rows = [];
                if (response && Array.isArray(response.rows)) rows = response.rows;
                else if (response?.status === true && Array.isArray(response.data)) rows = response.data;
                else if (Array.isArray(response?.items)) rows = response.items;
                else if (Array.isArray(response?.terapeutas)) rows = response.terapeutas;
                else if (Array.isArray(response)) rows = response;

                if (!mounted) return;
                setTerapeutasDisponibles(rows);
            } catch (error) {
                console.error("Error al obtener terapeutas:", error);
                if (!mounted) return;
                setTerapeutasDisponibles([]);
            }
        };

        fetchTerapeutas();
        return () => (mounted = false);
    }, [tipo]);

    useEffect(() => setBanner({ type: "", message: "" }), [tipo]);

    const errors = useMemo(() => {
        const e = {};

        if (isBlank(email)) e.email = "Email es obligatorio.";
        if (isBlank(password)) e.password = "Contraseña es obligatoria.";
        if (!isBlank(password) && password.length < 8) e.password = "La contraseña debe tener mínimo 8 caracteres.";
        if (isBlank(confirmPassword)) e.confirmPassword = "Confirma tu contraseña.";
        if (!isBlank(password) && !isBlank(confirmPassword) && password !== confirmPassword) {
            e.confirmPassword = "Las contraseñas no coinciden.";
        }

        if (isBlank(nombre)) e.nombre = "Nombres es obligatorio.";
        if (isBlank(apellido)) e.apellido = "Apellidos es obligatorio.";

        if (tipo !== "Paciente" && isBlank(telefono)) e.telefono = "Teléfono es obligatorio.";

        const sx = normalizeSexo(sexo);
        if (isBlank(sexo) || sx === "") e.sexo = "Selecciona un sexo válido.";
        if (isBlank(fechaNacimiento)) e.fechaNacimiento = "Fecha de nacimiento es obligatoria.";

        if (tipo === "Terapeuta") {
            if (isBlank(tituloProfesional)) e.tituloProfesional = "Título profesional es obligatorio.";
            if (isBlank(especialidadPrinc)) e.especialidadPrinc = "Especialidad principal es obligatoria.";
            if (isBlank(descripcionPerfil)) e.descripcionPerfil = "Descripción de perfil es obligatoria.";
            if (isBlank(matriculaProfesional)) e.matriculaProfesional = "Matrícula profesional es obligatoria.";
            if (isBlank(pais)) e.pais = "País es obligatorio.";
            if (isBlank(ciudad)) e.ciudad = "Ciudad es obligatoria.";

            if (isBlank(valorSesionBase)) e.valorSesionBase = "Valor sesión base es obligatorio.";
            if (!isBlank(valorSesionBase)) {
                const n = Number(valorSesionBase);
                if (Number.isNaN(n) || n <= 0) e.valorSesionBase = "Valor sesión base debe ser un número mayor a 0.";
            }
        }

        if (tipo === "Paciente") {
            if (isBlank(pais)) e.pais = "País es obligatorio.";
            if (isBlank(ciudad)) e.ciudad = "Ciudad es obligatoria.";
        }

        return e;
    }, [
        tipo,
        email,
        password,
        confirmPassword,
        nombre,
        apellido,
        telefono,
        sexo,
        fechaNacimiento,
        tituloProfesional,
        especialidadPrinc,
        descripcionPerfil,
        matriculaProfesional,
        pais,
        ciudad,
        valorSesionBase,
    ]);

    const hasErrors = Object.keys(errors).length > 0;
    const canSubmit = !submitting && !hasErrors;
    const showError = (key) => (touched[key] || didSubmit) && errors[key];

    const limpiar = () => {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setNombre("");
        setApellido("");
        setTelefono("");
        setSexo("");
        setFechaNacimiento("");

        setPrivs({ superAdmin: false, expedientes: false, auditoria: false });
        setSelectedTerapeuta("");

        setTituloProfesional("");
        setEspecialidadPrinc("");
        setDescripcionPerfil("");
        setFrasePersonal("");
        setLinkVideoYoutube("");
        setMatriculaProfesional("");
        setPais("");
        setCiudad("");
        setValorSesionBase("");

        setMotivoConsulta("");
        setSintomasTags([]);
        setObjetivosTags([]);
        setOcupacionTags([]);

        setTouched({});
        setDidSubmit(false);
        setBanner({ type: "", message: "" });
    };

    const switchTipo = (next) => {
        setTipo(next);
        setTouched({});
        setDidSubmit(false);
        setBanner({ type: "", message: "" });
    };

    const submit = async () => {
        setDidSubmit(true);
        setBanner({ type: "", message: "" });
        if (hasErrors) return;

        setSubmitting(true);
        try {
            const sexoNorm = normalizeSexo(sexo);

            if (tipo === "Terapeuta") {
                const payload = {
                    p_email: email.trim(),
                    p_password: password,
                    p_nombre: nombre.trim(),
                    p_apellido: apellido.trim(),
                    p_telefono: telefono.trim(),
                    p_sexo: sexoNorm,
                    p_fecha_nacimiento: fechaNacimiento,

                    p_titulo_profesional: tituloProfesional,
                    p_especialidad_princ: especialidadPrinc,
                    p_descripcion_perfil: descripcionPerfil,
                    p_frase_personal: frasePersonal.trim() || null,
                    p_link_video_youtube: linkVideoYoutube.trim() || null,
                    p_matricula_profesional: matriculaProfesional,
                    p_pais: pais.trim(),
                    p_ciudad: ciudad.trim(),
                    p_valor_sesion_base: Number(valorSesionBase),
                };

                const res = await createApiConn(USUARIOS_ENDPOINTS.REGISTRAR_TERAPEUTA, payload, "POST");
                if (parseOk(res)) {
                    setBanner({ type: "success", message: "Terapeuta registrado exitosamente." });
                    limpiar();
                    return;
                }
                setBanner({ type: "error", message: parseMsg(res, "Error al registrar terapeuta.") });
                return;
            }

            if (tipo === "Paciente") {
                const payload = {
                    p_email: email.trim(),
                    p_password: password,
                    p_nombre: nombre.trim(),
                    p_apellido: apellido.trim(),
                    p_telefono: telefono.trim() || null,
                    p_sexo: sexoNorm,
                    p_fecha_nacimiento: fechaNacimiento,

                    p_pais: pais.trim(),
                    p_ciudad: ciudad.trim(),

                    p_metadata: {
                        tags: {
                            ocupacion: ocupacionTags || [],
                            sintomas: sintomasTags || [],
                            objetivos: objetivosTags || [],
                        },
                        motivo_consulta: motivoConsulta?.trim() || null,
                    },
                };

                const res = await createApiConn(USUARIOS_ENDPOINTS.REGISTRAR_PACIENTE, payload, "POST");

                if (parseOk(res)) {
                    setBanner({ type: "success", message: "Paciente registrado exitosamente." });
                    limpiar();
                    return;
                }
                setBanner({ type: "error", message: parseMsg(res, "Error al registrar paciente.") });
                return;
            }

            // Administrador
            const payload = {
                p_email: email.trim(),
                p_password: password,
                p_nombre: nombre.trim(),
                p_apellido: apellido.trim(),
                p_telefono: telefono.trim(),
                p_sexo: sexoNorm,
                p_fecha_nacimiento: fechaNacimiento,

                p_is_super_admin: !!privs.superAdmin,
                p_can_manage_files: !!privs.expedientes,
                p_is_accounter: !!privs.auditoria,
                p_id_usuario_terapeuta: selectedTerapeuta || null,
            };

            const res = await createApiConn(USUARIOS_ENDPOINTS.REGISTRAR_ADMIN, payload, "POST");
            if (parseOk(res)) {
                setBanner({ type: "success", message: "Administrador registrado exitosamente." });
                limpiar();
                return;
            }
            setBanner({ type: "error", message: parseMsg(res, "Error al registrar administrador.") });
        } catch (err) {
            console.error("Error en registro:", err);
            setBanner({ type: "error", message: err?.message || "Error al procesar el registro." });
        } finally {
            setSubmitting(false);
        }
    };

    const tiposUI = [
        { key: "Administrador", label: "ADMINISTRADOR" },
        { key: "Terapeuta", label: "TERAPEUTA" },
        { key: "Paciente", label: "PACIENTE" },
    ];

    return (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col md-5">
            <div className="px-7 py-6 border-b border-slate-200 bg-brand-cream">
                <h3 className="text-lg font-bold text-slate-900">Registro de Usuario</h3>
                <p className="text-xs text-slate-500 mt-1">Crea accesos administrativos / terapeutas / pacientes</p>
            </div>

            <div className="p-7 space-y-6 overflow-y-auto flex-1 min-h-0">

                {banner.type && (
                    <div
                        className={
                            banner.type === "success"
                                ? "rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                                : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                        }
                    >
                        {banner.message}
                    </div>
                )}

                {/* Selector tipo */}
                <div className="bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-3 gap-1">
                        {tiposUI.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => switchTipo(t.key)}
                                className={
                                    tipo === t.key
                                        ? "px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-primary text-white rounded-lg"
                                        : "px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 rounded-lg"
                                }
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Email *</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">mail</span>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => markTouched("email")}
                            type="email"
                            placeholder="ejemplo@corazondemigrante.com"
                            className={
                                "w-full bg-slate-50 border rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-primary outline-none " +
                                (showError("email") ? "border-red-300" : "border-slate-200")
                            }
                        />
                    </div>
                    {showError("email") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            Contraseña * (mín. 8)
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">lock</span>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => markTouched("password")}
                                type="password"
                                placeholder="••••••••"
                                className={
                                    "w-full bg-slate-50 border rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-primary outline-none " +
                                    (showError("password") ? "border-red-300" : "border-slate-200")
                                }
                            />
                        </div>
                        {showError("password") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            Confirmar contraseña *
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">lock</span>
                            <input
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={() => markTouched("confirmPassword")}
                                type="password"
                                placeholder="Repite la contraseña"
                                className={
                                    "w-full bg-slate-50 border rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-primary outline-none " +
                                    (showError("confirmPassword") ? "border-red-300" : "border-slate-200")
                                }
                            />
                        </div>
                        {showError("confirmPassword") && (
                            <p className="text-xs text-red-600 font-semibold mt-2">{errors.confirmPassword}</p>
                        )}
                    </div>
                </div>

                {/* Datos personales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Nombres *</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">person</span>
                            <input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                onBlur={() => markTouched("nombre")}
                                type="text"
                                placeholder="Ingrese nombres"
                                className={
                                    "w-full bg-slate-50 border rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-primary outline-none " +
                                    (showError("nombre") ? "border-red-300" : "border-slate-200")
                                }
                            />
                        </div>
                        {showError("nombre") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.nombre}</p>}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            Apellidos *
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">person</span>
                            <input
                                value={apellido}
                                onChange={(e) => setApellido(e.target.value)}
                                onBlur={() => markTouched("apellido")}
                                type="text"
                                placeholder="Ingrese apellidos"
                                className={
                                    "w-full bg-slate-50 border rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-primary outline-none " +
                                    (showError("apellido") ? "border-red-300" : "border-slate-200")
                                }
                            />
                        </div>
                        {showError("apellido") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.apellido}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            Teléfono {tipo === "Paciente" ? "(opcional)" : "*"}
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">call</span>
                            <input
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                onBlur={() => markTouched("telefono")}
                                type="text"
                                placeholder="+591 70000001"
                                className={
                                    "w-full bg-slate-50 border rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-primary outline-none " +
                                    (showError("telefono") ? "border-red-300" : "border-slate-200")
                                }
                            />
                        </div>
                        {showError("telefono") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.telefono}</p>}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            Fecha de nacimiento *
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">
                                calendar_month
                            </span>
                            <input
                                value={fechaNacimiento}
                                onChange={(e) => setFechaNacimiento(e.target.value)}
                                onBlur={() => markTouched("fechaNacimiento")}
                                type="date"
                                className={
                                    "w-full bg-slate-50 border rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-primary outline-none " +
                                    (showError("fechaNacimiento") ? "border-red-300" : "border-slate-200")
                                }
                            />
                        </div>
                        {showError("fechaNacimiento") && (
                            <p className="text-xs text-red-600 font-semibold mt-2">{errors.fechaNacimiento}</p>
                        )}
                    </div>
                </div>

                {/* Sexo */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Sexo *</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">person</span>
                        <select
                            value={sexo}
                            onChange={(e) => setSexo(e.target.value)}
                            onBlur={() => markTouched("sexo")}
                            className={
                                "w-full bg-slate-50 border rounded-xl py-3 pl-11 pr-10 text-sm outline-none focus:bg-white focus:border-primary appearance-none cursor-pointer " +
                                (showError("sexo") ? "border-red-300" : "border-slate-200")
                            }
                        >
                            <option value="">Seleccionar sexo</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">
                            expand_more
                        </span>
                    </div>
                    {showError("sexo") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.sexo}</p>}
                </div>

                {/* =========================
            TERAPEUTA (no se toca)
        ========================= */}
                {tipo === "Terapeuta" && (
                    <div className="space-y-6 border-t border-dashed border-slate-200 pt-6">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Datos Profesionales</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Título Profesional */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Título Profesional *
                                </label>
                                <div className="relative">
                                    <select
                                        value={tituloProfesional}
                                        onChange={(e) => setTituloProfesional(e.target.value)}
                                        onBlur={() => markTouched("tituloProfesional")}
                                        className={
                                            "w-full bg-slate-50 border rounded-xl py-3 px-4 pr-10 text-sm focus:bg-white focus:border-primary outline-none appearance-none cursor-pointer " +
                                            (showError("tituloProfesional") ? "border-red-300" : "border-slate-200")
                                        }
                                    >
                                        <option value="">Seleccionar Título</option>
                                        {profesionesList.map((prof) => (
                                            <option key={prof} value={prof}>
                                                {prof}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                                {showError("tituloProfesional") && (
                                    <p className="text-xs text-red-600 font-semibold mt-2">{errors.tituloProfesional}</p>
                                )}
                            </div>

                            {/* Especialidad */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Especialidad Principal *
                                </label>
                                <div className="relative">
                                    <select
                                        value={especialidadPrinc}
                                        onChange={(e) => setEspecialidadPrinc(e.target.value)}
                                        onBlur={() => markTouched("especialidadPrinc")}
                                        className={
                                            "w-full bg-slate-50 border rounded-xl py-3 px-4 pr-10 text-sm focus:bg-white focus:border-primary outline-none appearance-none cursor-pointer " +
                                            (showError("especialidadPrinc") ? "border-red-300" : "border-slate-200")
                                        }
                                    >
                                        <option value="">Seleccionar Especialidad</option>
                                        {especialidadesList.map((esp) => (
                                            <option key={esp} value={esp}>
                                                {esp}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                                {showError("especialidadPrinc") && (
                                    <p className="text-xs text-red-600 font-semibold mt-2">{errors.especialidadPrinc}</p>
                                )}
                            </div>
                        </div>

                        {/* Descripción Perfil */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Descripción Perfil *
                            </label>
                            <textarea
                                value={descripcionPerfil}
                                onChange={(e) => setDescripcionPerfil(e.target.value)}
                                onBlur={() => markTouched("descripcionPerfil")}
                                placeholder="Describe tu enfoque y experiencia..."
                                className={
                                    "w-full bg-slate-50 border rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none min-h-[90px] " +
                                    (showError("descripcionPerfil") ? "border-red-300" : "border-slate-200")
                                }
                            />
                            {showError("descripcionPerfil") && (
                                <p className="text-xs text-red-600 font-semibold mt-2">{errors.descripcionPerfil}</p>
                            )}
                        </div>

                        {/* Frase Personal */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Frase Personal (opcional)
                            </label>
                            <input
                                value={frasePersonal}
                                onChange={(e) => setFrasePersonal(e.target.value)}
                                type="text"
                                placeholder="Una frase personal"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                            />
                        </div>

                        {/* Youtube */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Link Video Youtube (opcional)
                            </label>
                            <input
                                value={linkVideoYoutube}
                                onChange={(e) => setLinkVideoYoutube(e.target.value)}
                                type="text"
                                placeholder="https://youtube.com/..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none"
                            />
                        </div>

                        {/* Matrícula + Valor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Matrícula Profesional *
                                </label>
                                <input
                                    value={matriculaProfesional}
                                    onChange={(e) => setMatriculaProfesional(e.target.value)}
                                    onBlur={() => markTouched("matriculaProfesional")}
                                    type="text"
                                    placeholder="Ej: SCZ-PSI-12345"
                                    className={
                                        "w-full bg-slate-50 border rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none " +
                                        (showError("matriculaProfesional") ? "border-red-300" : "border-slate-200")
                                    }
                                />
                                {showError("matriculaProfesional") && (
                                    <p className="text-xs text-red-600 font-semibold mt-2">{errors.matriculaProfesional}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Valor Sesión Base *
                                </label>
                                <input
                                    value={valorSesionBase}
                                    onChange={(e) => setValorSesionBase(e.target.value)}
                                    onBlur={() => markTouched("valorSesionBase")}
                                    type="number"
                                    placeholder="Ej: 120"
                                    className={
                                        "w-full bg-slate-50 border rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none " +
                                        (showError("valorSesionBase") ? "border-red-300" : "border-slate-200")
                                    }
                                />
                                {showError("valorSesionBase") && (
                                    <p className="text-xs text-red-600 font-semibold mt-2">{errors.valorSesionBase}</p>
                                )}
                            </div>
                        </div>

                        {/* País/Ciudad selects */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    País *
                                </label>
                                <div className="relative">
                                    <select
                                        value={pais}
                                        onChange={(e) => setPais(e.target.value)}
                                        onBlur={() => markTouched("pais")}
                                        className={
                                            "w-full bg-slate-50 border rounded-xl py-3 px-4 pr-10 text-sm focus:bg-white focus:border-primary outline-none appearance-none cursor-pointer " +
                                            (showError("pais") ? "border-red-300" : "border-slate-200")
                                        }
                                    >
                                        <option value="">{paisOptions.length ? "Seleccionar país" : "Cargando países..."}</option>
                                        {paisOptions.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                                {showError("pais") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.pais}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Ciudad *
                                </label>
                                <div className="relative">
                                    <select
                                        value={ciudad}
                                        onChange={(e) => setCiudad(e.target.value)}
                                        onBlur={() => markTouched("ciudad")}
                                        disabled={isBlank(pais)}
                                        className={
                                            "w-full bg-slate-50 border rounded-xl py-3 px-4 pr-10 text-sm focus:bg-white focus:border-primary outline-none appearance-none cursor-pointer " +
                                            (showError("ciudad") ? "border-red-300" : "border-slate-200") +
                                            (isBlank(pais) ? " opacity-60 cursor-not-allowed" : "")
                                        }
                                    >
                                        <option value="">
                                            {isBlank(pais)
                                                ? "Selecciona un país primero"
                                                : ciudadOptions.length
                                                    ? "Seleccionar ciudad"
                                                    : "Sin ciudades disponibles"}
                                        </option>
                                        {ciudadOptions.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                                {showError("ciudad") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.ciudad}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================
            ADMIN
        ========================= */}
                {tipo === "Administrador" && (
                    <div className="pt-4 border-t border-dashed border-slate-200">
                        <div className="mb-4">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Asignar a Terapeuta (Opcional)
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">
                                    psychology
                                </span>
                                <select
                                    value={selectedTerapeuta}
                                    onChange={(e) => setSelectedTerapeuta(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-10 text-sm outline-none focus:bg-white focus:border-primary appearance-none cursor-pointer"
                                    disabled={terapeutasDisponibles.length === 0}
                                >
                                    <option value="">
                                        {terapeutasDisponibles.length === 0 ? "Cargando o no hay terapeutas..." : "Seleccionar Terapeuta..."}
                                    </option>
                                    {terapeutasDisponibles.map((t) => (
                                        <option
                                            key={t.id_usuario_terapeuta || t.usuario_id || t.id}
                                            value={t.id_usuario_terapeuta || t.usuario_id || t.id}
                                        >
                                            {t.terapeuta_nombre_completo || `${t.p_nombre ?? ""} ${t.p_apellido ?? ""}`}
                                        </option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">
                                    expand_more
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-slate-200 pt-4" />

                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
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

                {/* =========================
            PACIENTE (multi tags)
        ========================= */}
                {tipo === "Paciente" && (
                    <div className="space-y-6 border-t border-dashed border-slate-200 pt-6">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Datos del Paciente</p>

                        {/* País/Ciudad */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    País *
                                </label>
                                <div className="relative">
                                    <select
                                        value={pais}
                                        onChange={(e) => setPais(e.target.value)}
                                        onBlur={() => markTouched("pais")}
                                        className={
                                            "w-full bg-slate-50 border rounded-xl py-3 px-4 pr-10 text-sm focus:bg-white focus:border-primary outline-none appearance-none cursor-pointer " +
                                            (showError("pais") ? "border-red-300" : "border-slate-200")
                                        }
                                    >
                                        <option value="">{paisOptions.length ? "Seleccionar país" : "Cargando países..."}</option>
                                        {paisOptions.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                                {showError("pais") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.pais}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Ciudad *
                                </label>
                                <div className="relative">
                                    <select
                                        value={ciudad}
                                        onChange={(e) => setCiudad(e.target.value)}
                                        onBlur={() => markTouched("ciudad")}
                                        disabled={isBlank(pais)}
                                        className={
                                            "w-full bg-slate-50 border rounded-xl py-3 px-4 pr-10 text-sm focus:bg-white focus:border-primary outline-none appearance-none cursor-pointer " +
                                            (showError("ciudad") ? "border-red-300" : "border-slate-200") +
                                            (isBlank(pais) ? " opacity-60 cursor-not-allowed" : "")
                                        }
                                    >
                                        <option value="">
                                            {isBlank(pais)
                                                ? "Selecciona un país primero"
                                                : ciudadOptions.length
                                                    ? "Seleccionar ciudad"
                                                    : "Sin ciudades disponibles"}
                                        </option>
                                        {ciudadOptions.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                                {showError("ciudad") && <p className="text-xs text-red-600 font-semibold mt-2">{errors.ciudad}</p>}
                            </div>
                        </div>

                        {/* Multi tags */}
                        <MultiSelectTags
                            label="Ocupación"
                            optionalLabel="(opcional)"
                            options={ocupacionesList}
                            selected={ocupacionTags}
                            onChange={setOcupacionTags}
                            placeholder="Seleccionar ocupación(es)"
                        />

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Motivo de Consulta (opcional)
                            </label>
                            <textarea
                                value={motivoConsulta}
                                onChange={(e) => setMotivoConsulta(e.target.value)}
                                placeholder="Cuéntanos un poco sobre ti..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-primary outline-none min-h-[90px]"
                            />
                        </div>

                        <MultiSelectTags
                            label="Síntomas Principales"
                            optionalLabel="(opcional)"
                            options={sintomasList}
                            selected={sintomasTags}
                            onChange={setSintomasTags}
                            placeholder="Seleccionar síntoma(s)"
                        />

                        <MultiSelectTags
                            label="Objetivos"
                            optionalLabel="(opcional)"
                            options={objetivosList}
                            selected={objetivosTags}
                            onChange={setObjetivosTags}
                            placeholder="Seleccionar objetivo(s)"
                        />
                    </div>
                )}

                {/* actions */}
                <div className="flex flex-col gap-3 pt-2">
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!canSubmit}
                        className={
                            "w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all " +
                            (canSubmit
                                ? "bg-primary text-white shadow-primary/20 hover:bg-black"
                                : "bg-slate-200 text-slate-500 shadow-none cursor-not-allowed")
                        }
                    >
                        <span className="material-symbols-outlined text-sm">{submitting ? "hourglass_top" : "person_add"}</span>
                        {submitting ? "Procesando..." : "Dar de Alta"}
                    </button>

                    <button
                        type="button"
                        onClick={limpiar}
                        disabled={submitting}
                        className={
                            "w-full px-5 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 " +
                            (submitting ? "opacity-60 cursor-not-allowed" : "")
                        }
                    >
                        Limpiar
                    </button>
                </div>
            </div>
        </section>
    );
}
