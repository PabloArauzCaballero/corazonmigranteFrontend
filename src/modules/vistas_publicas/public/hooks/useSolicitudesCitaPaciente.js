import { useCallback, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { TERAPIA_ENDPOINTS } from "../../../../config/TERAPIA_ENDPOINTS";
import { useSession } from "../../../../app/auth/SessionContext";

/**
 * Hook para listar solicitudes/citas del paciente usando:
 * POST /api/terapia/admin/citas/solicitudes/listar
 *
 * Nota: aunque el endpoint está en /admin, aquí se consume desde el dashboard del paciente
 * según el flujo del proyecto.
 */
export function useSolicitudesCitaPaciente({ autoFetch = true, limit = 50, offset = 0, overridePacienteId = null } = {}) {
  const { session } = useSession();

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSolicitudes = useCallback(
    async ({ p_limit, p_offset, p_id_usuario_paciente } = {}) => {
      if (!session?.user_id || !session?.id_sesion) {
        const msg = "Usuario no autenticado";
        setError(msg);
        throw new Error(msg);
      }

      const pacienteId = overridePacienteId ?? p_id_usuario_paciente ?? session.user_id;

      const payload = {
        p_actor_user_id: session.user_id,
        p_id_sesion: session.id_sesion,
        p_limit: typeof p_limit === "number" ? p_limit : limit,
        p_offset: typeof p_offset === "number" ? p_offset : offset,
        p_id_usuario_paciente: pacienteId,
      };

      try {
        setIsLoading(true);
        setError(null);

        const res = await createApiConn(
          TERAPIA_ENDPOINTS.CITAS_SOLICITUDES_LISTAR,
          payload,
          "POST",
          session
        );

        if (!res?.ok) {
          throw new Error(res?.message || "Error listando solicitudes de cita");
        }

        // createApiConn devuelve el JSON directo del backend (no envuelve en {data:...})
        // Soportamos ambas formas por compatibilidad: { rows: [...] } o { data: { rows: [...] } }
        const list =
          Array.isArray(res?.rows) ? res.rows :
          Array.isArray(res?.data?.rows) ? res.data.rows :
          [];
        setRows(list);
        return list;
      } catch (err) {
        const msg = err?.message || "Error listando solicitudes de cita";
        setError(msg);
        setRows([]);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [session, limit, offset, overridePacienteId]
  );

  return {
    rows,
    isLoading,
    error,
    fetchSolicitudes,
  };
}
