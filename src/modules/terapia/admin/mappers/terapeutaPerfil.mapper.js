function safeStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

export function mapTerapeutaPerfilToUI(apiData = {}, fallback = {}) {
  // Back-end (Corazón Migrante) normalmente retorna:
  // { usuario: {...}, usuario_terapeuta: {...} }
  // pero mantenemos compatibilidad con otras variantes.
  const usuario = apiData?.usuario || apiData?.user || apiData?.usuario_base || {};
  const terapeuta = apiData?.usuario_terapeuta || apiData?.terapeuta || apiData?.profile || {};

  const pais = safeStr(terapeuta?.pais);
  const ciudad = safeStr(terapeuta?.ciudad);

  return {
    email: safeStr(usuario?.email || fallback.email),
    nombres: safeStr(usuario?.nombre || fallback.nombres),
    apellidos: safeStr(usuario?.apellido || fallback.apellidos),
    telefono: safeStr(usuario?.telefono || fallback.telefono),

    timezone: safeStr(usuario?.timezone || usuario?.time_zone || usuario?.tz || terapeuta?.timezone || terapeuta?.time_zone || fallback.timezone),

    // Estos campos viven en usuarios.usuario
    fecha_nacimiento: safeStr(usuario?.fecha_nacimiento || usuario?.birth_date || fallback.fecha_nacimiento),
    sexo: safeStr(usuario?.sexo || fallback.sexo),

    titulo_profesional: safeStr(terapeuta?.titulo_profesional || terapeuta?.titulo || fallback.titulo_profesional),
    especialidad_principal: safeStr(terapeuta?.especialidad_principal || terapeuta?.especialidad || fallback.especialidad_principal),
    descripcion: safeStr(terapeuta?.descripcion_perfil || terapeuta?.descripcion || fallback.descripcion),
    frase_personal: safeStr(terapeuta?.frase_personal || terapeuta?.frase || fallback.frase_personal),
    youtube_link: safeStr(terapeuta?.link_video_youtube || terapeuta?.youtube_link || terapeuta?.link_video || fallback.youtube_link),
    matricula_profesional: safeStr(terapeuta?.matricula_profesional || terapeuta?.matricula || fallback.matricula_profesional),
    valor_sesion_base: safeStr(terapeuta?.valor_sesion_base || terapeuta?.tarifa_base || fallback.valor_sesion_base),

    pais,
    ciudad,

    // La foto normalmente vive en usuarios.usuario (foto_perfil_link)
    foto_url: safeStr(
      usuario?.foto_perfil_link ||
      usuario?.avatar_url ||
      usuario?.link ||
      usuario?.foto ||
      terapeuta?.foto_url ||
      terapeuta?.avatar_url ||
      fallback.foto_url
    ),

    raw: { usuario, terapeuta },
  };
}

export function mapTerapeutaPerfilFromSession(session = {}) {
  const u = session?.usuario;

  const pais = safeStr(u?.pais || u?.country);
  const ciudad = safeStr(u?.ciudad || u?.city);
return {
  email: safeStr(u?.email),
  nombres: safeStr(u?.nombre ?? u?.nombres ?? u?.nombre_completo),
  apellidos: safeStr(u?.apellido ?? u?.apellidos),
  telefono: safeStr(u?.telefono ?? u?.phone),

  timezone: safeStr(u?.timezone ?? u?.time_zone ?? u?.tz ?? ""),

  fecha_nacimiento: safeStr(u?.fecha_nacimiento ?? u?.birth_date),
  sexo: safeStr(u?.sexo ?? ""),

  titulo_profesional: safeStr(u?.titulo_profesional ?? u?.titulo),
  especialidad_principal: safeStr(u?.especialidad_principal ?? u?.especialidad),
  descripcion: safeStr(u?.descripcion),
  frase_personal: safeStr(u?.frase_personal ?? u?.frase),
  youtube_link: safeStr(u?.youtube_link ?? u?.link_video),
  matricula_profesional: safeStr(u?.matricula_profesional ?? u?.matricula),
  valor_sesion_base: safeStr(u?.valor_sesion_base ?? u?.tarifa_base),

  pais,
  ciudad,

  foto_url: safeStr(u?.foto_perfil_link ?? u?.avatar_url ?? u?.link ?? u?.foto),

  raw: { session: u },
};
}
