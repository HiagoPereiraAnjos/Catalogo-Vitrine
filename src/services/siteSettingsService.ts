import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { DeepPartial, SiteSettings, SiteSettingsModuleKey } from '../types/siteSettings';
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
      heroTitle: asString(home.heroTitle, baseSettings.home.heroTitle),
      heroSubtitle: asString(home.heroSubtitle, baseSettings.home.heroSubtitle),
      primaryCtaLabel: asString(home.primaryCtaLabel, baseSettings.home.primaryCtaLabel),
      primaryCtaHref: asString(home.primaryCtaHref, baseSettings.home.primaryCtaHref),
      secondaryCtaLabel: asString(home.secondaryCtaLabel, baseSettings.home.secondaryCtaLabel),
      secondaryCtaHref: asString(home.secondaryCtaHref, baseSettings.home.secondaryCtaHref),
      featuredTitle: asString(home.featuredTitle, baseSettings.home.featuredTitle),
      featuredSubtitle: asString(home.featuredSubtitle, baseSettings.home.featuredSubtitle)
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
      storyTitle: asString(about.storyTitle, baseSettings.about.storyTitle),
      storyText: asString(about.storyText, baseSettings.about.storyText),
      positioningTitle: asString(about.positioningTitle, baseSettings.about.positioningTitle),
      positioningText: asString(about.positioningText, baseSettings.about.positioningText),
      differentialsTitle: asString(about.differentialsTitle, baseSettings.about.differentialsTitle),
      differentials: asStringArray(about.differentials, baseSettings.about.differentials)
    },
    contact: {
      title: asString(contact.title, baseSettings.contact.title),
      subtitle: asString(contact.subtitle, baseSettings.contact.subtitle),
      ctaTitle: asString(contact.ctaTitle, baseSettings.contact.ctaTitle),
      ctaDescription: asString(contact.ctaDescription, baseSettings.contact.ctaDescription),
      whatsappCtaLabel: asString(contact.whatsappCtaLabel, baseSettings.contact.whatsappCtaLabel),
      showAddress: asBoolean(contact.showAddress, baseSettings.contact.showAddress),
      showSocialLinks: asBoolean(contact.showSocialLinks, baseSettings.contact.showSocialLinks)
    },
    seo: {
      defaultTitle: asString(seo.defaultTitle, baseSettings.seo.defaultTitle),
      defaultDescription: asString(seo.defaultDescription, baseSettings.seo.defaultDescription),
      defaultOgImage: asString(seo.defaultOgImage, baseSettings.seo.defaultOgImage),
      home: mergePageSeo(baseSettings.seo.home, seo.home),
      products: mergePageSeo(baseSettings.seo.products, seo.products),
      productDetails: mergePageSeo(baseSettings.seo.productDetails, seo.productDetails),
      about: mergePageSeo(baseSettings.seo.about, seo.about),
      contact: mergePageSeo(baseSettings.seo.contact, seo.contact)
    },
    appearance: {
      themeMode: asThemeMode(appearance.themeMode, baseSettings.appearance.themeMode),
      accentColor: asString(appearance.accentColor, baseSettings.appearance.accentColor),
      accentSoftColor: asString(appearance.accentSoftColor, baseSettings.appearance.accentSoftColor),
      backgroundColor: asString(appearance.backgroundColor, baseSettings.appearance.backgroundColor),
      surfaceColor: asString(appearance.surfaceColor, baseSettings.appearance.surfaceColor),
      borderColor: asString(appearance.borderColor, baseSettings.appearance.borderColor),
      borderRadius: asBorderRadius(appearance.borderRadius, baseSettings.appearance.borderRadius)
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

  resetSettings(): SiteSettings {
    StorageService.remove(SITE_SETTINGS_STORAGE_KEY);
    const defaults = cloneDefaultSettings();
    StorageService.set(SITE_SETTINGS_STORAGE_KEY, defaults);
    notifySettingsUpdated(defaults);
    return defaults;
  }
};
