import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Se deja como aplicación Next.js servida por Node para que la landing pública
  // pueda renderizarse desde el backend en el primer HTML. El modo de exportación
  // estática dejaba la home congelada en una pantalla inicial de carga.
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
