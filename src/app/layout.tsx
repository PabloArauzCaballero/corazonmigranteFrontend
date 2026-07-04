import type { Metadata } from "next";
import { AppProviders } from "@/app/providers";
import "@/app/globals.css";

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
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
