/**
 * @jest-environment jsdom
 */
import {
  DARK_CLASS,
  THEME_COLOR,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  applyTheme,
  isThemePreference,
  readStoredPreference,
  resolveTheme,
} from "@/shared/theme/theme";

/** Simula `prefers-color-scheme` sin depender del entorno real de jsdom. */
function mockSystemPrefersDark(dark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: dark && query.includes("dark"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.className = "";
  document.head.innerHTML = "";
  mockSystemPrefersDark(false);
});

describe("preferencia almacenada", () => {
  it("cae al defecto cuando no hay nada guardado", () => {
    expect(readStoredPreference()).toBe("system");
  });

  it("cae al defecto ante un valor corrupto en vez de propagarlo", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "azul-marino");
    expect(readStoredPreference()).toBe("system");
  });

  it("respeta una preferencia válida", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredPreference()).toBe("dark");
  });

  it("no lanza si localStorage está bloqueado (modo privado, políticas de empresa)", () => {
    const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("acceso denegado");
    });
    expect(() => readStoredPreference()).not.toThrow();
    expect(readStoredPreference()).toBe("system");
    spy.mockRestore();
  });
});

describe("resolución del tema", () => {
  it("`system` sigue a la preferencia del sistema", () => {
    mockSystemPrefersDark(true);
    expect(resolveTheme("system")).toBe("dark");
    mockSystemPrefersDark(false);
    expect(resolveTheme("system")).toBe("light");
  });

  it("una elección explícita ignora al sistema", () => {
    mockSystemPrefersDark(true);
    expect(resolveTheme("light")).toBe("light");
  });

  it("cae a claro si el navegador no expone matchMedia", () => {
    // @ts-expect-error se elimina a propósito para simular un navegador antiguo
    delete window.matchMedia;
    expect(resolveTheme("system")).toBe("light");
  });
});

describe("aplicación al documento", () => {
  it("añade y retira la clase `dark` del elemento raíz", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
    applyTheme("light");
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(false);
  });

  it("sincroniza el color de la barra del navegador con el tema elegido", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);

    applyTheme("dark");
    expect(meta.getAttribute("content")).toBe(THEME_COLOR.dark);
    applyTheme("light");
    expect(meta.getAttribute("content")).toBe(THEME_COLOR.light);
  });

  it("no falla si la etiqueta theme-color no existe", () => {
    expect(() => applyTheme("dark")).not.toThrow();
  });
});

describe("script anti-parpadeo", () => {
  it("aplica el tema oscuro antes de React cuando así está guardado", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    // Se ejecuta la MISMA cadena que se inyecta en el <head>: evaluarla es
    // justamente lo que da valor a esta prueba. La entrada es una constante de
    // compilación, no un dato de usuario.
    eval(THEME_INIT_SCRIPT);
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
  });

  it("sigue al sistema cuando la preferencia es `system`", () => {
    mockSystemPrefersDark(true);
    // Ver el comentario del primer caso.
    eval(THEME_INIT_SCRIPT);
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
  });

  it("no deja el documento en oscuro cuando la preferencia es clara", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    mockSystemPrefersDark(true);
    // Ver el comentario del primer caso.
    eval(THEME_INIT_SCRIPT);
    expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(false);
  });
});

describe("guarda de tipo", () => {
  it.each(["system", "light", "dark"])("acepta %s", (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each([null, undefined, "", "DARK", 1, {}])("rechaza %p", (value) => {
    expect(isThemePreference(value)).toBe(false);
  });
});
