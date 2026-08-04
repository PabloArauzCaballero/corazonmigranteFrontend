import type { Attributes } from "@opentelemetry/api";
import {
  authFailureCategory,
  fileExtension,
  fileSizeBucket,
  fileTypeFamily,
  safeAttributes
} from "@/observability/core/tracing.attributes";
import { AUTH_FAILURE_CATEGORY } from "@/observability/core/tracing.constants";

describe("safeAttributes", () => {
  it("conserva las claves de la lista blanca", () => {
    expect(safeAttributes({ "app.feature": "auth", "ui.result": "success" })).toEqual({
      "app.feature": "auth",
      "ui.result": "success"
    });
  });

  it.each([
    "user.email",
    "user.id",
    "http.request.body",
    "form.values",
    "session.token",
    "cualquier.cosa.inventada"
  ])("descarta la clave prohibida %s", (key) => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(safeAttributes({ [key]: "valor" })).toEqual({});
    warn.mockRestore();
  });

  it("acota los contadores para que no generen cardinalidad", () => {
    expect(safeAttributes({ "validation.error.count": 5000 })).toEqual({ "validation.error.count": 99 });
    expect(safeAttributes({ "retry.count": 3 })).toEqual({ "retry.count": 3 });
  });

  it("no acota los valores numéricos que no son contadores", () => {
    expect(safeAttributes({ "web_vital.value": 2410 })).toEqual({ "web_vital.value": 2410 });
  });

  it("descarta valores nulos, indefinidos y cadenas vacías", () => {
    // `null` no es un `AttributeValue` válido según los tipos, pero llega en tiempo de
    // ejecución desde payloads del backend: la guarda tiene que existir igualmente.
    const attributes = { "app.feature": undefined, "ui.result": null, "ui.action": "   " } as unknown as Attributes;
    expect(safeAttributes(attributes)).toEqual({});
  });

  it("descarta números no finitos", () => {
    expect(safeAttributes({ "web_vital.value": Number.POSITIVE_INFINITY })).toEqual({});
  });

  it("conserva los booleanos tal cual, incluido false", () => {
    expect(safeAttributes({ "app.authenticated": false })).toEqual({ "app.authenticated": false });
  });

  it("devuelve un objeto vacío si no recibe nada", () => {
    expect(safeAttributes(undefined)).toEqual({});
  });
});

describe("fileSizeBucket", () => {
  it.each([
    [0, "0-1MB"],
    [512 * 1024, "0-1MB"],
    [3 * 1024 * 1024, "1-5MB"],
    [10 * 1024 * 1024, "5-20MB"],
    [50 * 1024 * 1024, "20-100MB"],
    [500 * 1024 * 1024, "100MB+"]
  ])("clasifica %s bytes como %s", (bytes, expected) => {
    expect(fileSizeBucket(bytes)).toBe(expected);
  });
});

describe("fileExtension", () => {
  it("extrae la extensión sin el nombre del archivo", () => {
    // El nombre completo ("informe-psicologico-ana.pdf") nunca debe salir del navegador.
    expect(fileExtension("informe-psicologico-ana.pdf")).toBe("pdf");
  });

  it("normaliza a minúsculas", () => {
    expect(fileExtension("FOTO.JPG")).toBe("jpg");
  });

  it.each(["sin-extension", "acaba-en-punto.", "archivo.extensionmuylargaquenoloes"])(
    "devuelve cadena vacía para %s",
    (name) => {
      expect(fileExtension(name)).toBe("");
    }
  );
});

describe("fileTypeFamily", () => {
  it.each([
    ["image/png", "image"],
    ["application/pdf", "application"],
    ["", "unknown"],
    ["basura", "basura"]
  ])("clasifica %s como %s", (mime, expected) => {
    expect(fileTypeFamily(mime)).toBe(expected);
  });
});

describe("authFailureCategory", () => {
  /**
   * Regla antienumeración: 401 (contraseña incorrecta), 403 y 404 (cuenta inexistente)
   * deben producir EXACTAMENTE la misma categoría. Si esta prueba se rompe, la
   * telemetría se convierte en una herramienta para averiguar qué correos existen.
   */
  it("no permite distinguir si una cuenta existe", () => {
    expect(authFailureCategory(401)).toBe(AUTH_FAILURE_CATEGORY.invalidCredentials);
    expect(authFailureCategory(403)).toBe(AUTH_FAILURE_CATEGORY.invalidCredentials);
    expect(authFailureCategory(404)).toBe(AUTH_FAILURE_CATEGORY.invalidCredentials);
  });

  it.each([
    [0, AUTH_FAILURE_CATEGORY.networkError],
    [400, AUTH_FAILURE_CATEGORY.validationError],
    [422, AUTH_FAILURE_CATEGORY.validationError],
    [429, AUTH_FAILURE_CATEGORY.rateLimited],
    [500, AUTH_FAILURE_CATEGORY.serverError],
    [503, AUTH_FAILURE_CATEGORY.serverError],
    [418, AUTH_FAILURE_CATEGORY.unknown]
  ])("clasifica el estado %s como %s", (status, expected) => {
    expect(authFailureCategory(status)).toBe(expected);
  });

  it("clasifica la ausencia de estado como desconocido", () => {
    expect(authFailureCategory(undefined)).toBe(AUTH_FAILURE_CATEGORY.unknown);
  });
});
