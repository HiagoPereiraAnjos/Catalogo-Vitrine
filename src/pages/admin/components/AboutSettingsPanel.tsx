import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Save, Trash2, Upload, XCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CatalogImage } from '../../../components/CatalogImage';
import { defaultSiteSettings } from '../../../data/defaultSiteSettings';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { ImageStorageService } from '../../../services/imageStorageService';
import { SiteAboutSettings } from '../../../types/siteSettings';
import {
  IMAGE_UPLOAD_ACCEPT_ATTR,
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES,
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB,
  isAcceptedImageFileType
} from '../../../utils/imageSources';

type NoticeType = 'success' | 'error';

type AboutImageField = 'heroImage' | 'mainImage';

type AboutUploadState = Record<AboutImageField | 'galleryImages', boolean>;

interface StatusMessage {
  type: NoticeType;
  message: string;
}

const MAX_ABOUT_GALLERY_IMAGES = 6;

const initialUploadState: AboutUploadState = {
  heroImage: false,
  mainImage: false,
  galleryImages: false
};

const getFieldClassName = (hasError = false) =>
  `field-control ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
  }`;

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const sanitizeAbout = (about: SiteAboutSettings): SiteAboutSettings => ({
  ...about,
  title: about.title.trim(),
  subtitle: about.subtitle.trim(),
  heroImage: about.heroImage.trim(),
  mainImage: about.mainImage.trim(),
  galleryImages: about.galleryImages.map((item) => item.trim()).filter(Boolean).slice(0, MAX_ABOUT_GALLERY_IMAGES),
  storyTitle: about.storyTitle.trim(),
  storyText: about.storyText.trim(),
  institutionalMainText: about.institutionalMainText.trim(),
  missionTitle: about.missionTitle.trim(),
  missionText: about.missionText.trim(),
  valuesTitle: about.valuesTitle.trim(),
  values: about.values.map((item) => item.trim()).filter(Boolean),
  positioningTitle: about.positioningTitle.trim(),
  positioningText: about.positioningText.trim(),
  positioningPhrases: about.positioningPhrases.map((item) => item.trim()).filter(Boolean),
  differentialsTitle: about.differentialsTitle.trim(),
  differentials: about.differentials.map((item) => item.trim()).filter(Boolean)
});

const imageFieldMeta: Array<{ field: AboutImageField; title: string; description: string }> = [
  {
    field: 'heroImage',
    title: 'Imagem principal da página',
    description: 'Banner de abertura da página Sobre.'
  },
  {
    field: 'mainImage',
    title: 'Imagem institucional principal',
    description: 'Imagem do bloco de história/posicionamento.'
  }
];

