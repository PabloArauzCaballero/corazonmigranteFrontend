import net from "node:net";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preferredPort = Number.parseInt(process.env.NEXT_PUBLIC_DEV_PORT ?? process.env.PORT ?? "5173", 10);
const maxAttempts = Number.parseInt(process.env.NEXT_PUBLIC_DEV_PORT_SCAN_LIMIT ?? "30", 10);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findFreePort(startPort) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidate = startPort + offset;
    if (await isFree(candidate)) return candidate;
  }
  throw new Error(`No se encontró un puerto libre entre ${startPort} y ${startPort + maxAttempts - 1}. Cambia NEXT_PUBLIC_DEV_PORT.`);
}

const port = await findFreePort(preferredPort);
const nextCli = join(rootDir, "node_modules", "next", "dist", "bin", "next");

const env = {
  ...process.env,
  PORT: String(port),
  NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
  NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED ?? "1"
};

console.log(`\nCorazón Migrante frontend: http://localhost:${port}`);
console.log(`Backend esperado: ${env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000"}`);
console.log("Si el backend está en otro puerto, ajusta NEXT_PUBLIC_API_BASE_URL en .env.local.\n");

// `--turbopack` solo en DESARROLLO. El build de producción sigue en webpack a
// propósito: en Next 15.4 el build con Turbopack está marcado como experimental
// y, sobre todo, «always builds production source maps for the browser», lo que
// publicaría el código fuente del panel. Ver docs/adr/ADR-0012.
// Se puede desactivar con NEXT_DISABLE_TURBOPACK=1 para comparar o diagnosticar.
const useTurbopack = process.env.NEXT_DISABLE_TURBOPACK !== "1";
const devArgs = ["dev", "-p", String(port), ...(useTurbopack ? ["--turbopack"] : [])];

const child = spawn(process.execPath, [nextCli, ...devArgs], {
  stdio: "inherit",
  env,
  cwd: rootDir
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
