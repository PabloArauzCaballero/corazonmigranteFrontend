export type CmsPageStatus = "DRAFT" | "PUBLISHED";
export type CmsElementStatus = "ACTIVE" | "INACTIVE";

export type CmsElementType =
  | "HERO"
  | "RESOURCE_CARD"
  | "ARTICLE"
  | "GUIDE"
  | "SECTION"
  | "QUOTE"
  | "CTA"
  | string;

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  status: CmsPageStatus;
  seoMetadata: Record<string, unknown>;
  publishedAt?: string;
  elements: CmsElement[];
  raw: unknown;
};

export type CmsElement = {
  id: string;
  pageId?: string;
  code: string;
  type: CmsElementType;
  content: Record<string, unknown>;
  fileId?: string;
  sortOrder: number;
  status: CmsElementStatus;
};

export type EditorialResource = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  category: string;
  imageUrl?: string;
  imageAlt: string;
  readTimeLabel: string;
  authorLabel: string;
  publishedAt?: string;
  bodyBlocks: string[];
  ctaLabel?: string;
  ctaHref?: string;
  sourceElement: CmsElement;
};

export type EditorialHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
};

export type CreateCmsPageInput = {
  slug: string;
  title: string;
  status?: CmsPageStatus;
  seoMetadata?: Record<string, unknown>;
};

export type CreateCmsElementInput = {
  code: string;
  type: CmsElementType;
  content: Record<string, unknown>;
  sortOrder?: number;
};

export type CmsFileAsset = {
  id: string;
  module: string;
  entityType?: string;
  entityId?: string;
  storageProvider: string;
  bucket?: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  visibility: "PRIVATE" | "PUBLIC" | string;
  status: string;
  publicUrl?: string;
  url?: string;
};
