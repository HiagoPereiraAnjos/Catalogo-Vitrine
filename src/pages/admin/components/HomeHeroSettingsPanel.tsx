import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Loader2, Save, Upload } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CatalogImage } from '../../../components/CatalogImage';
import { defaultSiteSettings } from '../../../data/defaultSiteSettings';
import { PLACEHOLDER_LIBRARY } from '../../../data/placeholders';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { ImageStorageService } from '../../../services/imageStorageService';
import { SiteHomeSettings } from '../../../types/siteSettings';
import {
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES,
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB,
  isAcceptedImageFileType
} from '../../../utils/imageSources';

type NoticeType = 'success' | 'error';
type HeroImageField = 'heroDesktopImage' | 'heroMobileImage';
type HeroUploadState = Record<HeroImageField, boolean>;

interface StatusMessage {
  type: NoticeType;
  message: string;
}

const initialUploadState: HeroUploadState = {
  heroDesktopImage: false,
  heroMobileImage: false
};

const getFieldClassName = (hasError = false) =>
  `field-control ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
  }`;

const heroDesktopFallback = PLACEHOLDER_LIBRARY.lookbook[1];
const heroMobileFallback = PLACEHOLDER_LIBRARY.lookbook[2] || heroDesktopFallback;

const isValidCtaHref = (value: string) => {
  const href = value.trim();

  if (!href) {
    return true;
  }

  if (href.startsWith('/') || href.startsWith('#')) {
    return true;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
    return true;
  }

  return false;
};

const sanitizeHomeSettings = (home: SiteHomeSettings): SiteHomeSettings => ({
  ...home,
  heroEyebrow: home.heroEyebrow.trim(),
  heroTag: home.heroTag.trim(),
  heroTitle: home.heroTitle.trim(),
  heroSubtitle: home.heroSubtitle.trim(),
  primaryCtaLabel: home.primaryCtaLabel.trim(),
  primaryCtaHref: home.primaryCtaHref.trim(),
  secondaryCtaLabel: home.secondaryCtaLabel.trim(),
  secondaryCtaHref: home.secondaryCtaHref.trim(),
  heroDesktopImage: home.heroDesktopImage.trim(),
  heroMobileImage: home.heroMobileImage.trim(),
  featuredTitle: home.featuredTitle.trim(),
  featuredSubtitle: home.featuredSubtitle.trim()
});

const heroImageFieldMeta: Array<{ field: HeroImageField; title: string; description: string }> = [
  {
    field: 'heroDesktopImage',
    title: 'Imagem desktop',
    description: 'Imagem principal exibida em telas maiores.'
  },
  {
    field: 'heroMobileImage',
    title: 'Imagem mobile',
    description: 'Versao otimizada para telas menores.'
  }
];

