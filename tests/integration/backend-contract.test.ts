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

const publicChecks: ContractCheck[] = [
  { name: "health", path: ENDPOINTS.health.check, expectedStatuses: [200] },
  { name: "public therapy products", path: ENDPOINTS.products.productsPublicList, expectedStatuses: [200] },
  { name: "public view landing by id", path: ENDPOINTS.publicUi.publicViewById.replace(":id", process.env.NEXT_PUBLIC_PUBLIC_VIEW_ID || process.env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG || "1"), expectedStatuses: [200, 404] },
  { name: "public page by id contract", path: ENDPOINTS.publicUi.pageById.replace(":id", process.env.NEXT_PUBLIC_PUBLIC_VIEW_ID || process.env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG || "1"), expectedStatuses: [200, 404] },
  { name: "public CMS biblioteca", path: ENDPOINTS.cms.publicPage.replace(":slug", process.env.NEXT_PUBLIC_CMS_LIBRARY_SLUG ?? "biblioteca"), expectedStatuses: [200, 404] },
  {
    name: "booking availability validates required backend params",
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

describe("real backend integration contract", () => {
  beforeAll(() => {
    if (!baseUrl) {
      throw new Error("Configura BACKEND_INTEGRATION_BASE_URL o NEXT_PUBLIC_API_BASE_URL para ejecutar integración real contra el backend. Esta prueba no usa mocks.");
    }
    if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true") {
      throw new Error("NEXT_PUBLIC_ENABLE_DEMO_MODE no puede estar activo en pruebas de integración contra backend real.");
    }
  });

  it.each(publicChecks)("$name responde desde backend real", async (check) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${check.path}`, {
        method: check.method ?? "GET",
        headers: check.body ? { "content-type": "application/json" } : undefined,
        body: check.body ? JSON.stringify(check.body) : undefined,
        signal: controller.signal
      });

      expect(check.expectedStatuses).toContain(response.status);
      expect(response.headers.get("content-type") ?? "").not.toContain("text/html");
    } finally {
      clearTimeout(timeout);
    }
  });
});
