import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { APP_ROUTES, isKnownRoute, normalizeRoute, routeMatches } from "@/features/tutorial/model/app-routes";

const root = process.cwd();

/** `/paciente/citas` puede vivir en `src/app/...` o dentro de un grupo como `(public)`. */
function pageExists(route: string): boolean {
  const relative = route === "/" ? "" : route;
  return (
    existsSync(join(root, "src/app", relative, "page.tsx")) ||
    existsSync(join(root, "src/app/(public)", relative, "page.tsx"))
  );
}

describe("rutas declaradas para los tutoriales", () => {
  it("todas las rutas del catálogo existen en el router", () => {
    const missing = APP_ROUTES.filter((route) => !pageExists(route));
    expect(missing).toEqual([]);
  });

  it("todas las rutas del menú lateral están declaradas", () => {
    const sidebar = readFileSync(join(root, "src/features/dashboard/sidebar.tsx"), "utf8");
    const hrefs = [...sidebar.matchAll(/href: "(\/[^"]*)"/g)].map((match) => match[1]);
    expect(hrefs.length).toBeGreaterThan(20);
    const undeclared = [...new Set(hrefs)].filter((href) => !isKnownRoute(href));
    expect(undeclared).toEqual([]);
  });

  it("normaliza barras finales, parámetros y anclas", () => {
    expect(normalizeRoute("/admin/usuarios/")).toBe("/admin/usuarios");
    expect(normalizeRoute("/admin/usuarios?page=2")).toBe("/admin/usuarios");
    expect(normalizeRoute("/admin/usuarios#tabla")).toBe("/admin/usuarios");
    expect(normalizeRoute("/")).toBe("/");
    expect(normalizeRoute("")).toBe("/");
  });

  it("una ruta coincide consigo misma y con sus subrutas, no con hermanas", () => {
    expect(routeMatches("/admin", "/admin")).toBe(true);
    expect(routeMatches("/admin", "/admin/usuarios")).toBe(true);
    expect(routeMatches("/admin/usuarios", "/admin")).toBe(false);
    expect(routeMatches("/paciente", "/pacientes")).toBe(false);
  });

  it("la raíz solo coincide con la raíz", () => {
    expect(routeMatches("/", "/")).toBe(true);
    expect(routeMatches("/", "/admin")).toBe(false);
  });
});
