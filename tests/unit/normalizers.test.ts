import { mapAccountingRow, mapTransactionRow } from "@/features/accounting/accounting.api";
import { mapCatalogRow } from "@/features/products/products.api";
import { mapAppointmentRequest } from "@/features/therapy/therapy.api";
import { mapUser } from "@/features/users/users.api";
import { normalizePaginatedResponse } from "@/shared/api/normalizers";
import { buildQueryString } from "@/shared/api/query";

describe("backend response normalization", () => {
  it("normalizes multiple backend pagination shapes", () => {
    const result = normalizePaginatedResponse(
      {
        data: [{ id: 1, nombre: "Ana", correo: "ana@cm.test", rol: "TERAPEUTA", estado: "activo" }],
        pagination: { total: 48, pages: 3 }
      },
      mapUser,
      { page: 2, pageSize: 20 }
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: "1", name: "Ana", email: "ana@cm.test", role: "TERAPEUTA", status: "activo" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(48);
    expect(result.totalPages).toBe(3);
  });

  it("maps therapy, catalog, accounting, and transaction rows without hardcoded fixtures", () => {
    expect(mapAppointmentRequest({ solicitud_id: "s1", nombre_paciente: "María", producto_nombre: "Consulta", fecha_preferida: "2026-07-05", estado: "pendiente" }, 0)).toMatchObject({ id: "s1", patient: "María", service: "Consulta", status: "pendiente" });
    expect(mapCatalogRow("Servicio")({ producto_id: "p1", nombre: "Consulta inicial", estado: true }, 0)).toMatchObject({ id: "p1", name: "Consulta inicial", type: "Servicio", status: "activo" });
    expect(mapAccountingRow({ cuenta_id: "c1", codigo_cuenta: "1.1.01", nombre: "Caja", grupo_cuenta: "Activo" }, 0)).toMatchObject({ id: "c1", code: "1.1.01", group: "Activo" });
    expect(mapTransactionRow({ transaccion_id: "t1", fecha: "2026-07-05", glosa: "Pago", monto: 350, estado: "borrador" }, 0)).toMatchObject({ id: "t1", date: "2026-07-05", amount: "350", status: "pendiente" });
  });

  it("builds backend query params for server-side search and pagination", () => {
    const query = buildQueryString({ search: "ana", page: 3, pageSize: 25, status: "activo", sortBy: "nombre", sortDir: "asc" });
    expect(query).toContain("search=ana");
    expect(query).toContain("page=3");
    expect(query).toContain("pageSize=25");
    expect(query).toContain("sort=nombre");
    expect(query).toContain("order=asc");
    expect(query).not.toContain("p_search");
    expect(query).not.toContain("p_limit");
    expect(query).not.toContain("p_estado");
    expect(query).not.toContain("status");
    expect(query).not.toContain("sortBy");
    expect(query).not.toContain("sortDir");
  });
});
