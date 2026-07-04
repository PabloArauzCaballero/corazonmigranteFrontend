/**
 * @jest-environment node
 */
import { ENDPOINTS } from "@/shared/api/endpoints";

type ContractCheck = {
  name: string;
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
  expectedStatuses: number[];
};

const baseUrl = (process.env.BACKEND_INTEGRATION_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const timeoutMs = Number(process.env.BACKEND_INTEGRATION_TIMEOUT_MS ?? 10_000);
const publicViewId = process.env.NEXT_PUBLIC_PUBLIC_VIEW_ID || process.env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG || "1";
const librarySlug = process.env.NEXT_PUBLIC_CMS_LIBRARY_SLUG ?? "biblioteca";

const requiredChecks: ContractCheck[] = [
  { name: "health", path: ENDPOINTS.health.check, expectedStatuses: [200] },
  { name: "public therapy products", path: ENDPOINTS.products.productsPublicList, expectedStatuses: [200] },
  { name: "public page by id contract", path: ENDPOINTS.publicUi.pageById.replace(":id", publicViewId), expectedStatuses: [200, 404] },
  {
    name: "booking availability validates required params",
    path: `${ENDPOINTS.booking.availability}?therapistUserId=invalid&productId=invalid&from=2026-07-01&to=2026-07-01&timezone=America/La_Paz`,
    expectedStatuses: [400, 422]
  },
  {
    name: "appointments creation is protected and does not allow anonymous booking",
    path: ENDPOINTS.appointments.createMine,
    method: "POST",
    body: {},
    expectedStatuses: [401, 403]
  },
  {
    name: "login rejects invalid credentials through backend",
    path: ENDPOINTS.auth.login,
    method: "POST",
    body: { email: "invalid-contract-test@corazonmigrante.local", password: "invalid-password" },
    expectedStatuses: [400, 401, 422]
  }
];

const landingFallbacks = [
  ENDPOINTS.publicUi.publicViewById.replace(":id", publicViewId),
  ENDPOINTS.cms.publicPage.replace(":slug", "inicio"),
  ENDPOINTS.publicUi.pageById.replace(":id", publicViewId)
];

const libraryFallbacks = [
  ENDPOINTS.cms.publicPage.replace(":slug", librarySlug),
  ENDPOINTS.publicUi.publicViewById.replace(":id", "2")
];

async function request(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal });
    const contentType = response.headers.get("content-type") ?? "";
    return { status: response.status, contentType };
  } finally {
    clearTimeout(timeout);
  }
}

async function atLeastOnePublicRouteWorks(paths: string[]) {
  const results = await Promise.all(paths.map((path) => request(path).catch(() => ({ status: 0, contentType: "" }))));
  return results.some((result) => result.status === 200 && !result.contentType.includes("text/html"));
}

describe("real backend integration contract", () => {
  beforeAll(() => {
    if (!baseUrl) {
      throw new Error("Configura BACKEND_INTEGRATION_BASE_URL o NEXT_PUBLIC_API_BASE_URL para ejecutar integración real contra el backend. Esta prueba no usa mocks.");
    }
    if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true") {
      throw new Error("NEXT_PUBLIC_ENABLE_DEMO_MODE no puede estar activo en pruebas de integración contra backend real.");
    }
  });

  it.each(requiredChecks)("$name responde desde backend real", async (check) => {
    const response = await request(check.path, {
      method: check.method ?? "GET",
      headers: check.body ? { "content-type": "application/json" } : undefined,
      body: check.body ? JSON.stringify(check.body) : undefined
    });

    expect(check.expectedStatuses).toContain(response.status);
    expect(response.contentType).not.toContain("text/html");
  });

  it("responde al menos una ruta compatible para la landing pública", async () => {
    await expect(atLeastOnePublicRouteWorks(landingFallbacks)).resolves.toBe(true);
  });

  it("responde al menos una ruta compatible para biblioteca pública", async () => {
    await expect(atLeastOnePublicRouteWorks(libraryFallbacks)).resolves.toBe(true);
  });
});
