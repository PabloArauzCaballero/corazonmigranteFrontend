/**
 * Smoke test de "botones -> funciones reales". No renderiza componentes: llama directamente a
 * las funciones que los botones/formularios del admin invocan al enviarse, contra un fetch
 * simulado. El objetivo es detectar justo el tipo de bug que no deja rastro en consola:
 * un ReferenceError por un import faltante (p. ej. `ApiError is not defined` en
 * createManagedBooking) que rompe la promesa sin que aparezca como error de red.
 */
export {};

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

describe("Acciones administrativas: la función real detrás de cada botón", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_API_BASE_URL: "https://backend.corazon.test" };
    window.localStorage.clear();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("booking administrativo: createManagedBooking envía POST a /appointments/admin con patientUserId explícito", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ id: "cita-1", status: "REQUESTED" }, 201));
    global.fetch = fetchMock;

    const { createManagedBooking } = await import("@/features/booking/booking.api");
    await createManagedBooking({
      patientUserId: "11111111-1111-1111-1111-111111111111",
      therapistUserId: "22222222-2222-2222-2222-222222222222",
      productId: "33333333-3333-3333-3333-333333333333",
      scheduledDate: "2026-08-01",
      scheduledTime: "10:00",
      timezone: "America/La_Paz",
      notesForTherapist: ""
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://backend.corazon.test/api/v1/appointments/admin");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({ patientUserId: "11111111-1111-1111-1111-111111111111" });
  });

  it("booking paciente: createPatientBooking envía POST a /appointments con el cuerpo esperado", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ id: "cita-1", status: "REQUESTED" }, 201));
    global.fetch = fetchMock;

    const { createPatientBooking } = await import("@/features/booking/booking.api");
    await createPatientBooking({
      therapistUserId: "22222222-2222-2222-2222-222222222222",
      productId: "33333333-3333-3333-3333-333333333333",
      scheduledDate: "2026-08-01",
      scheduledTime: "10:00",
      timezone: "America/La_Paz",
      notesForTherapist: "Nota"
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://backend.corazon.test/api/v1/appointments");
    expect(init.method).toBe("POST");
  });

  it("booking disponibilidad: si el backend rechaza fecha simple con 400, reintenta con ISO date-time y no rompe la pantalla", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "HTTP_400", message: "formato inválido", details: [] } }, 400))
      .mockResolvedValueOnce(jsonResponse({ data: [{ scheduledStartAt: "2026-08-01T13:00:00.000Z", timezone: "America/La_Paz" }] }, 200));
    global.fetch = fetchMock;

    const { getBookingAvailability } = await import("@/features/booking/booking.api");
    const slots = await getBookingAvailability({
      therapistUserId: "22222222-2222-2222-2222-222222222222",
      productId: "33333333-3333-3333-3333-333333333333",
      from: "2026-08-01",
      to: "2026-08-01",
      timezone: "America/La_Paz"
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(slots).toHaveLength(1);
    const [secondUrl] = fetchMock.mock.calls[1] as unknown as [string];
    expect(secondUrl).toContain("T00%3A00%3A00.000Z");
  });

  it("premium: getMyContentSubscription degrada a 'sin premium' cuando el backend responde 400 (bug confirmado del servidor)", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ error: { code: "HTTP_400", message: "formato inválido", details: [] } }, 400));
    global.fetch = fetchMock;

    const { getMyContentSubscription } = await import("@/features/newsroom/premium-content.api");
    const status = await getMyContentSubscription();

    expect(status.isPremiumActive).toBe(false);
    expect(status.subscriptionTier).toBe("FREE");
  });

  it("premium: getMyContentSubscription propaga otros errores (401, 500) en vez de ocultarlos", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ error: { code: "HTTP_401", message: "Token requerido.", details: [] } }, 401));
    global.fetch = fetchMock;

    const { getMyContentSubscription } = await import("@/features/newsroom/premium-content.api");
    const { ApiError } = await import("@/shared/api/errors");
    await expect(getMyContentSubscription()).rejects.toBeInstanceOf(ApiError);
  });

  it("autores: newsroomApi.createAuthor envía displayName y el userId vinculado al backend", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ id: "autor-1", displayName: "Ana", status: "ACTIVE" }, 201));
    global.fetch = fetchMock;

    const { newsroomApi } = await import("@/features/newsroom/newsroom.api");
    await newsroomApi.createAuthor({ displayName: "Ana", userId: "usuario-1" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/admin/content/authors");
    expect(JSON.parse(String(init.body))).toMatchObject({ displayName: "Ana", userId: "usuario-1" });
  });

  it("suscriptores: newsroomApi.upsertSubscriber y updateSubscriber golpean los endpoints correctos", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ id: "sub-1", email: "lector@correo.com", status: "ACTIVE", subscriptionTier: "PREMIUM" }, 201));
    global.fetch = fetchMock;

    const { newsroomApi } = await import("@/features/newsroom/newsroom.api");
    await newsroomApi.upsertSubscriber({ email: "lector@correo.com", subscriptionTier: "PREMIUM" });
    await newsroomApi.updateSubscriber("sub-1", { subscriptionTier: "FREE" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [createUrl, createInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const [updateUrl, updateInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(createUrl).toContain("/admin/content/subscribers");
    expect(createInit.method).toBe("POST");
    expect(updateUrl).toContain("/admin/content/subscribers/sub-1");
    expect(updateInit.method).toBe("PATCH");
  });

  it("publicidad: adsApi.createCompany, createPlacement y createCampaign golpean los endpoints correctos", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ id: "x", status: "ACTIVE" }, 201));
    global.fetch = fetchMock;

    const { adsApi } = await import("@/features/newsroom/newsroom.api");

    await adsApi.createCompany({ businessName: "Empresa SRL", commercialName: "Empresa" });
    await adsApi.createPlacement({ code: "home_hero", name: "Hero" });
    await adsApi.createCampaign({ companyId: "empresa-1", name: "Campaña", startsAt: "2026-08-01T00:00:00.000Z", endsAt: "2026-08-31T00:00:00.000Z", publicationIds: ["pub-1"] });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const urls = fetchMock.mock.calls.map((call) => (call as unknown as [string])[0]);
    expect(urls[0]).toContain("/admin/advertising/companies");
    expect(urls[1]).toContain("/admin/advertising/placements");
    expect(urls[2]).toContain("/admin/advertising/campaigns");
  });
});
