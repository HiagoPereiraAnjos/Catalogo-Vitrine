import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Loader2, Save, Upload, XCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CatalogImage } from '../../../components/CatalogImage';
import { defaultSiteSettings } from '../../../data/defaultSiteSettings';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { ImageStorageService } from '../../../services/imageStorageService';
import { SiteSeoSettings } from '../../../types/siteSettings';
import {
  IMAGE_UPLOAD_ACCEPT_ATTR,
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES,
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB,
  isAcceptedImageFileType,
  isPersistedImageSource
} from '../../../utils/imageSources';

type NoticeType = 'success' | 'error';

interface StatusMessage {
  type: NoticeType;
  message: string;
}

const getFieldClassName = (hasError = false) =>
  `field-control ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
  }`;

const sanitizeSeo = (seo: SiteSeoSettings): SiteSeoSettings => ({
  ...seo,
  defaultTitle: seo.defaultTitle.trim(),
  institutionalTitle: seo.institutionalTitle.trim(),
  defaultDescription: seo.defaultDescription.trim(),
  defaultOgImage: seo.defaultOgImage.trim(),
  primaryKeywords: seo.primaryKeywords.trim(),
  home: {
    title: seo.home.title.trim(),
    description: seo.home.description.trim()
  },
  products: {
    ...seo.products,
    title: seo.products.title.trim(),
    description: seo.products.description.trim()
  },
  productDetails: {
    ...seo.productDetails,
    title: seo.productDetails.title.trim(),
    description: seo.productDetails.description.trim()
  },
  about: {
    title: seo.about.title.trim(),
    description: seo.about.description.trim()
  },
  contact: {
    title: seo.contact.title.trim(),
    description: seo.contact.description.trim()
  }
});

const getSeoValidationError = (seo: SiteSeoSettings) => {
  if (seo.institutionalTitle.trim().length < 2) {
    return 'Informe o título institucional padrão da marca.';
  }

  if (seo.home.title.trim().length < 2) {
    return 'Informe um título para SEO da Home.';
  }

  if (seo.about.title.trim().length < 2) {
    return 'Informe um título para SEO da página Sobre.';
  }

  if (seo.contact.title.trim().length < 2) {
    return 'Informe um título para SEO da página Contato.';
  }

  if (seo.defaultDescription.trim().length < 20) {
    return 'A descrição padrão precisa ter pelo menos 20 caracteres.';
  }

  if (seo.home.description.trim().length < 20) {
    return 'A meta description da Home precisa ter pelo menos 20 caracteres.';
  }

  if (seo.about.description.trim().length < 20) {
    return 'A meta description da página Sobre precisa ter pelo menos 20 caracteres.';
  }

  if (seo.contact.description.trim().length < 20) {
    return 'A meta description da página Contato precisa ter pelo menos 20 caracteres.';
  }

  if (seo.defaultOgImage.trim() && !isPersistedImageSource(seo.defaultOgImage)) {
    return 'A imagem de compartilhamento precisa ser uma URL válida, caminho /public ou referência local.';
  }

  return null;
};

