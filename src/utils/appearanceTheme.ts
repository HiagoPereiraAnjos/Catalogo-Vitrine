import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { SiteAppearanceSettings } from '../types/siteSettings';

export const APPEARANCE_COLOR_PRESETS = [
  {
    id: 'indigo-premium',
    label: 'Indigo Premium',
    primary: '#1e3a8a',
    highlight: '#dbeafe',
    support: '#475569'
  },
  {
    id: 'denim-ocean',
    label: 'Denim Ocean',
    primary: '#0f4c81',
    highlight: '#dbeafe',
    support: '#334155'
  },
  {
    id: 'sandstone',
    label: 'Sandstone',
    primary: '#8b5e34',
    highlight: '#fef3c7',
    support: '#57534e'
  },
  {
    id: 'graphite',
    label: 'Graphite',
    primary: '#1f2937',
    highlight: '#e5e7eb',
    support: '#4b5563'
  }
] as const;

export const APPEARANCE_BUTTON_STYLES: Array<{
  value: SiteAppearanceSettings['buttonStyle'];
  label: string;
  description: string;
}> = [
  {
    value: 'solid',
    label: 'Sólido Premium',
    description: 'Botões com preenchimento forte e presença visual.'
  },
  {
    value: 'soft',
    label: 'Suave',
    description: 'Botões mais leves, mantendo contraste e elegância.'
  },
  {
    value: 'outline',
    label: 'Contorno',
    description: 'Visual minimalista com bordas e menos massa de cor.'
  }
];

