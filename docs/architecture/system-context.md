# Contexto del sistema (C4 nivel 1)

- **Fecha de evidencia:** 2026-08-03
- **Fuente oficial del modelo:** [structurizr/workspace.dsl](../../structurizr/workspace.dsl)

---

## 1. Diagrama de contexto

```mermaid
C4Context
    title Contexto — Corazón Migrante

    Person(paciente, "Paciente", "Persona migrante que busca acompañamiento emocional")
    Person(terapeuta, "Terapeuta", "Profesional que atiende citas y gestiona su agenda")
    Person(admin, "Administrador", "Gestiona usuarios, contenido, publicidad y citas")
    Person(contador, "Contador", "Registra y consulta movimientos contables")
    Person(visitante, "Visitante", "Persona anónima que navega el sitio público")

    System(frontend, "Frontend Corazón Migrante", "Next.js 15 exportado como HTML estático sobre Cloudflare Pages")

    System_Ext(backend, "Backend Corazón Migrante", "API NestJS en /api/v1. Autoridad de autenticación, autorización y datos")
    System_Ext(cloudinary, "Cloudinary", "Almacenamiento y entrega de imágenes y archivos")
    System_Ext(fonts, "Google Fonts", "Fraunces y Manrope, cargadas vía next/font")
    System_Ext(otel, "Colector OpenTelemetry", "Recibe trazas por OTLP HTTP")

    Rel(visitante, frontend, "Navega el sitio público", "HTTPS")
    Rel(paciente, frontend, "Reserva citas, consulta contenido premium", "HTTPS")
    Rel(terapeuta, frontend, "Gestiona agenda y horarios", "HTTPS")
    Rel(admin, frontend, "Administra el sistema", "HTTPS")
    Rel(contador, frontend, "Consulta y registra contabilidad", "HTTPS")

    Rel(frontend, backend, "Consume la API con JWT", "HTTPS /api/v1")
    Rel(frontend, cloudinary, "Descarga medios; sube con firma del backend", "HTTPS")
    Rel(frontend, fonts, "Descarga fuentes variables", "HTTPS")
    Rel(frontend, otel, "Exporta trazas vía Pages Function", "OTLP/HTTP")
```

---

## 2. Actores

| Actor | Rol técnico | Punto de entrada | Portal |
|---|---|---|---|
| Visitante | — (sin sesión) | `/` | Sitio público |
| Paciente | `PACIENTE` | `/login` | `/paciente` |
| Terapeuta | `TERAPEUTA` | `/admin/login` | `/terapeuta` |
| Administrador | `ADMIN`, `SUPER_ADMIN` | `/admin/login` | `/admin` |
| Contador | `CONTADOR` | `/admin/login` | `/admin/contabilidad` |

Detalle de permisos en [business/actors-and-roles.md](../business/actors-and-roles.md).

---

## 3. Sistemas externos

### Backend NestJS — `/api/v1`

**La autoridad del sistema.** El frontend no toma ninguna decisión de seguridad que el backend no pueda revocar.

- Configurado por `NEXT_PUBLIC_API_BASE_URL` (validada como URL por zod en [config/env.ts](../../src/config/env.ts)).
- Sin ella, `apiBaseUrl()` lanza `ApiError(…, 500)` en la primera llamada.
- El cliente normaliza la base: si alguien deja `https://dominio/api/v1`, el sufijo se recorta para evitar `/api/v1/api/v1/...`.
- En desarrollo detecta y rechaza que la variable apunte al propio frontend.

Mapa completo en [integrations/backend-api.md](../integrations/backend-api.md).

### Cloudinary

Entrega de imágenes y archivos. Las URLs concretas llegan por más de una docena de variables `NEXT_PUBLIC_FILE_SERVER_*`. La subida usa **firma emitida por el backend** (`/files/cloudinary/signature` → `/files/cloudinary/complete`): el frontend nunca posee credenciales de Cloudinary.

Ver [integrations/file-storage.md](../integrations/file-storage.md) y [CLOUDINARY-ASSETS.md](../CLOUDINARY-ASSETS.md).

### Google Fonts

Fraunces y Manrope vía `next/font/google`, que las descarga **en build** y las sirve desde el propio origen. La CSP mantiene `fonts.googleapis.com` y `fonts.gstatic.com` permitidos en `style-src` y `font-src`.

### Colector OpenTelemetry

Las trazas se exportan por OTLP HTTP a `/otel/v1/traces` — **mismo origen**, atendido por la Cloudflare Pages Function [functions/otel/v1/traces.ts](../../functions/otel/v1/traces.ts), que reenvía al colector. Configuración de referencia en [infra/otel-collector/](../../infra/otel-collector/).

Que el destino sea el mismo origen es lo que permite que la CSP no necesite abrir `connect-src` a ningún host externo por telemetría.

---

## 4. Fronteras de confianza

```mermaid
flowchart LR
    subgraph NC["🔴 No confiable — navegador"]
        HTML["HTML estático<br/>(descargable sin sesión)"]
        JS["Bundle JS<br/>(inspeccionable)"]
        LS["localStorage: JWT<br/>Cookie: rol"]
    end
    subgraph CDN["🟡 Borde — Cloudflare Pages"]
        H["_headers: CSP, HSTS,<br/>X-Frame-Options, no-store"]
        F["Pages Function<br/>/otel/v1/traces"]
    end
    subgraph C["🟢 Confiable — servidor"]
        API["Backend NestJS<br/>valida el JWT en cada endpoint"]
        DB[("Base de datos")]
    end

    NC -->|"HTTPS + Bearer"| C
    NC --> CDN
    CDN --> C
    API --> DB
```

**Regla que gobierna todo el frontend:** nada dentro de la frontera roja es una medida de seguridad. Ocultar un botón, comprobar un rol en el guard o derivar permisos en el cliente son decisiones de **experiencia de uso**. La autorización real ocurre en verde.

Modelo de amenazas completo en [security/threat-model.md](../security/threat-model.md).
