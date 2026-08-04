# Reglas de composición

- **Fecha de evidencia:** 2026-08-03

## 1. Anatomía de una pantalla de portal

```tsx
export const metadata = { title: "…" };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="…"
        description="…"
        actions={<Button>…</Button>}
      />
      <FeatureComponent />   {/* la lógica vive aquí, no en la página */}
    </div>
  );
}
```

**`page.tsx` compone; no decide.** Es la convención que hace que `src/app/` sea delgada y que el producto pueda documentarse por feature.

Excepción conocida: `admin/notificaciones/page.tsx` implementa React Query, mutaciones y paginación directamente en la página. Se documenta como estado real.

## 2. Patrón de tabla con datos

```tsx
if (query.isLoading) return <DataTableSkeleton columns={5} rows={6} />;
if (query.isError)   return <ErrorState title="…" description="…" actionLabel="Reintentar" onAction={query.refetch} />;
return <DataTable columns={columns} data={query.data} getRowKey={(r) => r.id} />;
```

`DataTable` acepta `data` como `undefined` o `null` y lo normaliza a `[]`, así que puede recibir `query.data` sin comprobaciones. Su estado vacío está integrado: no hace falta un `if` adicional.

## 3. Navegación: `Button` con `asChild`

```tsx
// ✅ correcto
<Button asChild variant="outline">
  <Link href="/admin/usuarios">Ver usuarios</Link>
</Button>

// ❌ incorrecto
<Button onClick={() => router.push("/admin/usuarios")}>Ver usuarios</Button>
```

La forma incorrecta rompe «abrir en pestaña nueva», el menú contextual y la semántica de enlace para lectores de pantalla. `asChild` usa `Radix Slot` para aplicar los estilos al `<Link>` real.

Además, `eslint-config-next` detecta enlaces internos con `<a>` — y como el lint bloquea el build, no llegan a producción.

## 4. Jerarquía de superposiciones

| Necesidad | Componente |
|---|---|
| Diálogo con contenido | `Modal` |
| Confirmar una acción destructiva | `useConfirm()` de `ConfirmProvider` |
| Aviso efímero | `useToast()` |
| Progreso global | `GlobalLoadingBar` (ya montado) |

> **Regla: no escribir un contenedor superpuesto nuevo.** `Modal` ya resuelve trampa de foco, restauración de foco, `Escape` y etiquetado con `useId()`. Reimplementarlo significa reimplementar esa accesibilidad — y probablemente peor.

## 5. Estados: siempre los cuatro

Toda pantalla con datos remotos debe contemplar:

| Estado | Componente |
|---|---|
| Carga | `DataTableSkeleton` o `LoadingState` |
| Vacío | `EmptyState` (integrado en `DataTable`) |
| Error | `ErrorState` con acción de reintento |
| Éxito | El contenido |

Y, en rutas privadas, el guard añade dos más: «verificando sesión» y `ForbiddenState`.

## 6. Composición de clases

```tsx
import { cn } from "@/lib/utils";
<div className={cn("base", condicion && "extra", className)} />
```

`cn()` combina `clsx` y `tailwind-merge`: resuelve conflictos de utilidades Tailwind (`p-2` frente a `p-4`) quedándose con la última. Sin él, ambas clases coexistirían y ganaría la del CSS, no la de la intención.

**Toda prop `className` de un componente compartido debe pasar por `cn()`**, o el consumidor no podrá sobrescribir estilos.

## 7. Variantes con `cva`

```tsx
const variants = cva("clases-base", {
  variants: { variant: { … }, size: { … } },
  defaultVariants: { variant: "default", size: "md" },
});
export interface Props extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof variants> {}
```

`VariantProps` deriva los tipos del propio objeto: `variant` y `size` son **tipos**, no cadenas libres. Un valor inexistente falla en `yarn typecheck`.

## 8. Marcadores de tutorial

`PageHeader`, `DataTable` y `Modal` incluyen atributos `data-tutorial-id` tomados de `TUTORIAL_TARGETS`.

**Están en las primitivas a propósito.** El comentario de `page-header.tsx` lo explica: al usarlas casi todas las pantallas, cualquier tutorial puede resaltar el título o las acciones **sin anotar cada página por separado**.

Consecuencia: no eliminar esos atributos al refactorizar, y añadir el marcador a la primitiva —no a la pantalla— cuando un tutorial necesite un objetivo nuevo.

## 9. Dónde vive cada cosa

| Código | Ubicación |
|---|---|
| Define una URL | `src/app/` |
| Lógica de un dominio | `src/features/<dominio>/` |
| Usado por dos o más dominios, visual | `src/shared/ui/` |
| Habla con el backend | `src/features/<dominio>/<dominio>.api.ts` |
| URL de backend nueva | `src/shared/api/endpoints.ts` |
| Telemetría | `src/observability/` |
| Variable de entorno | `src/config/env.ts` — **nunca** `process.env` directo |
