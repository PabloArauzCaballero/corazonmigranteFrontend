import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { THEME_COLOR } from "@/shared/theme/theme";

// Requerido con `output: export`: el manifest se genera en build (estático).
export const dynamic = "force-static";

/**
 * Manifest de aplicación web. Permite instalar el sitio en el móvil y, sobre todo,
 * da nombre, color e icono coherentes cuando alguien lo añade a la pantalla de
 * inicio — habitual en un servicio que se consulta desde el teléfono.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: env.NEXT_PUBLIC_APP_NAME,
    short_name: "Corazón Migrante",
    description:
      "Acompañamiento psicológico y emocional para personas migrantes y sus familias.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // El manifest se consume fuera del navegador (lanzador del sistema), así que
    // no puede leer variables CSS: son los únicos literales legítimos del color.
    // Se toman de THEME_COLOR para que no diverjan de los tokens.
    background_color: THEME_COLOR.light,
    // `theme_color` pinta la barra de la app instalada. Antes era `#27120c`, un
    // marrón que ya no corresponde a ningún token; ahora es el fondo real del
    // tema oscuro.
    theme_color: THEME_COLOR.dark,
    lang: "es",
    dir: "ltr",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
