import { useEffect, useMemo, useRef, useState } from "react";
import { USUARIOS_ENDPOINTS } from "../../../../config/USUARIOS_ENDPOINTS";
import { createApiConn } from "../../../../helpers/api_conn_factory";

function resolveUserType(session) {
  if (!session) return { type: null, reason: "NO_SESSION" };

  const isTerapeuta = Boolean(session?.is_terapeuta);
  const isAdminLike = Boolean(session?.is_admin || session?.is_super_admin || session?.is_accounter);

  if (isTerapeuta) return { type: "terapeuta", reason: null };
  if (isAdminLike) return { type: "admin", reason: null };

  return { type: null, reason: "NO_ROLE" };
}

function safeStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function buildRolLabel(session) {
  if (session?.is_super_admin) return "Super Admin";
  if (session?.is_accounter) return "Contabilidad";
  if (session?.is_admin) return "Administrador";
  if (session?.is_terapeuta) return "Terapeuta";
  return "Usuario";
}

function pickEstadoCuenta(usuario) {
  // En tu API el estado viene como estado_cuenta y/o register_status
  return safeStr(
    usuario?.estado_cuenta || usuario?.estado || usuario?.register_status || "Activo"
  ) || "Activo";
}

function formatMonthYear(iso) {
  const raw = safeStr(iso);
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function extractApiPayloadFromResponse(res) {
  const row = res?.rows?.[0];
  if (!row || typeof row !== "object") return null;

  // La respuesta viene como { api_usuario_admin_obtener: { data: {...} } }
  // o { api_usuario_terapeuta_obtener: { data: {...} } }
  const key = Object.keys(row).find((k) => k.startsWith("api_usuario_") && k.endsWith("_obtener"));
  if (!key) return null;
  return row?.[key] || null;
}

function parseUbicacionToPaisCiudad(ubicacion) {
  const raw = safeStr(ubicacion).trim();
  if (!raw) return { pais: "", ciudad: "" };
  // "Pais, Ciudad" (preferido)
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { pais: parts[0], ciudad: parts.slice(1).join(", ") };
  }
  // si no hay coma, tratamos todo como ciudad
  return { pais: "", ciudad: raw };
}

function buildUpdatePayload(session, userType, profile) {
  if (!session || !userType) return null;

  const { pais, ciudad } = parseUbicacionToPaisCiudad(profile?.ubicacion);

  return {
    p_actor_user_id: session.user_id,
    p_id_sesion: session.id_sesion,
    p_user_id: session.user_id,

    // comunes
    p_nombre: safeStr(profile?.nombre),
    p_apellido: safeStr(profile?.apellido),
    p_email: safeStr(profile?.email),
    p_telefono: safeStr(profile?.telefono),
    p_sexo: safeStr(profile?.sexo),
    p_fecha_nacimiento: safeStr(profile?.fecha_nacimiento),

    // terapeuta (si aplica)
    ...(userType === "terapeuta" ? { p_pais: pais, p_ciudad: ciudad } : {}),

    // admin (si aplica)
    ...(userType === "admin"
      ? {
        p_is_super_admin: !!profile?.is_super_admin,
        p_can_manage_files: !!profile?.can_manage_files,
        p_is_accounter: !!profile?.is_accounter,
        p_id_usuario_terapeuta: profile?.id_usuario_terapeuta || null,
      }
      : {}),

    // prefs
    p_idioma: safeStr(profile?.idioma),
    p_timezone: safeStr(profile?.timezone),
  };
}

