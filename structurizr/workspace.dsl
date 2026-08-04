/**
 * Modelo C4 de Corazón Migrante — frontend.
 *
 * Fuente oficial del modelo arquitectónico. Los diagramas Mermaid de docs/ deben
 * mantenerse coherentes con este archivo.
 *
 * Evidencia: 2026-08-03, commit 82e37332.
 * Verificado contra: next.config.ts (output: "export"), salida de `next build` (69
 * rutas), src/shared/api/endpoints.ts, public/_headers, functions/otel/v1/traces.ts.
 *
 * Renderizar con Structurizr Lite:
 *   docker run -it --rm -p 8080:8080 -v "$(pwd)/structurizr:/usr/local/structurizr" structurizr/lite
 */
workspace "Corazón Migrante" "Acompañamiento psicológico y emocional para personas migrantes y sus familias." {

    model {
        # --- Actores -------------------------------------------------------
        visitante = person "Visitante" "Persona anónima que navega el sitio público. Sin sesión."
        paciente  = person "Paciente" "Rol PACIENTE. Reserva citas y consulta contenido premium."
        terapeuta = person "Terapeuta" "Rol TERAPEUTA. Gestiona agenda, horarios y citas asignadas."
        admin     = person "Administrador" "Roles ADMIN y SUPER_ADMIN. Gestiona usuarios, contenido, publicidad y citas."
        contador  = person "Contador" "Rol CONTADOR. Registra y consulta movimientos contables."

        # --- Sistemas externos ---------------------------------------------
        backend = softwareSystem "Backend Corazón Migrante" "API NestJS en /api/v1. Autoridad de autenticación, autorización y datos." "Externo"
        cloudinary = softwareSystem "Cloudinary" "Almacenamiento y entrega de imágenes y archivos." "Externo"
        colector = softwareSystem "Colector OpenTelemetry" "Ingesta de trazas por OTLP/HTTP." "Externo"
        googleFonts = softwareSystem "Google Fonts" "Fraunces y Manrope. Se descargan en build vía next/font." "Externo"

        # --- Sistema documentado -------------------------------------------
        frontend = softwareSystem "Frontend Corazón Migrante" "Next.js 15 App Router exportado como HTML estático y servido por Cloudflare Pages." {

            spa = container "Aplicación estática" "69 rutas prerenderizadas. Todo el fetch de datos ocurre en el navegador." "Next.js 15.4.7 · React 19.2.0 · TypeScript 5.9" {

                # Capa de rutas
                rutasPublicas = component "Rutas públicas" "15 rutas bajo el grupo (public), envueltas por PublicShell." "src/app/(public)/"
                portalAdmin = component "Portal admin" "30 rutas. ClientRoleGuard ADMIN · SUPER_ADMIN · CONTADOR." "src/app/admin/"
                portalPaciente = component "Portal paciente" "7 rutas. ClientRoleGuard PACIENTE." "src/app/paciente/"
                portalTerapeuta = component "Portal terapeuta" "6 rutas. ClientRoleGuard TERAPEUTA." "src/app/terapeuta/"

                # Capa de dominio
                features = component "Features de negocio" "17 dominios: auth, booking, therapy, users, profile, dashboard, accounting, newsroom, editorial, public-view, public-content, landing, files, downloadables, products, notifications, tutorial." "src/features/"

                # Capa compartida
                clienteApi = component "Cliente API" "apiRequest(): autenticación Bearer, saneado del cuerpo, reintento por validación estricta, manejo de 401 y trazas. Único punto de salida HTTP de datos." "src/shared/api/client.ts"
                registroEndpoints = component "Registro de endpoints" "ENDPOINTS: ~110 claves en 13 grupos, todas con prefijo /api/v1." "src/shared/api/endpoints.ts"
                auth = component "Sesión y RBAC" "5 roles, 12 permisos, normalizeSession(), ClientRoleGuard, expiración por claim exp." "src/shared/auth/"
                designSystem = component "Sistema de diseño" "19 componentes compartidos sobre Tailwind y Radix." "src/shared/ui/"
                estadoServidor = component "Estado de servidor" "React Query con retry 1 y staleTime 30 s." "@tanstack/react-query"
                observabilidad = component "Observabilidad" "OpenTelemetry Web SDK: trazas, Web Vitals, saneado en dos capas." "src/observability/"
                configuracion = component "Configuración" "envSchema de zod. Falla el arranque si el entorno es inválido." "src/config/env.ts"
                notificacionesSse = component "Cliente SSE" "EventSource hacia el stream de notificaciones admin." "src/features/notifications/"
            }

            pagesFunction = container "Pages Function de telemetría" "Recibe el lote OTLP del navegador en /otel/v1/traces y lo reenvía al colector. Único código que se ejecuta fuera del navegador." "TypeScript sobre Cloudflare Workers" "Función"

            cabeceras = container "Reglas de cabeceras" "CSP, HSTS, X-Frame-Options, Permissions-Policy; noindex y no-store en los portales privados; caché inmutable para /_next/static." "public/_headers" "Configuración"
        }

        # --- Relaciones de contexto ----------------------------------------
        visitante -> frontend "Navega el sitio público" "HTTPS"
        paciente  -> frontend "Reserva citas y consulta contenido premium" "HTTPS"
        terapeuta -> frontend "Gestiona agenda y horarios" "HTTPS"
        admin     -> frontend "Administra el sistema" "HTTPS"
        contador  -> frontend "Consulta y registra contabilidad" "HTTPS"

        frontend -> backend "Consume la API con JWT" "HTTPS /api/v1"
        frontend -> cloudinary "Descarga medios; sube con firma emitida por el backend" "HTTPS"
        frontend -> googleFonts "Descarga fuentes variables en build" "HTTPS"
        frontend -> colector "Exporta trazas" "OTLP/HTTP"

        # --- Relaciones de contenedor --------------------------------------
        spa -> backend "apiRequest() con Authorization: Bearer" "HTTPS/JSON"
        spa -> cloudinary "Descarga de imágenes" "HTTPS"
        spa -> pagesFunction "Exporta trazas al mismo origen" "OTLP/HTTP"
        pagesFunction -> colector "Reenvía las trazas" "OTLP/HTTP"
        cabeceras -> spa "Aplica cabeceras de seguridad a cada respuesta"

        # --- Relaciones de componente --------------------------------------
        rutasPublicas -> features "Compone"
        portalAdmin -> auth "Protegido por ClientRoleGuard"
        portalPaciente -> auth "Protegido por ClientRoleGuard"
        portalTerapeuta -> auth "Protegido por ClientRoleGuard"
        portalAdmin -> features "Compone"
        portalPaciente -> features "Compone"
        portalTerapeuta -> features "Compone"

        features -> clienteApi "Llama a la API"
        features -> designSystem "Usa componentes compartidos"
        features -> estadoServidor "Cachea el estado de servidor"
        features -> observabilidad "Emite spans de negocio"

        clienteApi -> registroEndpoints "Resuelve rutas"
        clienteApi -> auth "Lee el token y expulsa ante 401"
        clienteApi -> observabilidad "Envuelve cada petición en un span http.client"
        clienteApi -> configuracion "Lee NEXT_PUBLIC_API_BASE_URL"
        clienteApi -> backend "fetch" "HTTPS/JSON"

        notificacionesSse -> backend "EventSource con el token en la query string" "SSE"
        observabilidad -> pagesFunction "Exporta lotes OTLP" "HTTP"
        auth -> observabilidad "Emite auth.logout y auth.session_expired"
    }

    views {
        systemContext frontend "Contexto" {
            include *
            autolayout lr
            description "C4 nivel 1 — Corazón Migrante y su entorno."
        }

        container frontend "Contenedores" {
            include *
            autolayout lr
            description "C4 nivel 2 — La aplicación estática, la Pages Function de telemetría y las reglas de cabeceras."
        }

        component spa "Componentes" {
            include *
            autolayout lr
            description "C4 nivel 3 — Capas internas de la aplicación estática."
        }

        styles {
            element "Person" {
                shape person
                background #7e3725
                color #ffffff
            }
            element "Software System" {
                background #96412c
                color #ffffff
            }
            element "Externo" {
                background #8a8a8a
                color #ffffff
            }
            element "Container" {
                background #b64f35
                color #ffffff
            }
            element "Función" {
                shape hexagon
            }
            element "Configuración" {
                shape folder
            }
            element "Component" {
                background #cf7159
                color #ffffff
            }
        }

        theme default
    }
}
