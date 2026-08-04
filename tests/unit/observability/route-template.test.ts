import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  DYNAMIC_PAGE_TEMPLATE,
  STATIC_ROUTES,
  UNKNOWN_ROUTE_TEMPLATE,
  apiRouteTemplate,
  routeTemplateFromPath
} from "@/observability/core/route-template";

/**
 * `app.route.template` es el atributo con más riesgo de cardinalidad de todo el
 * módulo: si se cuela un identificador, Jaeger acaba con una dimensión por cada
 * paciente. Esta suite comprueba las dos cosas que lo evitan: que la lista de rutas
 * refleje el árbol real y que todo lo demás se colapse.
 */

/** Recorre `src/app` y deduce las URL reales, ignorando grupos `(public)`. */
function discoverRoutes(): string[] {
  const appDir = join(process.cwd(), "src", "app");
  const routes: string[] = [];

  const walk = (dir: string, urlSegments: string[]) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        if (entry.name === "page.tsx") routes.push(`/${urlSegments.join("/")}`.replace(/\/+/g, "/"));
        continue;
      }
      // Los grupos de rutas y las carpetas privadas no aparecen en la URL.
      const isGroup = entry.name.startsWith("(") && entry.name.endsWith(")");
      const isPrivate = entry.name.startsWith("_") || entry.name === "api";
      if (isPrivate) continue;
      walk(join(dir, entry.name), isGroup ? urlSegments : [...urlSegments, entry.name]);
    }
  };

  walk(appDir, []);
  return routes.map((route) => (route.length > 1 ? route.replace(/\/$/, "") : route));
}

describe("routeTemplateFromPath", () => {
  it("la lista de rutas estáticas no se ha quedado obsoleta respecto a src/app", () => {
    const real = discoverRoutes();
    // `[slug]` es la única ruta dinámica: se compara aparte porque su plantilla no es
    // su nombre de carpeta.
    const realStatic = real.filter((route) => !route.includes("["));
    const missing = realStatic.filter((route) => !STATIC_ROUTES.includes(route));

    expect(missing).toEqual([]);
    // Si esto falla, se añadió una pantalla sin registrarla en STATIC_ROUTES y sus
    // trazas caerían en "/unknown".
    expect(real.some((route) => route.includes("["))).toBe(true);
  });

  it.each([
    ["/", "/"],
    ["/admin/usuarios", "/admin/usuarios"],
    ["/admin/usuarios/", "/admin/usuarios"],
    ["/paciente/citas/", "/paciente/citas"],
    ["/admin/contabilidad/transacciones", "/admin/contabilidad/transacciones"]
  ])("conserva la ruta estática %s", (input, expected) => {
    expect(routeTemplateFromPath(input)).toBe(expected);
  });

  it("descarta la query string en lugar de generar una plantilla nueva", () => {
    expect(routeTemplateFromPath("/noticias/detalle?id=9f1c2b3a")).toBe("/noticias/detalle");
  });

  it("descarta el fragmento", () => {
    expect(routeTemplateFromPath("/biblioteca#privado")).toBe("/biblioteca");
  });

  it.each(["/inicio", "/una-pagina-cms-cualquiera", "/otra-mas"])(
    "colapsa el slug dinámico %s a una sola plantilla",
    (input) => {
      expect(routeTemplateFromPath(input)).toBe(DYNAMIC_PAGE_TEMPLATE);
    }
  );

  it("no inventa plantillas para rutas profundas desconocidas", () => {
    expect(routeTemplateFromPath("/admin/usuarios/3f2504e0-4f89-11d3-9a0c-0305e82c3301/editar")).toBe(
      UNKNOWN_ROUTE_TEMPLATE
    );
  });

  it.each([null, undefined, ""])("devuelve /unknown para una entrada vacía (%s)", (input) => {
    expect(routeTemplateFromPath(input)).toBe(UNKNOWN_ROUTE_TEMPLATE);
  });

  it("la cardinalidad total está acotada por construcción", () => {
    // 57 rutas estáticas + la dinámica + el escape. Si esto crece de golpe, algo se
    // está colando sin normalizar.
    expect(STATIC_ROUTES.length).toBeLessThanOrEqual(80);
  });
});

describe("apiRouteTemplate", () => {
  it("conserva los marcadores que ya trae ENDPOINTS", () => {
    expect(apiRouteTemplate("/api/v1/appointments/:appointmentId/status")).toBe(
      "/api/v1/appointments/:appointmentId/status"
    );
  });

  it("colapsa un identificador ya resuelto", () => {
    expect(apiRouteTemplate("/api/v1/admin/users/892738/status")).toBe("/api/v1/admin/users/:id/status");
  });

  it("descarta la query string de una búsqueda escrita por una persona", () => {
    expect(apiRouteTemplate("/api/v1/admin/users?search=ana%20maria&page=2")).toBe("/api/v1/admin/users");
  });
});
