function normMode(v) {
    return String(v || "").trim().toUpperCase();
}

const MODE = normMode(import.meta.env.VITE_MODE);

const DEV_URL = import.meta.env.VITE_API_URL_DEV || "https://apidev.corazondemigrante.com";
const PROD_URL = import.meta.env.VITE_API_URL_PROD || "https://api.corazondemigrante.com";

export const API_URL = DEV_URL;