export const HomeHeroSettingsPanel = () => {
  const { settings, saveModuleSettings } = useSiteSettings();
  const [formData, setFormData] = useState<SiteHomeSettings>(settings.home);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadState, setUploadState] = useState<HeroUploadState>(initialUploadState);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    setFormData(settings.home);
  }, [settings.home]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(settings.home),
    [formData, settings.home]
  );

  const hasPendingUpload = useMemo(() => Object.values(uploadState).some(Boolean), [uploadState]);

  const previewDesktopImage = formData.heroDesktopImage || heroDesktopFallback;
  const previewMobileImage = formData.heroMobileImage || formData.heroDesktopImage || heroMobileFallback;
  const previewEyebrow = formData.heroEyebrow || settings.brand.heroEyebrow;
  const previewTag = formData.heroTag;
  const previewTitle = formData.heroTitle || defaultSiteSettings.home.heroTitle;
  const previewSubtitle = formData.heroSubtitle || defaultSiteSettings.home.heroSubtitle;
  const previewPrimaryLabel = formData.primaryCtaLabel || defaultSiteSettings.home.primaryCtaLabel;
  const previewSecondaryLabel = formData.secondaryCtaLabel || defaultSiteSettings.home.secondaryCtaLabel;

  const setField = <K extends keyof SiteHomeSettings>(field: K, value: SiteHomeSettings[K]) => {
    setFormData((previousState) => ({
      ...previousState,
      [field]: value
    }));
  };

  const handleImageUpload = async (field: HeroImageField, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!isAcceptedImageFileType(file)) {
      setStatus({
        type: 'error',
        message: `Arquivo "${file.name}" invalido. Use JPG, PNG ou WEBP.`
      });
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES) {
      setStatus({
        type: 'error',
        message: `A imagem "${file.name}" excede ${MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}MB.`
      });
      return;
    }

    setUploadState((previousState) => ({ ...previousState, [field]: true }));

    try {
      const localRef = await ImageStorageService.saveFile(file);
      setField(field, localRef);
      setStatus({ type: 'success', message: `Imagem "${file.name}" pronta para salvar.` });
    } catch (error) {
      console.error('Falha ao enviar imagem da hero', error);
      setStatus({ type: 'error', message: 'Nao foi possivel processar esta imagem.' });
    } finally {
      setUploadState((previousState) => ({ ...previousState, [field]: false }));
    }
  };

  const validateForm = () => {
    if (formData.heroTitle.trim().length > 0 && formData.heroTitle.trim().length < 8) {
      return 'A headline deve ter pelo menos 8 caracteres.';
    }

    if (formData.heroSubtitle.trim().length > 0 && formData.heroSubtitle.trim().length < 12) {
      return 'O subtitulo deve ter pelo menos 12 caracteres.';
    }

    if (!isValidCtaHref(formData.primaryCtaHref)) {
      return 'Link do botao principal invalido.';
    }

    if (!isValidCtaHref(formData.secondaryCtaHref)) {
      return 'Link do botao secundario invalido.';
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setIsSaving(true);

    try {
      const payload = sanitizeHomeSettings(formData);
      saveModuleSettings('home', payload);
      setStatus({ type: 'success', message: 'Hero da Home salva com sucesso.' });
    } catch (error) {
      console.error('Falha ao salvar Home Hero', error);
      setStatus({ type: 'error', message: 'Nao foi possivel salvar esta configuracao.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings.home);
    setStatus({ type: 'success', message: 'Alteracoes locais descartadas.' });
  };

  return (
    <section className="premium-reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_22px_44px_-34px_rgba(17,24,39,0.55)] md:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Home</p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Hero</h2>
          <p className="mt-1 text-sm text-gray-600">Edite headline, subtitulo, CTAs e imagens da principal vitrine da Home.</p>
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
          <h3 className="text-sm font-semibold text-gray-900">Texto e chamadas</h3>
          <p className="mt-1 text-xs text-gray-500">Conteudo principal da dobra inicial da Home.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Texto curto acima da headline</label>
              <input
                type="text"
                value={formData.heroEyebrow}
                onChange={(event) => setField('heroEyebrow', event.target.value)}
                className={getFieldClassName()}
                placeholder="Nova colecao de jeans premium"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Selo opcional</label>
              <input
                type="text"
                value={formData.heroTag}
                onChange={(event) => setField('heroTag', event.target.value)}
                className={getFieldClassName()}
                placeholder="Nova colecao"
              />
            </div>

            <div className="hidden md:block" />

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Headline principal</label>
              <textarea
                rows={2}
                value={formData.heroTitle}
                onChange={(event) => setField('heroTitle', event.target.value)}
                className={getFieldClassName()}
                placeholder="Jeans premium para marcar presenca"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Subtitulo</label>
              <textarea
                rows={2}
                value={formData.heroSubtitle}
                onChange={(event) => setField('heroSubtitle', event.target.value)}
                className={getFieldClassName()}
                placeholder="Pecas com modelagem precisa e acabamento premium para looks comerciais."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Botao principal (texto)</label>
              <input
                type="text"
                value={formData.primaryCtaLabel}
                onChange={(event) => setField('primaryCtaLabel', event.target.value)}
                className={getFieldClassName()}
                placeholder="Ver colecao completa"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Botao principal (link)</label>
              <input
                type="text"
                value={formData.primaryCtaHref}
                onChange={(event) => setField('primaryCtaHref', event.target.value)}
                className={getFieldClassName()}
                placeholder="/produtos"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Botao secundario (texto)</label>
              <input
                type="text"
                value={formData.secondaryCtaLabel}
                onChange={(event) => setField('secondaryCtaLabel', event.target.value)}
                className={getFieldClassName()}
                placeholder="Falar com especialista"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Botao secundario (link)</label>
              <input
                type="text"
                value={formData.secondaryCtaHref}
                onChange={(event) => setField('secondaryCtaHref', event.target.value)}
                className={getFieldClassName()}
                placeholder="/contato"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Imagens da hero</h3>
          <p className="mt-1 text-xs text-gray-500">
            Upload local com IndexedDB e preview imediato. Formatos: JPG, PNG, WEBP (max. {MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}MB).
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {heroImageFieldMeta.map((item) => {
              const value = formData[item.field];
              const isUploading = uploadState[item.field];

              return (
                <article key={item.field} className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    {value ? (
                      <CatalogImage
                        src={value}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        fallback={{ style: 'lookbook', seed: `home-hero-${item.field}`, label: item.title }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          Sem imagem
                        </span>
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                  <p className="mt-1 text-xs text-gray-500">{item.description}</p>

                  <input
                    type="text"
                    value={value}
                    onChange={(event) => setField(item.field, event.target.value)}
                    className={`${getFieldClassName()} mt-3 text-xs`}
                    placeholder="URL externa ou referencia local"
                  />

                  <div className="mt-2 flex flex-wrap gap-2">
                    <label className="premium-interactive inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Upload
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="sr-only"
                        disabled={isUploading || isSaving}
                        onChange={(event) => {
                          void handleImageUpload(item.field, event);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setField(item.field, '')}
                      className="premium-interactive rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Remover
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Preview da hero</h3>
          <p className="mt-1 text-xs text-gray-500">Visualizacao rapida para desktop e mobile antes de salvar.</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
            <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-black text-white">
              <div className="absolute inset-0">
                <CatalogImage
                  src={previewDesktopImage}
                  alt="Preview hero desktop"
                  className="h-full w-full object-cover"
                  fallback={{ style: 'lookbook', seed: 'hero-preview-desktop', label: 'Hero desktop' }}
                />
                <div className="absolute inset-0 bg-black/45" />
              </div>
              <div className="relative space-y-4 p-6 sm:p-8">
                {previewTag && (
                  <span className="inline-flex rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                    {previewTag}
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-200">{previewEyebrow}</p>
                <h4 className="max-w-2xl text-3xl font-light leading-tight sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
                  {previewTitle}
                </h4>
                <p className="max-w-2xl text-sm text-gray-100 sm:text-base">{previewSubtitle}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-900">
                    {previewPrimaryLabel}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/35 bg-white/5 px-4 py-2 text-xs font-semibold text-white">
                    {previewSecondaryLabel}
                  </span>
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-3">
              <div className="mx-auto w-[210px] overflow-hidden rounded-[1.65rem] border border-gray-300 bg-black text-white shadow-sm">
                <div className="relative aspect-[9/16]">
                  <CatalogImage
                    src={previewMobileImage}
                    alt="Preview hero mobile"
                    className="h-full w-full object-cover"
                    fallback={{ style: 'lookbook', seed: 'hero-preview-mobile', label: 'Hero mobile' }}
                  />
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-gray-200">{previewEyebrow}</p>
                    <h4 className="mt-1 text-sm font-medium leading-tight">{previewTitle}</h4>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">A Home publica atualizacoes de texto, links e imagens logo apos salvar.</p>

          <div className="flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || isSaving || hasPendingUpload}>
              Descartar
            </Button>
            <Button type="submit" disabled={!isDirty || isSaving || hasPendingUpload}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar Hero'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};
