import type { MetadataRoute } from "next";

// Requerido con `output: export`: robots.txt se genera en build (estático).
export const dynamic = "force-static";

// Se normaliza la barra final: con NEXT_PUBLIC_APP_URL="https://dominio.com/" se
// generaban URLs con doble barra ("https://dominio.com//sitemap.xml").
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://corazonmigrante.com").replace(/\/+$/, "");

/**
 * Next.js App Router robots.ts — generates /robots.txt at build time.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin/",
          "/paciente/",
          "/terapeuta/",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
