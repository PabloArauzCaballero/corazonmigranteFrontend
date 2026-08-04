# Plan de pruebas

## Unitarias
```bash
yarn test:unit
```

Cubren:
- normalización de sesión y roles backend/frontend;
- cliente API con bearer token real de sesión;
- normalización de respuestas paginadas;
- bloqueo de fixtures/mocks de negocio dentro de `src`;
- motor de tutoriales: validación del catálogo, registro y filtrado por rol/permiso,
  máquina de estados, progreso y versionado, persistencia, resolución de objetivos en el
  DOM (incluidos los asíncronos e inexistentes), accesibilidad de la tarjeta y Centro de
  ayuda. Detalle en `docs/modules/tutorials-module.md`.

## CI local
```bash
yarn test:ci
```

Ejecuta lint, typecheck, unitarias y smoke estático.

## Integración backend real
```bash
BACKEND_INTEGRATION_BASE_URL=http://localhost:3000 yarn test:integration:backend
```

Esta prueba falla si no se configura backend real. No usa mockups.

Valida:
- `/api/v1/health`;
- `/api/v1/therapy/products`;
- `/api/v1/booking/availability` con parámetros inválidos, esperando validación real del backend;
- `POST /api/v1/appointments` sin JWT, esperando 401/403 para confirmar que booking no es público;
- login inválido contra backend.

## Extremo a extremo (Playwright)
```bash
yarn test:e2e:install                                   # una vez
yarn dev                                                # levanta la app
E2E_BASE_URL=http://localhost:4173 yarn test:e2e
```

- `tests/e2e/landing-visual.spec.ts`: revisión visual de la landing en escritorio, tableta y móvil.
- `tests/e2e/tutorials.spec.ts`: recorrido del tutorial público — avance y retroceso, teclado
  (flechas y `Escape` con confirmación), reanudación desde el paso guardado y encaje de la
  tarjeta en móvil. Se omite con motivo explícito si la portada pública no carga porque el
  backend no está disponible.
