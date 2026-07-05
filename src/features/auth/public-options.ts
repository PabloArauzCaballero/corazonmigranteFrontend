import { fileServer } from "@/config/file-server";

async function fetchJson<T>(url?: string): Promise<T> {
  if (!url) throw new Error("URL de datos públicos no configurada.");
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function fetchCountriesCities() {
  return fetchJson<Record<string, string[]>>(fileServer.countriesCitiesUrl);
}

export function fetchOccupations() {
  return fetchJson<string[]>(fileServer.occupationsUrl);
}
