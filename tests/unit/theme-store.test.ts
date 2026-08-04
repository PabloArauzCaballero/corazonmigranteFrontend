/**
 * @jest-environment jsdom
 */
import { DARK_CLASS, THEME_STORAGE_KEY } from "@/shared/theme/theme";

/** Simula `prefers-color-scheme` y permite disparar el evento de cambio del SO. */
function mockMatchMedia(dark: boolean) {
  const listeners = new Set<() => void>();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return dark && query.includes("dark");
      },
      media: query,
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    }),
  });
  return {
    setDark(next: boolean) {
      dark = next;
      listeners.forEach((cb) => cb());
    },
  };
}

/**
 * El almacén cachea su snapshot en un módulo, así que cada prueba necesita una
 * instancia limpia; de lo contrario el valor de la anterior se filtra.
 */
async function freshStore() {
  let store!: typeof import("@/shared/theme/theme-store");
  await jest.isolateModulesAsync(async () => {
    store = await import("@/shared/theme/theme-store");
  });
  return store;
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.className = "";
  mockMatchMedia(false);
});

it("el snapshot de servidor es estable y no depende del navegador", async () => {
  const store = await freshStore();
  expect(store.getServerSnapshot()).toBe("system|light");
  expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
});

it("getSnapshot devuelve la misma identidad mientras nada cambie", async () => {
  const store = await freshStore();
  expect(store.getSnapshot()).toBe(store.getSnapshot());
});

it("setPreference persiste, aplica al DOM y notifica a los suscriptores", async () => {
  const store = await freshStore();
  const listener = jest.fn();
  const unsubscribe = store.subscribe(listener);

  store.setPreference("dark");

  expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
  expect(store.getSnapshot()).toBe("dark|dark");
  expect(listener).toHaveBeenCalledTimes(1);

  unsubscribe();
});

it("no notifica cuando la preferencia elegida ya estaba activa", async () => {
  const store = await freshStore();
  store.setPreference("dark");
  const listener = jest.fn();
  const unsubscribe = store.subscribe(listener);

  store.setPreference("dark");

  expect(listener).not.toHaveBeenCalled();
  unsubscribe();
});

it("con preferencia `system`, un cambio del sistema operativo repinta el tema", async () => {
  const media = mockMatchMedia(false);
  const store = await freshStore();
  const listener = jest.fn();
  const unsubscribe = store.subscribe(listener);

  expect(store.getSnapshot()).toBe("system|light");

  media.setDark(true);

  expect(store.getSnapshot()).toBe("system|dark");
  expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(true);
  expect(listener).toHaveBeenCalled();

  unsubscribe();
});

it("con una preferencia explícita, el cambio del sistema NO altera el tema", async () => {
  const media = mockMatchMedia(false);
  const store = await freshStore();
  store.setPreference("light");
  const listener = jest.fn();
  const unsubscribe = store.subscribe(listener);

  media.setDark(true);

  expect(store.getSnapshot()).toBe("light|light");
  expect(document.documentElement.classList.contains(DARK_CLASS)).toBe(false);
  expect(listener).not.toHaveBeenCalled();

  unsubscribe();
});

it("un cambio hecho en otra pestaña se refleja en esta", async () => {
  const store = await freshStore();
  const listener = jest.fn();
  const unsubscribe = store.subscribe(listener);

  // Otra pestaña escribe y el navegador emite `storage` solo en las DEMÁS pestañas.
  window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
  window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));

  expect(store.getSnapshot()).toBe("dark|dark");
  expect(listener).toHaveBeenCalled();

  unsubscribe();
});

it("al darse de baja deja de recibir avisos", async () => {
  const store = await freshStore();
  const listener = jest.fn();
  store.subscribe(listener)();

  store.setPreference("dark");

  expect(listener).not.toHaveBeenCalled();
});
