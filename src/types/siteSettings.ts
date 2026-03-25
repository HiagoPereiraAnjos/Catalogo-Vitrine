export type SiteThemeMode = 'light' | 'dark' | 'system';

export interface SiteBrandSettings {
  name: string;
  shortName: string;
  tagline: string;
  signature: string;
  heroEyebrow: string;
  logoImage: string;
  faviconImage: string;
  institutionalImage: string;
  siteUrl: string;
  whatsappDisplay: string;
  whatsappUrl: string;
  contactEmail: string;
  instagramHandle: string;
  instagramUrl: string;
  addressLine1: string;
  addressLine2: string;
}

export interface SiteHomeSettings {
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  featuredTitle: string;
  featuredSubtitle: string;
}

export interface SiteSectionsSettings {
  showHero: boolean;
  showCollections: boolean;
  showHighlights: boolean;
  showEditorial: boolean;
  showInstitutional: boolean;
  showContactCta: boolean;
}

export interface SiteAboutSettings {
  title: string;
  subtitle: string;
  storyTitle: string;
  storyText: string;
  positioningTitle: string;
  positioningText: string;
  differentialsTitle: string;
  differentials: string[];
}

export interface SiteContactSettings {
  title: string;
  subtitle: string;
  ctaTitle: string;
  ctaDescription: string;
  whatsappCtaLabel: string;
  showAddress: boolean;
  showSocialLinks: boolean;
}

export interface SiteSeoPageSettings {
  title: string;
  description: string;
}

export interface SiteSeoSettings {
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  home: SiteSeoPageSettings;
  products: SiteSeoPageSettings;
  productDetails: SiteSeoPageSettings;
  about: SiteSeoPageSettings;
  contact: SiteSeoPageSettings;
}

export interface SiteAppearanceSettings {
  themeMode: SiteThemeMode;
  accentColor: string;
  accentSoftColor: string;
  backgroundColor: string;
  surfaceColor: string;
  borderColor: string;
  borderRadius: 'md' | 'lg' | 'xl' | '2xl';
}

export interface SiteSettings {
  version: number;
  updatedAt: string;
  brand: SiteBrandSettings;
  home: SiteHomeSettings;
  sections: SiteSectionsSettings;
  about: SiteAboutSettings;
  contact: SiteContactSettings;
  seo: SiteSeoSettings;
  appearance: SiteAppearanceSettings;
}

export type SiteSettingsModuleKey = keyof Omit<SiteSettings, 'version' | 'updatedAt'>;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
