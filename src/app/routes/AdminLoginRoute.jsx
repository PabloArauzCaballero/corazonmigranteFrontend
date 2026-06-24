import React, { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminLoginPage from "../../modules/auth/admin/pages/AdminLoginPage.jsx";
import { useSession } from "../auth/SessionContext.jsx";
import { getDefaultAdminPath } from "../auth/adminAccess";

export default function AdminLoginRoute({ basePath = "/admin" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useSession();

  const onLoginSuccess = useCallback(
    (sessionPayload) => {
      const remember = !!sessionPayload?.remember;
      login(sessionPayload, { remember });

      const from = location.state?.from;
      const fallback = getDefaultAdminPath(sessionPayload, basePath);
      navigate(from || fallback, { replace: true });
    },
    [login, navigate, location.state, basePath]
  );

  return <AdminLoginPage onLoginSuccess={onLoginSuccess} />;
}
