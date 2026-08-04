/**
 * Rutas reales de la aplicación que un tutorial puede visitar.
 *
 * La validación del catálogo rechaza cualquier tutorial que apunte a una ruta que no
 * esté aquí, de forma que un recorrido nunca lleve a una pantalla inexistente. La
 * prueba `tests/unit/tutorial-app-routes.test.ts` comprueba que cada entrada tenga su
 * `page.tsx` correspondiente, para que esta lista no se desincronice del router.
 */
export const APP_ROUTES = [
  // Sitio público
  "/",
  "/login",
  "/registro",
  "/booking",
  "/biblioteca",
  "/cursos",
  "/noticias",
  "/novedades",
  "/privacidad",
  "/terminos",
  // Portal del paciente
  "/paciente",
  "/paciente/citas",
  "/paciente/booking",
  "/paciente/premium",
  "/paciente/descargables",
  "/paciente/perfil",
  "/paciente/ayuda",
  // Portal del terapeuta
  "/terapeuta",
  "/terapeuta/agenda",
  "/terapeuta/horarios",
  "/terapeuta/booking",
  "/terapeuta/perfil",
  "/terapeuta/ayuda",
  // Panel administrativo
  "/admin",
  "/admin/notificaciones",
  "/admin/solicitudes",
  "/admin/booking",
  "/admin/usuarios",
  "/admin/descargables",
  "/admin/archivos",
  "/admin/publicidad",
  "/admin/publicidad/empresas",
  "/admin/publicidad/ubicaciones",
  "/admin/publicidad/campanas",
  "/admin/publicidad/creativos",
  "/admin/productos/enfoques",
  "/admin/productos/servicios",
  "/admin/contenido/paginas",
  "/admin/contenido/publico",
  "/admin/contenido/publicaciones",
  "/admin/contenido/categorias",
  "/admin/contenido/tags",
  "/admin/contenido/autores",
  "/admin/contenido/suscriptores",
  "/admin/contenido/homepage",
  "/admin/contabilidad",
  "/admin/contabilidad/cuentas",
  "/admin/contabilidad/grupos-cuenta",
  "/admin/contabilidad/centros-costo",
  "/admin/contabilidad/transacciones",
  "/admin/vistas-publicas",
  "/admin/ayuda",
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];

const ROUTE_SET: ReadonlySet<string> = new Set(APP_ROUTES);

export function isKnownRoute(route: string): boolean {
  return ROUTE_SET.has(normalizeRoute(route));
}

/** Quita la barra final (`trailingSlash: true` la añade en producción) y normaliza. */
export function normalizeRoute(pathname: string): string {
  const clean = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return clean === "" ? "/" : clean;
}

/** `true` si `pathname` está dentro de `route` (misma ruta o subruta). */
export function routeMatches(route: string, pathname: string): boolean {
  const target = normalizeRoute(route);
  const current = normalizeRoute(pathname);
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}
