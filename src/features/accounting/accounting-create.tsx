"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  createAccount,
  createAccountGroup,
  createCostCenter,
  createTransaction,
  listAccountingRows,
  type TransactionEntryInput
} from "@/features/accounting/accounting.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Modal } from "@/shared/ui/modal";

function useOptions(resource: "accounts" | "accountGroups" | "costCenters", enabled: boolean) {
  return useQuery({
    queryKey: ["accounting", resource, "options"],
    queryFn: () => listAccountingRows(resource, { page: 1, pageSize: 100 }),
    enabled
  });
}

export function CreateAccountGroupButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: createAccountGroup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounting"] });
      setOpen(false);
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      code: String(form.get("code") ?? ""),
      name: String(form.get("name") ?? ""),
      type: String(form.get("type") ?? "ASSET") as "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE"
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Crear grupo</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Crear grupo contable" description="POST /admin/accounting/account-groups">
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2"><Label>Código</Label><Input name="code" required /></div>
          <div className="grid gap-2"><Label>Nombre</Label><Input name="name" required /></div>
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <select name="type" required className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="ASSET">Activo (ASSET)</option>
              <option value="LIABILITY">Pasivo (LIABILITY)</option>
              <option value="EQUITY">Patrimonio (EQUITY)</option>
              <option value="INCOME">Ingreso (INCOME)</option>
              <option value="EXPENSE">Gasto (EXPENSE)</option>
            </select>
          </div>
          {mutation.isError ? <p className="text-sm text-destructive">{humanizeApiError(mutation.error)}</p> : null}
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creando..." : "Crear grupo"}</Button>
        </form>
      </Modal>
    </>
  );
}

export function CreateAccountButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const groups = useOptions("accountGroups", open);
  const mutation = useMutation({
    mutationFn: createAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounting"] });
      setOpen(false);
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      groupId: String(form.get("groupId") ?? ""),
      code: String(form.get("code") ?? ""),
      name: String(form.get("name") ?? ""),
      normalBalance: String(form.get("normalBalance") ?? "DEBIT") as "DEBIT" | "CREDIT"
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Crear cuenta</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Crear cuenta contable" description="POST /admin/accounting/accounts">
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label>Grupo contable</Label>
            <select name="groupId" required className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={groups.isLoading}>
              <option value="">{groups.isLoading ? "Cargando grupos..." : "Seleccionar grupo"}</option>
              {groups.data?.items.map((group) => (
                <option key={group.id} value={group.id}>{group.code} — {group.name}</option>
              ))}
            </select>
            {groups.data && groups.data.items.length === 0 ? <p className="text-xs text-amber-700">No hay grupos disponibles: crea primero un grupo contable.</p> : null}
          </div>
          <div className="grid gap-2"><Label>Código</Label><Input name="code" required /></div>
          <div className="grid gap-2"><Label>Nombre</Label><Input name="name" required /></div>
          <div className="grid gap-2">
            <Label>Saldo normal</Label>
            <select name="normalBalance" required className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="DEBIT">Deudor (DEBIT)</option>
              <option value="CREDIT">Acreedor (CREDIT)</option>
            </select>
          </div>
          {mutation.isError ? <p className="text-sm text-destructive">{humanizeApiError(mutation.error)}</p> : null}
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creando..." : "Crear cuenta"}</Button>
        </form>
      </Modal>
    </>
  );
}

export function CreateCostCenterButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: createCostCenter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounting"] });
      setOpen(false);
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({ code: String(form.get("code") ?? ""), name: String(form.get("name") ?? "") });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Crear centro</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Crear centro de costo" description="POST /admin/accounting/cost-centers">
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2"><Label>Código</Label><Input name="code" required /></div>
          <div className="grid gap-2"><Label>Nombre</Label><Input name="name" required /></div>
          {mutation.isError ? <p className="text-sm text-destructive">{humanizeApiError(mutation.error)}</p> : null}
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creando..." : "Crear centro"}</Button>
        </form>
      </Modal>
    </>
  );
}

