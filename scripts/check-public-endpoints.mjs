const baseUrl = (process.env.BACKEND_INTEGRATION_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.corazondemigrante.com').replace(/\/$/, '');
const timeoutMs = Number(process.env.PUBLIC_ENDPOINT_TIMEOUT_MS || 12000);

const requiredGroups = [
  {
    label: 'landing pública',
    endpoints: [
      ['/api/v1/public-views/1', 'vista pública legacy'],
      ['/api/v1/public/pages/inicio', 'página CMS inicio'],
      ['/api/v1/public/pages/by-id/1', 'página CMS por id']
    ]
  },
  {
    label: 'biblioteca pública',
    endpoints: [
      ['/api/v1/public/pages/biblioteca', 'página CMS biblioteca'],
      ['/api/v1/public-views/2', 'vista pública biblioteca legacy']
    ]
  }
];

const optionalEndpoints = [
  ['/api/v1/public/pages/inicio/elements/hero', 'hero de inicio'],
  ['/api/v1/public/pages/biblioteca/elements/hero', 'hero de biblioteca']
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

    console.log(`${ok ? '[OK]' : '[NO]'} ${label} ${path} -> ${response.status}`);
    if (!ok && text) console.log(text.slice(0, 500));
    return ok;
  } catch (error) {
    console.log(`[NO] ${label} ${path} -> ${error instanceof Error ? error.message : String(error)}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

let failed = false;
for (const group of requiredGroups) {
  console.log(`\nValidando ${group.label}...`);
  const results = [];
  for (const [path, label] of group.endpoints) {
    results.push(await check(path, label));
  }

  if (!results.some(Boolean)) {
    failed = true;
    console.error(`[FAIL] Ninguna ruta compatible respondió para ${group.label}.`);
  }
}

console.log('\nValidando endpoints opcionales...');
for (const [path, label] of optionalEndpoints) {
  await check(path, label);
}

if (failed) {
  console.error(`\nLa validación pública falló contra ${baseUrl}. Debe responder al menos una ruta compatible para landing y una para biblioteca.`);
  process.exit(1);
}

console.log(`\nValidación pública OK contra ${baseUrl}.`);
