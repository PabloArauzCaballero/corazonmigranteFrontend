const baseUrl = (process.env.BACKEND_INTEGRATION_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.corazondemigrante.com').replace(/\/$/, '');
const timeoutMs = Number(process.env.PUBLIC_ENDPOINT_TIMEOUT_MS || 12000);

// Contrato real del backend incluido: no existen /public-views/:id ni /public/pages/:slug/elements/:code.
const endpoints = [
  ['/api/v1/health', 'health'],
  ['/api/v1/public/pages/inicio', 'landing CMS page'],
  ['/api/v1/public/pages/biblioteca', 'biblioteca CMS page'],
  ['/api/v1/therapy/products?page=1&pageSize=1', 'public therapy products'],
  ['/api/v1/publications/news?page=1&pageSize=1', 'public news']
];

async function check(path, label) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal });
    const text = await response.text().catch(() => '');
    const contentType = response.headers.get('content-type') || '';
    const ok = response.status === 200 && contentType.includes('application/json');

    console.log(`${ok ? '[OK]' : '[FAIL]'} ${label} ${path} -> ${response.status}`);
    if (!ok) {
      console.log(text.slice(0, 700));
      return false;
    }
    return true;
  } catch (error) {
    console.log(`[FAIL] ${label} ${path} -> ${error instanceof Error ? error.message : String(error)}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

const results = [];
for (const [path, label] of endpoints) {
  results.push(await check(path, label));
}

if (results.some((item) => !item)) {
  console.error(`\nPublic endpoint check failed against ${baseUrl}. Fix backend bootstrap/env before deploying the frontend.`);
  process.exit(1);
}

console.log(`\nAll public endpoint checks passed against ${baseUrl}.`);
