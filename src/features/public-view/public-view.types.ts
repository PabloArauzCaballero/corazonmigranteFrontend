export type UiElementAsset = {
  id: number;
  type: string;
  value?: string;
  url?: string;
  alt?: string;
  metadata?: Record<string, unknown>;
};

export type LandingLink = {
  label: string;
  href?: string;
  action?: string;
};

export type LandingImage = {
  src?: string;
  alt?: string;
  idUi?: number | string | null;
  footerText?: string;
};

export type LandingHero = {
  badge?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string | string[];
  primaryCta?: LandingLink;
  secondaryCta?: LandingLink;
  image?: LandingImage;
};

export type LandingNavbar = {
  brand?: string;
  tagline?: string;
  logoIdUi?: number | string | null;
  links: LandingLink[];
  cta?: LandingLink;
  adminCta?: LandingLink;
};

export type LandingCard = {
  label?: string;
  title?: string;
  body?: string;
  description?: string;
  image?: LandingImage;
};

export type LandingSection = {
  id: string;
  code?: string;
  label?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  paragraphs?: string[];
  image?: LandingImage;
  items?: LandingCard[];
  primaryCta?: LandingLink;
  secondaryCta?: LandingLink;
  layout?: "cards" | "split" | "quote" | "cta" | "timeline" | "compact";
};

export type NormalizedPublicLanding = {
  source: "cms" | "public-view" | "legacy-bundle" | "legacy-json";
  pageId?: string;
  slug?: string;
  title?: string;
  seoDescription?: string;
  navbar: LandingNavbar;
  hero?: LandingHero;
  sections: LandingSection[];
  footer?: {
    note?: string;
    columns?: Array<{ title: string; links?: LandingLink[]; body?: string }>;
  };
  phone?: string;
  uiById: Record<number, UiElementAsset>;
  raw: unknown;
};

export type PublicViewLoadResult =
  | { ok: true; landing: NormalizedPublicLanding; endpoint: string }
  | { ok: false; message: string; endpoint: string; status?: number; details?: unknown };
