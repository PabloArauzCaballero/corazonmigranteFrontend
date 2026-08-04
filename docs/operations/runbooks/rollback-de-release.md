# Runbook — Rollback de release

## Cuándo aplicarlo

Ante cualquier incidente con impacto sobre personas usuarias cuya causa esté en un despliegue reciente del frontend. **Ante la duda, revertir primero y diagnosticar después:** el rollback es rápido y reversible; un diagnóstico en caliente con la aplicación rota, no.

## Cuándo NO resuelve nada

| Situación | Motivo |
|---|---|
| Backend caído | El frontend no es la causa |
| Certificado TLS caducado | Es infraestructura |
| Incidencia de Cloudflare | Es la plataforma |
| DNS mal configurado | Es infraestructura |
| Cambio de variable de entorno sin reconstruir | El rollback devuelve un artefacto igualmente sin el valor nuevo |

## Procedimiento

### Opción A — Rollback en Cloudflare Pages (recomendada)

1. Panel de Cloudflare Pages → proyecto → **Deployments**.
2. Localizar el último despliegue bueno conocido.
3. **Rollback to this deployment**.
4. Verificar (§ Verificación).

**Es inmediato y no requiere reconstruir.** Es la vía preferente.

### Opción B — Revertir en git y reconstruir

Cuando el despliegue anterior tampoco sirve o hace falta corregir el código:

```bash
git revert <sha>          # revert, no reset: preserva el historial
git push origin main      # el pipeline reconstruye y despliega
```

Más lento (build completo) pero deja el repositorio coherente con lo desplegado.

⚠️ **No usar `git reset --hard` sobre una rama compartida.** Reescribe el historial y rompe el trabajo de quien tenga la rama.

## Verificación posterior

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://DOMINIO/
curl -sI https://DOMINIO/       | grep -iE 'content-security|strict-transport'
curl -sI https://DOMINIO/admin/ | grep -iE 'x-robots|cache-control'
```

Y en el navegador: cargar `/`, iniciar sesión y abrir una pantalla con datos. Esa última comprobación valida a la vez la API, la CSP y la sesión.

## Después del rollback

1. **Confirmar que el incidente cesó.** Si no, la causa no estaba en el despliegue.
2. Registrar qué versión quedó activa y cuál se retiró.
3. Diagnosticar la causa **fuera de producción**.
4. Corregir, verificar según [../../governance/zero-regression-policy.md](../../governance/zero-regression-policy.md) y volver a desplegar.
5. Post-mortem si fue P1 o P2 — ver [../../security/incident-response.md §5](../../security/incident-response.md).

## Lo que el rollback no revierte

| Elemento | Motivo |
|---|---|
| Cambios en el backend | Sistema distinto |
| Datos ya modificados | El frontend no los revierte |
| Variables de entorno cambiadas en el panel | Persisten; hay que revertirlas a mano **y reconstruir** |
| Trazas ya exportadas | Están en el colector |

La tercera es la trampa más habitual: revertir el código y dejar la variable nueva puede producir una combinación que nunca se ha probado.

## Riesgo específico: chunks

Un rollback restaura los bundles antiguos. Las pestañas abiertas con el HTML **nuevo** empezarán a fallar con `ChunkLoadError` — el problema simétrico del descrito en [chunks-fallidos.md](chunks-fallidos.md). Se resuelve recargando, y conviene anticiparlo al comunicar la incidencia.

## Prevención

Cuanto mejor sea la verificación previa al despliegue, menos rollbacks. Ver [../deployment.md §3](../deployment.md) y las brechas `OPS-01`, `OPS-02` y `OPS-03`, que hoy dejan pasar a producción errores detectables.

## Escalado

Quien tenga acceso al panel de Cloudflare Pages. **Sin definir en el repositorio** (`OPS-05`) — y es la ausencia más costosa, porque el rollback es la acción de contención principal de casi todos los runbooks.
