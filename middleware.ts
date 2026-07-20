import { NextResponse, type NextRequest } from "next/server";
import { roleFromCookie } from "@/shared/auth/cookies";
import { hasRole, type UserRole } from "@/shared/auth/roles";

const protectedRoutes: Array<{ prefix: string; loginPath: string; roles: UserRole[] }> = [
  { prefix: "/paciente", loginPath: "/login", roles: ["PACIENTE"] },
  { prefix: "/terapeuta", loginPath: "/admin/login", roles: ["TERAPEUTA"] },
  { prefix: "/admin", loginPath: "/admin/login", roles: ["ADMIN", "SUPER_ADMIN", "CONTADOR", "TERAPEUTA"] }
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
