import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Palette, Save } from 'lucide-react';
import { Button } from '../../../components/Button';
import { defaultSiteSettings } from '../../../data/defaultSiteSettings';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { SiteAppearanceSettings } from '../../../types/siteSettings';
import {
  APPEARANCE_BUTTON_STYLES,
  APPEARANCE_COLOR_PRESETS,
  APPEARANCE_FONT_PRESETS,
  normalizeAppearanceSettings,
  sanitizeHexColor
} from '../../../utils/appearanceTheme';

type NoticeType = 'success' | 'error';

interface StatusMessage {
  type: NoticeType;
  message: string;
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const getFieldClassName = (hasError = false) =>
  `field-control ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
  }`;

const sanitizeAppearance = (appearance: SiteAppearanceSettings): SiteAppearanceSettings => {
  const fallback = defaultSiteSettings.appearance;
  const normalized = normalizeAppearanceSettings(appearance, fallback);

  return {
    ...normalized,
    accentColor: normalized.primaryColor,
    accentSoftColor: normalized.highlightColor
  };
};

const getAppearanceValidationError = (appearance: SiteAppearanceSettings) => {
  if (!HEX_COLOR_REGEX.test(appearance.primaryColor.trim())) {
    return 'A cor principal deve estar no formato hexadecimal, por exemplo #1e3a8a.';
  }

  if (!HEX_COLOR_REGEX.test(appearance.highlightColor.trim())) {
    return 'A cor de destaque deve estar no formato hexadecimal.';
  }

  if (!HEX_COLOR_REGEX.test(appearance.supportColor.trim())) {
    return 'A cor de apoio deve estar no formato hexadecimal.';
  }

  return null;
};

export const AppearanceSettingsPanel = () => {
  const { settings, saveModuleSettings } = useSiteSettings();
  const [formData, setFormData] = useState<SiteAppearanceSettings>(settings.appearance);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    setFormData(settings.appearance);
  }, [settings.appearance]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(settings.appearance),
    [formData, settings.appearance]
  );

  const preview = useMemo(() => {
    const fallback = defaultSiteSettings.appearance;
    return normalizeAppearanceSettings(formData, fallback);
  }, [formData]);

  const setField = <K extends keyof SiteAppearanceSettings>(field: K, value: SiteAppearanceSettings[K]) => {
    setFormData((previousState) => ({
      ...previousState,
      [field]: value
    }));
  };

  const applyPalettePreset = (palette: (typeof APPEARANCE_COLOR_PRESETS)[number]) => {
    setFormData((previousState) => ({
      ...previousState,
      primaryColor: palette.primary,
      highlightColor: palette.highlight,
      supportColor: palette.support,
      accentColor: palette.primary,
      accentSoftColor: palette.highlight
    }));
  };

  const handleHexFieldChange = (
    field: 'primaryColor' | 'highlightColor' | 'supportColor',
    value: string
  ) => {
    setFormData((previousState) => {
      const normalizedValue = value.trim();
      const nextValue = normalizedValue.length === 0 ? value : sanitizeHexColor(value, previousState[field]);
      const nextState = {
        ...previousState,
        [field]: nextValue
      } as SiteAppearanceSettings;

      if (field === 'primaryColor') {
        nextState.accentColor = nextState.primaryColor;
      }

      if (field === 'highlightColor') {
        nextState.accentSoftColor = nextState.highlightColor;
      }

      return nextState;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = getAppearanceValidationError(formData);
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setIsSaving(true);

    try {
      const payload = sanitizeAppearance(formData);
      saveModuleSettings('appearance', payload);
      setStatus({ type: 'success', message: 'Tema visual salvo com sucesso.' });
    } catch (error) {
      console.error('Falha ao salvar configuracoes de aparencia', error);
      setStatus({ type: 'error', message: 'Nao foi possivel salvar o tema visual.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings.appearance);
    setStatus({ type: 'success', message: 'Alteracoes locais descartadas.' });
  };

  return (
    <section className="premium-reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_22px_44px_-34px_rgba(17,24,39,0.55)] md:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Aparencia</p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Tema visual controlado</h2>
          <p className="mt-1 text-sm text-gray-600">Personalize cores e estilo dos botoes com opcoes seguras, sem quebrar o layout premium.</p>
        </div>

        {status && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {status.message}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Paletas sugeridas</h3>
          <p className="mt-1 text-xs text-gray-500">Selecione uma base pronta e depois ajuste as cores finamente, se quiser.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {APPEARANCE_COLOR_PRESETS.map((palette) => (
              <button
                key={palette.id}
                type="button"
                onClick={() => applyPalettePreset(palette)}
                className="premium-interactive rounded-xl border border-gray-200 bg-white p-3 text-left hover:-translate-y-px hover:border-gray-300"
              >
                <div className="mb-2 flex gap-2">
                  <span className="h-5 w-5 rounded-full border border-white/70" style={{ backgroundColor: palette.primary }} />
                  <span className="h-5 w-5 rounded-full border border-white/70" style={{ backgroundColor: palette.highlight }} />
                  <span className="h-5 w-5 rounded-full border border-white/70" style={{ backgroundColor: palette.support }} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-700">{palette.label}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Cores da identidade</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Cor principal</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={sanitizeHexColor(formData.primaryColor, defaultSiteSettings.appearance.primaryColor)}
                  onChange={(event) => handleHexFieldChange('primaryColor', event.target.value)}
                  className="h-10 w-12 rounded-lg border border-gray-200 bg-white"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(event) => handleHexFieldChange('primaryColor', event.target.value)}
                  className={getFieldClassName()}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Cor de destaque</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={sanitizeHexColor(formData.highlightColor, defaultSiteSettings.appearance.highlightColor)}
                  onChange={(event) => handleHexFieldChange('highlightColor', event.target.value)}
                  className="h-10 w-12 rounded-lg border border-gray-200 bg-white"
                />
                <input
                  type="text"
                  value={formData.highlightColor}
                  onChange={(event) => handleHexFieldChange('highlightColor', event.target.value)}
                  className={getFieldClassName()}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Cor de apoio</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={sanitizeHexColor(formData.supportColor, defaultSiteSettings.appearance.supportColor)}
                  onChange={(event) => handleHexFieldChange('supportColor', event.target.value)}
                  className="h-10 w-12 rounded-lg border border-gray-200 bg-white"
                />
                <input
                  type="text"
                  value={formData.supportColor}
                  onChange={(event) => handleHexFieldChange('supportColor', event.target.value)}
                  className={getFieldClassName()}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Estilo de botoes</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {APPEARANCE_BUTTON_STYLES.map((option) => {
              const isSelected = formData.buttonStyle === option.value;

              return (
                <label
                  key={option.value}
                  className={`premium-interactive cursor-pointer rounded-xl border px-3 py-3 ${
                    isSelected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="button-style"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setField('buttonStyle', option.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className={`mt-1 text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{option.description}</p>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Fonte principal (opcional)</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {APPEARANCE_FONT_PRESETS.map((option) => {
              const isSelected = formData.fontPreset === option.value;

              return (
                <label
                  key={option.value}
                  className={`premium-interactive cursor-pointer rounded-xl border px-3 py-3 ${
                    isSelected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="font-preset"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setField('fontPreset', option.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className={`mt-1 text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{option.description}</p>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Preview rapido</h3>

          <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: preview.borderColor, backgroundColor: preview.surfaceColor }}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: preview.supportColor }}>
              Aparencia da marca
            </p>
            <h4 className="mt-2 text-2xl" style={{ color: preview.primaryColor, fontFamily: 'var(--font-serif)' }}>
              Denim Premium
            </h4>
            <p className="mt-2 text-sm text-gray-600">Seu tema se aplica em Header, botoes, badges e principais CTAs.</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: `${preview.primaryColor}40`,
                  color: preview.primaryColor,
                  backgroundColor: `${preview.highlightColor}`
                }}
              >
                <Palette className="mr-1 h-3.5 w-3.5" />
                Badge de destaque
              </span>
              <Button type="button" variant="primary" size="sm">
                Botao principal
              </Button>
              <Button type="button" variant="outline" size="sm">
                Botao secundario
              </Button>
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Personalizacao controlada: o layout permanece consistente e premium.</p>

          <div className="flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || isSaving}>
              Descartar
            </Button>
            <Button type="submit" disabled={!isDirty || isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar aparencia'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};
