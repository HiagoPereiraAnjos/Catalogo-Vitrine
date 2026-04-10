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
  resetModuleSettings: <K extends SiteSettingsModuleKey>(moduleKey: K) => SiteSettings;
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
      setError('Não foi possível carregar as configurações do site.');
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
      setError('Não foi possível salvar as configurações do site.');
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
        setError('Não foi possível salvar as configurações deste módulo.');
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
      setError('Não foi possível restaurar as configurações padrão.');
      throw caughtError;
    }
  }, []);

  const resetModuleSettings = useCallback(<K extends SiteSettingsModuleKey>(moduleKey: K) => {
    setError(null);

    try {
      const resetedSettings = SiteSettingsService.resetModule(moduleKey);
      setSettings(resetedSettings);
      return resetedSettings;
    } catch (caughtError) {
      console.error(`Failed to reset site settings module "${moduleKey}"`, caughtError);
      setError('Não foi possível restaurar este módulo para o padrão.');
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
      resetModuleSettings,
      resetSettings
    }),
    [settings, isLoading, error, refreshSettings, saveSettings, saveModuleSettings, resetModuleSettings, resetSettings]
  );
};
