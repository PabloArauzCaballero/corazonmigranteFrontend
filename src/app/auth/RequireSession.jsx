import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "./SessionContext";
import { isSessionValid } from "./sessionStorage";

/**
 * RequireSession - Guards routes that require authentication
 * @param {React.ReactNode} children - Components to render if authenticated
 * @param {string} loginPath - Path to redirect if not authenticated
 * @param {string[]} allowedRoles - Optional array of roles allowed to access this route
 * @param {string} redirectIfWrongRole - Path to redirect if user has wrong role
 */
export default function RequireSession({
  children,
  loginPath = "/admin/login",
  allowedRoles = null,
  redirectIfWrongRole = null,
}) {
  const { session, validateNow } = useSession();
  const location = useLocation();

  // Validate on every navigation to a guarded route
  useEffect(() => {
    validateNow();
  }, [location.key, validateNow]);

  // Not authenticated
  if (!isSessionValid(session)) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Check role if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = session?.role?.toUpperCase();
    const isAllowed = allowedRoles.some(
      (role) => role.toUpperCase() === userRole
    );

    if (!isAllowed && redirectIfWrongRole) {
      return <Navigate to={redirectIfWrongRole} replace />;
    }
  }

  return children;
}

/**
 * Helper to detect user role from session
 */
export function getUserRole(session) {
  if (!session) return null;
  return session.role?.toUpperCase() || null;
}

/**
 * Check if user is a patient
 */
export function isPaciente(session) {
  return getUserRole(session) === "PACIENTE";
}

/**
 * Check if user is a therapist
 */
export function isTerapeuta(session) {
  return getUserRole(session) === "TERAPEUTA";
}

/**
 * Check if user is an admin
 */
export function isAdmin(session) {
  const role = getUserRole(session);
  return role === "ADMIN" || session?.is_admin === true || session?.is_super_admin === true;
}

/**
 * Get the appropriate dashboard path based on user role
 */
export function getDashboardByRole(session) {
  if (!session) return "/";

  const role = getUserRole(session);

  if (role === "PACIENTE") {
    return "/paciente/dashboard";
  }
  if (role === "TERAPEUTA") {
    return "/terapeuta/dashboard";
  }
  if (role === "ADMIN" || session?.is_admin || session?.is_super_admin) {
    return "/admin/dashboard";
  }

  return "/";
}
