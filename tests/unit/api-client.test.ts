import type { NormalizedSession } from "@/shared/auth/session";

const originalEnv = { ...process.env };

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  } as Response;
}

async function importApiClient() {
  jest.resetModules();
  return import("@/shared/api/client");
}

function persistSession(session: NormalizedSession) {
  window.localStorage.setItem("cm_session", JSON.stringify(session));
}

describe("apiRequest", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_API_BASE_URL: "https://backend.corazon.test" };
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("builds requests against the configured backend URL", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ ok: true }));
    global.fetch = fetchMock;

    const { apiRequest } = await importApiClient();
    await expect(apiRequest("/api/v1/auth/login", { method: "POST", body: { email: "a@b.com", password: "secret" }, auth: false })).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://backend.corazon.test/api/v1/auth/login");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ email: "a@b.com", password: "secret" }));
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });

  it("sends the bearer token from the real client session when auth is enabled", async () => {
    persistSession({
      userId: "1",
      fullName: "Usuario",
      email: "usuario@cm.test",
      role: "ADMIN",
      permissions: ["admin:read"],
      token: "secure-token"
    });

    const fetchMock = jest.fn(async () => jsonResponse({ ok: true }));
    global.fetch = fetchMock;

    const { apiRequest } = await importApiClient();
    await apiRequest("api/v1/admin/users");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer secure-token");
  });

  it("fails fast when the backend URL is not configured", async () => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const { apiRequest } = await importApiClient();

    await expect(apiRequest("/api/v1/auth/login", { auth: false })).rejects.toThrow("NEXT_PUBLIC_API_BASE_URL no está configurado");
  });
});
