import { expect, test, type Request } from "@playwright/test";

/**
 * E2E de observabilidad (Fase 38).
 *
 * Se valida contra el **gateway**, no contra Jaeger: se interceptan las peticiones a
 * `/otel/v1/traces` (o `/api/otel/traces` en desarrollo) y se inspecciona el payload
 * OTLP que el navegador envía de verdad. Esto comprueba exactamente lo mismo que
 * consultar Jaeger —jerarquía, atributos, ausencia de secretos— sin exigir que la
 * suite levante Collector y Jaeger, que es lo que la haría inejecutable en CI.
 *
 * Para la verificación distribuida completa (frontend → backend → PostgreSQL) hay un
 * procedimiento manual en `docs/observability/frontend/06-runbook.md`.
 *
 * Requiere el frontend levantado con la telemetría encendida:
 *   NEXT_PUBLIC_OTEL_ENABLED=true yarn dev
 *   E2E_BASE_URL=http://localhost:4173 yarn test:e2e observability
 */

const TRACES_ENDPOINT = /\/(api\/)?otel\/(v1\/)?traces/;

type OtlpSpan = {
  name: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  attributes?: Array<{ key: string; value: Record<string, unknown> }>;
};

/** Aplana el payload OTLP/JSON a una lista de spans. */
function extractSpans(body: string): OtlpSpan[] {
  const payload = JSON.parse(body) as {
    resourceSpans?: Array<{ scopeSpans?: Array<{ spans?: OtlpSpan[] }> }>;
  };
  return (payload.resourceSpans ?? []).flatMap((resource) =>
    (resource.scopeSpans ?? []).flatMap((scope) => scope.spans ?? [])
  );
}

function attributeValue(span: OtlpSpan, key: string): string | undefined {
  const found = span.attributes?.find((attribute) => attribute.key === key);
  if (!found) return undefined;
  return Object.values(found.value)[0] as string | undefined;
}

/** Captura los lotes OTLP que salen del navegador durante la prueba. */
function collectTraceBatches(page: import("@playwright/test").Page) {
  const batches: string[] = [];

  page.on("request", (request: Request) => {
    if (TRACES_ENDPOINT.test(request.url()) && request.method() === "POST") {
      const body = request.postData();
      if (body) batches.push(body);
    }
  });

  return {
    batches,
    spans: () => batches.flatMap(extractSpans),
    rawText: () => batches.join("\n")
  };
}

test.describe("observabilidad del navegador", () => {
  test("la carga inicial produce un span de carga de documento", async ({ page }) => {
    const collected = collectTraceBatches(page);

    await page.goto("/");
    // El BatchSpanProcessor vacía cada 5 s; se fuerza ocultando la página, que es lo
    // que dispara el forceFlush de `browser-lifecycle.ts`.
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await page.waitForTimeout(6_000);

    const names = collected.spans().map((span) => span.name);
    expect(names).toContain("documentLoad");
  });

  test("una navegación SPA produce route.navigation con plantillas de ruta", async ({ page }) => {
    const collected = collectTraceBatches(page);

    await page.goto("/");
    await page.getByRole("link", { name: /biblioteca/i }).first().click();
    await page.waitForURL(/\/biblioteca/);
    await page.waitForTimeout(6_000);

    const navigation = collected.spans().find((span) => span.name === "route.navigation");
    expect(navigation).toBeDefined();
    expect(attributeValue(navigation!, "app.route.to")).toBe("/biblioteca");
    expect(attributeValue(navigation!, "ui.navigation.type")).toBe("spa");
  });

  test("un intento de login fallido produce auth.login con categoría normalizada", async ({ page }) => {
    const collected = collectTraceBatches(page);

    // Se responde 401 sin tocar el backend real: la prueba mide la instrumentación.
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "Unauthorized" }) })
    );

    await page.goto("/login");
    await page.getByLabel(/correo/i).fill("persona.inexistente@corazon.test");
    await page.getByLabel(/contraseña/i).fill("una-contrasena-que-no-vale");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await page.waitForTimeout(6_000);

    const login = collected.spans().find((span) => span.name === "auth.login");
    expect(login).toBeDefined();
    expect(attributeValue(login!, "auth.result")).toBe("failure");
    // Antienumeración: nunca debe poder distinguirse "no existe" de "clave incorrecta".
    expect(attributeValue(login!, "auth.failure.category")).toBe("invalid_credentials");
  });

  test("el span HTTP cuelga del span de negocio: misma traza, padre correcto", async ({ page }) => {
    const collected = collectTraceBatches(page);

    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "Unauthorized" }) })
    );

    await page.goto("/login");
    await page.getByLabel(/correo/i).fill("alguien@corazon.test");
    await page.getByLabel(/contraseña/i).fill("clave-incorrecta");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await page.waitForTimeout(6_000);

    const spans = collected.spans();
    const login = spans.find((span) => span.name === "auth.login");
    const http = spans.find((span) => span.name === "http.client");

    expect(login).toBeDefined();
    expect(http).toBeDefined();
    expect(http!.traceId).toBe(login!.traceId);
    expect(http!.parentSpanId).toBe(login!.spanId);
  });

  test("NINGÚN dato sensible sale del navegador", async ({ page }) => {
    const collected = collectTraceBatches(page);

    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "Unauthorized" }) })
    );

    await page.goto("/login");
    await page.getByLabel(/correo/i).fill("ana.perez@corazon.test");
    await page.getByLabel(/contraseña/i).fill("contrasena-super-secreta");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await page.waitForTimeout(6_000);

    const exported = collected.rawText();
    expect(exported).not.toContain("ana.perez@corazon.test");
    expect(exported).not.toContain("contrasena-super-secreta");
    expect(exported.toLowerCase()).not.toContain("authorization");
    expect(exported).not.toContain("password");
  });

  test("la aplicación sigue funcionando si el gateway de telemetría está caído", async ({ page }) => {
    // Se simula el Collector inalcanzable: toda exportación falla.
    await page.route(TRACES_ENDPOINT, (route) => route.abort("failed"));

    await page.goto("/");
    await page.waitForTimeout(6_000);

    // La pantalla se pinta igual y no aparece ninguna pantalla de error.
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/ocurrió un error inesperado/i)).toHaveCount(0);

    // Y la navegación sigue funcionando.
    await page.getByRole("link", { name: /biblioteca/i }).first().click();
    await page.waitForURL(/\/biblioteca/);
  });
});
