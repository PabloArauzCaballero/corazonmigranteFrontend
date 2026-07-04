# Plan de pruebas

## Unitarias
```bash
yarn test:unit
```

Cubren:
- normalización de sesión y roles backend/frontend;
- cliente API con bearer token real de sesión;
- normalización de respuestas paginadas;
- bloqueo de fixtures/mocks de negocio dentro de `src`.

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
