import { defineConfig, devices } from "@playwright/test";

/**
 * Revisión visual de la landing.
 * Uso:
 *   npx playwright install chromium   # una vez
 *   npm run dev                        # levanta la app en :5173 (o ajusta baseURL)
 *   npx playwright test                # corre la revisión + screenshots
 *
 * Los screenshots quedan en tests/e2e/__screenshots__ para revisar el
 * acomodado de imágenes en desktop, tablet y móvil.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/.output",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "tablet", use: { ...devices["iPad (gen 7)"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
