"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PublicContentElementInput, PublicContentRow } from "@/features/public-content/public-content.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Modal } from "@/shared/ui/modal";
import { Textarea } from "@/shared/ui/textarea";

const SELECT_CLASS =
  "focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-surface-raised px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Tipos que el CMS ya usa en las páginas publicadas. La lista es abierta: el campo
 * admite escribir cualquier otro, porque el backend guarda el tipo como texto libre
 * y limitar la interfaz a estos siete impediría editar secciones antiguas.
 */
const KNOWN_TYPES = ["HERO", "TEXT", "RICH_TEXT", "IMAGE", "CARD", "LIST", "CTA", "FAQ", "FOOTER", "NAVBAR"];

type ContentField = {
  key: string;
  /** Representación editable del valor. Los objetos y listas viajan como JSON. */
  value: string;
  json: boolean;
};

function toFields(content: Record<string, unknown>): ContentField[] {
  return Object.entries(content).map(([key, value]) => {
    if (value === null || value === undefined) return { key, value: "", json: false };
    if (typeof value === "object") return { key, value: JSON.stringify(value, null, 2), json: true };
    return { key, value: String(value), json: false };
  });
}

/**
 * Reconstruye el objeto `content`. Un campo marcado como JSON que no parsea aborta el
 * guardado en lugar de enviarse como texto: guardar `"{ title:" ` como cadena
 * rompería en silencio la sección en la web pública.
 */
function toContent(fields: ContentField[]): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const field of fields) {
    const key = field.key.trim();
    if (!key) continue;
    if (field.json) {
      try {
        content[key] = JSON.parse(field.value);
      } catch {
        throw new Error(`El campo "${key}" no contiene un JSON válido.`);
      }
      continue;
    }
    content[key] = field.value;
  }
  return content;
}

export type SectionEditorSubmit = (input: PublicContentElementInput) => void;

export function SectionEditorModal({
  open,
  onClose,
  onSubmit,
  row,
  pending,
  errorMessage
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: SectionEditorSubmit;
  /** Sin fila, el modal crea una sección nueva. */
  row?: PublicContentRow;
  pending?: boolean;
  errorMessage?: string;
}) {
  const initialFields = useMemo(() => toFields(row?.content ?? { title: "", text: "" }), [row]);
  const [fields, setFields] = useState<ContentField[]>(initialFields);
  const [formError, setFormError] = useState("");
  // Remonta el estado interno cuando se abre el modal sobre otra sección: sin esto,
  // editar una fila y luego otra mostraría los campos de la primera.
  const [editingId, setEditingId] = useState(row?.id ?? "");
  if ((row?.id ?? "") !== editingId) {
    setEditingId(row?.id ?? "");
    setFields(initialFields);
    setFormError("");
  }

  function updateField(index: number, patch: Partial<ContentField>) {
    setFields((current) => current.map((field, position) => (position === index ? { ...field, ...patch } : field)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let content: Record<string, unknown>;
    try {
      content = toContent(fields);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Revisa los campos de contenido.");
      return;
    }
    setFormError("");
    onSubmit({
      code: String(form.get("code") ?? "").trim(),
      type: String(form.get("type") ?? "TEXT").trim() || "TEXT",
      sortOrder: Number(form.get("sortOrder") ?? 0),
      status: String(form.get("status") ?? "ACTIVE") === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      content
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={row ? `Editar sección: ${row.name}` : "Nueva sección"}
      description="Los cambios se publican en la página del sitio en cuanto guardas."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="section-code">Código interno</Label>
            <Input id="section-code" name="code" defaultValue={row?.code ?? ""} required placeholder="hero-principal" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="section-type">Tipo de bloque</Label>
            <Input id="section-type" name="type" list="section-types" defaultValue={row?.type ?? "TEXT"} required />
            <datalist id="section-types">
              {KNOWN_TYPES.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="section-order">Orden en la página</Label>
            <Input id="section-order" name="sortOrder" type="number" min={0} defaultValue={row?.sortOrder ?? 0} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="section-status">Estado</Label>
            <select id="section-status" name="status" defaultValue={row?.status === "activo" || !row ? "ACTIVE" : "INACTIVE"} className={SELECT_CLASS}>
              <option value="ACTIVE">Visible en el sitio</option>
              <option value="INACTIVE">Oculta</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">Contenido visible</h3>
              <p className="text-xs text-muted-foreground">Cada campo corresponde a un texto o dato que se muestra en la página.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setFields((current) => [...current, { key: "", value: "", json: false }])}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Añadir campo
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Esta sección no tiene campos todavía. Añade al menos uno para que muestre algo.
            </p>
          ) : null}

          {fields.map((field, index) => (
            <div key={`${field.key}-${index}`} className="grid gap-2 md:grid-cols-[minmax(0,14rem)_1fr_auto] md:items-start">
              <Input
                aria-label={`Nombre del campo ${index + 1}`}
                value={field.key}
                placeholder="title"
                onChange={(event) => updateField(index, { key: event.target.value })}
              />
              {field.json ? (
                <Textarea
                  aria-label={`Valor de ${field.key || `campo ${index + 1}`} (JSON)`}
                  value={field.value}
                  onChange={(event) => updateField(index, { value: event.target.value })}
                  spellCheck={false}
                />
              ) : (
                <Textarea
                  aria-label={`Valor de ${field.key || `campo ${index + 1}`}`}
                  className="min-h-14"
                  rows={2}
                  value={field.value}
                  onChange={(event) => updateField(index, { value: event.target.value })}
                />
              )}
              <Button
                type="button"
                size="icon"
                variant="outline"
                title={`Quitar el campo ${field.key || index + 1}`}
                aria-label={`Quitar el campo ${field.key || index + 1}`}
                onClick={() => setFields((current) => current.filter((_, position) => position !== index))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : row ? "Guardar cambios" : "Crear sección"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
