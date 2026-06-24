import { useCallback, useMemo, useState, useEffect } from "react";
import { USUARIOS_ENDPOINTS } from "../../../../config/USUARIOS_ENDPOINTS";
import { createApiConn } from "../../../../helpers/api_conn_factory";

export function useUsuariosAdmin(session) {
    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState("");
    const [onlyActive, setOnlyActive] = useState(true);

    const reloadUsers = useCallback(async () => {
        if (!session) return;
        try {
            const payload = {
                p_actor_user_id: session.user_id,
                p_id_sesion: session.id_sesion,
                p_limit: 200,
            };

            const response = await createApiConn(
                USUARIOS_ENDPOINTS.USUARIOS_LISTAR,
                payload,
                "POST"
            );

            if (response && response.rows && Array.isArray(response.rows)) {
                const mappedUsers = response.rows.map((u) => {
                    const email = u.email || "";
                    const nombres = (u.nombres || "").trim();
                    const name = nombres || (email ? email.split("@")[0] : "Usuario");

                    // iniciales: preferir nombres reales, si no email
                    const baseForInitials = (nombres || email || "").trim();
                    const initials = baseForInitials
                        ? baseForInitials
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                        : "??";

                    return {
                        id: u.id_user,
                        initials,
                        name,
                        email,
                        role: u.tipo_usuario,
                        status: u.estado,
                        avatarUrl: u.foto_perfil_link || "",
                    };
                });
                setUsers(mappedUsers);
            } else {
                console.warn("Respuesta inesperada al listar usuarios:", response);
                setUsers([]);
            }
        } catch (err) {
            console.error("Error fetching users list:", err);
        }
    }, [session]);

    // Fetch users on load and whenever session changes
    useEffect(() => {
        reloadUsers();
    }, [reloadUsers]);


    const filtered = useMemo(() => {
        let data = [...users];

        if (onlyActive) data = data.filter((u) => u.status === "Activo");

        const q = query.trim().toLowerCase();
        if (q) {
            data = data.filter((u) => {
                return (
                    String(u.id).includes(q) ||
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.role.toLowerCase().includes(q)
                );
            });
        }

        return data;
    }, [users, query, onlyActive]);

    return {
        users,
        setUsers,
        query,
        setQuery,
        onlyActive,
        setOnlyActive,
        filtered,
        reloadUsers,
    };
}