export function useMiPerfil(session) {
  const { type: userType, reason } = useMemo(() => resolveUserType(session), [session]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // Avatar se previsualiza al instante, pero se SUBE recién al guardar.
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingAvatarObjectUrl, setPendingAvatarObjectUrl] = useState("");
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [error, setError] = useState(null);
  const [terapeutasDisponibles, setTerapeutasDisponibles] = useState([]);

  const initialRef = useRef(null);
  const [profile, setProfile] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    sexo: "",
    fecha_nacimiento: "",
    ubicacion: "",
    idioma: "es-ES",
    timezone: "America/La_Paz",
    rolLabel: buildRolLabel(session),
    status: "Activo",
    idEmpleado: session?.user_id ? `#${session.user_id}` : "—",
    desdeLabel: "—",
    avatarUrl: "",

    // admin extras (planos)
    id_usuario_terapeuta: "",
    is_super_admin: false,
    can_manage_files: false,
    is_accounter: false,

    lastUpdatedLabel: "",
    _userType: userType,
  });

  const setField = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const isDirty = useMemo(() => {
    if (!initialRef.current) return false;
    const a = initialRef.current;
    const b = profile;
    const keys = [
      "nombre",
      "apellido",
      "email",
      "telefono",
      "sexo",
      "fecha_nacimiento",
      "ubicacion",
      "idioma",
      "timezone",
      // admin
      "id_usuario_terapeuta",
      "is_super_admin",
      "can_manage_files",
      "is_accounter",
    ];
    const baseDirty = keys.some((k) => safeStr(a?.[k]) !== safeStr(b?.[k]));
    return baseDirty || avatarDirty;
  }, [profile, avatarDirty]);

  const fetchPerfil = async () => {
    if (!session || !userType) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = userType === "terapeuta"
        ? USUARIOS_ENDPOINTS.OBTENER_TERAPEUTA
        : USUARIOS_ENDPOINTS.OBTENER_ADMIN;

      const payload = {
        p_actor_user_id: session.user_id,
        p_id_sesion: session.id_sesion,
        p_user_id: session.user_id,
      };

      // Nota: en tu front existente, este endpoint se usa con PATCH (ver EditUserModal)
      const res = await createApiConn(endpoint, payload, "PATCH", session);

      const apiPayload = extractApiPayloadFromResponse(res);
      if (!apiPayload?.data) {
        throw new Error("Respuesta inesperada: no se encontró api_usuario_*_obtener.data");
      }

      const apiData = apiPayload.data;
      const userData = apiData?.usuario || {};
      const specificData = userType === "terapeuta" ? (apiData?.terapeuta || {}) : (apiData?.admin || {});

      const pais = safeStr(specificData?.pais);
      const ciudad = safeStr(specificData?.ciudad);
      const ubicacion = userType === "terapeuta"
        ? [pais, ciudad].filter(Boolean).join(", ")
        : "";

      const next = {
        nombre: safeStr(userData?.nombre || session?.nombre),
        apellido: safeStr(userData?.apellido),
        email: safeStr(userData?.email || session?.email),
        telefono: safeStr(userData?.telefono),
        sexo: safeStr(userData?.sexo || userData?.genero || ""),
        fecha_nacimiento: safeStr(userData?.fecha_nacimiento || userData?.fechaNacimiento || ""),
        rolLabel: buildRolLabel(session),
        status: pickEstadoCuenta(userData),
        idEmpleado: userData?.user_id ? `#${userData.user_id}` : (session?.user_id ? `#${session.user_id}` : "—"),
        desdeLabel: formatMonthYear(userData?.created_at),
        avatarUrl: safeStr(userData?.foto_perfil_link || userData?.avatar_url || userData?.foto_url || ""),

        // admin extras (si aplica)
        id_usuario_terapeuta: safeStr(specificData?.id_usuario_terapeuta || specificData?.user_id_terapeuta || ""),
        // (opcional) nombre del terapeuta asignado si backend lo incluye
        terapeuta_nombre_completo: safeStr(
          specificData?.terapeuta_nombre_completo ||
            specificData?.nombre_terapeuta_completo ||
            specificData?.terapeuta_nombre ||
            specificData?.terapeuta_fullname ||
            ""
        ),
        is_super_admin: !!(specificData?.is_super_admin ?? userData?.is_super_admin),
        can_manage_files: !!(specificData?.can_manage_files ?? userData?.can_manage_files),
        is_accounter: !!(specificData?.is_accounter ?? userData?.is_accounter),

        lastUpdatedLabel: "",
        _userType: userType,
        // datos extra, por si luego los quieres
        _pais: pais,
        _ciudad: ciudad,
        _admin: userType === "admin" ? specificData : null,
        _terapeuta: userType === "terapeuta" ? specificData : null,
      };

      initialRef.current = next;
      setProfile(next);
    } catch (e) {
      setError(e?.message || "Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // sincroniza rol label rápido
    setProfile((prev) => ({ ...prev, rolLabel: buildRolLabel(session), _userType: userType }));
    // y luego carga desde backend
    fetchPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, userType]);

  // Si es admin: carga terapeutas activos sin admin (para asignación opcional)
  useEffect(() => {
    if (!session || userType !== "admin") return;
    let mounted = true;

    const fetchTerapeutas = async () => {
      try {
        const res = await createApiConn(
          USUARIOS_ENDPOINTS.TERAPEUTAS_SIN_ADMIN_LISTAR,
          {},
          "GET",
          session
        );

        let rows = [];
        if (res && Array.isArray(res.rows)) rows = res.rows;
        else if (Array.isArray(res.data)) rows = res.data;
        else if (Array.isArray(res.items)) rows = res.items;
        else if (Array.isArray(res.terapeutas)) rows = res.terapeutas;
        else if (Array.isArray(res)) rows = res;

        if (!mounted) return;
        setTerapeutasDisponibles(rows);
      } catch (e) {
        console.error("[useMiPerfil] Error listando terapeutas:", e);
        if (!mounted) return;
        setTerapeutasDisponibles([]);
      }
    };

    fetchTerapeutas();
    return () => {
      mounted = false;
    };
  }, [session, userType]);

  const reset = () => {
    if (initialRef.current) setProfile(initialRef.current);

    // limpia avatar pendiente
    try {
      if (pendingAvatarObjectUrl) URL.revokeObjectURL(pendingAvatarObjectUrl);
    } catch {
      // noop
    }
    setPendingAvatarFile(null);
    setPendingAvatarObjectUrl("");
    setAvatarDirty(false);
  };

  // Seleccionar avatar: preview instantáneo, NO sube nada.
  const selectAvatar = (file) => {
    if (!file) return;

    // revoke previo
    try {
      if (pendingAvatarObjectUrl) URL.revokeObjectURL(pendingAvatarObjectUrl);
    } catch {
      // noop
    }

    const tempUrl = URL.createObjectURL(file);
    setPendingAvatarFile(file);
    setPendingAvatarObjectUrl(tempUrl);
    setAvatarDirty(true);

    // preview en UI
    setProfile((prev) => ({ ...prev, avatarUrl: tempUrl }));
  };

  const save = async () => {
    if (!session || !userType) return;

    setSaving(true);
    setError(null);

    try {
      // Armamos el payload de actualización UNA sola vez.
      // ✅ Se usará tanto para el PATCH de datos como para el POST de foto (cuando aplique).
      const updatePayload = buildUpdatePayload(session, userType, profile);

      // 0) Si hay avatar cambiado, lo subimos primero (y recién ahí queda persistido)
      if (pendingAvatarFile) {
        // Importante: el backend recibirá también los datos editados (no solo el archivo)
        await uploadAvatarNow(pendingAvatarFile, { nota: "upload foto perfil" }, updatePayload);
        // limpia estado de pendiente (el fetchPerfil o newUrl actualizará avatarUrl)
        try {
          if (pendingAvatarObjectUrl) URL.revokeObjectURL(pendingAvatarObjectUrl);
        } catch {
          // noop
        }
        setPendingAvatarFile(null);
        setPendingAvatarObjectUrl("");
        setAvatarDirty(false);
      }

      const endpoint = userType === "terapeuta"
        ? USUARIOS_ENDPOINTS.UPDATE_USUARIOS_TERAPEUTA
        : USUARIOS_ENDPOINTS.UPDATE_USUARIOS_ADMIN;

      const payload = updatePayload;

      // Método: no tenemos otro ejemplo en front para update, así que mantenemos PATCH
      await createApiConn(endpoint, payload, "PATCH", session);

      // recargar para asegurar consistencia
      await fetchPerfil();

      setProfile((prev) => ({
        ...prev,
        lastUpdatedLabel: "Actualizado recién",
      }));
    } catch (e) {
      setError(e?.data?.message || e?.message || "Error al actualizar perfil");
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // ---------- Avatar / foto perfil ----------
  const findFirstHttpUrl = (obj) => {
    const seen = new Set();
    const walk = (x) => {
      if (x === null || x === undefined) return null;
      if (typeof x === "string") {
        const s = x.trim();
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        return null;
      }
      if (typeof x !== "object") return null;
      if (seen.has(x)) return null;
      seen.add(x);
      if (Array.isArray(x)) {
        for (const it of x) {
          const u = walk(it);
          if (u) return u;
        }
        return null;
      }
      for (const k of Object.keys(x)) {
        const u = walk(x[k]);
        if (u) return u;
      }
      return null;
    };
    return walk(obj);
  };

  // Subir avatar AHORA.
  // ✅ Ahora también manda el payload de modificación (nombre, teléfono, etc.) junto al archivo,
  // para que el backend no reciba solo la imagen.
  const uploadAvatarNow = async (
    file,
    metadata = { nota: "upload foto perfil" },
    updatePayload = null
  ) => {
    if (!session || !userType) return;
    if (!file) return;

    const actorId = session?.user_id ?? session?.id_usuario ?? session?.id ?? null;
    const sesionId = session?.id_sesion ?? session?.session_id ?? session?.sesion_id ?? null;
    const targetId = actorId;

    if (!actorId || !sesionId || !targetId) {
      throw new Error("Sesión inválida: falta p_actor_user_id o p_id_sesion.");
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const baseArgs = {
        p_actor_user_id: actorId,
        p_id_sesion: sesionId,
        // en este endpoint el target va separado, pero mandamos también p_user_id por compatibilidad
        p_target_user_id: targetId,
        p_user_id: targetId,
        p_rol: "PERFIL",
        p_metadata: metadata || {},
      };

      // Si viene el payload de edición, lo "inyectamos" en args.
      // Nota: si el backend ignora campos extra, no pasa nada. Si los soporta, los aplicará.
      const args = {
        ...baseArgs,
        ...(updatePayload && typeof updatePayload === "object" ? updatePayload : {}),
      };

      const fd = new FormData();
      fd.append("file", file);
      fd.append("args", JSON.stringify(args));

      const res = await createApiConn(
        USUARIOS_ENDPOINTS.USUARIO_ACTUALIZAR_CON_ARCHIVO,
        fd,
        "POST",
        session
      );

      // intenta encontrar la URL devuelta por backend (sin adivinar estructura única)
      const newUrl =
        res?.data?.link ||
        res?.data?.url ||
        res?.link ||
        res?.url ||
        findFirstHttpUrl(res);

      if (newUrl) {
        // ✅ actualiza el avatar con url final
        setProfile((prev) => ({ ...prev, avatarUrl: newUrl, lastUpdatedLabel: "Foto actualizada" }));
      } else {
        // si no vino url, recargamos perfil
        await fetchPerfil();
        setProfile((prev) => ({ ...prev, lastUpdatedLabel: "Foto actualizada" }));
      }

      return res;
    } catch (e) {
      // si falla, vuelve a lo anterior
      if (initialRef.current?.avatarUrl) {
        setProfile((prev) => ({ ...prev, avatarUrl: initialRef.current.avatarUrl }));
      }
      setError(e?.data?.message || e?.message || "Error al subir foto");
      throw e;
    } finally {
      setUploadingAvatar(false);
    }
  };

  return {
    userType,
    reason,
    profile,
    setField,
    isDirty,
    loading,
    saving,
    error,
    reset,
    save,
    uploadingAvatar,
    // UI: seleccionar foto (preview). Se sube recién al guardar.
    selectAvatar,
    terapeutasDisponibles,
    refetch: fetchPerfil,
  };
}
