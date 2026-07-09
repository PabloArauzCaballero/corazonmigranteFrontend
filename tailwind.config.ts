import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./tests/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px"
      }
    },
    extend: {
      colors: {
        // Paleta de marca (rojo/marron del logo de Corazon Migrante) reemplazando el
        // "teal" por defecto de Tailwind: el sitio usa clases teal-800/900/950 en
        // muchos componentes, y remapear la paleta aqui evita tener que tocar cada uno.
        teal: {
          50: "#faf1ef",
          100: "#f5e0db",
          200: "#eac2b8",
          300: "#dd9988",
          400: "#cf7159",
          500: "#b64f35",
          600: "#96412c",
          700: "#7e3725",
          800: "#673022",
          900: "#54271c",
          950: "#361912"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(41, 37, 36, 0.10)"
      }
    }
  },
  plugins: [forms]
};

export default config;
