import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { ApiError } from "@/shared/api/errors";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";

export type AccountingRow = {
  id: string;
  code: string;
  name: string;
  group: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

export type TransactionRow = {
  id: string;
  date: string;
  detail: string;
  amount: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

export type AccountingResource = "accounts" | "accountGroups" | "costCenters";

const accountingEndpoints: Record<AccountingResource, string> = {
  accounts: ENDPOINTS.accounting.accountsList,
  accountGroups: ENDPOINTS.accounting.accountGroupsList,
  costCenters: ENDPOINTS.accounting.costCentersList
};

export function mapAccountingRow(item: unknown, index: number): AccountingRow {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "cuenta_id", "grupo_id", "centro_costo_id", "uuid"], `contabilidad-${index + 1}`),
    code: getString(record, ["code", "codigo", "codigo_cuenta", "codigo_grupo"], "Sin código"),
    name: getString(record, ["name", "nombre", "descripcion", "detalle"], "Sin nombre"),
    group: getString(record, ["group", "grupo", "grupo_cuenta", "tipo", "categoria"], "Sin grupo"),
    status: normalizeStatus(record.estado ?? record.status ?? record.activo)
  };
}

export function mapTransactionRow(item: unknown, index: number): TransactionRow {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "transaccion_id", "uuid"], `transaccion-${index + 1}`),
    date: getString(record, ["fecha", "date", "created_at", "fecha_transaccion"], "Sin fecha"),
    detail: getString(record, ["detalle", "description", "descripcion", "glosa", "concepto"], "Sin detalle"),
    amount: getString(record, ["monto", "amount", "importe", "total"], "0"),
    status: normalizeStatus(record.estado ?? record.status)
  };
}

export async function listAccountingRows(resource: AccountingResource, query: SistemaListQuery = {}): Promise<PaginatedResult<AccountingRow>> {
  if (resource === "costCenters") {
    throw new ApiError(
      "El listado de centros de costo todavía no está disponible. Revisa la configuración administrativa antes de continuar.",
      501
    );
  }

  const payload = await apiRequest<unknown>(`${accountingEndpoints[resource]}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapAccountingRow, query);
}

export async function listTransactions(_query: SistemaListQuery = {}): Promise<PaginatedResult<TransactionRow>> {
  throw new ApiError(
    "El listado de transacciones todavía no está disponible. Revisa la configuración administrativa antes de continuar.",
    501
  );
}
