import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "api-requests.log");

/**
 * Recibe cada llamada al backend (request + response) desde el cliente y la anexa a
 * logs/api-requests.log. Pensado para depuración local: si escribir falla (filesystem
 * de solo lectura en producción/serverless) se ignora en silencio, nunca rompe la app.
 */
export async function POST(request: NextRequest) {
  try {
    const entry = await request.json();
    await mkdir(LOG_DIR, { recursive: true });
    const line = `${JSON.stringify({ receivedAt: new Date().toISOString(), ...entry })}\n`;
    await appendFile(LOG_FILE, line, "utf8");
  } catch {
    // el logging nunca debe romper la app
  }
  return NextResponse.json({ ok: true });
}