type EntryDraft = { key: number; accountId: string; costCenterId: string; debit: string; credit: string };

export function CreateTransactionButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<EntryDraft[]>([
    { key: 1, accountId: "", costCenterId: "", debit: "", credit: "" },
    { key: 2, accountId: "", costCenterId: "", debit: "", credit: "" }
  ]);
  const accounts = useOptions("accounts", open);
  const costCenters = useOptions("costCenters", open);

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setOpen(false);
      setEntries([
        { key: 1, accountId: "", costCenterId: "", debit: "", credit: "" },
        { key: 2, accountId: "", costCenterId: "", debit: "", credit: "" }
      ]);
    }
  });

  function updateEntry(key: number, patch: Partial<EntryDraft>) {
    setEntries((current) => current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)));
  }

  const totalDebit = entries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const mapped: TransactionEntryInput[] = entries.map((entry) => ({
      accountId: entry.accountId,
      ...(entry.costCenterId ? { costCenterId: entry.costCenterId } : {}),
      debit: Number(entry.debit) || 0,
      credit: Number(entry.credit) || 0
    }));
    mutation.mutate({
      date: String(form.get("date") ?? ""),
      description: String(form.get("description") ?? ""),
      reference: String(form.get("reference") ?? "").trim() || undefined,
      entries: mapped
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Nueva transacción</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva transacción contable" description="Partida doble: los débitos deben igualar a los créditos.">
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2"><Label>Fecha</Label><Input name="date" type="date" required /></div>
            <div className="grid gap-2 md:col-span-2"><Label>Descripción / glosa</Label><Input name="description" required /></div>
          </div>
          <div className="grid gap-2"><Label>Referencia (opcional)</Label><Input name="reference" /></div>

          <div className="grid gap-3">
            <Label>Asientos</Label>
            {entries.map((entry) => (
              <div key={entry.key} className="grid gap-2 rounded-xl border p-3 md:grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_auto] md:items-end">
                <div className="grid gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">Cuenta</span>
                  <select
                    required
                    value={entry.accountId}
                    onChange={(event) => updateEntry(entry.key, { accountId: event.target.value })}
                    className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">{accounts.isLoading ? "Cargando cuentas..." : "Seleccionar cuenta"}</option>
                    {accounts.data?.items.map((account) => (
                      <option key={account.id} value={account.id}>{account.code} — {account.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">Centro de costo</span>
                  <select
                    value={entry.costCenterId}
                    onChange={(event) => updateEntry(entry.key, { costCenterId: event.target.value })}
                    className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Sin centro</option>
                    {costCenters.data?.items.map((center) => (
                      <option key={center.id} value={center.id}>{center.code} — {center.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">Débito</span>
                  <Input type="number" min={0} step="0.01" value={entry.debit} onChange={(event) => updateEntry(entry.key, { debit: event.target.value })} />
                </div>
                <div className="grid gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">Crédito</span>
                  <Input type="number" min={0} step="0.01" value={entry.credit} onChange={(event) => updateEntry(entry.key, { credit: event.target.value })} />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Eliminar asiento"
                  disabled={entries.length <= 2}
                  onClick={() => setEntries((current) => current.filter((item) => item.key !== entry.key))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setEntries((current) => [...current, { key: Math.max(...current.map((item) => item.key)) + 1, accountId: "", costCenterId: "", debit: "", credit: "" }])}
            >
              <Plus className="h-4 w-4" /> Agregar asiento
            </Button>
          </div>

          <p className={balanced ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-amber-700"}>
            Débitos: {totalDebit.toFixed(2)} · Créditos: {totalCredit.toFixed(2)} {balanced ? "· Partida cuadrada" : "· La partida debe cuadrar"}
          </p>

          {mutation.isError ? <p className="text-sm text-destructive">{humanizeApiError(mutation.error)}</p> : null}
          <Button type="submit" disabled={mutation.isPending || !balanced}>{mutation.isPending ? "Registrando..." : "Registrar transacción"}</Button>
        </form>
      </Modal>
    </>
  );
}
