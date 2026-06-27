# Supuestos de arquitectura

## SUPUESTO_CM: Frontend reconstruido desde cero
Se implementa una base nueva en Next.js 15 App Router. El frontend React/Vite anterior queda solo como referencia funcional.

## SUPUESTO_CM: Sesión normalizada en cliente
La sesión se normaliza a `NormalizedSession` con `role` y `permissions`. El backend real puede seguir enviando flags legacy; la adaptación se concentra en `src/shared/auth/session.ts`.

## SUPUESTO_CM: Modo demo opcional
`NEXT_PUBLIC_ENABLE_DEMO_MODE=true` permite probar pantallas sin backend. En producción debe estar en `false`.

## PENDIENTE_CM: Confirmar contrato real del backend
Faltan confirmar payloads definitivos, respuestas de paginación y errores de validación de todos los endpoints.
