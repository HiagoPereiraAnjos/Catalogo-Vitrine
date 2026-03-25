import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeepPartial, SiteSettings, SiteSettingsModuleKey } from '../types/siteSettings';
import {
  SITE_SETTINGS_STORAGE_KEY,
  SITE_SETTINGS_UPDATED_EVENT,
  SiteSettingsService
} from '../services/siteSettingsService';

interface UseSiteSettingsResult {
  settings: SiteSettings;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => void;
  saveSettings: (nextSettings: DeepPartial<SiteSettings> | SiteSettings) => SiteSettings;
  saveModuleSettings: <K extends SiteSettingsModuleKey>(
    moduleKey: K,
    nextModuleSettings: DeepPartial<SiteSettings[K]>
  ) => SiteSettings;
  resetSettings: () => SiteSettings;
}

export const useSiteSettings = (): UseSiteSettingsResult => {
  const [settings, setSettings] = useState<SiteSettings>(() => SiteSettingsService.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const nextSettings = SiteSettingsService.getSettings();
      setSettings(nextSettings);
    } catch (caughtError) {
      console.error('Failed to load site settings', caughtError);
      setError('Nao foi possivel carregar as configuracoes do site.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback((nextSettings: DeepPartial<SiteSettings> | SiteSettings) => {
    setError(null);

    try {
      const savedSettings = SiteSettingsService.saveSettings(nextSettings);
      setSettings(savedSettings);
      return savedSettings;
    } catch (caughtError) {
      console.error('Failed to save site settings', caughtError);
      setError('Nao foi possivel salvar as configuracoes do site.');
      throw caughtError;
    }
  }, []);

  const saveModuleSettings = useCallback(
    <K extends SiteSettingsModuleKey>(
      moduleKey: K,
      nextModuleSettings: DeepPartial<SiteSettings[K]>
    ) => {
      setError(null);

      try {
        const savedSettings = SiteSettingsService.saveModule(moduleKey, nextModuleSettings);
        setSettings(savedSettings);
        return savedSettings;
      } catch (caughtError) {
        console.error(`Failed to save site settings module "${moduleKey}"`, caughtError);
        setError('Nao foi possivel salvar as configuracoes deste modulo.');
        throw caughtError;
      }
    },
    []
  );

  const resetSettings = useCallback(() => {
    setError(null);

    try {
      const resetedSettings = SiteSettingsService.resetSettings();
      setSettings(resetedSettings);
      return resetedSettings;
    } catch (caughtError) {
      console.error('Failed to reset site settings', caughtError);
      setError('Nao foi possivel restaurar as configuracoes padrao.');
      throw caughtError;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== SITE_SETTINGS_STORAGE_KEY) {
        return;
      }

      refreshSettings();
    };

    const handleSettingsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<SiteSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
        return;
      }

      refreshSettings();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    };
  }, [refreshSettings]);

  return useMemo(
    () => ({
      settings,
      isLoading,
      error,
      refreshSettings,
      saveSettings,
      saveModuleSettings,
      resetSettings
    }),
    [settings, isLoading, error, refreshSettings, saveSettings, saveModuleSettings, resetSettings]
  );
};
