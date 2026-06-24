import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#742f38",
                "brand-gold": "#D1A73A",
                "brand-cream": "#fbf7f4",
                "background-light": "#f7f6f6",
                "background-dark": "#1d1516",
                "cream-panel": "#fbf7f4",
                "background-soft": "#f7f6f6",
                "primary-dark": "#4a1b21",
                "primary-light": "#8a454d",
                secondary: "#E8E2DE",
                "surface-light": "#ffffff",
                "border-light": "#e5e1df",
                "text-main-light": "#2d2424",
                "text-muted-light": "#7c6f6f",
            },
            fontFamily: {
                display: ["Manrope", "Playfair Display", "sans-serif"],
                body: ["Manrope", "Inter", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                lg: "0.75rem",
                xl: "1.5rem",
                full: "9999px",
                "2xl": "1.25rem",
            },
            boxShadow: {
                soft: "0 4px 20px -2px rgba(109, 46, 54, 0.08)",
                "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)",
            },
        },
    },
    plugins: [forms, containerQueries],
};
