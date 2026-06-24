// src/app/auth/adminAccess.js
// Centralized access rules for the ADMIN portal (tabs + route guards).

export function computeAdminAccess(session) {
  const isSuper = Boolean(session?.is_super_admin);
  const isTerapeuta = Boolean(session?.is_terapeuta);
  const isAdmin = Boolean(session?.is_admin);
  const isAccounter = Boolean(session?.is_accounter);
  const canManageFiles = Boolean(session?.can_manage_files);

  // Super => everything
  if (isSuper) {
    return {
      solicitudes: true,
      terapeutas: true,
      usuarios: true,
      miPerfil: true,
      contabilidad: true,
      vistasPublicas: true,
      productos: true,
    };
  }

  // Terapeuta => only: Solicitudes (sesiones), Terapeutas, Contabilidad
  if (isTerapeuta) {
    return {
      solicitudes: true,
      terapeutas: true,
      usuarios: false,
      miPerfil: false,
      contabilidad: true,
      vistasPublicas: false,
      productos: false,
    };
  }

  // Admin-like (incluye contador)
  if (isAdmin || isAccounter) {
    return {
      solicitudes: true,
      terapeutas: true,
      usuarios: false,
      miPerfil: true,
      contabilidad: isAccounter,
      vistasPublicas: canManageFiles,
      productos: isAccounter,
    };
  }

  // Fallback (no access)
  return {
    solicitudes: false,
    terapeutas: false,
    usuarios: false,
    miPerfil: false,
    contabilidad: false,
    vistasPublicas: false,
    productos: false,
  };
}

export function canAccessAdminTab(session, tabKey) {
  const a = session?.admin_access || computeAdminAccess(session);
  return Boolean(a?.[tabKey]);
}

export function getDefaultAdminPath(session, basePath = "/admin") {
  const bp = String(basePath || "/admin").replace(/\/+$/, "");
  const a = session?.admin_access || computeAdminAccess(session);

  if (a.solicitudes) return `${bp}/solicitudes`;
  if (a.terapeutas) return `${bp}/terapeutas`;
  if (a.miPerfil) return `${bp}/mi-perfil`;
  if (a.contabilidad) return `${bp}/contabilidad/cuenta`;
  if (a.vistasPublicas) return `${bp}/vistas-publicas`;
  if (a.productos) return `${bp}/productos/enfoques`;
  if (a.usuarios) return `${bp}/usuarios`;

  return `${bp}/login`;
}
