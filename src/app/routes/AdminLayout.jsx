import React, { useCallback, useMemo } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../auth/SessionContext.jsx";
import { canAccessAdminTab, getDefaultAdminPath } from "../auth/adminAccess";

import RequestDashboard from "../../modules/terapia/admin/pages/RequestDashboard.jsx";
import NuevaCitaAdminPage from "../../modules/terapia/admin/pages/NuevaCitaAdminPage.jsx";
import UsersDashboard from "../../modules/sistema/admin/pages/UsersDashboard.jsx";
import VistasPublicasDashboard from "../../modules/vistas_publicas/admin/pages/VistasPublicasDashboard.jsx";
import EnfoquesDashboard from "../../modules/productos/admin/pages/EnfoquesDashboard.jsx";
import ProductosDashboard from "../../modules/productos/admin/pages/ProductosDashboard.jsx";
import ContabilidadDashboard from "../../modules/contabilidad/admin/pages/ContabilidadDashboard.jsx";
import MiPerfilDashboard from "../../modules/sistema/admin/pages/MiPerfilDashboard.jsx";
import TerapeutaPerfilDashboard from "../../modules/terapia/admin/pages/TerapeutaPerfilDashboard.jsx";
import { AdminOptionsProvider } from "../../modules/sistema/admin/context/AdminOptionsContext.jsx";

function tabToPath(basePath) {
  const bp = String(basePath || "/admin").replace(/\/+$/, "");
  return {
    solicitudes: `${bp}/solicitudes`,
    usuarios: `${bp}/usuarios`,
    miPerfil: `${bp}/mi-perfil`,
    terapeutas: `${bp}/terapeutas`,
    vistasPublicas: `${bp}/vistas-publicas`,
    productos_enfoques: `${bp}/productos/enfoques`,
    productos_productos: `${bp}/productos/productos`,
    contabilidad: `${bp}/contabilidad`,
  };
}

// Active tab is injected per-route (keeps existing Dashboard APIs intact)

function ContabilidadRoute({ commonProps, basePath }) {
  const params = useParams();
  const navigate = useNavigate();
  const moduleParam = String(params.module || "cuenta");

  const setContaModule = useCallback(
    (next) => {
      const m = String(next || "cuenta");
      const bp = String(basePath || "/admin").replace(/\/+$/, "");
      navigate(`${bp}/contabilidad/${m}`);
    },
    [navigate, basePath]
  );

  return (
    <ContabilidadDashboard
      {...commonProps}
      contaModule={moduleParam}
      setContaModule={setContaModule}
    />
  );
}

export default function AdminLayout({ basePath = "/admin" }) {
  const { session, logout } = useSession();
  const navigate = useNavigate();

  // Normalized base path (no trailing slash)
  const bp = String(basePath || "/admin").replace(/\/+$/, "");

  const TAB_TO_PATH = useMemo(() => tabToPath(basePath), [basePath]);

  const onNavigate = useCallback(
    (tab) => {
      const key = String(tab || "");

      // Allow callers (Header) to navigate to nested admin routes directly,
      // e.g. "contabilidad/transaccion".
      if (key.includes("/")) {
        const p = key.startsWith("/") ? key : `${bp}/${key.replace(/^\/+/, "")}`;
        navigate(p);
        return;
      }

      const target = TAB_TO_PATH[key] || TAB_TO_PATH.solicitudes;
      navigate(target);
    },
    [navigate, TAB_TO_PATH, bp]
  );

  const commonPropsBase = useMemo(
    () => ({
      session,
      onLogout: logout,
      onNavigate,
    }),
    [session, logout, onNavigate]
  );

  // Resolve the first allowed route (relative to this layout)
  const defaultRelPath = useMemo(() => {
    const abs = getDefaultAdminPath(session, basePath);
    const prefix = `${bp}/`;
    if (typeof abs === "string" && abs.startsWith(prefix)) return abs.slice(prefix.length);
    // fallback (will still be guarded)
    return "solicitudes";
  }, [session, basePath, bp]);

  function Guard({ allow, children }) {
    if (canAccessAdminTab(session, allow)) return children;
    return <Navigate to={defaultRelPath} replace />;
  }

  return (
    <AdminOptionsProvider enabled={!!session}>
      <Routes>
        <Route path="" element={<Navigate to={defaultRelPath} replace />} />

        <Route
          path="solicitudes"
          element={
            <Guard allow="solicitudes">
              <RequestDashboard
                {...commonPropsBase}
                activeTab={"solicitudes"}
                contaModule={"cuenta"}
                setContaModule={null}
              />
            </Guard>
          }
        />

        <Route
          path="solicitudes/nueva-cita"
          element={
            <Guard allow="solicitudes">
              <NuevaCitaAdminPage
                {...commonPropsBase}
                activeTab={"solicitudes"}
                contaModule={"cuenta"}
                setContaModule={null}
              />
            </Guard>
          }
        />

        <Route
          path="usuarios"
          element={
            <Guard allow="usuarios">
              <UsersDashboard
                {...commonPropsBase}
                activeTab={"usuarios"}
                contaModule={"cuenta"}
                setContaModule={null}
              />
            </Guard>
          }
        />

        <Route
          path="mi-perfil"
          element={
            <Guard allow="miPerfil">
              <MiPerfilDashboard
                {...commonPropsBase}
                activeTab={"miPerfil"}
                contaModule={"cuenta"}
                setContaModule={null}
              />
            </Guard>
          }
        />

        <Route
          path="terapeutas"
          element={
            <Guard allow="terapeutas">
              <TerapeutaPerfilDashboard
                {...commonPropsBase}
                activeTab={"terapeutas"}
                contaModule={"cuenta"}
                setContaModule={null}
              />
            </Guard>
          }
        />

        <Route
          path="vistas-publicas"
          element={
            <Guard allow="vistasPublicas">
              <VistasPublicasDashboard
                {...commonPropsBase}
                activeTab={"vistasPublicas"}
                contaModule={"cuenta"}
                setContaModule={null}
              />
            </Guard>
          }
        />

        <Route
          path="productos/enfoques"
          element={
            <Guard allow="productos">
              <EnfoquesDashboard
                {...commonPropsBase}
                activeTab={"productos_enfoques"}
                contaModule={"cuenta"}
                setContaModule={null}
              />
            </Guard>
          }
        />

        <Route
          path="productos/productos"
          element={
            <Guard allow="productos">
              <ProductosDashboard
                {...commonPropsBase}
                activeTab={"productos_productos"}
                contaModule={"cuenta"}
                setContaModule={null}
              />
            </Guard>
          }
        />

        <Route path="contabilidad" element={<Navigate to="contabilidad/cuenta" replace />} />

        <Route
          path="contabilidad/:module"
          element={
            <Guard allow="contabilidad">
              <ContabilidadRoute
                basePath={basePath}
                commonProps={{ ...commonPropsBase, activeTab: "contabilidad" }}
              />
            </Guard>
          }
        />

        {/* Unknown admin routes */}
        <Route path="*" element={<Navigate to={defaultRelPath} replace />} />
      </Routes>
    </AdminOptionsProvider>
  );
}
