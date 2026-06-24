import React, { useEffect, useMemo, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { USUARIOS_ENDPOINTS } from "../../../../config/USUARIOS_ENDPOINTS";

export default function PasswordRecoveryModal({
  open,
  onClose,
  initialEmail = "",
  lockEmail = false,
  secureMode = false,
}) {
  const [recoveryStep, setRecoveryStep] = useState("email");
  const [forgotEmail, setForgotEmail] = useState(initialEmail || "");
  const [recoveryPin, setRecoveryPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [error, setError] = useState("");
  const [resetError, setResetError] = useState("");
  const [loading, setLoading] = useState(false);

  const effectiveEmail = useMemo(() => (initialEmail ? initialEmail : forgotEmail), [initialEmail, forgotEmail]);

  useEffect(() => {
    if (!open) return;
    // sincroniza email cada vez que se abre
    setForgotEmail(initialEmail || "");
    setRecoveryStep(lockEmail ? "pin" : "email");
    setRecoveryPin("");
    setNewPassword("");
    setNewPassword2("");
    setError("");
    setResetError("");
    setLoading(false);
  }, [open, initialEmail, lockEmail]);

  // En modo seguro (Mi Perfil), solicitamos el PIN automáticamente al abrir.
  useEffect(() => {
    if (!open) return;
    if (!secureMode) return;
    if (!lockEmail) return;
    // ejecuta una sola vez por apertura
    // eslint-disable-next-line no-use-before-define
    handleRequestPin({ preventDefault: () => { } }, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, secureMode, lockEmail]);

  const close = () => {
    onClose?.();
  };

  async function handleRequestPin(e, opts = {}) {
    e?.preventDefault?.();
    setLoading(true);
    if (!opts?.silent) setError("");

    try {
      const resp = await createApiConn(
        USUARIOS_ENDPOINTS.REQUEST_PIN,
        { p_email: effectiveEmail },
        "POST"
      );

      const row = resp?.rows?.[0];
      if (row?.status === "ok" || row?.message === "Ya existe un PIN vigente. Usa ese PIN antes de solicitar otro.") {
        setRecoveryStep("pin");
        return;
      }

      // En modo seguro no queremos revelar demasiado detalle.
      if (opts?.silent) {
        setError("No se pudo enviar el PIN. Intenta más tarde.");
      } else {
        setError(row?.message || "Email no encontrado");
      }
    } catch (err) {
      console.error("[PasswordRecoveryModal] REQUEST_PIN error:", err);
      setError(opts?.silent ? "No se pudo enviar el PIN. Intenta más tarde." : "Ocurrió un error al solicitar el PIN");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const resp = await createApiConn(
        USUARIOS_ENDPOINTS.VERIFY_PIN,
        { p_email: effectiveEmail, p_tipo_pin: "recuperacion", p_pin_code: recoveryPin },
        "POST"
      );

      const row = resp?.rows?.[0];
      if (row?.status === "ok") {
        setRecoveryStep("password");
        return;
      }

      setError(row?.message || "PIN inválido o expirado");
    } catch (err) {
      console.error("[PasswordRecoveryModal] VERIFY_PIN error:", err);
      setError("Ocurrió un error al verificar el PIN");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    setResetError("");

    if (!newPassword.trim() || newPassword.length < 8) {
      setResetError("La contraseña debe tener al menos 8 caracteres");
      setLoading(false);
      return;
    }
    if (newPassword !== newPassword2) {
      setResetError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const resp = await createApiConn(
        USUARIOS_ENDPOINTS.RESET_PASSWORD,
        { p_email: effectiveEmail, p_password: newPassword },
        "POST"
      );

      const row = resp?.rows?.[0];
      if (row?.status === "ok") {
        close();
        return;
      }

      setResetError(row?.message || "No se pudo actualizar la contraseña");
    } catch (err) {
      console.error("[PasswordRecoveryModal] RESET_PASSWORD error:", err);
      setResetError("Ocurrió un error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cambiar Contraseña</h3>
            <button
              onClick={close}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {recoveryStep === "email" && (
            <>
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                Ingresa tu correo electrónico para recibir un PIN.
              </p>

              <form onSubmit={handleRequestPin} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                      Correo Electrónico
                    </label>
                    {error && (
                      <span className="text-red-500 text-xs font-semibold animate-pulse text-right">{error}</span>
                    )}
                  </div>

                  <input
                    type="email"
                    required
                    className={`w-full bg-slate-50 dark:bg-white/5 border ${error ? "border-red-500" : "border-slate-200 dark:border-white/10"
                      } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                    placeholder="ejemplo@correo.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? "Enviando..." : "Enviar PIN"}
                  </button>
                </div>
              </form>
            </>
          )}

          {recoveryStep === "pin" && (
            <>
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                {lockEmail
                  ? (secureMode
                    ? "Ingresa el PIN enviado a tu correo."
                    : <>Te enviaremos un PIN a <span className="font-semibold">{effectiveEmail}</span>.</>)
                  : "Ingresa el PIN enviado por correo."}
              </p>

              <form onSubmit={handleVerifyPin} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                      Código PIN
                    </label>
                    {error && (
                      <span className="text-red-500 text-xs font-semibold animate-pulse text-right">{error}</span>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    className={`w-full bg-slate-50 dark:bg-white/5 border ${error ? "border-red-500" : "border-slate-200 dark:border-white/10"
                      } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-widest text-center text-lg font-mono`}
                    placeholder="000000"
                    value={recoveryPin}
                    onChange={(e) => {
                      setRecoveryPin(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  {!secureMode && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        // permitir pedir otro PIN
                        setRecoveryStep(lockEmail ? "pin" : "email");
                        if (!lockEmail) return;
                        // si lockEmail, re-solicitar PIN para el correo de sesión
                        handleRequestPin({ preventDefault: () => { } });
                      }}
                      className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 font-semibold h-11 rounded-lg shadow-sm active:scale-95 transition-all duration-200"
                    >
                      Reenviar PIN
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`${secureMode ? "w-full" : "flex-1"} bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200`}
                  >
                    {loading ? "Verificando..." : "Verificar"}
                  </button>
                </div>
              </form>
            </>
          )}

          {recoveryStep === "password" && (
            <>
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                Ingresa tu nueva contraseña.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    className={`w-full bg-slate-50 dark:bg-white/5 border ${resetError ? "border-red-500" : "border-slate-200 dark:border-white/10"
                      } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (resetError) setResetError("");
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                      Repite la contraseña
                    </label>
                    {resetError && (
                      <span className="text-red-500 text-xs font-semibold animate-pulse text-right">{resetError}</span>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    className={`w-full bg-slate-50 dark:bg-white/5 border ${resetError ? "border-red-500" : "border-slate-200 dark:border-white/10"
                      } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                    value={newPassword2}
                    onChange={(e) => {
                      setNewPassword2(e.target.value);
                      if (resetError) setResetError("");
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setRecoveryStep("pin")}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 font-semibold h-11 rounded-lg shadow-sm active:scale-95 transition-all duration-200"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                  >
                    {loading ? "Actualizando..." : "Actualizar"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
