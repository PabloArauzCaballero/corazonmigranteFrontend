/**
 * Extiende el smoke test de "botones -> funciones reales" a otras áreas del admin:
 * usuarios, horarios de terapeutas, editorial/CMS y contabilidad. Mismo enfoque que
 * admin-actions-smoke.test.ts: llama directamente a la función detrás de cada acción
 * contra un fetch simulado, sin renderizar componentes.
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

describe("Otras áreas administrativas: la función real detrás de cada botón", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_API_BASE_URL: "https://backend.corazon.test" };
    window.localStorage.clear();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("usuarios: createUser registra un paciente vía /auth/register/patient", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ id: "user-1", email: "paciente@correo.com" }, 201));
    global.fetch = fetchMock;

    const { createUser } = await import("@/features/users/users.api");
    await createUser({
      role: "PACIENTE",
      email: "paciente@correo.com",
      password: "Demo123456!",
      firstName: "Ana",
      lastName: "Rojas"
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/auth/register/patient");
    expect(init.method).toBe("POST");
  });

  it("usuarios: createUser para ADMIN/SUPER_ADMIN/CONTADOR falla con un ApiError legible (gap de backend conocido)", async () => {
    const { createUser } = await import("@/features/users/users.api");
    const { ApiError } = await import("@/shared/api/errors");

    await expect(
      createUser({ role: "ADMIN", email: "admin@correo.com", password: "Demo123456!", firstName: "A", lastName: "B" })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("usuarios: updateUserStatus envía PATCH al endpoint del usuario correcto", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ id: "user-1", status: "BLOCKED" }, 200));
    global.fetch = fetchMock;

    const { updateUserStatus } = await import("@/features/users/users.api");
    await updateUserStatus("user-1", "bloqueado");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("user-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toMatchObject({ status: "BLOCKED" });
  });

  it("horarios: createAdminTherapistSchedule crea un horario recurrente vía POST", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ id: "sched-1" }, 201));
    global.fetch = fetchMock;

    const { createAdminTherapistSchedule } = await import("@/features/therapy/therapy.api");
    await createAdminTherapistSchedule("therapist-1", {
      weekday: 1,
      startTime: "09:00",
      endTime: "13:00",
      timezone: "America/La_Paz",
      effectiveFrom: "2026-08-01"
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("therapist-1");
    expect(init.method).toBe("POST");
  });

  it("horarios: deactivateAdminTherapistSchedule envía DELETE al horario correcto", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ ok: true }, 200));
    global.fetch = fetchMock;

    const { deactivateAdminTherapistSchedule } = await import("@/features/therapy/therapy.api");
    await deactivateAdminTherapistSchedule("therapist-1", "sched-1");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("therapist-1");
    expect(url).toContain("sched-1");
    expect(init.method).toBe("DELETE");
  });

  it("editorial/CMS: createCmsPage y addCmsElement golpean los endpoints correctos", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "page-1", slug: "biblioteca", title: "Biblioteca" }, 201))
      .mockResolvedValueOnce(jsonResponse({ id: "el-1", code: "hero" }, 201));
    global.fetch = fetchMock;

    const { createCmsPage, addCmsElement } = await import("@/features/editorial/editorial.api");
    const page = await createCmsPage({ slug: "biblioteca", title: "Biblioteca" });
    expect(page.slug).toBe("biblioteca");
    await addCmsElement(page.id, { code: "hero", type: "JSON", content: {} });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [createUrl] = fetchMock.mock.calls[0] as unknown as [string];
    const [elementUrl] = fetchMock.mock.calls[1] as unknown as [string];
    expect(createUrl).toContain("/admin/cms/pages");
    expect(elementUrl).toContain("page-1");
    expect(elementUrl).toContain("/elements");
  });

  it("contabilidad: listCostCenters y listTransactions consumen los GET recién agregados en el backend", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "cc-1", code: "CM-1", name: "Terapia" }] }, 200))
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "tx-1", date: "2026-08-01", description: "Venta" }] }, 200));
    global.fetch = fetchMock;

    const { listAccountingRows, listTransactions } = await import("@/features/accounting/accounting.api");
    const costCenters = await listAccountingRows("costCenters");
    const transactions = await listTransactions();

    expect(costCenters.items).toHaveLength(1);
    expect(transactions.items).toHaveLength(1);
    const [costCentersUrl] = fetchMock.mock.calls[0] as unknown as [string];
    const [transactionsUrl] = fetchMock.mock.calls[1] as unknown as [string];
    expect(costCentersUrl).toContain("/admin/accounting/cost-centers");
    expect(transactionsUrl).toContain("/admin/accounting/transactions");
  });

  it("contabilidad: createTransaction rechaza localmente una partida doble desbalanceada antes de llamar al backend", async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ ok: true }, 201));
    global.fetch = fetchMock;

    const { createTransaction } = await import("@/features/accounting/accounting.api");
    const { ApiError } = await import("@/shared/api/errors");

    await expect(
      createTransaction({
        date: "2026-08-01",
        description: "Desbalanceada",
        entries: [
          { accountId: "acc-1", debit: 100, credit: 0 },
          { accountId: "acc-2", debit: 0, credit: 50 }
        ]
      })
    ).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
