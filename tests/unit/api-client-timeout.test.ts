import { apiRequest } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";

/**
 * API-03 / API-04 — límite de tiempo y cancelación.
 *
 * Sin timeout, un backend que acepta la conexión pero nunca responde deja la petición
 * viva hasta que el navegador la corta por su cuenta. React Query no puede rescatar
 * ese caso: seguiría mostrando estado de carga indefinidamente y quien usa la
 * aplicación no vería ni datos ni error.
 *
 * Se distinguen tres finales porque exigen reacciones distintas: cancelación (normal,
 * la provoca React Query al descartar una consulta obsoleta), expiración y fallo de
 * red.
 */
jest.mock("@/observability", () => ({
  ATTR: { routeTemplate: "route_template", networkRequestType: "network.request_type", retryCount: "retry_count", feature: "feature", operation: "operation" },
  BUSINESS_SPANS: { authSessionExpired: "auth.session_expired" },
  TECHNICAL_SPANS: { httpClient: "http.client" },
  apiRouteTemplate: (path: string) => path,
  runInSpan: (_name: string, _attrs: unknown, run: (span: unknown) => Promise<unknown>) =>
    run({ setAttribute: jest.fn() }),
  startSpan: () => ({ end: jest.fn(), setAttribute: jest.fn() })
}));

jest.mock("@/config/env", () => ({
  env: { NEXT_PUBLIC_API_BASE_URL: "https://api.pruebas.local" }
}));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

/** Un `fetch` que solo termina cuando se aborta la señal que recibe. */
function fetchQueNuncaResponde() {
  return jest.fn((_url: string, init?: RequestInit) => {
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("The operation was aborted.");
        error.name = "AbortError";
        reject(error);
      });
    });
  });
}

describe("apiRequest — tiempo y cancelación", () => {
  it("aborta la petición cuando se agota el tiempo y lo explica", async () => {
    jest.useFakeTimers();
    try {
      global.fetch = fetchQueNuncaResponde() as unknown as typeof fetch;

      const promesa = apiRequest("/api/v1/health", { auth: false, timeoutMs: 5_000 });
      const esperado = expect(promesa).rejects.toMatchObject({
        status: 0,
        details: expect.objectContaining({ timeout: true })
      });

      jest.advanceTimersByTime(5_001);
      await esperado;
    } finally {
      jest.useRealTimers();
    }
  });

  it("el mensaje de expiración es comprensible y menciona los segundos", async () => {
    jest.useFakeTimers();
    try {
      global.fetch = fetchQueNuncaResponde() as unknown as typeof fetch;

      const promesa = apiRequest("/api/v1/health", { auth: false, timeoutMs: 8_000 });
      const esperado = expect(promesa).rejects.toThrow(/no respondió a tiempo \(8 s\)/i);

      jest.advanceTimersByTime(8_001);
      await esperado;
    } finally {
      jest.useRealTimers();
    }
  });

  it("una cancelación del consumidor no se presenta como fallo del servidor", async () => {
    // React Query cancela consultas obsoletas continuamente: tratarlo como error de
    // servidor llenaría la interfaz de avisos falsos.
    global.fetch = fetchQueNuncaResponde() as unknown as typeof fetch;

    const controller = new AbortController();
    const promesa = apiRequest("/api/v1/health", { auth: false, signal: controller.signal });

    controller.abort();

    await expect(promesa).rejects.toMatchObject({
      status: 0,
      details: expect.objectContaining({ cancelled: true })
    });
    await expect(promesa).rejects.toThrow(/se canceló/i);
  });

  it("con timeoutMs=0 no impone ningún límite", async () => {
    jest.useFakeTimers();
    try {
      global.fetch = fetchQueNuncaResponde() as unknown as typeof fetch;

      let resuelta = false;
      void apiRequest("/api/v1/health", { auth: false, timeoutMs: 0 }).catch(() => {
        resuelta = true;
      });

      jest.advanceTimersByTime(120_000);
      await Promise.resolve();

      expect(resuelta).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it("no deja temporizadores vivos cuando la respuesta llega a tiempo", async () => {
    jest.useFakeTimers();
    try {
      // jsdom no expone `Response`, así que se compone el mínimo que `parseResponse`
      // necesita: cabeceras, estado y `json()`.
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
        text: async () => JSON.stringify({ ok: true })
      });

      await expect(apiRequest("/api/v1/health", { auth: false })).resolves.toEqual({ ok: true });

      // Si el timeout no se limpiara en `finally`, quedaría un temporizador de 30 s
      // vivo por cada petición y el proceso no terminaría tras la suite.
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("un fallo de red normal sigue produciendo ApiError con status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(apiRequest("/api/v1/health", { auth: false })).rejects.toBeInstanceOf(ApiError);
    await expect(apiRequest("/api/v1/health", { auth: false })).rejects.toThrow(/No se pudo conectar/i);
  });
});
