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

function emptyResult<T>(query: SistemaListQuery): PaginatedResult<T> {
  return { items: [], page: query.page ?? 1, pageSize: query.pageSize ?? 20, total: 0, totalPages: 1, raw: null };
}

function isMissingListEndpoint(error: unknown) {
  return error instanceof ApiError && [404, 405, 501].includes(error.status ?? 0);
}

export async function listAccountingRows(resource: AccountingResource, query: SistemaListQuery = {}): Promise<PaginatedResult<AccountingRow>> {
  try {
    const payload = await apiRequest<unknown>(`${accountingEndpoints[resource]}${buildQueryString(query)}`);
    return normalizePaginatedResponse(payload, mapAccountingRow, query);
  } catch (error) {
    // Si el backend aún no expone el GET (solo POST), la vista no se bloquea: se muestra vacía y se permite crear.
    if (isMissingListEndpoint(error)) return emptyResult<AccountingRow>(query);
    throw error;
  }
}

export async function listTransactions(query: SistemaListQuery = {}): Promise<PaginatedResult<TransactionRow>> {
  try {
    const payload = await apiRequest<unknown>(`${ENDPOINTS.accounting.transactionsList}${buildQueryString(query)}`);
    return normalizePaginatedResponse(payload, mapTransactionRow, query);
  } catch (error) {
    if (isMissingListEndpoint(error)) return emptyResult<TransactionRow>(query);
    throw error;
  }
}

export type CreateAccountGroupInput = {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
};

export async function createAccountGroup(input: CreateAccountGroupInput) {
  return apiRequest<unknown>(ENDPOINTS.accounting.accountGroupsCreate, { method: "POST", body: input });
}

export type CreateAccountInput = {
  groupId: string;
  code: string;
  name: string;
  normalBalance: "DEBIT" | "CREDIT";
};

export async function createAccount(input: CreateAccountInput) {
  return apiRequest<unknown>(ENDPOINTS.accounting.accountsCreate, { method: "POST", body: input });
}

export type CreateCostCenterInput = {
  code: string;
  name: string;
};

export async function createCostCenter(input: CreateCostCenterInput) {
  return apiRequest<unknown>(ENDPOINTS.accounting.costCentersCreate, { method: "POST", body: input });
}

export type TransactionEntryInput = {
  accountId: string;
  costCenterId?: string;
  debit: number;
  credit: number;
};

export type CreateTransactionInput = {
  date: string;
  description: string;
  reference?: string;
  entries: TransactionEntryInput[];
};

export async function createTransaction(input: CreateTransactionInput) {
  const totalDebit = input.entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = input.entries.reduce((sum, entry) => sum + entry.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.005) {
    throw new ApiError("La partida doble no cuadra: los débitos deben ser iguales a los créditos.", 400);
  }
  return apiRequest<unknown>(ENDPOINTS.accounting.transactionSaleCreate, {
    method: "POST",
    body: {
      date: input.date,
      description: input.description,
      ...(input.reference ? { reference: input.reference } : {}),
      entries: input.entries.map((entry) => ({
        accountId: entry.accountId,
        ...(entry.costCenterId ? { costCenterId: entry.costCenterId } : {}),
        debit: entry.debit,
        credit: entry.credit
      }))
    }
  });
}
