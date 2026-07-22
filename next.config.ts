import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Raíz del proyecto (carpeta de este archivo). Evita que Next infiera la raíz a
// partir de un lockfile ajeno (p. ej. C:\Users\<user>\package-lock.json) cuando
// hay múltiples lockfiles en directorios superiores.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  eslint: {
    // El lint se corre por separado (yarn lint). No debe bloquear el build de
    // despliegue: hay reglas nuevas de react-hooks pendientes de limpiar.
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
