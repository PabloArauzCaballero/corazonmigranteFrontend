import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * Construye una paleta de Tailwind cuyos once tonos apuntan a variables CSS
 * (`--brand-500`, `--neutral-200`…) definidas en `src/app/tokens.css`.
 *
 * Se usa `<alpha-value>` para que los modificadores de opacidad de Tailwind
 * sigan funcionando (`bg-teal-800/40`): sin él, Tailwind no sabría dónde
 * inyectar el canal alfa y esas clases quedarían opacas.
 */
function scale(name: string): Record<string, string> {
  return Object.fromEntries(
    SHADES.map((shade) => [shade, `hsl(var(--${name}-${shade}) / <alpha-value>)`]),
  );
}

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
        // --- Paletas remapeadas a tokens ---------------------------------
        // Estas cinco paletas de Tailwind están redirigidas a variables CSS
        // (`src/app/tokens.css`). Los valores del tema CLARO son idénticos a
        // los anteriores, así que el aspecto no cambia; lo que se gana es que
        // ~490 usos ya existentes (`text-teal-800`, `bg-slate-50`,
        // `text-red-600`…) respondan al tema oscuro sin reescribir nada.
        //
        // En el tema oscuro la escala se INVIERTE: `bg-*-50` sigue siendo
        // «fondo sutil» y `text-*-800` sigue siendo «tinta de alto contraste».
        //
        // ⚠️ `teal` NO es verde azulado en este proyecto: es el rojo/marrón del
        // logo (ADR-0006). El código nuevo debe usar `brand-*`, `ink-*`,
        // `success`, `warning` y `destructive`, no estas paletas.
        teal: scale("brand"),
        slate: scale("neutral"),
        emerald: scale("positive"),
        amber: scale("caution"),
        red: scale("negative"),
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
          foreground: "hsl(var(--destructive-foreground))",
          surface: "hsl(var(--destructive-surface))",
          border: "hsl(var(--destructive-border))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },

        // --- Escala de superficie e ink -----------------------------------
        // Sustituyen a los literales hexadecimales que se repetían por toda
        // la landing y los portales (`bg-[#fbfaf8]`, `text-[#2b1b17]`…).
        surface: {
          raised: "hsl(var(--surface-raised))",
          sunken: "hsl(var(--surface-sunken))",
          accent: "hsl(var(--surface-accent))",
          inverse: "hsl(var(--surface-inverse))",
          "inverse-deep": "hsl(var(--surface-inverse-deep))",
          "inverse-foreground": "hsl(var(--surface-inverse-foreground))"
        },
        ink: {
          DEFAULT: "hsl(var(--foreground))",
          soft: "hsl(var(--ink-soft))",
          muted: "hsl(var(--ink-muted))",
          subtle: "hsl(var(--ink-subtle))"
        },
        line: {
          DEFAULT: "hsl(var(--line))",
          strong: "hsl(var(--line-strong))"
        },

        // --- Acentos editoriales de marca ---------------------------------
        brand: {
          terracotta: "hsl(var(--brand-terracotta))",
          clay: "hsl(var(--brand-clay))",
          plum: "hsl(var(--brand-plum))",
          gold: "hsl(var(--brand-gold))",
          sand: "hsl(var(--brand-sand))"
        },

        // --- Estados semánticos -------------------------------------------
        // `DEFAULT` es el color fuerte (texto/icono/relleno sólido);
        // `surface` y `border` componen el aviso suave.
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          surface: "hsl(var(--success-surface))",
          border: "hsl(var(--success-border))"
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          surface: "hsl(var(--warning-surface))",
          border: "hsl(var(--warning-border))"
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          surface: "hsl(var(--info-surface))",
          border: "hsl(var(--info-border))"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"]
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        // `soft` se conserva como alias del nivel `lg` para no romper los
        // componentes que ya la usaban.
        soft: "var(--shadow-lg)",
        "elev-sm": "var(--shadow-sm)",
        "elev-md": "var(--shadow-md)",
        "elev-lg": "var(--shadow-lg)",
        overlay: "var(--shadow-overlay)"
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)"
      },
      transitionTimingFunction: {
        "ease-out-soft": "var(--ease-out)"
      },
      zIndex: {
        sticky: "var(--z-sticky)",
        header: "var(--z-header)",
        overlay: "var(--z-overlay)",
        toast: "var(--z-toast)",
        "skip-link": "var(--z-skip-link)"
      }
    }
  },
  plugins: [forms]
};

export default config;
