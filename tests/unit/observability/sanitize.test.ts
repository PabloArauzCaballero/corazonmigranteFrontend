import {
  REDACTED,
  boundedCount,
  containsSensitiveData,
  normalizePathSegments,
  sanitizeErrorMessage,
  sanitizeText,
  sanitizeUrlPath
} from "@/observability/core/sanitize";

/**
 * La sanitización es la última línea de defensa antes de que un valor salga del
 * navegador. Cada caso de esta suite corresponde a un dato real que este producto
 * maneja: es una prueba de privacidad, no solo de formato.
 */
describe("sanitize", () => {
  describe("containsSensitiveData", () => {
    it.each([
      ["correo electrónico", "El usuario ana.perez@corazon.test no existe"],
      ["JWT", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdef"],
      ["cabecera de portador", "Authorization: Bearer abc123def456"],
      ["teléfono internacional", "Contacto +34 611 22 33 44"],
      ["secuencia larga de dígitos", "Tarjeta 4111 1111 1111 1111"],
      ["clave en texto plano", "password: hunter2"]
    ])("detecta %s", (_caso, value) => {
      expect(containsSensitiveData(value)).toBe(true);
    });

    it.each([
      "No se pudo cargar la agenda",
      "HTTP 500",
      "/admin/usuarios",
      "appointment.request"
    ])("no marca texto inocuo: %s", (value) => {
      expect(containsSensitiveData(value)).toBe(false);
    });
  });

  describe("sanitizeText", () => {
    it("redacta el valor entero, no solo la parte sensible", () => {
      expect(sanitizeText("Fallo al notificar a ana@corazon.test")).toBe(REDACTED);
    });

    it("trunca los textos largos a 256 caracteres más el indicador", () => {
      const result = sanitizeText("a".repeat(400));
      expect(result).toHaveLength(257);
      expect(result.endsWith("…")).toBe(true);
    });

    it("deja intacto un valor normal", () => {
      expect(sanitizeText("  LoginForm  ")).toBe("LoginForm");
    });
  });

  describe("sanitizeUrlPath", () => {
    it("elimina la query string que lleva el token del stream de notificaciones", () => {
      const url = "https://api.corazon.test/api/v1/admin/notifications/stream?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.zzz";
      expect(sanitizeUrlPath(url)).toBe("/api/v1/admin/notifications/stream");
    });

    it("elimina la firma de una URL de subida de Cloudinary", () => {
      const url = "https://api.cloudinary.com/v1_1/demo/image/upload?api_key=123456789012345&signature=abcdef";
      expect(sanitizeUrlPath(url)).toBe("/v1_1/demo/image/upload");
    });

    it("elimina el fragmento", () => {
      expect(sanitizeUrlPath("/biblioteca/recurso#seccion-privada")).toBe("/biblioteca/recurso");
    });

    it("colapsa un UUID a :id", () => {
      expect(sanitizeUrlPath("/api/v1/appointments/3f2504e0-4f89-11d3-9a0c-0305e82c3301/status")).toBe(
        "/api/v1/appointments/:id/status"
      );
    });

    it("colapsa un identificador numérico a :id", () => {
      expect(sanitizeUrlPath("/api/v1/admin/users/892738")).toBe("/api/v1/admin/users/:id");
    });

    it("devuelve cadena vacía para una entrada vacía", () => {
      expect(sanitizeUrlPath("")).toBe("");
    });
  });

  describe("normalizePathSegments", () => {
    it("quita la barra final que impone trailingSlash", () => {
      expect(normalizePathSegments("/admin/usuarios/")).toBe("/admin/usuarios");
    });

    it("conserva la raíz", () => {
      expect(normalizePathSegments("/")).toBe("/");
    });
  });

  describe("boundedCount", () => {
    it("acota el valor máximo", () => {
      expect(boundedCount(5000)).toBe(99);
    });

    it("rechaza valores no finitos y negativos", () => {
      expect(boundedCount(Number.NaN)).toBe(0);
      expect(boundedCount(-3)).toBe(0);
    });
  });

  describe("sanitizeErrorMessage", () => {
    it("redacta un mensaje del backend que cita un correo", () => {
      expect(sanitizeErrorMessage("El correo ana@corazon.test ya está registrado")).toBe(REDACTED);
    });

    it("normaliza los saltos de línea de un stack multilínea", () => {
      expect(sanitizeErrorMessage("Error\n  en la línea 3")).toBe("Error en la línea 3");
    });

    it("devuelve cadena vacía si no recibe texto", () => {
      expect(sanitizeErrorMessage(undefined)).toBe("");
      expect(sanitizeErrorMessage({ message: "x" })).toBe("");
    });
  });
});
