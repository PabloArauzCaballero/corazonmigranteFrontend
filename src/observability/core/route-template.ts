import { normalizePathSegments, sanitizeUrlPath } from "@/observability/core/sanitize";

/**
 * Plantilla de ruta (`app.route.template`) con cardinalidad acotada por construcción.
 *
 * No se usa el router interno de Next: en `output: "export"` no hay forma pública de
 * pedirle la plantilla desde el cliente, y depender de internos rompería en cada
 * actualización menor. En su lugar se mantiene la lista de rutas reales del proyecto,
 * que el test `route-template.test.ts` compara contra el árbol de `src/app` para que
 * no se quede obsoleta al añadir una pantalla.
 *
 * Este proyecto tiene una única ruta dinámica: `/(public)/[slug]`.
 */

/** Rutas estáticas reales. Los grupos `(public)` no aparecen en la URL. */
export const STATIC_ROUTES: readonly string[] = [
  "/",
  "/403",
  "/admin",
  "/admin/archivos",
  "/admin/ayuda",
  "/admin/booking",
  "/admin/contabilidad",
  "/admin/contabilidad/centros-costo",
  "/admin/contabilidad/cuentas",
  "/admin/contabilidad/grupos-cuenta",
  "/admin/contabilidad/transacciones",
  "/admin/contenido/autores",
  "/admin/contenido/categorias",
  "/admin/contenido/editorial",
  "/admin/contenido/homepage",
  "/admin/contenido/paginas",
  "/admin/contenido/publicaciones",
  "/admin/contenido/publico",
  "/admin/contenido/suscriptores",
  "/admin/contenido/tags",
  "/admin/descargables",
  "/admin/login",
  "/admin/notificaciones",
  "/admin/productos/enfoques",
  "/admin/productos/servicios",
  "/admin/publicidad",
  "/admin/publicidad/campanas",
  "/admin/publicidad/creativos",
  "/admin/publicidad/empresas",
  "/admin/publicidad/ubicaciones",
  "/admin/solicitudes",
  "/admin/usuarios",
  "/admin/vistas-publicas",
  "/biblioteca",
  "/biblioteca/recurso",
  "/booking",
  "/cursos",
  "/login",
  "/noticias",
  "/noticias/detalle",
  "/novedades",
  "/novedades/detalle",
  "/paciente",
  "/paciente/ayuda",
  "/paciente/booking",
  "/paciente/citas",
  "/paciente/descargables",
  "/paciente/perfil",
  "/paciente/premium",
  "/privacidad",
  "/registro",
  "/terapeuta",
  "/terapeuta/agenda",
  "/terapeuta/ayuda",
  "/terapeuta/booking",
  "/terapeuta/horarios",
  "/terapeuta/perfil",
  "/terminos",
];

const STATIC_ROUTE_SET: ReadonlySet<string> = new Set(STATIC_ROUTES);

/** Plantilla de la única ruta dinámica del proyecto. */
export const DYNAMIC_PAGE_TEMPLATE = "/:slug";

/** Valor de escape: cualquier cosa que no encaje en el mapa conocido. */
export const UNKNOWN_ROUTE_TEMPLATE = "/unknown";

/**
 * Convierte un pathname vivido en su plantilla.
 *
 * ```text
 * /admin/usuarios/       → /admin/usuarios
 * /inicio                → /:slug        (ruta dinámica [slug])
 * /noticias/detalle?id=9 → /noticias/detalle
 * /admin/a3f2-…/editar   → /unknown      (no existe: no se inventa cardinalidad)
 * ```
 */
export function routeTemplateFromPath(pathname: string | null | undefined): string {
  if (!pathname) return UNKNOWN_ROUTE_TEMPLATE;

  const cleaned = normalizePathSegments(sanitizeUrlPath(pathname));
  if (cleaned === "") return UNKNOWN_ROUTE_TEMPLATE;
  if (STATIC_ROUTE_SET.has(cleaned)) return cleaned;

  // Un único segmento desconocido es, por definición del árbol de rutas, la página
  // dinámica `[slug]`. Se colapsa para que el slug no genere una dimensión nueva.
  const segments = cleaned.split("/").filter(Boolean);
  if (segments.length === 1) return DYNAMIC_PAGE_TEMPLATE;

  return UNKNOWN_ROUTE_TEMPLATE;
}

/** Plantilla de la ruta que el navegador tiene abierta ahora mismo. */
export function currentRouteTemplate(): string {
  if (typeof window === "undefined") return UNKNOWN_ROUTE_TEMPLATE;
  return routeTemplateFromPath(window.location.pathname);
}

/**
 * Plantilla de un endpoint de la API.
 *
 * Los endpoints de `src/shared/api/endpoints.ts` ya vienen con marcadores
 * (`/appointments/:appointmentId/status`), así que basta con quitar la query string.
 * Si llega una URL ya resuelta con identificadores reales, `normalizePathSegments`
 * los colapsa igualmente.
 */
export function apiRouteTemplate(path: string): string {
  const withoutQuery = path.split("?")[0] ?? "";
  return normalizePathSegments(withoutQuery) || UNKNOWN_ROUTE_TEMPLATE;
}
