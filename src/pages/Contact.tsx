import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Facebook, Instagram, Mail, MapPin, Phone, Send, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Container } from '../components/Container';
import { buildWhatsAppHref, whatsappPrimaryButtonClass } from '../utils/whatsapp';
import { usePageSeo } from '../hooks/usePageSeo';
import { WhatsAppLogo } from '../components/icons/WhatsAppLogo';
import { CatalogImage } from '../components/CatalogImage';
import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

interface FormStatus {
  type: 'success' | 'error';
  message: string;
}

const initialState: ContactFormState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
};

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const resolveText = (value: string, fallback: string) => {
  const sanitized = value.trim();
  return sanitized || fallback;
};

const normalizeExternalLink = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const getFieldClassName = (hasError: boolean) =>
  `field-control ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
  }`;

export default function Contact() {
  const { settings } = useSiteSettings();
  const brand = settings.brand;
  const about = settings.about;
  const contact = settings.contact;
  const seo = settings.seo;
  const contactFallback = defaultSiteSettings.contact;

  const [form, setForm] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasStatus = useMemo(() => status !== null, [status]);

  const title = resolveText(contact.title, contactFallback.title);
  const subtitle = resolveText(contact.subtitle, contactFallback.subtitle);
  const supportText = resolveText(contact.supportText, contactFallback.supportText);
  const ctaTitle = resolveText(contact.ctaTitle, contactFallback.ctaTitle);
  const ctaDescription = resolveText(contact.ctaDescription, contactFallback.ctaDescription);
  const primaryCtaLabel = resolveText(contact.primaryCtaLabel, contactFallback.primaryCtaLabel);

  const whatsappDisplay = resolveText(
    contact.whatsappDisplay,
    brand.whatsappDisplay || contactFallback.whatsappDisplay
  );
  const secondaryPhone = contact.secondaryPhone.trim();
  const contactEmail = resolveText(contact.email, brand.contactEmail || contactFallback.email);
  const instagramHandle = resolveText(
    contact.instagramHandle,
    brand.instagramHandle || contactFallback.instagramHandle
  );
  const instagramUrl = normalizeExternalLink(
    resolveText(contact.instagramUrl, brand.instagramUrl || contactFallback.instagramUrl)
  );
  const facebookLabel = contact.facebookLabel.trim();
  const facebookUrl = normalizeExternalLink(contact.facebookUrl);

  const addressLine1 = resolveText(contact.addressLine1, brand.addressLine1 || contactFallback.addressLine1);
  const addressLine2 = resolveText(contact.addressLine2, brand.addressLine2 || contactFallback.addressLine2);
  const businessHours = resolveText(contact.businessHours, contactFallback.businessHours);
  const contactHeroImage =
    brand.institutionalImage || about.heroImage || defaultSiteSettings.about.heroImage;
  const hasInstagram = contact.showSocialLinks && Boolean(instagramUrl);

  const contactWhatsAppHref = buildWhatsAppHref({ context: 'contact', intent: 'contact-form' });

  usePageSeo({
    title: seo.contact.title || defaultSiteSettings.seo.contact.title,
    description: seo.contact.description || defaultSiteSettings.seo.contact.description,
    image: contactHeroImage,
    type: 'website',
    keywords: seo.primaryKeywords || defaultSiteSettings.seo.primaryKeywords
  });

  const validate = () => {
    const nextErrors: ContactFormErrors = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      nextErrors.name = 'Informe seu nome.';
    }

    if (!isValidEmail(form.email.trim())) {
      nextErrors.email = 'Informe um e-mail valido.';
    }

    if (!form.message.trim() || form.message.trim().length < 12) {
      nextErrors.message = 'Escreva uma mensagem com ao menos 12 caracteres.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!validate()) {
      setStatus({ type: 'error', message: 'Revise os campos destacados para continuar.' });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);

    setStatus({
      type: 'success',
      message: 'Mensagem registrada com sucesso. Nossa equipe retorna em breve.'
    });
    setForm(initialState);
    setErrors({});
  };

  return (
    <article className="bg-transparent">
      <section className="relative h-[52vh] min-h-[430px] overflow-hidden" aria-labelledby="contact-page-title">
        <CatalogImage
          src={contactHeroImage}
          alt="Atendimento da marca"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
          fallback={{ style: 'institutional', seed: 'contact-hero', label: 'Atendimento da marca' }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <Container className="relative z-10 flex h-full items-end pb-14">
          <div className="max-w-3xl text-white">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-gray-200">Contato</p>
            <h1
              id="contact-page-title"
              className="text-4xl font-light leading-tight md:text-5xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base text-gray-200 md:text-lg">{subtitle}</p>
          </div>
        </Container>
      </section>

      <section className="section-shell premium-reveal">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-6">
              <div className="surface-card premium-reveal-delay-1 rounded-3xl border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-green-700">Canal prioritario</p>
                <h2 className="mb-3 text-2xl font-semibold text-green-900">{ctaTitle}</h2>
                <p className="mb-3 text-sm text-green-800">{ctaDescription}</p>
                <p className="mb-5 text-sm text-green-800">{supportText}</p>
                <a
                  href={contactWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={whatsappPrimaryButtonClass}
                >
                  <WhatsAppLogo className="h-4 w-4" />
                  {primaryCtaLabel}
                </a>
              </div>

              <div className="surface-card premium-reveal-delay-2 space-y-5 p-6">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">E-mail</p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <WhatsAppLogo className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                    <a
                      href={contactWhatsAppHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {whatsappDisplay}
                    </a>
                  </div>
                </div>

                {secondaryPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Telefone secundario</p>
                      <p className="text-sm text-gray-600">{secondaryPhone}</p>
                    </div>
                  </div>
                )}

                {contact.showSocialLinks && (
                  <>
                    {hasInstagram && (
                      <div className="flex items-start gap-3">
                        <Instagram className="mt-0.5 h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Instagram</p>
                          <a
                            href={instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                          >
                            {instagramHandle}
                          </a>
                        </div>
                      </div>
                    )}

                    {facebookLabel && facebookUrl && (
                      <div className="flex items-start gap-3">
                        <Facebook className="mt-0.5 h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Facebook</p>
                          <a
                            href={facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                          >
                            {facebookLabel}
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {contact.showAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Endereco</p>
                      <p className="text-sm text-gray-600">
                        {addressLine1} - {addressLine2}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Horario de atendimento</p>
                    <p className="text-sm text-gray-600">{businessHours}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-card-strong premium-reveal-delay-3 p-6 md:p-7">
              <p className="section-eyebrow mb-3">Formulario</p>
              <h2 className="section-title text-3xl">Envie sua mensagem</h2>
              <p className="mt-2 text-sm text-gray-600">
                Este formulario nao envia dados reais, mas simula a experiencia institucional da marca.
              </p>

              <AnimatePresence initial={false}>
                {hasStatus && (
                  <motion.div
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={`mt-5 flex items-start gap-2 rounded-xl border px-3 py-2.5 ${
                      status?.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {status?.type === 'success' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4" />
                    )}
                    <p className="text-sm">{status?.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Nome *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      className={getFieldClassName(Boolean(errors.name))}
                      placeholder="Seu nome"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                      E-mail *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      className={getFieldClassName(Boolean(errors.email))}
                      placeholder="voce@empresa.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <input
                      id="contact-phone"
                      type="text"
                      value={form.phone}
                      onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                      className={getFieldClassName(Boolean(errors.phone))}
                      placeholder={whatsappDisplay}
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Assunto
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={form.subject}
                      onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                      className={getFieldClassName(Boolean(errors.subject))}
                      placeholder="Ex: Duvida sobre tamanho"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Mensagem *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={form.message}
                    onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                    className={getFieldClassName(Boolean(errors.message))}
                    placeholder="Conte como podemos te ajudar..."
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="premium-interactive premium-focus inline-flex items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.7)] hover:-translate-y-px hover:bg-gray-800 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar mensagem
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </Container>
      </section>
    </article>
  );
}