export const APPEARANCE_FONT_PRESETS: Array<{
  value: SiteAppearanceSettings['fontPreset'];
  label: string;
  description: string;
  sans: string;
  serif: string;
}> = [
  {
    value: 'signature',
    label: 'Assinatura',
    description: 'Equilibrado e premium, ideal para moda comercial.',
    sans: '"Manrope", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    serif: '"Cormorant Garamond", Georgia, "Times New Roman", serif'
  },
  {
    value: 'modern',
    label: 'Moderno',
    description: 'Leitura limpa com tom contemporâneo.',
    sans: '"Plus Jakarta Sans", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    serif: '"Playfair Display", Georgia, "Times New Roman", serif'
  },
  {
    value: 'editorial',
    label: 'Editorial',
    description: 'Mais contraste e personalidade em títulos.',
    sans: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    serif: '"Libre Baskerville", Georgia, "Times New Roman", serif'
  }
];

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeHexColor = (value: string) => {
  const sanitized = value.trim();

  if (!HEX_COLOR_REGEX.test(sanitized)) {
    return null;
  }

  if (sanitized.length === 4) {
    const [hash, r, g, b] = sanitized;
    return `${hash}${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return sanitized.toLowerCase();
};

export const sanitizeHexColor = (value: string, fallback: string) =>
  normalizeHexColor(value) || normalizeHexColor(fallback) || '#1e3a8a';

const hexToRgb = (hexColor: string) => {
  const normalized = sanitizeHexColor(hexColor, '#1e3a8a').slice(1);
  const parsed = Number.parseInt(normalized, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;

const shiftHexColor = (hexColor: string, amount: number) => {
  const { r, g, b } = hexToRgb(hexColor);
  return rgbToHex(r + amount, g + amount, b + amount);
};

const rgbCssValue = (hexColor: string) => {
  const { r, g, b } = hexToRgb(hexColor);
  return `${r}, ${g}, ${b}`;
};

const resolveButtonStyle = (value: string, fallback: SiteAppearanceSettings['buttonStyle']) => {
  if (value === 'solid' || value === 'soft' || value === 'outline') {
    return value;
  }

  return fallback;
};

const resolveFontPreset = (value: string, fallback: SiteAppearanceSettings['fontPreset']) => {
  if (value === 'signature' || value === 'modern' || value === 'editorial') {
    return value;
  }

  return fallback;
};

export const normalizeAppearanceSettings = (
  incoming: SiteAppearanceSettings,
  fallback: SiteAppearanceSettings = defaultSiteSettings.appearance
): SiteAppearanceSettings => {
  const primaryColor = sanitizeHexColor(incoming.primaryColor || incoming.accentColor, fallback.primaryColor);
  const highlightColor = sanitizeHexColor(
    incoming.highlightColor || incoming.accentSoftColor,
    fallback.highlightColor
  );
  const supportColor = sanitizeHexColor(incoming.supportColor, fallback.supportColor);

  return {
    ...incoming,
    themeMode: incoming.themeMode || fallback.themeMode,
    primaryColor,
    highlightColor,
    supportColor,
    accentColor: primaryColor,
    accentSoftColor: highlightColor,
    backgroundColor: sanitizeHexColor(incoming.backgroundColor, fallback.backgroundColor),
    surfaceColor: sanitizeHexColor(incoming.surfaceColor, fallback.surfaceColor),
    borderColor: sanitizeHexColor(incoming.borderColor, fallback.borderColor),
    borderRadius: incoming.borderRadius || fallback.borderRadius,
    buttonStyle: resolveButtonStyle(incoming.buttonStyle, fallback.buttonStyle),
    fontPreset: resolveFontPreset(incoming.fontPreset, fallback.fontPreset)
  };
};

export const applyAppearanceTheme = (
  appearance: SiteAppearanceSettings,
  fallback: SiteAppearanceSettings = defaultSiteSettings.appearance
) => {
  if (typeof document === 'undefined') {
    return;
  }

  const resolved = normalizeAppearanceSettings(appearance, fallback);
  const root = document.documentElement;
  const fontPreset =
    APPEARANCE_FONT_PRESETS.find((preset) => preset.value === resolved.fontPreset) || APPEARANCE_FONT_PRESETS[0];

  const primaryStrongColor = shiftHexColor(resolved.primaryColor, -20);
  const primarySubtleColor = shiftHexColor(resolved.primaryColor, 16);

  root.style.setProperty('--brand-accent', resolved.primaryColor);
  root.style.setProperty('--brand-accent-soft', resolved.highlightColor);
  root.style.setProperty('--brand-bg', resolved.backgroundColor);
  root.style.setProperty('--brand-surface', resolved.surfaceColor);
  root.style.setProperty('--brand-border', resolved.borderColor);

  root.style.setProperty('--theme-primary', resolved.primaryColor);
  root.style.setProperty('--theme-primary-strong', primaryStrongColor);
  root.style.setProperty('--theme-primary-subtle', primarySubtleColor);
  root.style.setProperty('--theme-highlight', resolved.highlightColor);
  root.style.setProperty('--theme-support', resolved.supportColor);
  root.style.setProperty('--theme-primary-rgb', rgbCssValue(resolved.primaryColor));
  root.style.setProperty('--theme-highlight-rgb', rgbCssValue(resolved.highlightColor));
  root.style.setProperty('--theme-support-rgb', rgbCssValue(resolved.supportColor));

  root.style.setProperty('--font-sans', fontPreset.sans);
  root.style.setProperty('--font-serif', fontPreset.serif);

  root.dataset.themeMode = resolved.themeMode;
  root.dataset.fontPreset = fontPreset.value;
  root.dataset.buttonStyle = resolved.buttonStyle;

  if (resolved.buttonStyle === 'soft') {
    root.style.setProperty('--btn-primary-bg', `rgba(${rgbCssValue(resolved.primaryColor)}, 0.13)`);
    root.style.setProperty('--btn-primary-bg-hover', `rgba(${rgbCssValue(resolved.primaryColor)}, 0.2)`);
    root.style.setProperty('--btn-primary-text', resolved.primaryColor);
    root.style.setProperty('--btn-primary-border', `rgba(${rgbCssValue(resolved.primaryColor)}, 0.3)`);
    root.style.setProperty('--btn-primary-shadow', '0 10px 28px -20px rgba(15,23,42,0.22)');
  } else if (resolved.buttonStyle === 'outline') {
    root.style.setProperty('--btn-primary-bg', 'transparent');
    root.style.setProperty('--btn-primary-bg-hover', `rgba(${rgbCssValue(resolved.primaryColor)}, 0.09)`);
    root.style.setProperty('--btn-primary-text', resolved.primaryColor);
    root.style.setProperty('--btn-primary-border', `rgba(${rgbCssValue(resolved.primaryColor)}, 0.38)`);
    root.style.setProperty('--btn-primary-shadow', '0 8px 22px -20px rgba(15,23,42,0.18)');
  } else {
    root.style.setProperty('--btn-primary-bg', resolved.primaryColor);
    root.style.setProperty('--btn-primary-bg-hover', primaryStrongColor);
    root.style.setProperty('--btn-primary-text', '#ffffff');
    root.style.setProperty('--btn-primary-border', 'transparent');
    root.style.setProperty('--btn-primary-shadow', `0 14px 32px -22px rgba(${rgbCssValue(resolved.primaryColor)}, 0.66)`);
  }

  root.style.setProperty('--btn-secondary-bg', `rgba(${rgbCssValue(resolved.highlightColor)}, 0.55)`);
  root.style.setProperty('--btn-secondary-bg-hover', `rgba(${rgbCssValue(resolved.highlightColor)}, 0.78)`);
  root.style.setProperty('--btn-secondary-text', resolved.primaryColor);
  root.style.setProperty('--btn-secondary-border', `rgba(${rgbCssValue(resolved.primaryColor)}, 0.18)`);

  root.style.setProperty('--btn-outline-bg', '#ffffff');
  root.style.setProperty('--btn-outline-bg-hover', `rgba(${rgbCssValue(resolved.primaryColor)}, 0.08)`);
  root.style.setProperty('--btn-outline-text', resolved.primaryColor);
  root.style.setProperty('--btn-outline-border', `rgba(${rgbCssValue(resolved.primaryColor)}, 0.28)`);

  root.style.setProperty('--btn-ghost-text', resolved.supportColor);
  root.style.setProperty('--btn-ghost-hover-bg', `rgba(${rgbCssValue(resolved.primaryColor)}, 0.08)`);
  root.style.setProperty('--btn-ghost-hover-text', resolved.primaryColor);
};
