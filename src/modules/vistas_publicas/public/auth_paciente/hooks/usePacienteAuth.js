import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createApiConn } from "../../../../../helpers/api_conn_factory";
import { USUARIOS_ENDPOINTS } from "../../../../../config/USUARIOS_ENDPOINTS";
import { useSession } from "../../../../../app/auth/SessionContext";

function normalizeList(value) {
  const s = String(value || "").trim();
  if (!s) return [];
  return s
    .split(/[,\n]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function assertDbOk(res) {
  if (res?.ok === false) {
    throw new Error(res?.message || "Operación fallida");
  }
  const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
  if (r0?.status && String(r0.status).toLowerCase() !== "ok") {
    const err = new Error(r0?.message || "Operación fallida");
    err.data = res;
    throw err;
  }
  return res;
}

export function usePacienteAuth({ initialMode } = {}) {
  const navigate = useNavigate();
  const { login: sessionLogin } = useSession();

  const startMode = initialMode === "login" ? "login" : "register";
  const [mode, setMode] = useState(startMode); // "register" | "login" | "verify-pin" | "password-recovery"

  const [registerForm, setRegisterForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
    sexo: "",
    fecha_nacimiento: "",
    pais: "",
    ciudad: "",
    ocupacion: "",
    motivo_consulta: "",
    sintomas_principales: "",
    objetivos: "",
    modalidad: "online",
    horario: "",
  });

  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [pinForm, setPinForm] = useState({ email: "", pin: "" });
  const [recoveryForm, setRecoveryForm] = useState({ email: "", pin: "", newPassword: "", step: 1 });

  const [confirm, setConfirm] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const openConfirm = useCallback((payload) => setConfirm(payload), []);
  const closeConfirm = useCallback(() => setConfirm(null), []);
  const closeResult = useCallback(() => setResult(null), []);

  const setRegisterField = useCallback((k, v) => setRegisterForm((s) => ({ ...s, [k]: v })), []);
  const setLoginField = useCallback((k, v) => setLoginForm((s) => ({ ...s, [k]: v })), []);
  const setPinField = useCallback((k, v) => setPinForm((s) => ({ ...s, [k]: v })), []);
  const setRecoveryField = useCallback((k, v) => setRecoveryForm((s) => ({ ...s, [k]: v })), []);

  const goRegister = useCallback(() => setMode("register"), []);
  const goLogin = useCallback(() => setMode("login"), []);
  const goVerifyPin = useCallback((email) => {
    setPinForm({ email: email || "", pin: "" });
    setMode("verify-pin");
  }, []);
  const goPasswordRecovery = useCallback(() => {
    setRecoveryForm({ email: "", pin: "", newPassword: "", step: 1 });
    setMode("password-recovery");
  }, []);

  // ============== LOGIN ==============
  const submitLogin = useCallback(() => {
    const email = String(loginForm.email || "").trim();
    const password = String(loginForm.password || "");

    if (!email || !password) {
      setResult({
        kind: "error",
        title: "Datos incompletos",
        message: "Por favor ingresa tu correo y contraseña.",
      });
      return;
    }

    openConfirm({
      title: "Iniciar sesión",
      message: "¿Deseas continuar con el inicio de sesión?",
      confirmText: "Ingresar",
      onConfirm: async () => {
        closeConfirm();
        setLoading(true);
        try {
          const payload = {
            p_email: email,
            p_password: password,
          };

          const res = await createApiConn(
            USUARIOS_ENDPOINTS.LOGIN,
            payload,
            "POST"
          );

          const okRes = assertDbOk(res);
          const r0 = Array.isArray(okRes?.rows) ? okRes.rows[0] : null;

          if (r0?.status !== "ok" || !r0?.data) {
            throw new Error(r0?.message || "Error de autenticación");
          }

          const data = r0.data;

          // Build session object compatible with SessionContext
          const sessionPayload = {
            user_id: data.user_id,
            id_sesion: data.id_sesion,
            role: data.role,
            nombre: data.nombre,
            apellido: data.apellido,
            is_admin: data.is_admin || false,
            is_super_admin: data.is_super_admin || false,
            can_manage_files: data.can_manage_files || false,
            is_accounter: data.is_accounter || false,
            access_token: data.access_token,
            token_type: data.token_type || "Bearer",
            expires_at: Date.now() + (data.expires_in * 1000),
          };

          // Store session via SessionContext
          sessionLogin(sessionPayload, { remember: loginForm.remember });

          // Determine redirect based on role
          const userRole = (data.role || "").toUpperCase();
          let redirectPath = "/";

          if (userRole === "PACIENTE") {
            redirectPath = "/paciente/dashboard";
          } else if (userRole === "TERAPEUTA") {
            redirectPath = "/terapeuta/dashboard";
          } else if (userRole === "ADMIN" || data.is_admin || data.is_super_admin) {
            redirectPath = "/admin/dashboard";
          }

          setResult({
            kind: "success",
            title: "¡Bienvenido!",
            message: userRole === "TERAPEUTA"
              ? "Has iniciado sesión como terapeuta."
              : userRole === "ADMIN"
                ? "Has iniciado sesión como administrador."
                : "Has iniciado sesión correctamente.",
          });

          // Redirect to appropriate dashboard after a short delay
          setTimeout(() => {
            navigate(redirectPath);
          }, 1500);

        } catch (err) {
          setResult({
            kind: "error",
            title: "Error de autenticación",
            message: err?.message || "No se pudo iniciar sesión. Verifica tus credenciales.",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  }, [openConfirm, closeConfirm, loginForm, sessionLogin, navigate]);

  // ============== REGISTER ==============
  const submitRegister = useCallback(() => {
    openConfirm({
      title: "Crear cuenta",
      message: "Se creará tu cuenta y se enviará un PIN de verificación al correo. ¿Deseas continuar?",
      confirmText: "Registrarme",
      onConfirm: async () => {
        closeConfirm();
        setLoading(true);
        try {
          const payload = {
            p_email: String(registerForm.email || "").trim(),
            p_password: String(registerForm.password || ""),
            p_nombre: String(registerForm.nombre || "").trim(),
            p_apellido: String(registerForm.apellido || "").trim(),
            p_telefono: String(registerForm.telefono || "").trim(),
            p_sexo: String(registerForm.sexo || "").trim(),
            p_fecha_nacimiento: String(registerForm.fecha_nacimiento || "").trim(),
            p_pais: String(registerForm.pais || "").trim(),
            p_ciudad: String(registerForm.ciudad || "").trim(),
            p_ocupacion: String(registerForm.ocupacion || "").trim(),
            p_perfil_psicologico: {
              motivo_consulta: String(registerForm.motivo_consulta || "").trim(),
              sintomas_principales: normalizeList(registerForm.sintomas_principales),
              objetivos: normalizeList(registerForm.objetivos),
              preferencias: {
                modalidad: String(registerForm.modalidad || "").trim(),
                horario: String(registerForm.horario || "").trim(),
              },
            },
            p_pin_life_time: "00:10:00",
            p_pin_contexto: "signup_paciente",
            p_pin_metadata: {
              source: "web",
              device: "web",
              notes: "signup paciente",
            },
          };

          const res = await createApiConn(
            USUARIOS_ENDPOINTS.REGISTRAR_PACIENTE,
            payload,
            "POST"
          );

          const okRes = assertDbOk(res);
          const r0 = Array.isArray(okRes?.rows) ? okRes.rows[0] : null;

          setResult({
            kind: "success",
            title: "Registro exitoso",
            message: r0?.message || "Paciente registrado correctamente. Se ha enviado un PIN de verificación a tu correo.",
            data: r0?.data || null,
          });

          // Switch to PIN verification mode
          goVerifyPin(registerForm.email);

        } catch (err) {
          setResult({
            kind: "error",
            title: "No se pudo registrar",
            message: err?.message || "Error al registrar paciente",
            data: err?.data || null,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  }, [openConfirm, closeConfirm, registerForm, goVerifyPin]);

  // ============== VERIFY PIN ==============
  const submitVerifyPin = useCallback(async () => {
    const email = String(pinForm.email || "").trim();
    const pin = String(pinForm.pin || "").trim();

    if (!email || !pin) {
      setResult({
        kind: "error",
        title: "Datos incompletos",
        message: "Por favor ingresa el PIN de verificación.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        p_email: email,
        p_pin: pin,
      };

      const res = await createApiConn(
        USUARIOS_ENDPOINTS.VERIFY_PIN,
        payload,
        "POST"
      );

      assertDbOk(res);

      setResult({
        kind: "success",
        title: "¡Cuenta verificada!",
        message: "Tu cuenta ha sido verificada correctamente. Ahora puedes iniciar sesión.",
      });

      // Switch to login mode
      setTimeout(() => {
        setLoginForm((prev) => ({ ...prev, email: email }));
        setMode("login");
      }, 1500);

    } catch (err) {
      setResult({
        kind: "error",
        title: "PIN inválido",
        message: err?.message || "El PIN ingresado no es válido o ha expirado.",
      });
    } finally {
      setLoading(false);
    }
  }, [pinForm]);

  // ============== REQUEST NEW PIN ==============
  const requestNewPin = useCallback(async () => {
    const email = String(pinForm.email || "").trim();

    if (!email) {
      setResult({
        kind: "error",
        title: "Email requerido",
        message: "No se puede reenviar el PIN sin un correo electrónico.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        p_email: email,
      };

      const res = await createApiConn(
        USUARIOS_ENDPOINTS.REQUEST_NEW_PIN_AUTH,
        payload,
        "POST"
      );

      assertDbOk(res);

      setResult({
        kind: "success",
        title: "PIN reenviado",
        message: "Se ha enviado un nuevo PIN de verificación a tu correo.",
      });

    } catch (err) {
      setResult({
        kind: "error",
        title: "Error",
        message: err?.message || "No se pudo reenviar el PIN.",
      });
    } finally {
      setLoading(false);
    }
  }, [pinForm.email]);

  // ============== PASSWORD RECOVERY - REQUEST PIN ==============
  const requestPasswordRecovery = useCallback(async () => {
    const email = String(recoveryForm.email || "").trim();

    if (!email) {
      setResult({
        kind: "error",
        title: "Email requerido",
        message: "Por favor ingresa tu correo electrónico.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        p_email: email,
      };

      const res = await createApiConn(
        USUARIOS_ENDPOINTS.REQUEST_PIN,
        payload,
        "POST"
      );

      assertDbOk(res);

      setResult({
        kind: "success",
        title: "PIN enviado",
        message: "Se ha enviado un PIN de recuperación a tu correo.",
      });

      // Move to step 2
      setRecoveryForm((prev) => ({ ...prev, step: 2 }));

    } catch (err) {
      setResult({
        kind: "error",
        title: "Error",
        message: err?.message || "No se pudo enviar el PIN de recuperación.",
      });
    } finally {
      setLoading(false);
    }
  }, [recoveryForm.email]);

  // ============== PASSWORD RECOVERY - RESET PASSWORD ==============
  const resetPassword = useCallback(async () => {
    const email = String(recoveryForm.email || "").trim();
    const newPassword = String(recoveryForm.newPassword || "");

    if (!email || !newPassword) {
      setResult({
        kind: "error",
        title: "Datos incompletos",
        message: "Por favor ingresa tu nueva contraseña.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setResult({
        kind: "error",
        title: "Contraseña débil",
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        p_email: email,
        p_password: newPassword,
      };

      const res = await createApiConn(
        USUARIOS_ENDPOINTS.RESET_PASSWORD,
        payload,
        "POST"
      );

      assertDbOk(res);

      setResult({
        kind: "success",
        title: "¡Contraseña actualizada!",
        message: "Tu contraseña ha sido cambiada correctamente. Ahora puedes iniciar sesión.",
      });

      // Switch to login mode
      setTimeout(() => {
        setLoginForm((prev) => ({ ...prev, email: email }));
        setMode("login");
      }, 1500);

    } catch (err) {
      setResult({
        kind: "error",
        title: "Error",
        message: err?.message || "No se pudo actualizar la contraseña.",
      });
    } finally {
      setLoading(false);
    }
  }, [recoveryForm]);

  const bgUrl = useMemo(
    () =>
      "https://storage.googleapis.com/vistas_publicas_assets/global_assets/media/landing_hero_migrante_1.jpeg",
    []
  );

  return {
    mode,
    goRegister,
    goLogin,
    goVerifyPin,
    goPasswordRecovery,

    registerForm,
    setRegisterField,
    submitRegister,

    loginForm,
    setLoginField,
    submitLogin,

    pinForm,
    setPinField,
    submitVerifyPin,
    requestNewPin,

    recoveryForm,
    setRecoveryField,
    requestPasswordRecovery,
    resetPassword,

    confirm,
    result,
    loading,
    closeConfirm,
    closeResult,

    bgUrl,
  };
}
