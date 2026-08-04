"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasRole, type UserRole } from "@/shared/auth/roles";
import { useSession } from "@/shared/auth/use-session";
import { ForbiddenState, LoadingState } from "@/shared/ui/state";

/**
 * Guardia de rutas del lado del cliente.
 *
 * IMPORTANTE: este componente es la ÚNICA protección efectiva de las rutas privadas.
 * El proyecto se despliega con `output: "export"` (HTML estático en Cloudflare Pages)
 * y en ese modo Next.js **no ejecuta `middleware.ts`**: no hay servidor donde correrlo.
 * Cualquier ruta nueva bajo /admin, /paciente o /terapeuta debe quedar dentro de un
 * layout envuelto por este guard.
 *
 * Esto protege la interfaz, no los datos: el HTML estático es público por definición.
 * Quien decide qué información se entrega es el backend, validando el JWT en cada
 * endpoint.
 */
export function ClientRoleGuard({ allowedRoles, loginPath, children }: { allowedRoles: UserRole[]; loginPath: string; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isReady } = useSession();

  useEffect(() => {
    if (!isReady || session) return;
    // Se conserva el destino para volver ahí tras iniciar sesión, igual que hacía el
    // middleware. Sin esto, una sesión caducada mandaba siempre al panel por defecto.
    const next = pathname && pathname !== loginPath ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`${loginPath}${next}`);
  }, [isReady, loginPath, pathname, router, session]);

  if (!isReady) return <LoadingState title="Verificando sesión" />;
  if (!session) return <LoadingState title="Redirigiendo al inicio de sesión" />;
  if (!hasRole(session.role, allowedRoles)) return <ForbiddenState />;
  return <>{children}</>;
}
