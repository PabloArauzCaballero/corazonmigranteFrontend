import { assertDeployableAppUrl, isLocalAppUrl, resetAppUrlWarning } from "@/config/env";

beforeEach(() => resetAppUrlWarning());

describe("detección de URL local", () => {
  it.each([
    "http://localhost:5173",
    "http://localhost",
    "http://127.0.0.1:4173",
    "https://0.0.0.0:8080",
  ])("reconoce %s como local", (url) => {
    expect(isLocalAppUrl(url)).toBe(true);
  });

  it.each([
    "https://corazonmigrante.org",
    "https://app.corazonmigrante.org/",
    "https://corazon-migrante.pages.dev",
  ])("no marca %s como local", (url) => {
    expect(isLocalAppUrl(url)).toBe(false);
  });

  it("no confunde un dominio que solo CONTIENE la palabra localhost", () => {
    expect(isLocalAppUrl("https://localhost.corazonmigrante.org")).toBe(false);
  });

  it("una URL inválida no se trata como local (zod ya la rechaza antes)", () => {
    expect(isLocalAppUrl("no-es-una-url")).toBe(false);
  });
});

describe("guarda del build", () => {
  it("rompe el build en CI con una URL local", () => {
    expect(() => assertDeployableAppUrl("http://localhost:5173", { ci: true })).toThrow(
      /NEXT_PUBLIC_APP_URL apunta a un host local/,
    );
  });

  it("no rompe el build en CI con un dominio real", () => {
    expect(() => assertDeployableAppUrl("https://corazonmigrante.org", { ci: true })).not.toThrow();
  });

  it("fuera de CI avisa pero deja continuar", () => {
    const warn = jest.fn();
    expect(() => assertDeployableAppUrl("http://localhost:5173", { ci: false, warn })).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no se bloquea el build fuera de CI"));
  });

  it("no repite el aviso: Next carga la configuración varias veces por build", () => {
    const warn = jest.fn();
    assertDeployableAppUrl("http://localhost:5173", { ci: false, warn });
    assertDeployableAppUrl("http://localhost:5173", { ci: false, warn });
    assertDeployableAppUrl("http://localhost:5173", { ci: false, warn });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("con un dominio real no avisa nada", () => {
    const warn = jest.fn();
    assertDeployableAppUrl("https://corazonmigrante.org", { ci: false, warn });
    expect(warn).not.toHaveBeenCalled();
  });
});
