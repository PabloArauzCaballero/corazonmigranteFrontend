import { useMemo, useState } from "react";
import { createApiConn } from "../helpers/api_conn_factory";
import { USUARIOS_ENDPOINTS } from "../config/USUARIOS_ENDPOINTS";

export default function AdminLogin({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [errorMessage, setErrorMessage] = useState(""); // Kept for general errors if needed, or we can remove
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Forgot Password State
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [recoveryStep, setRecoveryStep] = useState("email");
    const [newPassword, setNewPassword] = useState("");
    const [newPassword2, setNewPassword2] = useState("");
    const [resetError, setResetError] = useState("");
    const [recoveryPin, setRecoveryPin] = useState("");
    const [forgotError, setForgotError] = useState("");

    // Loading States
    const [isLoading, setIsLoading] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);

    const bgUrl = useMemo(
        () =>
            "https://storage.googleapis.com/vistas_publicas_assets/admin_portal/media/Banner%20portal%20administrativo",
        []
    );

    const [isSuccess, setIsSuccess] = useState(false);


    async function handleSubmit(e) {
        e.preventDefault();
        setEmailError("");
        setPasswordError("");
        setErrorMessage("");

        // 1. Client-side Validation
        let hasError = false;
        if (!email.trim()) {
            setEmailError("Debes llenar los campos");
            hasError = true;
        }
        if (!password.trim()) {
            setPasswordError("Debes llenar los campos");
            hasError = true;
        }
        if (hasError) return;

        setIsLoading(true); // Start loading

        try {
            const response = await createApiConn("/api/usuarios/login", { p_email: email, p_password: password }, "POST");


            if (response.rows && response.rows.length > 0) {
                const result = response.rows[0];
                if (result.status === "error") {
                    // 2. Backward Error Mapping
                    if (result.type_error === "INVALID_PASSWORD" || result.message === "Contraseña incorrecta") {
                        setPasswordError(result.message);
                    } else if (result.message.includes("Usuario no encontrado o inactivo") || result.message.includes("inactivo")) {
                        setEmailError(result.message);
                    } else {
                        // Fallback for other errors
                        setErrorMessage(result.message);
                    }
                } else if (result.status === "ok") {

                    const allowed =
                        result.data.is_terapeuta === true ||
                        result.data.is_admin === true ||
                        result.data.is_super_admin === true ||
                        result.data.is_accounter === true;

                    if (!allowed) {
                        setEmailError("Acceso denegado");
                        return;
                    }
                    setIsSuccess(true);

                    // 1) Extrae la sesión de tu respuesta
                    const data = result.data || {};
                    const sessionPayload = {
                        id_sesion: data.id_sesion ?? data.session_id ?? data.sesion_id,
                        user_id: data.user_id ?? data.id_usuario ?? data.id,
                        email: email.trim(),
                        nombre: data.nombre,
                        rol: data.role,
                        is_admin: data.is_admin,
                        is_super_admin: data.is_super_admin,
                        is_terapeuta: data.is_terapeuta,
                        is_accounter: data.is_accounter,
                        access_token: data.access_token,
                        token_type: data.token_type,
                        expires_in: data.expires_in,
                        id_terapeuta: parseInt(data.id_terapeuta),
                    };

                    const storage = remember ? localStorage : sessionStorage;
                    storage.setItem("cm_admin_session", JSON.stringify(sessionPayload));

                    setTimeout(() => {
                        onLoginSuccess?.(sessionPayload);
                    }, 800);
                }
            }

        } catch (error) {
            console.error("Error en login:", error);
            setErrorMessage("Ocurrió un error inesperado al intentar iniciar sesión");
        } finally {
            setIsLoading(false); // Stop loading
        }
    }


    async function handleForgotSubmit(e) {
        e.preventDefault();
        setForgotLoading(true);
        setForgotError("");

        try {
            const resp = await createApiConn(
                USUARIOS_ENDPOINTS.REQUEST_PIN,
                { p_email: forgotEmail },
                "POST"
            );

            const row = resp?.rows?.[0];

            if (row?.status === "ok" || row?.message === "Ya existe un PIN vigente. Usa ese PIN antes de solicitar otro.") {
                setRecoveryStep("pin");
                return;
            }

            setForgotError(row?.message || "Email no encontrado");
        } catch (error) {
            console.error("Error recuperando:", error);
            setForgotError("Ocurrió un error al solicitar el PIN");
        } finally {
            setForgotLoading(false);
        }
    }

    async function handleVerifyPin(e) {
        e.preventDefault();
        setForgotLoading(true);
        setForgotError("");

        try {
            const resp = await createApiConn(
                USUARIOS_ENDPOINTS.VERIFY_PIN,
                { p_email: forgotEmail, p_tipo_pin: "recuperacion", p_pin_code: recoveryPin },
                "POST"
            );

            const row = resp?.rows?.[0];

            if (row?.status === "ok") {
                setRecoveryStep("password");
                return;
            }

            setForgotError(row?.message || "PIN inválido o expirado");
        } catch (error) {
            console.error("Error verificando PIN:", error);
            setForgotError("Ocurrió un error al verificar el PIN");
        } finally {
            setForgotLoading(false);
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        setForgotLoading(true);
        setResetError("");

        if (!newPassword.trim() || newPassword.length < 8) {
            setResetError("La contraseña debe tener al menos 8 caracteres");
            setForgotLoading(false);
            return;
        }
        if (newPassword !== newPassword2) {
            setResetError("Las contraseñas no coinciden");
            setForgotLoading(false);
            return;
        }

        try {
            const resp = await createApiConn(
                USUARIOS_ENDPOINTS.RESET_PASSWORD,
                { p_email: forgotEmail, p_password: newPassword },
                "POST"
            );

            const row = resp?.rows?.[0];

            if (row?.status === "ok") {

                closeForgotModal();
                return;
            }

            setResetError(row?.message || "No se pudo actualizar la contraseña");
        } catch (error) {
            console.error("Error reseteando password:", error);
            setResetError("Ocurrió un error al actualizar la contraseña");
        } finally {
            setForgotLoading(false);
        }
    }

    const closeForgotModal = () => {
        setIsForgotModalOpen(false);
        setRecoveryStep("email"); // Reset to first step
        setForgotEmail("");
        setRecoveryPin("");
        setForgotError("");
    };

    return (
        <div className="min-h-screen flex w-full font-display antialiased text-slate-800 bg-background-light dark:bg-background-dark">
            {/* Left Panel */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-primary/5">
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center grayscale-[30%] sepia-[10%]"
                    data-alt="Close up of diverse hands holding together in a circle representing community support and solidarity"
                    style={{ backgroundImage: `url('${bgUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2a1215]/90 via-[#742f38]/40 to-transparent" />

                <div className="relative z-10 flex flex-col justify-end p-16 w-full h-full text-white">
                    <div className="max-w-lg">
                        <span className="material-symbols-outlined text-4xl mb-6 opacity-90">
                            psychology
                        </span>
                        <blockquote className="text-3xl font-medium leading-tight mb-4 tracking-tight">
                            "Migrar es un acto de vida, un acto de vida que requiere de la solidaridad"
                        </blockquote>
                        <p className="text-white/70 font-light text-sm uppercase tracking-widest">
                            Corazón de Migrante
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-cream-panel dark:bg-background-dark transition-colors duration-300 relative">
                <div className="absolute top-8 right-8 flex gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <a className="hover:text-primary transition-colors" href="#">
                        Ayuda
                    </a>
                </div>

                <div className="w-full max-w-[420px] flex flex-col gap-8">
                    {/* Branding */}
                    <div className="flex flex-col items-start gap-6">
                        <div className="flex items-center gap-3 text-primary dark:text-white" style={{ display: "flex", alignItems: "center", justifyContent: "start", width: "100%" }}>
                            <img
                                src="https://storage.googleapis.com/vistas_publicas_assets/global_assets/media/LOGO%20CORAZON%20MIGRANTE.png"
                                alt="Logo Corazón Migrante"
                                className="w-10 h-10 object-contain"
                                style={{ borderRadius: "50%" }}
                            />
                            <span className="text-xl font-bold tracking-tight text-primary dark:text-white">
                                Corazón de Migrante
                            </span>
                        </div>

                        <div className="space-y-2 mt-4" style={{ display: "flex", flexDirection: "column", alignItems: "start", justifyContent: "center", width: "100%" }}>
                            <h1 className="text-3xl font-bold text-[#181112] dark:text-white tracking-tight">
                                Portal Administrativo
                            </h1>
                            <p className="text-[#865f64] dark:text-gray-400 text-base font-normal" style={{ textAlign: "start" }}>
                                Bienvenido de nuevo. Ingresa tus credenciales para acceder al panel.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    {/* Form */}
                    <div className="relative">
                        {isSuccess && (
                            <div className="absolute inset-0 z-10 bg-white/90 dark:bg-[#1e1e1e]/90 flex flex-col items-center justify-center rounded-lg animate-in fade-in duration-300">
                                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4 animate-in zoom-in-50 duration-500 ease-out-back">
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-6xl shadow-sm">
                                        check_circle
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 animate-in slide-in-from-bottom-2 duration-700 delay-100">
                                    ¡Bienvenido!
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                                    Redireccionando...
                                </p>
                            </div>
                        )}
                        <form className={`flex flex-col gap-5 mt-2 transition-opacity duration-300 ${isSuccess ? 'opacity-0 invisible' : 'opacity-100'}`} onSubmit={handleSubmit}>
                            {errorMessage && (
                                <div className="p-3 bg-red-100 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                                    {errorMessage}
                                </div>
                            )}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label
                                        className="text-[#181112] dark:text-gray-200 text-sm font-semibold block"
                                        htmlFor="email"
                                        style={{ display: "flex", alignItems: "start", justifyContent: "start", width: "100%" }}
                                    >
                                        Correo Electrónico
                                    </label>
                                    {emailError && (
                                        <span className="text-red-500 w-64 text-xs font-semibold animate-pulse text-right" style={{ display: "flex", alignItems: "center", justifyContent: "end", width: "100%" }} >
                                            {emailError}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        id="email"
                                        className={`w-full bg-white dark:bg-white/5 border ${emailError ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-lg h-12 px-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm`}
                                        placeholder="nombre@fundacion.org"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label
                                        className="text-[#181112] dark:text-gray-200 text-sm font-semibold block"
                                        htmlFor="password"
                                        style={{ display: "flex", alignItems: "start", justifyContent: "start", width: "100%" }}
                                    >
                                        Contraseña
                                    </label>
                                    {passwordError && (
                                        <span className="text-red-500 w-64 text-xs font-semibold animate-pulse text-right">
                                            {passwordError}
                                        </span>
                                    )}
                                </div>

                                <div className="relative">
                                    <input
                                        id="password"
                                        className={`w-full bg-white dark:bg-white/5 border ${passwordError ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-lg h-12 px-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm`}
                                        placeholder="••••••••"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? "visibility" : "visibility_off"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:bg-primary checked:border-primary transition-all"
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                        />
                                        <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    clipRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                />
                                            </svg>
                                        </span>
                                    </div>

                                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                                        Recordarme
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => setIsForgotModalOpen(true)}
                                    className="text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <button
                                className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-12 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 mt-4 group"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <span>Entrar al Portal</span>
                                        <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
                                            arrow_forward
                                        </span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center border-t border-slate-200 dark:border-white/10 pt-6">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                © 2025 Corazón de Migrante. Todos los derechos reservados.
                                <br />
                                <span className="mt-1 block">Acceso restringido únicamente a personal autorizado.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div >

            {/* Forgot Password Modal */}
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recuperar Contraseña</h3>
                                <button
                                    onClick={closeForgotModal}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {recoveryStep === "email" && (
                                <>
                                    <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                                        Ingresa tu correo electronico de usuario:
                                    </p>

                                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                                                    Correo Electrónico
                                                </label>
                                                {forgotError && (
                                                    <span className="text-red-500 text-xs font-semibold animate-pulse text-right">
                                                        {forgotError}
                                                    </span>
                                                )}
                                            </div>

                                            <input
                                                type="email"
                                                required
                                                className={`w-full bg-slate-50 dark:bg-white/5 border ${forgotError ? "border-red-500" : "border-slate-200 dark:border-white/10"} rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                                                placeholder="ejemplo@correo.com"
                                                value={forgotEmail}
                                                onChange={(e) => {
                                                    setForgotEmail(e.target.value);
                                                    if (forgotError) setForgotError("");
                                                }}
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={forgotLoading}
                                                className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                                            >
                                                {forgotLoading ? "Enviando..." : "Enviar correo"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {recoveryStep === "pin" && (
                                <>
                                    <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                                        Ingresa el PIN enviado por correo:
                                    </p>

                                    <form onSubmit={handleVerifyPin} className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                                                    Código PIN
                                                </label>
                                                {forgotError && (
                                                    <span className="text-red-500 text-xs font-semibold animate-pulse text-right">
                                                        {forgotError}
                                                    </span>
                                                )}
                                            </div>

                                            <input
                                                type="text"
                                                required
                                                className={`w-full bg-slate-50 dark:bg-white/5 border ${forgotError ? "border-red-500" : "border-slate-200 dark:border-white/10"} rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-widest text-center text-lg font-mono`}
                                                placeholder="000000"
                                                value={recoveryPin}
                                                onChange={(e) => {
                                                    setRecoveryPin(e.target.value);
                                                    if (forgotError) setForgotError("");
                                                }}
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={forgotLoading}
                                                className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                                            >
                                                {forgotLoading ? "Verificando..." : "Verificar"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {recoveryStep === "password" && (
                                <>
                                    <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                                        Ingresa tu nueva contraseña:
                                    </p>

                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                                                    Nueva contraseña
                                                </label>
                                                {resetError && (
                                                    <span className="text-red-500 text-xs font-semibold animate-pulse text-right">
                                                        {resetError}
                                                    </span>
                                                )}
                                            </div>

                                            <input
                                                type="password"
                                                required
                                                className={`w-full bg-slate-50 dark:bg-white/5 border ${resetError ? "border-red-500" : "border-slate-200 dark:border-white/10"} rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => {
                                                    setNewPassword(e.target.value);
                                                    if (resetError) setResetError("");
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                                                Repetir contraseña
                                            </label>

                                            <input
                                                type="password"
                                                required
                                                className={`w-full bg-slate-50 dark:bg-white/5 border ${resetError ? "border-red-500" : "border-slate-200 dark:border-white/10"} rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                                                placeholder="••••••••"
                                                value={newPassword2}
                                                onChange={(e) => {
                                                    setNewPassword2(e.target.value);
                                                    if (resetError) setResetError("");
                                                }}
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={forgotLoading}
                                                className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                                            >
                                                {forgotLoading ? "Actualizando..." : "Actualizar contraseña"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
