import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Facebook, Instagram, Loader2, Mail, MapPin, Phone, Save, XCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { WhatsAppLogo } from '../../../components/icons/WhatsAppLogo';
import { defaultSiteSettings } from '../../../data/defaultSiteSettings';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { SiteContactSettings } from '../../../types/siteSettings';

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

const isValidUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  try {
    const normalized = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
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
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  return /\S+@\S+\.\S+/.test(trimmed);
};

const resolveText = (value: string, fallback: string) => {
  const sanitized = value.trim();
  return sanitized || fallback;
};

const sanitizeContact = (contact: SiteContactSettings): SiteContactSettings => ({
  ...contact,
  title: contact.title.trim(),
  subtitle: contact.subtitle.trim(),
  supportText: contact.supportText.trim(),
  ctaTitle: contact.ctaTitle.trim(),
  ctaDescription: contact.ctaDescription.trim(),
  primaryCtaLabel: contact.primaryCtaLabel.trim(),
  whatsappDisplay: contact.whatsappDisplay.trim(),
  whatsappUrl: normalizeUrl(contact.whatsappUrl),
  secondaryPhone: contact.secondaryPhone.trim(),
  email: contact.email.trim(),
  instagramHandle: contact.instagramHandle.trim(),
  instagramUrl: normalizeUrl(contact.instagramUrl),
  facebookLabel: contact.facebookLabel.trim(),
  facebookUrl: normalizeUrl(contact.facebookUrl),
  addressLine1: contact.addressLine1.trim(),
  addressLine2: contact.addressLine2.trim(),
  businessHours: contact.businessHours.trim()
});

const getContactValidationError = (contact: SiteContactSettings) => {
  if (contact.title.trim().length < 3) {
    return 'Informe um título da página com pelo menos 3 caracteres.';
  }

  if (contact.subtitle.trim().length < 8) {
    return 'Informe um subtítulo mais descritivo para a página.';
  }

  if (contact.primaryCtaLabel.trim().length < 3) {
    return 'Informe um texto para o CTA principal.';
  }

  if (contact.whatsappDisplay.trim().length < 6) {
    return 'Informe um número de WhatsApp válido para exibição.';
  }

  if (!isValidUrl(contact.whatsappUrl)) {
    return 'Informe um link válido de WhatsApp.';
  }

  if (!isValidEmail(contact.email)) {
    return 'Informe um e-mail válido.';
  }

  if (!isValidUrl(contact.instagramUrl)) {
    return 'Informe uma URL válida para o Instagram.';
  }

  if (!isValidUrl(contact.facebookUrl)) {
    return 'Informe uma URL válida para o Facebook.';
  }

  return null;
};

