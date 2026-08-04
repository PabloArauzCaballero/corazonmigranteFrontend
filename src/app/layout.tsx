import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { AppProviders } from "@/app/providers";
import { env } from "@/config/env";
import { THEME_COLOR, THEME_INIT_SCRIPT } from "@/shared/theme/theme";
import "@/app/globals.css";

// Tipografía display (títulos) — serif editorial con carácter humano.
// Fraunces y Manrope son fuentes VARIABLES: al no declarar `weight` se descarga un
// único archivo que cubre todo el rango de grosores, en vez de un archivo estático
// por cada peso (antes eran 5 pesos × 2 estilos = 10 descargas solo para los títulos).
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Tipografía de cuerpo — sans moderna, alta legibilidad.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_DESCRIPTION =
  "Acompañamiento psicológico y emocional para personas migrantes y sus familias.";

export const metadata: Metadata = {
  title: {
    default: "Corazón Migrante",
    template: "%s | Corazón Migrante"
  },
  description: SITE_DESCRIPTION,
  applicationName: env.NEXT_PUBLIC_APP_NAME,
  // Se toma de `env` (validado por zod, con default coherente con el resto del
  // proyecto) en vez de leer process.env con un fallback distinto: antes esto
  // apuntaba a localhost:3000, que es el BACKEND, y generaba URLs canónicas y de
  // Open Graph incorrectas en cuanto faltara la variable.
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Corazón Migrante",
    description: "Un espacio de acompañamiento emocional humano, seguro y profesional.",
    siteName: env.NEXT_PUBLIC_APP_NAME,
    locale: "es_ES",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Corazón Migrante",
    description: SITE_DESCRIPTION
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false }
};

export const viewport: Viewport = {
  // Faltaba por completo: sin `width=device-width` el móvil renderiza el sitio a
  // 980 px y lo escala, y sin `themeColor` la barra del navegador no acompaña a la
  // marca. `maximumScale` se deja libre a propósito — limitar el zoom rompe WCAG 1.4.4.
  width: "device-width",
  initialScale: 1,
  // Un solo `themeColor` sin `media`: el valor real lo fija el script anti-parpadeo
  // y lo mantiene `applyTheme()`. Con entradas por `prefers-color-scheme` la barra
  // del navegador seguía al SISTEMA aunque la persona hubiera elegido otro tema a
  // mano, que era justo la contradicción registrada en design-system/themes.md.
  themeColor: THEME_COLOR.light,
  // El sitio ya soporta ambos esquemas; `color-scheme` real lo declaran
  // `:root` y `.dark` en globals.css, que es lo que ve el navegador al pintar
  // controles nativos y barras de desplazamiento.
  colorScheme: "light dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // `suppressHydrationWarning`: el script de abajo añade la clase `dark` al
    // <html> antes de que React hidrate, así que el atributo `class` del cliente
    // no coincide con el del HTML estático. Es intencionado y afecta solo a este
    // elemento — no silencia desajustes dentro de la aplicación.
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Debe ir antes de cualquier contenido pintable para evitar el destello
            blanco al cargar en tema oscuro. Ver THEME_INIT_SCRIPT. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#contenido-principal">Saltar al contenido principal</a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
