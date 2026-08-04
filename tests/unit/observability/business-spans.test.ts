import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BUSINESS_SPANS, TECHNICAL_SPANS } from "@/observability/core/tracing.constants";

const CATALOG_PATH = join(process.cwd(), "docs/observability/frontend/03-business-spans-catalog.md");
const CONVENTIONS_PATH = join(process.cwd(), "docs/observability/frontend/02-naming-conventions.md");

/**
 * El catálogo de spans de negocio vive en dos sitios: la constante y el documento.
 * Esta suite impide que se separen — que es lo que siempre acaba pasando.
 */
describe("catálogo de spans de negocio", () => {
  const catalog = readFileSync(CATALOG_PATH, "utf8");

  it.each(Object.values(BUSINESS_SPANS))("el span %s está documentado en 03-business-spans-catalog.md", (name) => {
    expect(catalog).toContain(`\`${name}\``);
  });

  it("todos los nombres siguen el formato <dominio>.<acción>", () => {
    for (const name of Object.values(BUSINESS_SPANS)) {
      expect(name).toMatch(/^[a-z]+(\.[a-z]+)+$/);
    }
  });

  it("ningún nombre contiene un identificador, un número o texto interpolado", () => {
    for (const name of Object.values([...Object.values(BUSINESS_SPANS), ...Object.values(TECHNICAL_SPANS)])) {
      expect(name).not.toMatch(/\d/);
      expect(name).not.toContain("$");
      expect(name).not.toContain("{");
      expect(name).not.toContain("/");
    }
  });

  it("los nombres son únicos", () => {
    const names = Object.values(BUSINESS_SPANS);
    expect(new Set(names).size).toBe(names.length);
  });

  it("el catálogo no documenta spans que el código no emite", () => {
    // Cada encabezado `## \`algo.algo\`` del documento debe corresponder a una constante.
    const documented = [...catalog.matchAll(/^## `([a-z.]+)`$/gm)].map((match) => match[1]);
    const declared = new Set<string>(Object.values(BUSINESS_SPANS));

    expect(documented.length).toBeGreaterThan(0);
    expect(documented.filter((name) => !declared.has(name))).toEqual([]);
  });
});

describe("convenciones de nombres", () => {
  const conventions = readFileSync(CONVENTIONS_PATH, "utf8");

  it("el documento 02 declara el mismo catálogo cerrado", () => {
    for (const name of Object.values(BUSINESS_SPANS)) {
      expect(conventions).toContain(name);
    }
  });
});
