"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasRole, type UserRole } from "@/shared/auth/roles";
import { useSession } from "@/shared/auth/use-session";
import { ForbiddenState, LoadingState } from "@/shared/ui/state";

export function ClientRoleGuard({ allowedRoles, loginPath, children }: { allowedRoles: UserRole[]; loginPath: string; children: React.ReactNode }) {
  const router = useRouter();
  const { session, isReady } = useSession();

  useEffect(() => {
    if (isReady && !session) router.replace(loginPath);
  }, [isReady, loginPath, router, session]);

  if (!isReady) return <LoadingState title="Verificando sesión" />;
  if (!session) return <LoadingState title="Redirigiendo al inicio de sesión" />;
  if (!hasRole(session.role, allowedRoles)) return <ForbiddenState />;
  return <>{children}</>;
}
