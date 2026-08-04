import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**/page.tsx",
    "!src/app/**/layout.tsx"
  ],
  coverageDirectory: "coverage",
  /**
   * Umbral NO REGRESIVO. Los valores están fijados justo por debajo de la cobertura
   * real medida el 2026-08-03 (statements 34,45 % · branches 28,87 % · functions
   * 25,13 % · lines 35,62 %), con un margen de ~1 punto para que una refactorización
   * legítima no rompa el pipeline.
   *
   * El objetivo no es celebrar estas cifras —son bajas— sino impedir que BAJEN. La
   * deuda preexistente no bloquea; una regresión nueva sí. Al subir la cobertura,
   * subir también estos números: un umbral que se queda atrás deja de proteger.
   *
   * Solo se aplica con `--coverage`, así que no afecta a `yarn test:unit` ni al
   * tiempo del pipeline actual.
   */
  coverageThreshold: {
    global: {
      statements: 33,
      branches: 27,
      functions: 24,
      lines: 34
    }
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/tests/e2e/"]
};

export default createJestConfig(config);
