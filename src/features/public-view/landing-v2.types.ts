export type LandingV2IconText = {
  icon?: string | number;
  text?: string;
};

export type LandingV2Link = {
  label?: string;
  action?: string;
  href?: string;
};

export type LandingV2Image = {
  src?: string;
  id_ui?: number | string;
  idUi?: number | string;
  alt?: string;
  fallback_src?: string;
  fallbackSrc?: string;
};

export type LandingV2Navbar = {
  brand?: { label?: string; icon?: string | number; href?: string };
  links?: LandingV2Link[];
  cta_sign_up?: LandingV2Link;
  cta_login?: LandingV2Link;
  mobile?: {
    menu_label?: string;
    close_label?: string;
  };
};

export type LandingV2Hero = {
  badge?: LandingV2IconText;
  title?: string;
  subtitle?: string;
  title_line_1?: string;
  title_line_2?: string;
  description?: string[];
  lead?: string[];
  primary_cta?: LandingV2Link;
  secondary_cta?: LandingV2Link;
  visual?: {
    header?: LandingV2IconText & { title?: string };
    bubbles?: Array<{ variant?: "user" | "assistant" | string; text?: string }>;
    stats?: Array<{ label?: string; value?: string }>;
    note?: LandingV2IconText;
  };
  trust_cards?: Array<{
    icon?: string;
    title?: string;
    body?: string;
  }>;
};

export type LandingV2HistorySection = {
  id?: string;
  badge?: LandingV2IconText;
  title?: string;
  subtitle?: string;
  paragraphs?: {
    main?: string[];
    aditional?: string[];
    additional?: string[];
    testimonios?: Record<
      string,
      {
        paragraph?: string[];
        paragraphs?: string[];
        image?: LandingV2Image;
      }
    >;
    conclusion_phrase?: Record<string, string[]>;
  };
  image?: LandingV2Image;
  link?: LandingV2Link;
  decor_letter?: string;
};

export type LandingV2MissionSection = {
  id?: string;
  badge?: LandingV2IconText;
  title?: string;
  paragraphs?: string[];
  feature_cards?: Array<{ icon?: string; title?: string; body?: string }>;
  image?: LandingV2Image;
  link?: LandingV2Link;
  decor_letter?: string;
};

export type LandingV2EmotionsSection = {
  id?: string;
  title?: string;
  items?: Array<{ title?: string; body?: string; image?: LandingV2Image }>;
  decor_letter?: string;
};

export type LandingV2SpecialistsSection = {
  id?: string;
  title?: string;
  subtitle?: string;
  items?: Array<{
    name?: string;
    role?: string;
    tags?: string[];
    story?: string[];
    image?: LandingV2Image;
  }>;
  decor_letter?: string;
};

export type LandingV2CtaSection = {
  id?: string;
  title?: string;
  body?: string;
  bullets?: Array<LandingV2IconText>;
  primary_cta?: LandingV2Link;
  note?: LandingV2IconText;
  badge?: LandingV2IconText;
  card_body?: string;
};

export type LandingV2Footer = {
  brand?: { label?: string; icon?: string };
  tagline?: string[];
  quick_links?: LandingV2Link[];
  notice?: {
    title?: string;
    body?: string;
    note?: LandingV2IconText;
  };
  legal?: {
    copyright_template?: string;
    links?: LandingV2Link[];
  };
};

export type LandingV2Content = {
  meta?: {
    key?: string;
    version?: number;
    updated_at?: string;
    schema?: string;
  };
  navbar?: LandingV2Navbar;
  hero?: LandingV2Hero;
  sections?: {
    map?: LandingV2HistorySection;
    image?: LandingV2Image;
    link?: LandingV2Link;
    decor_letter?: string;
    mission?: LandingV2MissionSection;
    emotions?: LandingV2EmotionsSection;
    psicologists?: LandingV2SpecialistsSection;
    psychologists?: LandingV2SpecialistsSection;
    cta?: LandingV2CtaSection;
  };
  footer?: LandingV2Footer;
  presentation_section?: {
    badge?: LandingV2IconText;
    title?: string;
    subtitle?: string;
    description?: string[];
    primary_cta?: LandingV2Link;
    secondary_cta?: LandingV2Link;
    img?: LandingV2Image;
    imgs?: LandingV2Image & { id_ui_list?: Array<number | string>; id_uis?: Array<number | string> };
    img_footer_text?: string;
  };
  ui?: {
    theme_toggle?: {
      aria_label?: string;
      title?: string;
    };
  };
  telefono?: string;
  phone?: string;
};
