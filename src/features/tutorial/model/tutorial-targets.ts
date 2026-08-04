/**
 * Identificadores estables de los elementos que los tutoriales resaltan.
 *
 * Están centralizados aquí (y no dispersos como literales) por dos motivos: el catálogo
 * y los componentes usan exactamente la misma cadena, y renombrar un objetivo es un
 * cambio en un solo sitio. Nunca se apunta a clases CSS: son de presentación y cambian
 * con cualquier retoque visual.
 */
export const TUTORIAL_TARGETS = {
  /** Estructura común de los portales (`DashboardShell`). */
  menuMovil: "menu-movil",
  campanaNotificaciones: "campana-notificaciones",
  cerrarSesion: "cerrar-sesion",
  contenidoPrincipal: "contenido-principal",
  /** Primitivas compartidas: existen en cualquier pantalla que las use. */
  encabezadoPagina: "encabezado-pagina",
  tituloPagina: "titulo-pagina",
  accionesPagina: "acciones-pagina",
  filtrosTabla: "filtros-tabla",
  tablaDatos: "tabla-datos",
  ventanaModal: "ventana-modal",
  /** Centro de ayuda. */
  centroResumen: "centro-resumen",
  centroBuscador: "centro-buscador",
  centroFiltros: "centro-filtros",
  lanzador: "lanzador-tutorial",
  /** Sitio público. */
  landingEmpezar: "landing-empezar",
  landingContacto: "landing-contacto",
} as const;

/** Marcas diacríticas de la descomposición Unicode (para quitar tildes de las etiquetas). */
const DIACRITICS = /[̀-ͯ]/g;

/**
 * Identificador de un enlace del menú lateral a partir de su ruta.
 * `/admin/contenido/publicaciones` → `nav-admin-contenido-publicaciones`.
 */
export function navTutorialId(href: string): string {
  const slug = href.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\//g, "-");
  return slug ? `nav-${slug}` : "nav-inicio";
}

/** Identificador del desplegable de un grupo del menú lateral. */
export function navGroupTutorialId(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `nav-grupo-${slug}`;
}
