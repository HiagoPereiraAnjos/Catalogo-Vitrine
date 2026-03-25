import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { SiteSettingsService } from '../services/siteSettingsService';
import { SiteBrandSettings } from '../types/siteSettings';

export const getBrandSettingsSnapshot = (): SiteBrandSettings => {
  try {
    return SiteSettingsService.getSettings().brand;
  } catch (error) {
    console.error('Falha ao carregar configuracoes da marca. Usando padrao.', error);
    return defaultSiteSettings.brand;
  }
};