export const SeoSettingsPanel = () => {
  const { settings, saveModuleSettings } = useSiteSettings();
  const [formData, setFormData] = useState<SiteSeoSettings>(settings.seo);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingOgImage, setIsUploadingOgImage] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    setFormData(settings.seo);
  }, [settings.seo]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(settings.seo),
    [formData, settings.seo]
  );

  const setField = <K extends keyof SiteSeoSettings>(field: K, value: SiteSeoSettings[K]) => {
    setFormData((previousState) => ({
      ...previousState,
      [field]: value
    }));
  };

  const setPageField = (
    page: 'home' | 'about' | 'contact',
    field: 'title' | 'description',
    value: string
  ) => {
    setFormData((previousState) => ({
      ...previousState,
      [page]: {
        ...previousState[page],
        [field]: value
      }
    }));
  };

  const handleOgImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!isAcceptedImageFileType(file)) {
      setStatus({ type: 'error', message: `Arquivo "${file.name}" inválido. Use JPG, PNG ou WEBP.` });
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES) {
      setStatus({
        type: 'error',
        message: `A imagem "${file.name}" excede ${MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}MB.`
      });
      return;
    }

    setIsUploadingOgImage(true);

    try {
      const localRef = await ImageStorageService.saveFile(file);
      setField('defaultOgImage', localRef);
      setStatus({ type: 'success', message: `Imagem "${file.name}" pronta para salvar.` });
    } catch (error) {
      console.error('Falha ao enviar imagem social de SEO', error);
      setStatus({
        type: 'error',
        message: 'Não foi possível processar a imagem de compartilhamento. Tente JPG, PNG ou WEBP.'
      });
    } finally {
      setIsUploadingOgImage(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = getSeoValidationError(formData);
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setIsSaving(true);

    try {
      const payload = sanitizeSeo(formData);
      saveModuleSettings('seo', payload);
      setStatus({ type: 'success', message: 'Configurações de SEO salvas com sucesso.' });
    } catch (error) {
      console.error('Falha ao salvar configurações de SEO', error);
      setStatus({ type: 'error', message: 'Não foi possível salvar as configurações de SEO.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings.seo);
    setStatus({ type: 'success', message: 'Alterações locais descartadas.' });
  };

  const ogImagePreview = formData.defaultOgImage || defaultSiteSettings.seo.defaultOgImage;

  return (
    <section className="premium-reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_22px_44px_-34px_rgba(17,24,39,0.55)] md:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">SEO</p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Metadados do site</h2>
          <p className="mt-1 text-sm text-gray-600">Configure títulos, descrições e imagem de compartilhamento sem alterar código.</p>
        </div>

        {status && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {status.message}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Padrão institucional</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Título institucional padrão da marca</label>
              <input
                type="text"
                value={formData.institutionalTitle}
                onChange={(event) => setField('institutionalTitle', event.target.value)}
                className={getFieldClassName()}
                placeholder="Ex: Denim Premium"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Título SEO padrão (fallback)</label>
              <input
                type="text"
                value={formData.defaultTitle}
                onChange={(event) => setField('defaultTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Descrição padrão do site</label>
              <textarea
                rows={3}
                value={formData.defaultDescription}
                onChange={(event) => setField('defaultDescription', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Palavras-chave principais</label>
              <textarea
                rows={2}
                value={formData.primaryKeywords}
                onChange={(event) => setField('primaryKeywords', event.target.value)}
                className={getFieldClassName()}
                placeholder="jeans premium, catálogo digital, moda jeans"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Metadados por página</h3>
          <div className="mt-4 space-y-5">
            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Home</p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={formData.home.title}
                  onChange={(event) => setPageField('home', 'title', event.target.value)}
                  className={getFieldClassName()}
                  placeholder="Título da Home"
                />
                <textarea
                  rows={2}
                  value={formData.home.description}
                  onChange={(event) => setPageField('home', 'description', event.target.value)}
                  className={getFieldClassName()}
                  placeholder="Meta description da Home"
                />
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Sobre</p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={formData.about.title}
                  onChange={(event) => setPageField('about', 'title', event.target.value)}
                  className={getFieldClassName()}
                  placeholder="Título da página Sobre"
                />
                <textarea
                  rows={2}
                  value={formData.about.description}
                  onChange={(event) => setPageField('about', 'description', event.target.value)}
                  className={getFieldClassName()}
                  placeholder="Meta description da página Sobre"
                />
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Contato</p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={formData.contact.title}
                  onChange={(event) => setPageField('contact', 'title', event.target.value)}
                  className={getFieldClassName()}
                  placeholder="Título da página Contato"
                />
                <textarea
                  rows={2}
                  value={formData.contact.description}
                  onChange={(event) => setPageField('contact', 'description', event.target.value)}
                  className={getFieldClassName()}
                  placeholder="Meta description da página Contato"
                />
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Imagem social padrão</h3>
          <p className="mt-1 text-xs text-gray-500">
            Upload local com IndexedDB ou URL externa. Formatos: JPG, PNG, WEBP (max. {MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}MB).
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="relative aspect-[1.91/1] overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                {ogImagePreview ? (
                  <CatalogImage
                    src={ogImagePreview}
                    alt="Imagem social padrão"
                    className="h-full w-full object-cover"
                    fallback={{ style: 'institutional', seed: 'seo-og-image', label: 'Imagem social' }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Sem imagem
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">URL ou referência da imagem social</label>
              <input
                type="text"
                value={formData.defaultOgImage}
                onChange={(event) => setField('defaultOgImage', event.target.value)}
                className={getFieldClassName()}
                placeholder="/mock/editorial/editorial-01.svg ou https://..."
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <label className="premium-interactive inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  {isUploadingOgImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload
                  <input
                    type="file"
                    accept={IMAGE_UPLOAD_ACCEPT_ATTR}
                    className="sr-only"
                    disabled={isUploadingOgImage || isSaving}
                    onChange={(event) => {
                      void handleOgImageUpload(event);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setField('defaultOgImage', '')}
                  className="premium-interactive rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Os metadados passam a refletir os dados salvos nas páginas principais.</p>

          <div className="flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || isSaving || isUploadingOgImage}>
              Descartar
            </Button>
            <Button type="submit" disabled={!isDirty || isSaving || isUploadingOgImage}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar SEO'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};
