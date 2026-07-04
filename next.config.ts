import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Evita bloqueos en la fase "Collecting build traces" dentro de entornos CI/container.
  // La app no usa `output: standalone`; se despliega con dependencias instaladas por Yarn en el entorno de destino.
  outputFileTracingExcludes: {
    "/*": ["**/*"],
    "*": ["**/*"]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com"
      }
    ]
  }
};

export default nextConfig;