export const ContactSettingsPanel = () => {
  const { settings, saveModuleSettings } = useSiteSettings();
  const [formData, setFormData] = useState<SiteContactSettings>(settings.contact);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    setFormData(settings.contact);
  }, [settings.contact]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(settings.contact),
    [formData, settings.contact]
  );

  const preview = useMemo(() => {
    const fallback = defaultSiteSettings.contact;
    return {
      title: resolveText(formData.title, fallback.title),
      subtitle: resolveText(formData.subtitle, fallback.subtitle),
      supportText: resolveText(formData.supportText, fallback.supportText),
      ctaTitle: resolveText(formData.ctaTitle, fallback.ctaTitle),
      ctaDescription: resolveText(formData.ctaDescription, fallback.ctaDescription),
      primaryCtaLabel: resolveText(formData.primaryCtaLabel, fallback.primaryCtaLabel),
      whatsappDisplay: resolveText(formData.whatsappDisplay, fallback.whatsappDisplay),
      secondaryPhone: resolveText(formData.secondaryPhone, fallback.secondaryPhone),
      email: resolveText(formData.email, fallback.email),
      instagramHandle: resolveText(formData.instagramHandle, fallback.instagramHandle),
      facebookLabel: resolveText(formData.facebookLabel, fallback.facebookLabel),
      addressLine1: resolveText(formData.addressLine1, fallback.addressLine1),
      addressLine2: resolveText(formData.addressLine2, fallback.addressLine2),
      businessHours: resolveText(formData.businessHours, fallback.businessHours),
      showAddress: formData.showAddress,
      showSocialLinks: formData.showSocialLinks
    };
  }, [formData]);

  const setField = <K extends keyof SiteContactSettings>(field: K, value: SiteContactSettings[K]) => {
    setFormData((previousState) => ({
      ...previousState,
      [field]: value
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = getContactValidationError(formData);
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setIsSaving(true);

    try {
      const payload = sanitizeContact(formData);
      saveModuleSettings('contact', payload);
      setStatus({ type: 'success', message: 'Configurações de contato salvas com sucesso.' });
    } catch (error) {
      console.error('Falha ao salvar configurações de contato', error);
      setStatus({ type: 'error', message: 'Não foi possível salvar as configurações de contato.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings.contact);
    setStatus({ type: 'success', message: 'Alterações locais descartadas.' });
  };

  return (
    <section className="premium-reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_22px_44px_-34px_rgba(17,24,39,0.55)] md:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Contato</p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Página de contato</h2>
          <p className="mt-1 text-sm text-gray-600">Edite dados, canais e mensagens da página /contato sem alterar código.</p>
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
          <h3 className="text-sm font-semibold text-gray-900">Conteúdo principal</h3>
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

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Texto de apoio</label>
              <textarea
                rows={3}
                value={formData.supportText}
                onChange={(event) => setField('supportText', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Título do CTA principal</label>
              <input
                type="text"
                value={formData.ctaTitle}
                onChange={(event) => setField('ctaTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Texto do botão principal</label>
              <input
                type="text"
                value={formData.primaryCtaLabel}
                onChange={(event) => setField('primaryCtaLabel', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Descrição do CTA principal</label>
              <textarea
                rows={3}
                value={formData.ctaDescription}
                onChange={(event) => setField('ctaDescription', event.target.value)}
                className={getFieldClassName()}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Canais de contato</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">WhatsApp (exibição)</label>
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
              <p className="mt-1 text-xs text-gray-500">
                Aceita `wa.me`, `api.whatsapp.com/send?phone=...` ou apenas o número com DDD/país.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Telefone secundário</label>
              <input
                type="text"
                value={formData.secondaryPhone}
                onChange={(event) => setField('secondaryPhone', event.target.value)}
                className={getFieldClassName()}
                placeholder="(11) 3333-4444"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setField('email', event.target.value)}
                className={getFieldClassName()}
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Facebook (nome/handle)</label>
              <input
                type="text"
                value={formData.facebookLabel}
                onChange={(event) => setField('facebookLabel', event.target.value)}
                className={getFieldClassName()}
                placeholder="Denim Premium"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Facebook (link)</label>
              <input
                type="text"
                value={formData.facebookUrl}
                onChange={(event) => setField('facebookUrl', event.target.value)}
                className={getFieldClassName()}
                placeholder="https://facebook.com/sua-marca"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Endereço e horário</h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Endereço (linha 1)</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(event) => setField('addressLine1', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Endereço (linha 2)</label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(event) => setField('addressLine2', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Horário de atendimento</label>
              <input
                type="text"
                value={formData.businessHours}
                onChange={(event) => setField('businessHours', event.target.value)}
                className={getFieldClassName()}
                placeholder="Segunda a sexta, das 9h às 18h"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.showAddress}
                onChange={(event) => setField('showAddress', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-300"
              />
              Exibir endereço na página
            </label>

            <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.showSocialLinks}
                onChange={(event) => setField('showSocialLinks', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-300"
              />
              Exibir redes sociais na página
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Preview básico</h3>
          <p className="mt-1 text-xs text-gray-500">Resumo rápido de como os dados de contato serão exibidos para o cliente final.</p>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{preview.title}</p>
            <h4 className="mt-2 text-lg font-semibold text-gray-900">{preview.ctaTitle}</h4>
            <p className="mt-1 text-sm text-gray-600">{preview.ctaDescription}</p>

            <div className="mt-4 grid gap-2 text-sm text-gray-700">
              <p className="inline-flex items-center gap-2">
                <WhatsAppLogo className="h-4 w-4" />
                {preview.whatsappDisplay}
              </p>
              {preview.secondaryPhone && (
                <p className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {preview.secondaryPhone}
                </p>
              )}
              <p className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {preview.email}
              </p>
              {preview.showSocialLinks && (
                <>
                  <p className="inline-flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    {preview.instagramHandle}
                  </p>
                  {preview.facebookLabel && (
                    <p className="inline-flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      {preview.facebookLabel}
                    </p>
                  )}
                </>
              )}
              {preview.showAddress && (
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {preview.addressLine1} - {preview.addressLine2}
                </p>
              )}
              <p className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {preview.businessHours}
              </p>
            </div>

            <button
              type="button"
              className="premium-interactive premium-focus mt-4 inline-flex items-center gap-2 rounded-full border border-green-500/80 bg-green-600 px-4 py-2 text-xs font-semibold text-white"
            >
              <WhatsAppLogo className="h-4 w-4" />
              {preview.primaryCtaLabel}
            </button>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Os links e dados da página /contato vão refletir os valores salvos.</p>

          <div className="flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || isSaving}>
              Descartar
            </Button>
            <Button type="submit" disabled={!isDirty || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar contato'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};
