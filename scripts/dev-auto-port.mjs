import net from "node:net";
import { spawn } from "node:child_process";

const preferredPort = Number.parseInt(process.env.NEXT_PUBLIC_DEV_PORT ?? process.env.PORT ?? "4173", 10);
const maxAttempts = Number.parseInt(process.env.NEXT_PUBLIC_DEV_PORT_SCAN_LIMIT ?? "30", 10);

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
const command = process.platform === "win32" ? "yarn.cmd" : "yarn";

const env = {
  ...process.env,
  PORT: String(port),
  NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
  NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED ?? "1"
};

console.log(`\nCorazón Migrante frontend: http://localhost:${port}`);
console.log(`Backend esperado: ${env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000"}`);
console.log("Si el backend está en otro puerto, ajusta NEXT_PUBLIC_API_BASE_URL en .env.local.\n");

const child = spawn(command, ["next", "dev", "-p", String(port)], {
  stdio: "inherit",
  env
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
