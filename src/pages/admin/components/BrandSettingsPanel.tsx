import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Loader2, Save, Upload } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CatalogImage } from '../../../components/CatalogImage';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { ImageStorageService } from '../../../services/imageStorageService';
import { SiteBrandSettings } from '../../../types/siteSettings';
import {
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES,
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB,
  isAcceptedImageFileType
} from '../../../utils/imageSources';

type NoticeType = 'success' | 'error';

type BrandImageField = 'logoImage' | 'faviconImage' | 'institutionalImage';

type BrandUploadState = Record<BrandImageField, boolean>;

interface StatusMessage {
  type: NoticeType;
  message: string;
}

const initialUploadState: BrandUploadState = {
  logoImage: false,
  faviconImage: false,
  institutionalImage: false
};

const getFieldClassName = (hasError = false) =>
  `field-control ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
  }`;

const isValidUrl = (value: string) => {
  if (!value.trim()) {
    return true;
  }

  try {
    const normalizedValue = value.includes('://') ? value : `https://${value}`;
    const parsed = new URL(normalizedValue);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const isValidEmail = (value: string) => {
  if (!value.trim()) {
    return true;
  }

  return /\S+@\S+\.\S+/.test(value.trim());
};

const sanitizeBrand = (brand: SiteBrandSettings): SiteBrandSettings => ({
  ...brand,
  name: brand.name.trim(),
  shortName: brand.shortName.trim(),
  tagline: brand.tagline.trim(),
  signature: brand.signature.trim(),
  heroEyebrow: brand.heroEyebrow.trim(),
  logoImage: brand.logoImage.trim(),
  faviconImage: brand.faviconImage.trim(),
  institutionalImage: brand.institutionalImage.trim(),
  siteUrl: normalizeUrl(brand.siteUrl),
  whatsappDisplay: brand.whatsappDisplay.trim(),
  whatsappUrl: normalizeUrl(brand.whatsappUrl),
  contactEmail: brand.contactEmail.trim(),
  instagramHandle: brand.instagramHandle.trim(),
  instagramUrl: normalizeUrl(brand.instagramUrl),
  addressLine1: brand.addressLine1.trim(),
  addressLine2: brand.addressLine2.trim()
});

const getBrandValidationError = (brand: SiteBrandSettings) => {
  if (brand.name.trim().length < 2) {
    return 'Informe o nome da marca com pelo menos 2 caracteres.';
  }

  if (!isValidEmail(brand.contactEmail)) {
    return 'Informe um e-mail valido.';
  }

  if (!isValidUrl(brand.siteUrl)) {
    return 'Informe uma URL valida para o site.';
  }

  if (!isValidUrl(brand.whatsappUrl)) {
    return 'Informe uma URL valida para o WhatsApp.';
  }

  if (!isValidUrl(brand.instagramUrl)) {
    return 'Informe uma URL valida para o Instagram.';
  }

  return null;
};

const imageFieldMeta: Array<{ field: BrandImageField; title: string; description: string }> = [
  {
    field: 'logoImage',
    title: 'Logo da marca',
    description: 'Usada no header e nas areas institucionais.'
  },
  {
    field: 'faviconImage',
    title: 'Favicon (opcional)',
    description: 'Icone exibido na aba do navegador quando personalizado.'
  },
  {
    field: 'institutionalImage',
    title: 'Imagem institucional',
    description: 'Foto de apoio para blocos institucionais da marca.'
  }
];

export const BrandSettingsPanel = () => {
  const { settings, saveModuleSettings } = useSiteSettings();
  const [formData, setFormData] = useState<SiteBrandSettings>(settings.brand);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadState, setUploadState] = useState<BrandUploadState>(initialUploadState);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    setFormData(settings.brand);
  }, [settings.brand]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(settings.brand),
    [formData, settings.brand]
  );

  const hasPendingUpload = useMemo(() => Object.values(uploadState).some(Boolean), [uploadState]);

  const setField = <K extends keyof SiteBrandSettings>(field: K, value: SiteBrandSettings[K]) => {
    setFormData((previousState) => ({
      ...previousState,
      [field]: value
    }));
  };

  const handleImageUpload = async (field: BrandImageField, event: ChangeEvent<HTMLInputElement>) => {
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
      console.error('Falha ao enviar imagem da marca', error);
      setStatus({ type: 'error', message: 'Nao foi possivel processar esta imagem.' });
    } finally {
      setUploadState((previousState) => ({ ...previousState, [field]: false }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = getBrandValidationError(formData);
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setIsSaving(true);

    try {
      const payload = sanitizeBrand(formData);
      saveModuleSettings('brand', payload);
      setStatus({ type: 'success', message: 'Identidade da marca salva com sucesso.' });
    } catch (error) {
      console.error('Falha ao salvar configuracoes de marca', error);
      setStatus({ type: 'error', message: 'Nao foi possivel salvar a identidade da marca.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings.brand);
    setStatus({ type: 'success', message: 'Alteracoes locais descartadas.' });
  };

  return (
    <section className="premium-reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_22px_44px_-34px_rgba(17,24,39,0.55)] md:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Configuracoes globais</p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Marca</h2>
          <p className="mt-1 text-sm text-gray-600">Edite identidade, canais e midia institucional sem alterar codigo.</p>
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
          <h3 className="text-sm font-semibold text-gray-900">Identidade textual</h3>
          <p className="mt-1 text-xs text-gray-500">Nome, slogan e assinatura curta usados em areas institucionais.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome da marca *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setField('name', event.target.value)}
                className={getFieldClassName()}
                placeholder="Ex: Denim Premium"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome curto</label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(event) => setField('shortName', event.target.value)}
                className={getFieldClassName()}
                placeholder="Ex: Denim"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Slogan</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(event) => setField('tagline', event.target.value)}
                className={getFieldClassName()}
                placeholder="Jeans premium com identidade autoral"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Frase institucional curta</label>
              <input
                type="text"
                value={formData.signature}
                onChange={(event) => setField('signature', event.target.value)}
                className={getFieldClassName()}
                placeholder="Modelagem precisa e acabamento premium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Texto de apoio do hero</label>
              <input
                type="text"
                value={formData.heroEyebrow}
                onChange={(event) => setField('heroEyebrow', event.target.value)}
                className={getFieldClassName()}
                placeholder="Nova colecao de jeans premium"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Canais e contato</h3>
          <p className="mt-1 text-xs text-gray-500">Informacoes exibidas no rodape, pagina de contato e links de atendimento.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">WhatsApp (texto)</label>
              <input
                type="text"
                value={formData.whatsappDisplay}
                onChange={(event) => setField('whatsappDisplay', event.target.value)}
                className={getFieldClassName()}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">WhatsApp (link)</label>
              <input
                type="text"
                value={formData.whatsappUrl}
                onChange={(event) => setField('whatsappUrl', event.target.value)}
                className={getFieldClassName()}
                placeholder="https://wa.me/5511999999999"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Instagram (handle)</label>
              <input
                type="text"
                value={formData.instagramHandle}
                onChange={(event) => setField('instagramHandle', event.target.value)}
                className={getFieldClassName()}
                placeholder="@denimpremium"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Instagram (link)</label>
              <input
                type="text"
                value={formData.instagramUrl}
                onChange={(event) => setField('instagramUrl', event.target.value)}
                className={getFieldClassName()}
                placeholder="https://instagram.com/denimpremium"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(event) => setField('contactEmail', event.target.value)}
                className={getFieldClassName()}
                placeholder="contato@denimpremium.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Site</label>
              <input
                type="text"
                value={formData.siteUrl}
                onChange={(event) => setField('siteUrl', event.target.value)}
                className={getFieldClassName()}
                placeholder="https://denimpremium.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Endereco resumido (linha 1)</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(event) => setField('addressLine1', event.target.value)}
                className={getFieldClassName()}
                placeholder="Av. Paulista, 1000"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Endereco resumido (linha 2)</label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(event) => setField('addressLine2', event.target.value)}
                className={getFieldClassName()}
                placeholder="Sao Paulo, SP"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Imagens de marca</h3>
          <p className="mt-1 text-xs text-gray-500">
            Upload local com IndexedDB e preview em tempo real. Formatos: JPG, PNG, WEBP (max. {MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}MB).
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {imageFieldMeta.map((item) => {
              const value = formData[item.field];
              const isUploading = uploadState[item.field];

              return (
                <article key={item.field} className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    {value ? (
                      <CatalogImage
                        src={value}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        fallback={{ style: 'institutional', seed: `brand-${item.field}`, label: item.title }}
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

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Header, Footer e textos institucionais vao refletir os dados salvos.</p>

          <div className="flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || isSaving || hasPendingUpload}>
              Descartar
            </Button>
            <Button type="submit" disabled={!isDirty || isSaving || hasPendingUpload}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar identidade'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};

