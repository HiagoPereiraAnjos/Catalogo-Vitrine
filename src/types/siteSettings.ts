export type SiteThemeMode = 'light' | 'dark' | 'system';
export type HomeSectionKey =
  | 'categories'
  | 'featured'
  | 'collections'
  | 'institutional'
  | 'benefits'
  | 'finalCta';

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
  heroEyebrow: string;
  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  heroDesktopImage: string;
  heroMobileImage: string;
  showCategories: boolean;
  showFeaturedProducts: boolean;
  showCollections: boolean;
  showInstitutional: boolean;
  showBenefits: boolean;
  showFinalCta: boolean;
  sectionOrder: HomeSectionKey[];
  categoriesTitle: string;
  categoriesSubtitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  collectionsTitle: string;
  collectionsSubtitle: string;
  institutionalEyebrow: string;
  institutionalTitle: string;
  institutionalBodyPrimary: string;
  institutionalBodySecondary: string;
  benefitsTitle: string;
  benefitsSubtitle: string;
  benefitsItems: string[];
  finalCtaEyebrow: string;
  finalCtaTitle: string;
  finalCtaSubtitle: string;
  finalCtaLabel: string;
  finalCtaHref: string;
  featuredProductIds: string[];
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
  heroImage: string;
  mainImage: string;
  galleryImages: string[];
  storyTitle: string;
  storyText: string;
  institutionalMainText: string;
  missionTitle: string;
  missionText: string;
  valuesTitle: string;
  values: string[];
  positioningTitle: string;
  positioningText: string;
  positioningPhrases: string[];
  differentialsTitle: string;
  differentials: string[];
}

export interface SiteContactSettings {
  title: string;
  subtitle: string;
  supportText: string;
  ctaTitle: string;
  ctaDescription: string;
  primaryCtaLabel: string;
  whatsappDisplay: string;
  whatsappUrl: string;
  secondaryPhone: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  facebookLabel: string;
  facebookUrl: string;
  addressLine1: string;
  addressLine2: string;
  businessHours: string;
  showAddress: boolean;
  showSocialLinks: boolean;
}

export interface SiteSeoPageSettings {
  title: string;
  description: string;
}

export interface SiteSeoSettings {
  defaultTitle: string;
  institutionalTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  primaryKeywords: string;
  home: SiteSeoPageSettings;
  products: SiteSeoPageSettings;
  productDetails: SiteSeoPageSettings;
  about: SiteSeoPageSettings;
  contact: SiteSeoPageSettings;
}

export interface SiteAppearanceSettings {
  themeMode: SiteThemeMode;
  primaryColor: string;
  highlightColor: string;
  supportColor: string;
  accentColor: string;
  accentSoftColor: string;
  backgroundColor: string;
  surfaceColor: string;
  borderColor: string;
  borderRadius: 'md' | 'lg' | 'xl' | '2xl';
  buttonStyle: 'solid' | 'soft' | 'outline';
  fontPreset: 'signature' | 'modern' | 'editorial';
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
