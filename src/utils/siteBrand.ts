import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { SiteSettingsService } from '../services/siteSettingsService';
import { SiteBrandSettings, SiteContactSettings, SiteSeoSettings } from '../types/siteSettings';

const getSettingsSnapshot = () => {
  try {
    return SiteSettingsService.getSettings();
  } catch (error) {
    console.error('Falha ao carregar configurações do site. Usando padrão.', error);
    return defaultSiteSettings;
  }
};

export const getBrandSettingsSnapshot = (): SiteBrandSettings => {
  return getSettingsSnapshot().brand;
};

export const getContactSettingsSnapshot = (): SiteContactSettings => {
  return getSettingsSnapshot().contact;
};

export const getSeoSettingsSnapshot = (): SiteSeoSettings => {
  return getSettingsSnapshot().seo;
};
