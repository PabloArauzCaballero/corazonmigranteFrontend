import { useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { USUARIOS_ENDPOINTS } from "../../../../config/USUARIOS_ENDPOINTS";
import { computeAdminAccess } from "../../../../app/auth/adminAccess";
import { ROUTES_FILE_SERVER } from "../../../../config/ROUTES_FILE_SERVER";

export function useAdminLogin({ onLoginSuccess } = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Forgot password
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [recoveryStep, setRecoveryStep] = useState("email");
  const [recoveryPin, setRecoveryPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [resetError, setResetError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);

  // Verify PIN (registro)
  const [isVerifyPinModalOpen, setIsVerifyPinModalOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPinCode, setVerifyPinCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyOkMessage, setVerifyOkMessage] = useState("");

  // Request new auth pin (registro)
  const [requestNewPinLoading, setRequestNewPinLoading] = useState(false);
  const [requestNewPinOkMessage, setRequestNewPinOkMessage] = useState("");
  const [requestNewPinError, setRequestNewPinError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setErrorMessage("");

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

    setIsLoading(true);

    try {
      const response = await createApiConn(
        "/api/usuarios/login",
        { p_email: email, p_password: password },
        "POST"
      );

      const result = response?.rows?.[0];
      if (!result) {
        setErrorMessage("Respuesta inválida del servidor");
        return;
      }

      if (result.status === "error") {
        if (
          result.type_error === "INVALID_PASSWORD" ||
          result.message === "Contraseña incorrecta"
        ) {
          setPasswordError(result.message);
        } else if (
          String(result.message || "").includes("Usuario no encontrado") ||
          String(result.message || "").includes("inactivo")
        ) {
          setEmailError(result.message);
        } else {
          setErrorMessage(result.message);
        }
        return;
      }

      if (result.status === "ok") {
        const data = result.data || {};
        const allowed =
          data.is_terapeuta === true ||
          data.is_admin === true ||
          data.is_super_admin === true ||
          data.is_accounter === true;

        if (!allowed) {
          setEmailError("Acceso denegado");
          return;
        }

        setIsSuccess(true);

        const issued_at = Date.now();
        const expires_in_sec = Number(data.expires_in);
        const expires_at = Number.isFinite(expires_in_sec)
          ? issued_at + Math.max(0, expires_in_sec) * 1000
          : NaN;

        const sessionPayload = {
          id_sesion: data.id_sesion ?? data.session_id ?? data.sesion_id,
          user_id: data.user_id ?? data.id_usuario ?? data.id,
          email: email.trim(),
          nombre: data.nombre,
          is_admin: data.is_admin,
          is_super_admin: data.is_super_admin,
          is_terapeuta: data.is_terapeuta,
          is_accounter: data.is_accounter,
          can_manage_files: data.can_manage_files,
          access_token: data.access_token,
          token_type: data.token_type,
          expires_in: data.expires_in,
          issued_at,
          expires_at,
          remember,
          id_terapeuta: parseInt(data.id_terapeuta),
        };

        // computed UI access for ADMIN portal
        sessionPayload.admin_access = computeAdminAccess(sessionPayload);

        setTimeout(() => {
          onLoginSuccess?.(sessionPayload);
        }, 800);
      }
    } catch (err) {
      console.error("Error en login:", err);
      setErrorMessage("Ocurrió un error inesperado al intentar iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  }

  const openForgotModal = () => {
    setIsForgotModalOpen(true);
    setRecoveryStep("email");
    setForgotEmail(email || "");
    setRecoveryPin("");
    setNewPassword("");
    setNewPassword2("");
    setForgotError("");
    setResetError("");
  };

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    setRecoveryStep("email");
    setForgotEmail("");
    setRecoveryPin("");
    setNewPassword("");
    setNewPassword2("");
    setForgotError("");
    setResetError("");
  };

  const openVerifyPinModal = () => {
    setIsVerifyPinModalOpen(true);
    setVerifyEmail(email || "");
    setVerifyPinCode("");
    setVerifyError("");
    setVerifyOkMessage("");
    setRequestNewPinOkMessage("");
    setRequestNewPinError("");
  };

  const closeVerifyPinModal = () => {
    setIsVerifyPinModalOpen(false);
    setVerifyEmail("");
    setVerifyPinCode("");
    setVerifyError("");
    setVerifyOkMessage("");
    setRequestNewPinOkMessage("");
    setRequestNewPinError("");
  };

  async function verifyRegistroPin() {
    setVerifyLoading(true);
    setVerifyError("");
    setVerifyOkMessage("");

    try {
      const resp = await createApiConn(
        USUARIOS_ENDPOINTS.VERIFY_PIN,
        {
          p_email: verifyEmail,
          p_tipo_pin: "registro",
          p_pin_code: verifyPinCode,
        },
        "POST"
      );

      const row = resp?.rows?.[0];
      if (row?.status === "ok") {
        setVerifyOkMessage(row?.message || "PIN verificado correctamente");
        return;
      }

      setVerifyError(row?.message || "PIN inválido o expirado");
    } catch (err) {
      console.error("Error verificando PIN (registro):", err);
      setVerifyError("Ocurrió un error al verificar el PIN");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function requestNewAuthPin() {
    setRequestNewPinLoading(true);
    setRequestNewPinOkMessage("");
    setRequestNewPinError("");
    setVerifyError("");

    try {
      const resp = await createApiConn(
        USUARIOS_ENDPOINTS.REQUEST_NEW_PIN_AUTH,
        { p_email: verifyEmail },
        "POST"
      );

      const row = resp?.rows?.[0];
      if (row?.status === "ok") {
        setRequestNewPinOkMessage(row?.message || "Nuevo PIN generado correctamente.");
        return;
      }

      setRequestNewPinError(row?.message || "No se pudo generar un nuevo PIN");
    } catch (err) {
      console.error("Error solicitando nuevo PIN:", err);
      setRequestNewPinError("Ocurrió un error al solicitar un nuevo PIN");
    } finally {
      setRequestNewPinLoading(false);
    }
  }

  async function requestPin() {
    setForgotLoading(true);
    setForgotError("");

    try {
      const resp = await createApiConn(
        USUARIOS_ENDPOINTS.REQUEST_PIN,
        { p_email: forgotEmail },
        "POST"
      );

      const row = resp?.rows?.[0];
      if (
        row?.status === "ok" ||
        row?.message === "Ya existe un PIN vigente. Usa ese PIN antes de solicitar otro."
      ) {
        setRecoveryStep("pin");
        return;
      }

      setForgotError(row?.message || "Email no encontrado");
    } catch (err) {
      console.error("Error recuperando:", err);
      setForgotError("Ocurrió un error al solicitar el PIN");
    } finally {
      setForgotLoading(false);
    }
  }

  async function verifyPin() {
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
    } catch (err) {
      console.error("Error verificando PIN:", err);
      setForgotError("Ocurrió un error al verificar el PIN");
    } finally {
      setForgotLoading(false);
    }
  }

  async function resetPassword() {
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
    } catch (err) {
      console.error("Error reseteando password:", err);
      setResetError("Ocurrió un error al actualizar la contraseña");
    } finally {
      setForgotLoading(false);
    }
  }

  return {
    // login
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    showPassword,
    setShowPassword,
    errorMessage,
    emailError,
    passwordError,
    isLoading,
    isSuccess,
    bgUrl: ROUTES_FILE_SERVER.URL_AUTH,
    handleSubmit,

    // forgot modal
    isForgotModalOpen,
    openForgotModal,
    closeForgotModal,
    forgotEmail,
    setForgotEmail,
    recoveryStep,
    setRecoveryStep,
    recoveryPin,
    setRecoveryPin,
    newPassword,
    setNewPassword,
    newPassword2,
    setNewPassword2,
    forgotError,
    resetError,
    forgotLoading,
    requestPin,
    verifyPin,
    resetPassword,

    // verify pin (registro)
    isVerifyPinModalOpen,
    openVerifyPinModal,
    closeVerifyPinModal,
    verifyEmail,
    setVerifyEmail,
    verifyPinCode,
    setVerifyPinCode,
    verifyLoading,
    verifyError,
    verifyOkMessage,
    requestNewPinLoading,
    requestNewPinOkMessage,
    requestNewPinError,
    requestNewAuthPin,
    verifyRegistroPin,
  };
}
