import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { DeepPartial, HomeSectionKey, SiteSettings, SiteSettingsModuleKey } from '../types/siteSettings';
import { StorageService } from './storageService';

export const SITE_SETTINGS_STORAGE_KEY = 'catalog_site_settings';
export const SITE_SETTINGS_UPDATED_EVENT = 'catalog:site-settings-updated';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asRecord = (value: unknown) => (isRecord(value) ? value : {});

const asString = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const nextValue = value.trim();
  return nextValue.length > 0 ? nextValue : fallback;
};

const asStringAllowEmpty = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
};

const asBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

const asStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const sanitized = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return sanitized.length > 0 ? sanitized : [...fallback];
};

const asStringArrayAllowEmpty = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

const HOME_SECTION_KEYS: HomeSectionKey[] = [
  'categories',
  'featured',
  'collections',
  'institutional',
  'benefits',
  'finalCta'
];

const asHomeSectionOrder = (value: unknown, fallback: HomeSectionKey[]) => {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const sanitized = value.filter(
    (item): item is HomeSectionKey =>
      typeof item === 'string' && HOME_SECTION_KEYS.includes(item as HomeSectionKey)
  );

  const uniqueSections: HomeSectionKey[] = [];
  sanitized.forEach((section) => {
    if (!uniqueSections.includes(section)) {
      uniqueSections.push(section);
    }
  });

  HOME_SECTION_KEYS.forEach((section) => {
    if (!uniqueSections.includes(section)) {
      uniqueSections.push(section);
    }
  });

  return uniqueSections.length > 0 ? uniqueSections : [...fallback];
};

const asBorderRadius = (value: unknown, fallback: SiteSettings['appearance']['borderRadius']) => {
  if (value === 'md' || value === 'lg' || value === 'xl' || value === '2xl') {
    return value;
  }

  return fallback;
};

const asThemeMode = (value: unknown, fallback: SiteSettings['appearance']['themeMode']) => {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return fallback;
};

const asButtonStyle = (value: unknown, fallback: SiteSettings['appearance']['buttonStyle']) => {
  if (value === 'solid' || value === 'soft' || value === 'outline') {
    return value;
  }

  return fallback;
};

const asFontPreset = (value: unknown, fallback: SiteSettings['appearance']['fontPreset']) => {
  if (value === 'signature' || value === 'modern' || value === 'editorial') {
    return value;
  }

  return fallback;
};

const cloneDefaultSettings = (): SiteSettings => JSON.parse(JSON.stringify(defaultSiteSettings)) as SiteSettings;

const notifySettingsUpdated = (settings: SiteSettings) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<SiteSettings>(SITE_SETTINGS_UPDATED_EVENT, {
      detail: settings
    })
  );
};

const mergePageSeo = (
  base: SiteSettings['seo']['home'],
  incoming: unknown
): SiteSettings['seo']['home'] => {
  const next = asRecord(incoming);
  return {
    title: asString(next.title, base.title),
    description: asString(next.description, base.description)
  };
};

