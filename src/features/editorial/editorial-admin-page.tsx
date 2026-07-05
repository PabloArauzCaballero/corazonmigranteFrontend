"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FileImage, FilePlus2, Layers3, LockKeyhole, Plus, RefreshCw, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { env } from "@/config/env";
import { addCmsElement, createCmsPage, getPublicCmsPage, getResourcesFromPage, uploadCmsFile } from "@/features/editorial/editorial.api";
import { CmsElementStatusBadge, CmsPageStatusBadge } from "@/features/editorial/editorial-status-badge";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { DataTable } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import type { CmsElement } from "@/features/editorial/editorial.types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "recurso";
}

function parseBody(value: string) {
  return value.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
}

export function EditorialAdminPage() {
  const queryClient = useQueryClient();
  const defaultSlug = env.NEXT_PUBLIC_CMS_LIBRARY_SLUG;
  const [pageSlug, setPageSlug] = useState(defaultSlug);
  const [pageTitle, setPageTitle] = useState("Biblioteca emocional");
  const [pageId, setPageId] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceCategory, setResourceCategory] = useState("Acompanamiento");
  const [resourceSummary, setResourceSummary] = useState("");
  const [resourceBody, setResourceBody] = useState("");
  const [resourceIsPremium, setResourceIsPremium] = useState(false);
  const [resourcePremiumSummary, setResourcePremiumSummary] = useState("");
  const [resourcePremiumBody, setResourcePremiumBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const pageQuery = useQuery({
    queryKey: ["cms-admin-preview", pageSlug],
    queryFn: () => getPublicCmsPage(pageSlug),
    retry: false
  });

  const resolvedPageId = pageId || pageQuery.data?.id || "";
  const resources = useMemo(() => (pageQuery.data ? getResourcesFromPage(pageQuery.data) : []), [pageQuery.data]);

  const createPageMutation = useMutation({
    mutationFn: () => createCmsPage({ slug: pageSlug.trim(), title: pageTitle.trim(), status: "PUBLISHED", seoMetadata: { description: "Biblioteca emocional de Corazon Migrante" } }),
    onSuccess: async (page) => {
      setPageId(page.id);
      setMessage("Pagina CMS creada/publicada correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["cms-admin-preview", pageSlug] });
    }
  });

  const addElementMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedPageId) throw new Error("Primero crea o carga una pagina CMS para obtener pageId.");
      let finalImageUrl = imageUrl.trim();
      let uploadedFileId = "";
      if (selectedFile) {
        const uploaded = await uploadCmsFile(selectedFile, resolvedPageId);
        uploadedFileId = uploaded.id;
        finalImageUrl = uploaded.publicUrl || finalImageUrl;
      }
      const slug = slugify(resourceTitle);
      return addCmsElement(resolvedPageId, {
        code: `resource-${slug}`,
        type: "RESOURCE_CARD",
        sortOrder: resources.length + 1,
        content: {
          slug,
          title: resourceTitle.trim(),
          category: resourceCategory.trim(),
          summary: resourceSummary.trim(),
          bodyBlocks: parseBody(resourceBody),
          accessType: resourceIsPremium ? "PREMIUM" : "PUBLIC",
          isPremium: resourceIsPremium,
          premiumSummary: resourcePremiumSummary.trim(),
          premiumBodyBlocks: parseBody(resourcePremiumBody),
          author: "Equipo Corazon Migrante",
          imageUrl: finalImageUrl,
          fileId: uploadedFileId,
          imageAlt: resourceTitle.trim()
        }
      });
    },
    onSuccess: async () => {
      setMessage("Bloque editorial agregado. Si la pagina esta publicada, aparecera en biblioteca.");
      setResourceTitle("");
      setResourceSummary("");
      setResourceBody("");
      setResourceIsPremium(false);
      setResourcePremiumSummary("");
      setResourcePremiumBody("");
      setImageUrl("");
      setSelectedFile(null);
      await queryClient.invalidateQueries({ queryKey: ["cms-admin-preview", pageSlug] });
    }
  });

  return (
    <div className="space-y-8">
      <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.72fr]">
          <div className="space-y-7 p-7 md:p-10">
            <div className="inline-flex items-center gap-2 border border-teal-900/20 bg-teal-900/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-teal-900">
              <Layers3 className="h-4 w-4" aria-hidden="true" /> Contenido administrable
            </div>
            <div className="space-y-3">
              <h1 className="font-serif text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">Biblioteca editorial profesional</h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                Crea paginas, agrega recursos publicos o premium y sube archivos desde una administracion centralizada.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-none"><Link href="/biblioteca">Ver biblioteca publica</Link></Button>
              <Button variant="outline" className="rounded-none" onClick={() => void pageQuery.refetch()}><RefreshCw className="h-4 w-4" /> Refrescar</Button>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-[#f7f4ef] p-7 lg:border-l lg:border-t-0 md:p-10">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <Card className="rounded-none border-slate-200 bg-white shadow-none"><CardHeader><CardDescription>Slug CMS</CardDescription><CardTitle>{pageSlug}</CardTitle></CardHeader></Card>
              <Card className="rounded-none border-slate-200 bg-white shadow-none"><CardHeader><CardDescription>Estado de publicacion</CardDescription><CardTitle>{pageQuery.data ? <CmsPageStatusBadge status={pageQuery.data.status} /> : "No cargado"}</CardTitle></CardHeader></Card>
              <Card className="rounded-none border-slate-200 bg-white shadow-none"><CardHeader><CardDescription>Recursos visibles</CardDescription><CardTitle>{resources.length}</CardTitle></CardHeader></Card>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="border border-teal-900/20 bg-teal-900/5 px-4 py-3 text-sm font-medium text-teal-900">{message}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="rounded-none border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FilePlus2 className="h-5 w-5" /> Pagina CMS</CardTitle>
            <CardDescription>Crea la pagina `biblioteca` si todavia no existe. El contenido se carga por slug publico.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); createPageMutation.mutate(); }}>
              <div className="space-y-2"><Label>Slug publico</Label><Input value={pageSlug} onChange={(event) => setPageSlug(slugify(event.target.value))} className="rounded-none" /></div>
              <div className="space-y-2"><Label>Titulo</Label><Input value={pageTitle} onChange={(event) => setPageTitle(event.target.value)} className="rounded-none" /></div>
              <div className="space-y-2"><Label>Page ID detectado o manual</Label><Input value={resolvedPageId} onChange={(event) => setPageId(event.target.value)} placeholder="Se completa al cargar/crear pagina" className="rounded-none" /></div>
              <Button type="submit" disabled={createPageMutation.isPending} className="w-full rounded-none bg-teal-900 hover:bg-teal-950"><Plus className="h-4 w-4" /> Crear pagina publicada</Button>
              {createPageMutation.isError ? <p className="text-sm text-red-700">{humanizeApiError(createPageMutation.error)}</p> : null}
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-none border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileImage className="h-5 w-5" /> Agregar recurso</CardTitle>
            <CardDescription>El recurso puede ser publico o premium, con imagen por URL o archivo CMS.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 lg:grid-cols-2" onSubmit={(event) => { event.preventDefault(); addElementMutation.mutate(); }}>
              <div className="space-y-2"><Label>Titulo del recurso</Label><Input value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} required className="rounded-none" /></div>
              <div className="space-y-2"><Label>Categoria</Label><Input value={resourceCategory} onChange={(event) => setResourceCategory(event.target.value)} className="rounded-none" /></div>
              <div className="space-y-2 lg:col-span-2"><Label>Resumen publico</Label><Textarea value={resourceSummary} onChange={(event) => setResourceSummary(event.target.value)} required className="min-h-24 rounded-none" /></div>
              <div className="space-y-2 lg:col-span-2"><Label>Cuerpo publico. Separa parrafos con una linea vacia.</Label><Textarea value={resourceBody} onChange={(event) => setResourceBody(event.target.value)} className="min-h-44 rounded-none" /></div>
              <div className="flex items-center gap-3 border border-slate-200 bg-[#f7f4ef] p-4 lg:col-span-2">
                <input id="resourceIsPremium" type="checkbox" checked={resourceIsPremium} onChange={(event) => setResourceIsPremium(event.target.checked)} className="h-4 w-4" />
                <Label htmlFor="resourceIsPremium" className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Marcar como contenido premium</Label>
              </div>
              {resourceIsPremium ? (
                <>
                  <div className="space-y-2 lg:col-span-2"><Label>Resumen premium</Label><Textarea value={resourcePremiumSummary} onChange={(event) => setResourcePremiumSummary(event.target.value)} className="min-h-20 rounded-none" /></div>
                  <div className="space-y-2 lg:col-span-2"><Label>Contenido adicional premium. Separa parrafos con una linea vacia.</Label><Textarea value={resourcePremiumBody} onChange={(event) => setResourcePremiumBody(event.target.value)} className="min-h-36 rounded-none" /></div>
                </>
              ) : null}
              <div className="space-y-2"><Label>URL publica de imagen</Label><Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." className="rounded-none" /></div>
              <div className="space-y-2"><Label>Subir imagen CMS</Label><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} className="rounded-none" /></div>
              <div className="lg:col-span-2">
                <Button type="submit" disabled={addElementMutation.isPending || !resolvedPageId} className="w-full rounded-none bg-teal-900 hover:bg-teal-950"><Upload className="h-4 w-4" /> Agregar bloque al CMS</Button>
              </div>
              {addElementMutation.isError ? <p className="text-sm text-red-700 lg:col-span-2">{humanizeApiError(addElementMutation.error)}</p> : null}
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        {pageQuery.isLoading ? <LoadingState title="Leyendo pagina CMS" /> : null}
        {pageQuery.isError ? <ErrorState title="No se pudo cargar la pagina por slug" description={humanizeApiError(pageQuery.error)} actionLabel="Reintentar" onAction={() => void pageQuery.refetch()} /> : null}
        {pageQuery.data ? (
          <DataTable<CmsElement>
            data={pageQuery.data.elements}
            getRowKey={(element) => element.id}
            emptyTitle="Sin elementos CMS"
            emptyDescription="Agrega bloques para que la biblioteca publica tenga contenido real."
            columns={[
              { key: "code", header: "Codigo", render: (element) => element.code },
              { key: "type", header: "Tipo", render: (element) => element.type },
              { key: "status", header: "Estado", render: (element) => <CmsElementStatusBadge status={element.status} /> },
              { key: "access", header: "Acceso", render: (element) => element.content.isPremium || element.content.accessType === "PREMIUM" ? "Premium" : "Publico" },
              { key: "sort", header: "Orden", render: (element) => element.sortOrder },
              { key: "title", header: "Titulo", render: (element) => String(element.content.title ?? element.content.titulo ?? "-") }
            ]}
          />
        ) : null}
      </section>
    </div>
  );
}
