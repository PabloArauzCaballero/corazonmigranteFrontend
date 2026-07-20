import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { AppProviders } from "@/app/providers";
import "@/app/globals.css";

// Tipografía display (títulos) — serif editorial con carácter humano.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Tipografía de cuerpo — sans moderna, alta legibilidad.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Corazón Migrante",
    template: "%s | Corazón Migrante"
  },
  description: "Acompañamiento psicológico y emocional para personas migrantes y sus familias.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Corazón Migrante",
    description: "Un espacio de acompañamiento emocional humano, seguro y profesional.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