export const mergeSiteSettings = (
  baseSettings: SiteSettings,
  incomingSettings: DeepPartial<SiteSettings> | unknown
): SiteSettings => {
  const incoming = asRecord(incomingSettings);

  const brand = asRecord(incoming.brand);
  const home = asRecord(incoming.home);
  const sections = asRecord(incoming.sections);
  const about = asRecord(incoming.about);
  const contact = asRecord(incoming.contact);
  const seo = asRecord(incoming.seo);
  const appearance = asRecord(incoming.appearance);

  return {
    version: baseSettings.version,
    updatedAt: asString(incoming.updatedAt, baseSettings.updatedAt),
    brand: {
      name: asString(brand.name, baseSettings.brand.name),
      shortName: asString(brand.shortName, baseSettings.brand.shortName),
      tagline: asString(brand.tagline, baseSettings.brand.tagline),
      signature: asString(brand.signature, baseSettings.brand.signature),
      heroEyebrow: asString(brand.heroEyebrow, baseSettings.brand.heroEyebrow),
      logoImage: asStringAllowEmpty(brand.logoImage, baseSettings.brand.logoImage),
      faviconImage: asStringAllowEmpty(brand.faviconImage, baseSettings.brand.faviconImage),
      institutionalImage: asStringAllowEmpty(brand.institutionalImage, baseSettings.brand.institutionalImage),
      siteUrl: asString(brand.siteUrl, baseSettings.brand.siteUrl),
      whatsappDisplay: asString(brand.whatsappDisplay, baseSettings.brand.whatsappDisplay),
      whatsappUrl: asString(brand.whatsappUrl, baseSettings.brand.whatsappUrl),
      contactEmail: asString(brand.contactEmail, baseSettings.brand.contactEmail),
      instagramHandle: asString(brand.instagramHandle, baseSettings.brand.instagramHandle),
      instagramUrl: asString(brand.instagramUrl, baseSettings.brand.instagramUrl),
      addressLine1: asString(brand.addressLine1, baseSettings.brand.addressLine1),
      addressLine2: asString(brand.addressLine2, baseSettings.brand.addressLine2)
    },
    home: {
      heroEyebrow: asStringAllowEmpty(home.heroEyebrow, baseSettings.home.heroEyebrow),
      heroTag: asStringAllowEmpty(home.heroTag, baseSettings.home.heroTag),
      heroTitle: asString(home.heroTitle, baseSettings.home.heroTitle),
      heroSubtitle: asString(home.heroSubtitle, baseSettings.home.heroSubtitle),
      primaryCtaLabel: asString(home.primaryCtaLabel, baseSettings.home.primaryCtaLabel),
      primaryCtaHref: asString(home.primaryCtaHref, baseSettings.home.primaryCtaHref),
      secondaryCtaLabel: asString(home.secondaryCtaLabel, baseSettings.home.secondaryCtaLabel),
      secondaryCtaHref: asString(home.secondaryCtaHref, baseSettings.home.secondaryCtaHref),
      heroDesktopImage: asStringAllowEmpty(home.heroDesktopImage, baseSettings.home.heroDesktopImage),
      heroMobileImage: asStringAllowEmpty(home.heroMobileImage, baseSettings.home.heroMobileImage),
      showCategories: asBoolean(home.showCategories, baseSettings.home.showCategories),
      showFeaturedProducts: asBoolean(home.showFeaturedProducts, baseSettings.home.showFeaturedProducts),
      showCollections: asBoolean(home.showCollections, baseSettings.home.showCollections),
      showInstitutional: asBoolean(home.showInstitutional, baseSettings.home.showInstitutional),
      showBenefits: asBoolean(home.showBenefits, baseSettings.home.showBenefits),
      showFinalCta: asBoolean(home.showFinalCta, baseSettings.home.showFinalCta),
      sectionOrder: asHomeSectionOrder(home.sectionOrder, baseSettings.home.sectionOrder),
      categoriesTitle: asString(home.categoriesTitle, baseSettings.home.categoriesTitle),
      categoriesSubtitle: asString(home.categoriesSubtitle, baseSettings.home.categoriesSubtitle),
      featuredTitle: asString(home.featuredTitle, baseSettings.home.featuredTitle),
      featuredSubtitle: asString(home.featuredSubtitle, baseSettings.home.featuredSubtitle),
      collectionsTitle: asString(home.collectionsTitle, baseSettings.home.collectionsTitle),
      collectionsSubtitle: asString(home.collectionsSubtitle, baseSettings.home.collectionsSubtitle),
      institutionalEyebrow: asString(home.institutionalEyebrow, baseSettings.home.institutionalEyebrow),
      institutionalTitle: asString(home.institutionalTitle, baseSettings.home.institutionalTitle),
      institutionalBodyPrimary: asString(home.institutionalBodyPrimary, baseSettings.home.institutionalBodyPrimary),
      institutionalBodySecondary: asString(home.institutionalBodySecondary, baseSettings.home.institutionalBodySecondary),
      benefitsTitle: asString(home.benefitsTitle, baseSettings.home.benefitsTitle),
      benefitsSubtitle: asString(home.benefitsSubtitle, baseSettings.home.benefitsSubtitle),
      benefitsItems: asStringArray(home.benefitsItems, baseSettings.home.benefitsItems),
      finalCtaEyebrow: asString(home.finalCtaEyebrow, baseSettings.home.finalCtaEyebrow),
      finalCtaTitle: asString(home.finalCtaTitle, baseSettings.home.finalCtaTitle),
      finalCtaSubtitle: asString(home.finalCtaSubtitle, baseSettings.home.finalCtaSubtitle),
      finalCtaLabel: asString(home.finalCtaLabel, baseSettings.home.finalCtaLabel),
      finalCtaHref: asStringAllowEmpty(home.finalCtaHref, baseSettings.home.finalCtaHref),
      featuredProductIds: asStringArrayAllowEmpty(home.featuredProductIds, baseSettings.home.featuredProductIds)
    },
    sections: {
      showHero: asBoolean(sections.showHero, baseSettings.sections.showHero),
      showCollections: asBoolean(sections.showCollections, baseSettings.sections.showCollections),
      showHighlights: asBoolean(sections.showHighlights, baseSettings.sections.showHighlights),
      showEditorial: asBoolean(sections.showEditorial, baseSettings.sections.showEditorial),
      showInstitutional: asBoolean(sections.showInstitutional, baseSettings.sections.showInstitutional),
      showContactCta: asBoolean(sections.showContactCta, baseSettings.sections.showContactCta)
    },
    about: {
      title: asString(about.title, baseSettings.about.title),
      subtitle: asString(about.subtitle, baseSettings.about.subtitle),
      heroImage: asStringAllowEmpty(about.heroImage, baseSettings.about.heroImage),
      mainImage: asStringAllowEmpty(about.mainImage, baseSettings.about.mainImage),
      galleryImages: asStringArrayAllowEmpty(about.galleryImages, baseSettings.about.galleryImages),
      storyTitle: asString(about.storyTitle, baseSettings.about.storyTitle),
      storyText: asString(about.storyText, baseSettings.about.storyText),
      institutionalMainText: asString(about.institutionalMainText, baseSettings.about.institutionalMainText),
      missionTitle: asString(about.missionTitle, baseSettings.about.missionTitle),
      missionText: asString(about.missionText, baseSettings.about.missionText),
      valuesTitle: asString(about.valuesTitle, baseSettings.about.valuesTitle),
      values: asStringArray(about.values, baseSettings.about.values),
      positioningTitle: asString(about.positioningTitle, baseSettings.about.positioningTitle),
      positioningText: asString(about.positioningText, baseSettings.about.positioningText),
      positioningPhrases: asStringArray(about.positioningPhrases, baseSettings.about.positioningPhrases),
      differentialsTitle: asString(about.differentialsTitle, baseSettings.about.differentialsTitle),
      differentials: asStringArray(about.differentials, baseSettings.about.differentials)
    },
    contact: {
      title: asString(contact.title, baseSettings.contact.title),
      subtitle: asString(contact.subtitle, baseSettings.contact.subtitle),
      supportText: asString(contact.supportText, baseSettings.contact.supportText),
      ctaTitle: asString(contact.ctaTitle, baseSettings.contact.ctaTitle),
      ctaDescription: asString(contact.ctaDescription, baseSettings.contact.ctaDescription),
      primaryCtaLabel: asString(
        contact.primaryCtaLabel ?? contact.whatsappCtaLabel,
        baseSettings.contact.primaryCtaLabel
      ),
      whatsappDisplay: asString(contact.whatsappDisplay, baseSettings.contact.whatsappDisplay),
      whatsappUrl: asString(contact.whatsappUrl, baseSettings.contact.whatsappUrl),
      secondaryPhone: asStringAllowEmpty(contact.secondaryPhone, baseSettings.contact.secondaryPhone),
      email: asString(contact.email, baseSettings.contact.email),
      instagramHandle: asString(contact.instagramHandle, baseSettings.contact.instagramHandle),
      instagramUrl: asString(contact.instagramUrl, baseSettings.contact.instagramUrl),
      facebookLabel: asStringAllowEmpty(contact.facebookLabel, baseSettings.contact.facebookLabel),
      facebookUrl: asStringAllowEmpty(contact.facebookUrl, baseSettings.contact.facebookUrl),
      addressLine1: asString(contact.addressLine1, baseSettings.contact.addressLine1),
      addressLine2: asString(contact.addressLine2, baseSettings.contact.addressLine2),
      businessHours: asString(contact.businessHours, baseSettings.contact.businessHours),
      showAddress: asBoolean(contact.showAddress, baseSettings.contact.showAddress),
      showSocialLinks: asBoolean(contact.showSocialLinks, baseSettings.contact.showSocialLinks)
    },
    seo: {
      defaultTitle: asString(seo.defaultTitle, baseSettings.seo.defaultTitle),
      institutionalTitle: asString(seo.institutionalTitle, baseSettings.seo.institutionalTitle),
      defaultDescription: asString(seo.defaultDescription, baseSettings.seo.defaultDescription),
      defaultOgImage: asStringAllowEmpty(seo.defaultOgImage, baseSettings.seo.defaultOgImage),
      primaryKeywords: asString(seo.primaryKeywords, baseSettings.seo.primaryKeywords),
      home: mergePageSeo(baseSettings.seo.home, seo.home),
      products: mergePageSeo(baseSettings.seo.products, seo.products),
      productDetails: mergePageSeo(baseSettings.seo.productDetails, seo.productDetails),
      about: mergePageSeo(baseSettings.seo.about, seo.about),
      contact: mergePageSeo(baseSettings.seo.contact, seo.contact)
    },
    appearance: {
      themeMode: asThemeMode(appearance.themeMode, baseSettings.appearance.themeMode),
      primaryColor: asString(appearance.primaryColor ?? appearance.accentColor, baseSettings.appearance.primaryColor),
      highlightColor: asString(
        appearance.highlightColor ?? appearance.accentSoftColor,
        baseSettings.appearance.highlightColor
      ),
      supportColor: asString(appearance.supportColor, baseSettings.appearance.supportColor),
      accentColor: asString(appearance.accentColor, baseSettings.appearance.accentColor),
      accentSoftColor: asString(appearance.accentSoftColor, baseSettings.appearance.accentSoftColor),
      backgroundColor: asString(appearance.backgroundColor, baseSettings.appearance.backgroundColor),
      surfaceColor: asString(appearance.surfaceColor, baseSettings.appearance.surfaceColor),
      borderColor: asString(appearance.borderColor, baseSettings.appearance.borderColor),
      borderRadius: asBorderRadius(appearance.borderRadius, baseSettings.appearance.borderRadius),
      buttonStyle: asButtonStyle(appearance.buttonStyle, baseSettings.appearance.buttonStyle),
      fontPreset: asFontPreset(appearance.fontPreset, baseSettings.appearance.fontPreset)
    }
  };
};

