import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LandingHome from "../../modules/vistas_publicas/public/pages/LandingHome.jsx";
import PublicLoginPage from "../../modules/vistas_publicas/public/auth/PublicLoginPage.jsx";
import PublicSignupPage from "../../modules/vistas_publicas/public/auth/PublicSignupPage.jsx";
import PacienteDashboard from "../../modules/vistas_publicas/public/pages/PacienteDashboard.jsx";
import TerapeutaDashboard from "../../modules/vistas_publicas/public/pages/TerapeutaDashboard.jsx";
import BookingPage from "../../modules/vistas_publicas/public/pages/BookingPage.jsx";
import PrivacyPage from "../../modules/vistas_publicas/public/pages/legal/PrivacyPage.jsx";
import TermsPage from "../../modules/vistas_publicas/public/pages/legal/TermsPage.jsx";
import AdminLoginRoute from "./AdminLoginRoute.jsx";
import AdminLayout from "./AdminLayout.jsx";
import RequireSession from "../auth/RequireSession.jsx";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingHome />} />

      {/* Legal */}
      <Route path="/privacidad" element={<PrivacyPage />} />
      <Route path="/terminos" element={<TermsPage />} />

      {/* Public auth (Paciente y Terapeuta) */}
      <Route path="/paciente/login" element={<PublicLoginPage />} />
      <Route path="/paciente/signup" element={<PublicSignupPage />} />
      {/* Terapeuta también puede usar el mismo login */}
      <Route path="/terapeuta/login" element={<PublicLoginPage />} />

      {/* Aliases for landing CTAs */}
      <Route path="/login" element={<Navigate to="/paciente/login" replace />} />
      <Route path="/signup" element={<Navigate to="/paciente/signup" replace />} />

      {/* ============================================ */}
      {/* PACIENTE protected routes                   */}
      {/* ============================================ */}
      <Route
        path="/paciente/dashboard"
        element={
          <RequireSession
            loginPath="/paciente/login"
            allowedRoles={["PACIENTE"]}
            redirectIfWrongRole="/terapeuta/dashboard"
          >
            <PacienteDashboard />
          </RequireSession>
        }
      />
      <Route
        path="/paciente/booking"
        element={
          <RequireSession
            loginPath="/paciente/login"
            allowedRoles={["PACIENTE"]}
            redirectIfWrongRole="/terapeuta/dashboard"
          >
            <BookingPage />
          </RequireSession>
        }
      />

      {/* ============================================ */}
      {/* TERAPEUTA protected routes                  */}
      {/* ============================================ */}
      <Route
        path="/terapeuta/dashboard"
        element={
          <RequireSession
            loginPath="/paciente/login"
            allowedRoles={["TERAPEUTA"]}
            redirectIfWrongRole="/paciente/dashboard"
          >
            <TerapeutaDashboard />
          </RequireSession>
        }
      />

      {/* ============================================ */}
      {/* ADMIN auth                                  */}
      {/* ============================================ */}
      <Route path="/admin/login" element={<AdminLoginRoute basePath="/admin" />} />

      {/* Admin portal auth (special route from src/modules/auth) */}
      <Route path="/auth/admin" element={<Navigate to="/auth/admin/login" replace />} />
      <Route
        path="/auth/admin/login"
        element={<AdminLoginRoute basePath="/portal-admin" />}
      />

      {/* Admin portal (alias entry from src/modules/auth) */}
      <Route path="/portal-admin" element={<Navigate to="/portal-admin/login" replace />} />
      <Route
        path="/portal-admin/login"
        element={<AdminLoginRoute basePath="/portal-admin" />}
      />

      {/* Admin protected */}
      <Route
        path="/admin/*"
        element={
          <RequireSession
            loginPath="/admin/login"
            allowedRoles={["ADMIN", "TERAPEUTA"]}
          >
            <AdminLayout basePath="/admin" />
          </RequireSession>
        }
      />

      {/* Admin portal protected */}
      <Route
        path="/portal-admin/*"
        element={
          <RequireSession
            loginPath="/portal-admin/login"
            allowedRoles={["ADMIN", "TERAPEUTA"]}
          >
            <AdminLayout basePath="/portal-admin" />
          </RequireSession>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