export const AboutSettingsPanel = () => {
  const { settings, saveModuleSettings } = useSiteSettings();

  const [formData, setFormData] = useState<SiteAboutSettings>(settings.about);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadState, setUploadState] = useState<AboutUploadState>(initialUploadState);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    setFormData(settings.about);
  }, [settings.about]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(settings.about),
    [formData, settings.about]
  );

  const hasPendingUpload = useMemo(() => Object.values(uploadState).some(Boolean), [uploadState]);

  const valuesText = useMemo(() => formData.values.join('\n'), [formData.values]);
  const positioningPhrasesText = useMemo(
    () => formData.positioningPhrases.join('\n'),
    [formData.positioningPhrases]
  );
  const differentialsText = useMemo(() => formData.differentials.join('\n'), [formData.differentials]);

  const setField = <K extends keyof SiteAboutSettings>(field: K, value: SiteAboutSettings[K]) => {
    setFormData((previousState) => ({
      ...previousState,
      [field]: value
    }));
  };

  const validateImageFile = (file: File) => {
    if (!isAcceptedImageFileType(file)) {
      return `Arquivo "${file.name}" inválido. Use JPG, PNG ou WEBP.`;
    }

    if (file.size > MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES) {
      return `A imagem "${file.name}" excede ${MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}MB.`;
    }

    return null;
  };

  const handleSingleImageUpload = async (field: AboutImageField, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setUploadState((previousState) => ({ ...previousState, [field]: true }));

    try {
      const localRef = await ImageStorageService.saveFile(file);
      setField(field, localRef);
      setStatus({ type: 'success', message: `Imagem "${file.name}" pronta para salvar.` });
    } catch (error) {
      console.error('Falha ao enviar imagem da página Sobre', error);
      setStatus({ type: 'error', message: 'Não foi possível processar esta imagem. Tente JPG, PNG ou WEBP.' });
    } finally {
      setUploadState((previousState) => ({ ...previousState, [field]: false }));
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
      ? Array.from({ length: event.target.files.length }, (_, index) => event.target.files?.item(index)).filter(
          (file): file is File => file !== null
        )
      : [];
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    const remainingSlots = MAX_ABOUT_GALLERY_IMAGES - formData.galleryImages.length;
    if (remainingSlots <= 0) {
      setStatus({ type: 'error', message: `Limite de ${MAX_ABOUT_GALLERY_IMAGES} imagens adicionais atingido.` });
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    const firstValidationError = filesToUpload
      .map((file) => validateImageFile(file))
      .find((message) => Boolean(message));

    if (firstValidationError) {
      setStatus({ type: 'error', message: firstValidationError });
      return;
    }

    setUploadState((previousState) => ({ ...previousState, galleryImages: true }));

    try {
      const uploadedRefs = await ImageStorageService.saveFiles(filesToUpload);
      setField('galleryImages', [...formData.galleryImages, ...uploadedRefs].slice(0, MAX_ABOUT_GALLERY_IMAGES));
      setStatus({ type: 'success', message: `${uploadedRefs.length} imagem(ns) adicionada(s) à galeria.` });
    } catch (error) {
      console.error('Falha ao enviar galeria da página Sobre', error);
      setStatus({ type: 'error', message: 'Não foi possível processar a galeria enviada. Revise formato e tamanho dos arquivos.' });
    } finally {
      setUploadState((previousState) => ({ ...previousState, galleryImages: false }));
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setField(
      'galleryImages',
      formData.galleryImages.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.title.trim().length < 3) {
      setStatus({ type: 'error', message: 'Informe um título da página com pelo menos 3 caracteres.' });
      return;
    }

    if (formData.storyText.trim().length < 20) {
      setStatus({ type: 'error', message: 'A história da marca deve ter pelo menos 20 caracteres.' });
      return;
    }

    setIsSaving(true);

    try {
      const payload = sanitizeAbout(formData);
      saveModuleSettings('about', payload);
      setStatus({ type: 'success', message: 'Página Sobre atualizada com sucesso.' });
    } catch (error) {
      console.error('Falha ao salvar configurações da página Sobre', error);
      setStatus({ type: 'error', message: 'Não foi possível salvar as configurações da página Sobre.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings.about);
    setStatus({ type: 'success', message: 'Alterações locais descartadas.' });
  };

  const previewGalleryImages =
    formData.galleryImages.length > 0 ? formData.galleryImages : defaultSiteSettings.about.galleryImages;

  return (
    <section className="premium-reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_22px_44px_-34px_rgba(17,24,39,0.55)] md:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Sobre</p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Conteúdo institucional</h2>
          <p className="mt-1 text-sm text-gray-600">Edite textos e imagens da página Sobre sem alterar código.</p>
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
          <h3 className="text-sm font-semibold text-gray-900">Cabeçalho da página</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Título da página</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setField('title', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Subtítulo</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(event) => setField('subtitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Textos institucionais</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">História da marca - título</label>
              <input
                type="text"
                value={formData.storyTitle}
                onChange={(event) => setField('storyTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Frase institucional principal</label>
              <input
                type="text"
                value={formData.institutionalMainText}
                onChange={(event) => setField('institutionalMainText', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">História da marca (texto)</label>
              <textarea
                rows={4}
                value={formData.storyText}
                onChange={(event) => setField('storyText', event.target.value)}
                className={getFieldClassName()}
                placeholder={'Linha 1\nLinha 2\nLinha 3'}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Missão - título</label>
              <input
                type="text"
                value={formData.missionTitle}
                onChange={(event) => setField('missionTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Missão</label>
              <textarea
                rows={3}
                value={formData.missionText}
                onChange={(event) => setField('missionText', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Valores - título</label>
              <input
                type="text"
                value={formData.valuesTitle}
                onChange={(event) => setField('valuesTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Valores (1 por linha)</label>
              <textarea
                rows={4}
                value={valuesText}
                onChange={(event) => setField('values', splitLines(event.target.value))}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Posicionamento - título</label>
              <input
                type="text"
                value={formData.positioningTitle}
                onChange={(event) => setField('positioningTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Posicionamento - texto</label>
              <textarea
                rows={3}
                value={formData.positioningText}
                onChange={(event) => setField('positioningText', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Frases de posicionamento (1 por linha)</label>
              <textarea
                rows={4}
                value={positioningPhrasesText}
                onChange={(event) => setField('positioningPhrases', splitLines(event.target.value))}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Diferenciais - título</label>
              <input
                type="text"
                value={formData.differentialsTitle}
                onChange={(event) => setField('differentialsTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Diferenciais (1 por linha)</label>
              <textarea
                rows={4}
                value={differentialsText}
                onChange={(event) => setField('differentials', splitLines(event.target.value))}
                className={getFieldClassName()}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Imagens da página Sobre</h3>
          <p className="mt-1 text-xs text-gray-500">
            Upload local com IndexedDB e preview imediato. Formatos: JPG, PNG, WEBP (max. {MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}MB).
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {imageFieldMeta.map((item) => {
              const value = formData[item.field];
              const isUploading = uploadState[item.field];

              return (
                <article key={item.field} className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <CatalogImage
                      src={value || defaultSiteSettings.about[item.field]}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      fallback={{ style: 'institutional', seed: `about-${item.field}`, label: item.title }}
                    />
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                  <p className="mt-1 text-xs text-gray-500">{item.description}</p>

                  <input
                    type="text"
                    value={value}
                    onChange={(event) => setField(item.field, event.target.value)}
                    className={`${getFieldClassName()} mt-3 text-xs`}
                    placeholder="URL externa ou referência local"
                  />

                  <div className="mt-2 flex flex-wrap gap-2">
                    <label className="premium-interactive inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Upload
                      <input
                        type="file"
                        accept={IMAGE_UPLOAD_ACCEPT_ATTR}
                        className="sr-only"
                        disabled={isUploading || isSaving}
                        onChange={(event) => {
                          void handleSingleImageUpload(item.field, event);
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

          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Imagens institucionais adicionais</h4>
                <p className="text-xs text-gray-500">{formData.galleryImages.length}/{MAX_ABOUT_GALLERY_IMAGES} imagem(ns)</p>
              </div>

              <label className="premium-interactive inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                {uploadState.galleryImages ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload múltiplo
                <input
                  type="file"
                  accept={IMAGE_UPLOAD_ACCEPT_ATTR}
                  multiple
                  className="sr-only"
                  disabled={uploadState.galleryImages || isSaving}
                  onChange={(event) => {
                    void handleGalleryUpload(event);
                  }}
                />
              </label>
            </div>

            {previewGalleryImages.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhuma imagem adicional cadastrada.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {previewGalleryImages.map((image, index) => {
                  const isDefaultFallback = formData.galleryImages.length === 0;

                  return (
                    <article key={`${image}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-md border border-gray-100 bg-white">
                        <CatalogImage
                          src={image}
                          alt={`Imagem institucional ${index + 1}`}
                          className="h-full w-full object-cover"
                          fallback={{ style: 'lookbook', seed: `about-gallery-${index + 1}`, label: 'Galeria institucional' }}
                        />
                      </div>

                      {!isDefaultFallback ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(index)}
                          className="premium-interactive inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover
                        </button>
                      ) : (
                        <p className="text-[11px] text-gray-500">Fallback padrão</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">A página Sobre reflete os textos e imagens salvos imediatamente.</p>

          <div className="flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || isSaving || hasPendingUpload}>
              Descartar
            </Button>
            <Button type="submit" disabled={!isDirty || isSaving || hasPendingUpload}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar Sobre'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};