const withUpdatedAt = (settings: SiteSettings): SiteSettings => ({
  ...settings,
  version: defaultSiteSettings.version,
  updatedAt: new Date().toISOString()
});

const loadStoredSettings = () => StorageService.get<DeepPartial<SiteSettings> | null>(SITE_SETTINGS_STORAGE_KEY, null);

export const SiteSettingsService = {
  getSettings(): SiteSettings {
    const defaults = cloneDefaultSettings();
    const stored = loadStoredSettings();
    const merged = mergeSiteSettings(defaults, stored || {});

    // Keep persisted structure normalized for safe future reads.
    StorageService.set(SITE_SETTINGS_STORAGE_KEY, merged);
    return merged;
  },

  saveSettings(nextSettings: DeepPartial<SiteSettings> | SiteSettings): SiteSettings {
    const currentSettings = this.getSettings();
    const merged = mergeSiteSettings(currentSettings, nextSettings);
    const normalized = withUpdatedAt(merged);
    StorageService.set(SITE_SETTINGS_STORAGE_KEY, normalized);
    notifySettingsUpdated(normalized);
    return normalized;
  },

  saveModule<K extends SiteSettingsModuleKey>(
    moduleKey: K,
    nextModuleSettings: DeepPartial<SiteSettings[K]>
  ): SiteSettings {
    const currentSettings = this.getSettings();
    const nextSettings = {
      ...currentSettings,
      [moduleKey]: {
        ...currentSettings[moduleKey],
        ...nextModuleSettings
      }
    } as DeepPartial<SiteSettings>;

    return this.saveSettings(nextSettings);
  },

  resetModule<K extends SiteSettingsModuleKey>(moduleKey: K): SiteSettings {
    const defaults = cloneDefaultSettings();
    return this.saveModule(moduleKey, defaults[moduleKey]);
  },

  resetSettings(): SiteSettings {
    StorageService.remove(SITE_SETTINGS_STORAGE_KEY);
    const defaults = cloneDefaultSettings();
    StorageService.set(SITE_SETTINGS_STORAGE_KEY, defaults);
    notifySettingsUpdated(defaults);
    return defaults;
  }
};
