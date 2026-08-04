# Runbook — La aplicación no carga

## Síntoma

El dominio no responde, agota el tiempo de espera, o devuelve `5xx` en la propia carga del HTML.

## Impacto

**Caída total.** Ninguna ruta, ni siquiera las estáticas.

## Por qué es poco frecuente aquí

Se sirve HTML estático desde el borde de Cloudflare. No hay servidor de aplicación que pueda caerse. Una indisponibilidad total apunta a la plataforma, al DNS o al certificado — casi nunca al código.

## Diagnóstico seguro

```bash
# 1. DNS
nslookup DOMINIO

# 2. Conectividad y TLS
curl -sv https://DOMINIO/ 2>&1 | head -30

# 3. Código de estado
curl -s -o /dev/null -w "%{http_code}\n" https://DOMINIO/

# 4. Certificado
echo | openssl s_client -connect DOMINIO:443 -servername DOMINIO 2>/dev/null | openssl x509 -noout -dates
```

## Causas por orden de probabilidad

| # | Causa | Indicio | Responsable |
|---:|---|---|---|
| 1 | Incidencia de Cloudflare Pages | Estado de la plataforma | Proveedor |
| 2 | **Certificado TLS caducado** | Error de certificado en `openssl` | Quien gestione el dominio |
| 3 | DNS mal configurado o caducado | `nslookup` no resuelve | Quien gestione el dominio |
| 4 | Despliegue con artefacto vacío | `404` en `/` pero el dominio responde | Equipo de frontend |
| 5 | Proyecto de Pages eliminado o despublicado | `404` de Cloudflare | Quien gestione Cloudflare |

**La causa 2 merece una nota:** un certificado caducado produce una caída total silenciosa —nada falla hasta el día exacto— y no la detecta ninguna prueba del repositorio.

## Evidencia a recoger

- Salida de los cuatro comandos del diagnóstico.
- Estado del último despliegue en el panel de Cloudflare Pages.
- Página de estado del proveedor.
- Si falla desde varias redes y ubicaciones o solo desde una.

## Mitigación

| Causa | Acción |
|---|---|
| 1 | Esperar; comunicar por canal externo |
| 2 | Renovar el certificado |
| 3 | Corregir los registros DNS |
| 4 | Rollback al despliegue anterior |
| 5 | Republicar el proyecto |

## Rollback

Solo resuelve la causa 4. Para el resto, el rollback es irrelevante.

## Prevención

1. Monitorización externa de disponibilidad (no existe hoy).
2. Alerta de caducidad del certificado con al menos 30 días de margen.
3. Verificar que `out/index.html` existe antes de publicar.
4. Un canal de comunicación con las personas usuarias independiente del propio sitio.

Los puntos 1, 2 y 4 son de infraestructura y organización, no de código. Registrados en `OPS-05`.

## Escalado

Inmediato: es P1. Requiere a quien gestione el dominio y la cuenta de Cloudflare. **Contactos sin definir en el repositorio** — es precisamente el escenario donde esa ausencia más cuesta.
