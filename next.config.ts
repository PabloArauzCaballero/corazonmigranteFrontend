import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { assertDeployableAppUrl, env } from "./src/config/env";

// Se ejecuta una sola vez, al cargar la configuración del build. Rompe el build en
// CI si la URL pública apunta a localhost — ver PENDIENTE_CM_ENV_PRODUCCION y el
// comentario de `assertDeployableAppUrl`.
assertDeployableAppUrl(env.NEXT_PUBLIC_APP_URL);

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
  // El lint vuelve a bloquear el build: ya no hay deuda pendiente de react-hooks y
  // dejarlo desactivado permitía que llegaran a producción errores reales (renders
  // en cascada, componentes recreados en cada render, enlaces internos con <a>).
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
