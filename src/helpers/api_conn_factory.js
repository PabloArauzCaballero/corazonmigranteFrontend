import { API_URL } from "../config/API_URL";

/**
 * Universal API helper
 * @param {string} endpoint - Endpoint route (e.g. "api/files/list" o "/api/files/list")
 * @param {object|FormData|null} payload - Query params for GET | Body for POST/PUT | FormData for upload
 * @param {string} method - HTTP Method (GET, POST, PUT, DELETE)
 * @param {object|null} session - Session object containing token (e.g. session.access_token)
 */
export async function createApiConn(endpoint, payload = {}, method = "POST", session) {
    if (typeof endpoint !== "string" || endpoint.trim() === "") {
        throw new Error(
            `API endpoint indefinido o inválido. Recibido: ${String(endpoint)}`
        );
    }


    const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    let url = `${API_URL}${normalized}`;

    const headers = {
        ...(payload instanceof FormData || method.toUpperCase() === "GET"
            ? {}
            : { "Content-Type": "application/json; charset=utf-8" }),
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };

    const options = {
        method: method.toUpperCase(),
        headers,
    };

    if (options.method === "GET") {
        if (payload && typeof payload === "object" && !(payload instanceof FormData)) {
            const queryParams = new URLSearchParams(
                Object.entries(payload).reduce((acc, [k, v]) => {
                    if (v === undefined || v === null || v === "") return acc;
                    acc[k] = String(v);
                    return acc;
                }, {})
            ).toString();

            if (queryParams) url += `?${queryParams}`;
        }
    } else {
        if (payload instanceof FormData) {
            options.body = payload;
        } else if (payload !== undefined && payload !== null) {
            options.body = JSON.stringify(payload);
        }
    }



    try {
        const response = await fetch(url, options);

        const contentType = response.headers.get("content-type") || "";
        let data = {};
        if (contentType.includes("application/json")) {
            data = await response.json().catch(() => ({}));
        } else {
            const text = await response.text().catch(() => "");
            data = text ? { message: text } : {};
        }

        if (!response.ok) {
            const error = new Error(data.message || `Error ${response.status}: ${response.statusText}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }


        return data;
    } catch (error) {
        console.error(`API Conn Error [${method} ${endpoint}]:`, error);
        throw error;
    }
}
