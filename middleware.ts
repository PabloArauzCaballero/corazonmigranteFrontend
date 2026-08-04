/**
 * ⚠️ ESTE MIDDLEWARE NO SE EJECUTA EN EL DESPLIEGUE ACTUAL.
 *
 * `next.config.ts` usa `output: "export"`: el build produce HTML estático que
 * Cloudflare Pages sirve sin ningún servidor Next.js, y el middleware de Next
 * requiere un runtime en el servidor. Se conserva por dos motivos:
 *
 *  1. sigue siendo la protección real si algún día se despliega con servidor
 *     (Node/Vercel), y basta con quitar `output: "export"`;
 *  2. documenta en un solo sitio el mapa ruta → roles.
 *
 * Mientras tanto, quien protege de verdad las rutas privadas es `ClientRoleGuard`
 * (`src/shared/auth/guard.tsx`), aplicado en los layouts de /admin, /paciente y
 * /terapeuta. Si se añade una ruta protegida hay que actualizar AMBOS sitios.
 */
import { NextResponse, type NextRequest } from "next/server";
import { roleFromCookie } from "@/shared/auth/cookies";
import { hasRole, type UserRole } from "@/shared/auth/roles";

/**
 * Este mapa debe coincidir EXACTAMENTE con los `allowedRoles` de cada
 * `ClientRoleGuard`. Si divergen, en un despliegue con servidor el middleware dejaría
 * pasar a alguien que el guard después rechaza con `ForbiddenState`: el resultado
 * final sería correcto, pero la defensa en profundidad quedaría degradada y el
 * diagnóstico sería confuso.
 *
 * Fuente de verdad de cada prefijo:
 *   /paciente   → src/app/paciente/layout.tsx
 *   /terapeuta  → src/app/terapeuta/layout.tsx
 *   /admin      → src/app/admin/layout.tsx
 */
const protectedRoutes: Array<{ prefix: string; loginPath: string; roles: UserRole[] }> = [
  { prefix: "/paciente", loginPath: "/login", roles: ["PACIENTE"] },
  { prefix: "/terapeuta", loginPath: "/admin/login", roles: ["TERAPEUTA"] },
  // TERAPEUTA no entra en /admin: su portal es /terapeuta y el guard del layout de
  // admin no lo incluye. Estaba aquí por arrastre y era la única divergencia entre
  // ambas capas.
  { prefix: "/admin", loginPath: "/admin/login", roles: ["ADMIN", "SUPER_ADMIN", "CONTADOR"] }
];

const publicAdminPaths = ["/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicAdminPaths.includes(pathname)) return NextResponse.next();

  const route = protectedRoutes.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  if (!route) return NextResponse.next();

  const role = roleFromCookie(request.cookies.get("cm_session_role")?.value);
  if (!role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = route.loginPath;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!hasRole(role, route.roles)) {
    const url = request.nextUrl.clone();
    url.pathname = "/403";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/paciente/:path*", "/terapeuta/:path*", "/admin/:path*"]
};
