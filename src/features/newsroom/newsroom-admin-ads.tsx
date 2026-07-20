"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { adsApi, newsroomApi } from "@/features/newsroom/newsroom.api";
import { listCmsPages } from "@/features/editorial/editorial.api";
import type { AdsCampaign, AdsCompany, AdsCreative, AdsPlacement } from "@/features/newsroom/newsroom.types";
import { csv, Field, fmtDate, fnum, fstr, isoLocal, NativeInput, Notice, Panel, paginateClient, Select, StatusBadge, Submit, typeLabel, useNotice } from "@/features/newsroom/admin-kit";
import { ApiError, humanizeApiError } from "@/shared/api/errors";
import { uploadFile } from "@/shared/api/files";
import { Button } from "@/shared/ui/button";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const ADS_PAGE_SIZE = 10;

function useAdsUpload() {
  return async ({ form, key, entityType, entityId }: { form: FormData; key: string; entityType: string; entityId: string }) => {
    const file = form.get(key);
    if (!(file instanceof File) || file.size <= 0) return null;
    return uploadFile({ file, module: "CMS", entityType, entityId, visibility: "PUBLIC", admin: true });
  };
}

const adsSelectedValues = (form: FormData, key: string) =>
  form.getAll(key).map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);

export function AdsCompaniesAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [companiesPage, setCompaniesPage] = useState(1);
  const companies = useQuery({ queryKey: ["ads-companies"], queryFn: () => adsApi.companies() });
  const upload = useAdsUpload();

  const companyMutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      const company = await adsApi.createCompany({ businessName: fstr(form, "businessName"), commercialName: fstr(form, "commercialName"), contactEmail: fstr(form, "contactEmail") || undefined, contactPhone: fstr(form, "contactPhone") || undefined, status: "ACTIVE" });
      const uploaded = await upload({ form, key: "logoFile", entityType: "AdsCompanyLogo", entityId: company.id });
      if (!uploaded) return company;
      const metadata: Record<string, unknown> = { ...(company.metadata ?? {}) };
      if (uploaded.fileId) metadata.logoFileId = uploaded.fileId;
      if (uploaded.url) metadata.logoUrl = uploaded.url;
      return adsApi.updateCompany(company.id, { metadata });
    },
    onSuccess: () => { notice.ok("Empresa registrada."); void qc.invalidateQueries({ queryKey: ["ads-companies"] }); },
    onError: notice.fail
  });

  const companiesPaged = paginateClient(companies.data ?? [], companiesPage, ADS_PAGE_SIZE);

  return (
    <Panel title="Empresas anunciantes" description="Registra anunciantes y consulta la lista con paginación." icon={<Megaphone className="h-5 w-5" />}>
      <div className="grid gap-6">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); companyMutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Razón social"><NativeInput name="businessName" required /></Field>
          <Field label="Nombre comercial"><NativeInput name="commercialName" required /></Field>
          <Field label="Email"><NativeInput name="contactEmail" type="email" /></Field>
          <Field label="Teléfono"><NativeInput name="contactPhone" /></Field>
          <Field label="Logo o banner" className="md:col-span-2" hint="Opcional."><NativeInput type="file" name="logoFile" accept="image/png,image/jpeg,image/webp" /></Field>
          <div className="md:col-span-4"><Submit pending={companyMutation.isPending} label="Crear empresa" /></div>
        </form>
        <Notice message={notice.message} error={notice.error} />
        {companies.isLoading ? <LoadingState title="Cargando empresas" /> : null}
        {companies.isError ? <ErrorState title="No se pudo cargar empresas" description={humanizeApiError(companies.error)} /> : null}
        {companies.data ? (
          <div className="grid gap-4">
            <DataTable<AdsCompany> data={companiesPaged.rows} getRowKey={(row) => row.id} columns={[{ key: "name", header: "Empresa", render: (row) => <div><b>{row.commercialName}</b><p className="text-xs text-muted-foreground">{row.businessName}</p></div> }, { key: "contact", header: "Contacto", render: (row) => <span>{row.contactEmail ?? "—"}<br />{row.contactPhone ?? "—"}</span> }, { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> }]} />
            <PaginationBar page={companiesPaged.page} totalPages={companiesPaged.totalPages} onPrevious={() => setCompaniesPage((p) => Math.max(1, p - 1))} onNext={() => setCompaniesPage((p) => Math.min(companiesPaged.totalPages, p + 1))} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export function AdsPlacementsAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [placementsPage, setPlacementsPage] = useState(1);
  const placements = useQuery({ queryKey: ["ads-placements"], queryFn: () => adsApi.placements() });

  const placementMutation = useMutation({
    mutationFn: async (form: FormData) => { notice.clear(); return adsApi.createPlacement({ code: fstr(form, "code"), name: fstr(form, "name"), context: fstr(form, "context") || "ARTICLE", description: fstr(form, "description") || undefined, isActive: true }); },
    onSuccess: () => { notice.ok("Ubicación creada."); void qc.invalidateQueries({ queryKey: ["ads-placements"] }); },
    onError: notice.fail
  });

  const placementsPaged = paginateClient(placements.data ?? [], placementsPage, ADS_PAGE_SIZE);

  return (
    <Panel title="Ubicaciones publicitarias" description="Espacios disponibles donde pueden mostrarse anuncios." icon={<Megaphone className="h-5 w-5" />}>
      <div className="grid gap-6">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); placementMutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Código"><NativeInput name="code" required placeholder="article_sidebar" /></Field>
          <Field label="Nombre"><NativeInput name="name" required /></Field>
          <Field label="Contexto"><Select name="context" defaultValue="ARTICLE"><option value="HOME">Inicio</option><option value="ARTICLE">Publicación</option><option value="CATEGORY">Categoría</option></Select></Field>
          <Field label="Descripción"><NativeInput name="description" /></Field>
          <div className="md:col-span-4"><Submit pending={placementMutation.isPending} label="Crear ubicación" /></div>
        </form>
        <Notice message={notice.message} error={notice.error} />
        {placements.isLoading ? <LoadingState title="Cargando ubicaciones" /> : null}
        {placements.isError ? <ErrorState title="No se pudo cargar ubicaciones" description={humanizeApiError(placements.error)} /> : null}
        {placements.data ? (
          <div className="grid gap-4">
            <DataTable<AdsPlacement> data={placementsPaged.rows} getRowKey={(row) => row.id} columns={[{ key: "code", header: "Código", render: (row) => <code className="text-xs">{row.code}</code> }, { key: "name", header: "Nombre", render: (row) => row.name }, { key: "context", header: "Contexto", render: (row) => row.context }, { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.isActive} /> }]} />
            <PaginationBar page={placementsPaged.page} totalPages={placementsPaged.totalPages} onPrevious={() => setPlacementsPage((p) => Math.max(1, p - 1))} onNext={() => setPlacementsPage((p) => Math.min(placementsPaged.totalPages, p + 1))} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export function AdsCampaignsAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [campaignsPage, setCampaignsPage] = useState(1);
  const companies = useQuery({ queryKey: ["ads-companies"], queryFn: () => adsApi.companies() });
  const placements = useQuery({ queryKey: ["ads-placements"], queryFn: () => adsApi.placements() });
  const campaigns = useQuery({ queryKey: ["ads-campaigns", campaignsPage], queryFn: () => adsApi.campaigns({ page: campaignsPage, pageSize: ADS_PAGE_SIZE }) });
  const publications = useQuery({ queryKey: ["ads-publications"], queryFn: () => newsroomApi.listPublications({ page: 1, pageSize: 80, status: "PUBLISHED" }) });
  const pages = useQuery({ queryKey: ["ads-public-pages"], queryFn: listCmsPages, retry: false });

  const refresh = () => { void qc.invalidateQueries({ queryKey: ["ads-campaigns"] }); void qc.invalidateQueries({ queryKey: ["ads-campaigns-for-creatives"] }); };

  const campaignMutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      const placementIds = adsSelectedValues(form, "placementIds");
      const publicationIds = adsSelectedValues(form, "publicationIds");
      const pageSlugs = adsSelectedValues(form, "pageSlugs");
      if (publicationIds.length === 0) throw new ApiError("Selecciona al menos una publicación para vincular la campaña.", 400);
      const startsAt = isoLocal(fstr(form, "startsAt")) ?? new Date().toISOString();
      const endsAt = isoLocal(fstr(form, "endsAt")) ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      return adsApi.createCampaign({ companyId: fstr(form, "companyId"), name: fstr(form, "name"), objective: fstr(form, "objective") || undefined, startsAt, endsAt, budgetAmount: fnum(form, "budgetAmount", 0), currency: "BOB", priority: fnum(form, "priority", 100), placementIds: placementIds.length ? placementIds : csv(fstr(form, "placementIds")), publicationIds, pageSlugs });
    },
    onSuccess: () => { notice.ok("Campaña creada y asociada correctamente."); refresh(); },
    onError: notice.fail
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adsApi.setStatus(id, status),
    onSuccess: () => { notice.ok("Estado actualizado."); refresh(); },
    onError: notice.fail
  });

  return (
    <Panel title="Campañas publicitarias" description="Campañas vinculadas a publicaciones, ubicaciones y páginas públicas." icon={<Megaphone className="h-5 w-5" />}>
      <div className="grid gap-6">
        <form className="grid gap-4 xl:grid-cols-4" onSubmit={(e) => { e.preventDefault(); campaignMutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Campaña"><NativeInput name="name" required /></Field>
          <Field label="Empresa"><Select name="companyId" required defaultValue=""><option value="" disabled>Seleccionar</option>{(companies.data ?? []).map((company) => <option key={company.id} value={company.id}>{company.commercialName}</option>)}</Select></Field>
          <Field label="Objetivo"><NativeInput name="objective" /></Field>
          <Field label="Prioridad"><NativeInput name="priority" type="number" defaultValue={100} /></Field>
          <Field label="Inicio"><NativeInput name="startsAt" type="datetime-local" required /></Field>
          <Field label="Fin"><NativeInput name="endsAt" type="datetime-local" required /></Field>
          <Field label="Presupuesto"><NativeInput name="budgetAmount" type="number" min="0" step="0.01" defaultValue={0} /></Field>
          <Field label="Ubicaciones" hint="Ctrl/Shift para seleccionar varias."><Select name="placementIds" multiple className="min-h-28">{(placements.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.code}</option>)}</Select></Field>
          <Field label="Publicaciones asociadas *" className="xl:col-span-2" hint="Obligatorio. Ctrl/Shift para varias."><Select name="publicationIds" multiple required className="min-h-40">{(publications.data?.items ?? []).map((pub) => <option key={pub.id} value={pub.id}>{pub.title} · {typeLabel(pub.publicationType)}</option>)}</Select>{publications.isError ? <p className="text-xs text-red-700">{humanizeApiError(publications.error)}</p> : null}</Field>
          <Field label="Páginas públicas asociadas" className="xl:col-span-2" hint="Opcional."><Select name="pageSlugs" multiple className="min-h-40">{(pages.data ?? []).map((page) => <option key={page.id ?? page.slug} value={page.slug}>{page.title} · /{page.slug}</option>)}</Select>{pages.isError ? <p className="text-xs text-red-700">{humanizeApiError(pages.error)}</p> : null}</Field>
          <div className="xl:col-span-4"><Submit pending={campaignMutation.isPending} label="Crear campaña" /></div>
        </form>
        <Notice message={notice.message} error={notice.error} />
        {campaigns.isLoading ? <LoadingState title="Cargando campañas" /> : null}
        {campaigns.isError ? <ErrorState title="No se pudo cargar campañas" description={humanizeApiError(campaigns.error)} /> : null}
        {campaigns.data ? (
          <div className="grid gap-4">
            <DataTable<AdsCampaign> data={campaigns.data.items} getRowKey={(row) => row.id} columns={[{ key: "name", header: "Campaña", render: (row) => <b>{row.name}</b> }, { key: "company", header: "Empresa", render: (row) => row.company?.commercialName ?? row.companyId }, { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> }, { key: "target", header: "Asociación", render: (row) => { const count = row.contentTargets?.filter((t) => t.publicationId || t.categoryId || t.pageSlug).length ?? 0; return count ? `${count} pub/cat/página` : "Global"; } }, { key: "dates", header: "Vigencia", render: (row) => <span>{fmtDate(row.startsAt)}<br />{fmtDate(row.endsAt)}</span> }, { key: "actions", header: "Acciones", render: (row) => <div className="flex gap-2"><Button size="sm" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: row.id, status: "ACTIVE" })}>Activar</Button><Button size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: row.id, status: "PAUSED" })}>Pausar</Button></div> }]} />
            <PaginationBar page={campaigns.data.page} totalPages={campaigns.data.totalPages} onPrevious={() => setCampaignsPage((p) => Math.max(1, p - 1))} onNext={() => setCampaignsPage((p) => Math.min(campaigns.data?.totalPages ?? p, p + 1))} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export function AdsCreativesAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [creativesPage, setCreativesPage] = useState(1);
  const placements = useQuery({ queryKey: ["ads-placements"], queryFn: () => adsApi.placements() });
  const campaignsForCreatives = useQuery({ queryKey: ["ads-campaigns-for-creatives"], queryFn: () => adsApi.campaigns({ page: 1, pageSize: 100 }) });
  const publications = useQuery({ queryKey: ["ads-publications"], queryFn: () => newsroomApi.listPublications({ page: 1, pageSize: 80, status: "PUBLISHED" }) });
  const pages = useQuery({ queryKey: ["ads-public-pages"], queryFn: listCmsPages, retry: false });
  const upload = useAdsUpload();

  const creativeMutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      let assetUrl = fstr(form, "assetUrl");
      const campaignId = fstr(form, "campaignId");
      const uploaded = await upload({ form, key: "assetFile", entityType: "AdsCreative", entityId: campaignId });
      const title = fstr(form, "title");
      if (uploaded) assetUrl = uploaded.url ?? assetUrl;
      if (!assetUrl) throw new Error("Sube una imagen o pega una URL pública para el creativo.");
      return adsApi.createAd({ campaignId, title, fileId: uploaded?.fileId, assetUrl, destinationUrl: fstr(form, "destinationUrl"), altText: fstr(form, "altText") || title || "Publicidad", mediaType: "IMAGE", mimeType: "image/webp", isPrimary: true, publicationId: fstr(form, "publicationId") || undefined, pageSlug: fstr(form, "pageSlug") || undefined, placementIds: adsSelectedValues(form, "creativePlacementIds") });
    },
    onSuccess: () => { notice.ok("Creativo agregado."); void qc.invalidateQueries({ queryKey: ["ads-campaigns-for-creatives"] }); },
    onError: notice.fail
  });

  const campaignOptions = campaignsForCreatives.data?.items ?? [];
  const allCreatives = campaignOptions.flatMap((c) => (c.creatives ?? []).map((cr) => ({ ...cr, campaignName: c.name })));
  const creativesPaged = paginateClient(allCreatives, creativesPage, ADS_PAGE_SIZE);

  return (
    <Panel title="Creativos" description="Piezas gráficas asociadas a cada campaña." icon={<Megaphone className="h-5 w-5" />}>
      <div className="grid gap-6">
        <form className="grid gap-4 xl:grid-cols-4" onSubmit={(e) => { e.preventDefault(); creativeMutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Campaña"><Select name="campaignId" required defaultValue=""><option value="" disabled>Seleccionar</option>{campaignOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Título"><NativeInput name="title" required /></Field>
          <Field label="URL destino"><NativeInput name="destinationUrl" type="url" required /></Field>
          <Field label="Texto alternativo"><NativeInput name="altText" /></Field>
          <Field label="Publicación relacionada" className="xl:col-span-2" hint="Opcional."><Select name="publicationId" defaultValue=""><option value="">Global</option>{(publications.data?.items ?? []).map((pub) => <option key={pub.id} value={pub.id}>{pub.title}</option>)}</Select></Field>
          <Field label="Página pública relacionada" className="xl:col-span-2" hint="Opcional."><Select name="pageSlug" defaultValue=""><option value="">Global</option>{(pages.data ?? []).map((page) => <option key={page.id ?? page.slug} value={page.slug}>{page.title} · /{page.slug}</option>)}</Select></Field>
          <Field label="Ubicaciones" className="xl:col-span-2" hint="Opcional. Ctrl/Shift para varias."><Select name="creativePlacementIds" multiple className="min-h-28">{(placements.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.code}</option>)}</Select></Field>
          <Field label="Imagen" className="xl:col-span-2" hint="Usa archivo o URL pública."><NativeInput type="file" name="assetFile" accept="image/png,image/jpeg,image/webp" /></Field>
          <Field label="URL imagen" className="xl:col-span-2"><NativeInput name="assetUrl" type="url" /></Field>
          <div className="xl:col-span-4"><Submit pending={creativeMutation.isPending} label="Agregar creativo" /></div>
        </form>
        <Notice message={notice.message} error={notice.error} />
        {campaignsForCreatives.isLoading ? <LoadingState title="Cargando creativos" /> : null}
        {campaignsForCreatives.isError ? <ErrorState title="No se pudo cargar creativos" description={humanizeApiError(campaignsForCreatives.error)} /> : null}
        {campaignsForCreatives.data ? (
          <div className="grid gap-4">
            <DataTable<AdsCreative & { campaignName: string }> data={creativesPaged.rows} getRowKey={(row) => row.id} columns={[{ key: "title", header: "Título", render: (row) => <b>{row.title}</b> }, { key: "campaign", header: "Campaña", render: (row) => row.campaignName }, { key: "mediaType", header: "Tipo", render: (row) => row.mediaType }, { key: "approval", header: "Aprobación", render: (row) => <StatusBadge status={row.approvalStatus} /> }, { key: "primary", header: "Principal", render: (row) => (row.isPrimary ? "Sí" : "No") }]} />
            <PaginationBar page={creativesPaged.page} totalPages={creativesPaged.totalPages} onPrevious={() => setCreativesPage((p) => Math.max(1, p - 1))} onNext={() => setCreativesPage((p) => Math.min(creativesPaged.totalPages, p + 1))} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export function AdvertisingAdmin() {
  return (
    <div className="grid gap-6">
      <AdsCompaniesAdmin />
      <AdsPlacementsAdmin />
      <AdsCampaignsAdmin />
      <AdsCreativesAdmin />
    </div>
  );
}
