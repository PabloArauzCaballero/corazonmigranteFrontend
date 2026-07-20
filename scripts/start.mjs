import { spawn } from "node:child_process";

const port = process.env.PORT || "4173";
const host = process.env.HOST || "0.0.0.0";
const nextBin = process.platform === "win32" ? "next.cmd" : "next";

const child = spawn(nextBin, ["start", "-p", port, "-H", host], {
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`No se pudo iniciar Next.js: ${error.message}`);
  process.exit(1);
});
