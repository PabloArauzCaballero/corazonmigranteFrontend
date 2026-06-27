# Plan de pruebas

## Comandos
```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run test:smoke
```

## Smoke actual
`npm run test:smoke` valida existencia de rutas, documentación y archivos críticos.

## Playwright
Se incluye configuración base y test e2e mínimo. Para ejecutarlo:
```bash
npm run dev
npx playwright install chromium
npm run test:e2e
```

## PENDIENTE_CM
Con backend real, agregar pruebas de login, permisos, filtros server-side, booking y errores 401/403/422.
