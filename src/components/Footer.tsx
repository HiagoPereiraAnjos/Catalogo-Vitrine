import React from 'react';
import { ArrowRight, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { buildWhatsAppHref } from '../utils/whatsapp';
import { CatalogImage } from './CatalogImage';
import { Container } from './Container';
import { WhatsAppLogo } from './icons/WhatsAppLogo';

const footerLinkClassName =
  'premium-focus premium-interactive rounded-sm -ml-1 px-1 text-gray-300 hover:text-white focus-visible:ring-white';

const socialLinkClassName =
  'premium-focus premium-interactive inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-gray-400 hover:border-white/35 hover:bg-white/[0.08] hover:text-white focus-visible:ring-white';

const resolveText = (value: string, fallback: string) => {
  const sanitized = value.trim();
  return sanitized || fallback;
};

const resolveList = (value: string[], fallback: string[]) => {
  const sanitized = value.map((item) => item.trim()).filter(Boolean);
  return sanitized.length > 0 ? sanitized : fallback;
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

export const Footer: React.FC = () => {
  const location = useLocation();
  const { settings } = useSiteSettings();
  const brand = settings.brand;
  const home = settings.home;
  const contact = settings.contact;

  const fallbackBrand = defaultSiteSettings.brand;
  const fallbackHome = defaultSiteSettings.home;
  const fallbackContact = defaultSiteSettings.contact;

  const footerWhatsAppHref = buildWhatsAppHref({
    context: 'floating',
    routePath: location.pathname,
    intent: 'general'
  });

  const brandName = resolveText(brand.name, fallbackBrand.name);
  const brandShortName = resolveText(brand.shortName, fallbackBrand.shortName || brandName);
  const brandTagline = resolveText(brand.tagline, fallbackBrand.tagline);
  const brandSignature = resolveText(brand.signature, fallbackBrand.signature);

  const signatureItems = resolveList(home.benefitsItems, fallbackHome.benefitsItems).slice(0, 4);
  const footerCtaLabel = resolveText(contact.primaryCtaLabel, fallbackContact.primaryCtaLabel);

  const instagramHandle = resolveText(
    contact.instagramHandle,
    resolveText(brand.instagramHandle, fallbackContact.instagramHandle)
  );
  const instagramUrl = normalizeExternalLink(
    resolveText(contact.instagramUrl, resolveText(brand.instagramUrl, fallbackContact.instagramUrl))
  );

  const showSocialLinks = contact.showSocialLinks;
  const hasInstagram = showSocialLinks && Boolean(instagramUrl);

  const addressLine1 = resolveText(contact.addressLine1, resolveText(brand.addressLine1, fallbackContact.addressLine1));
  const addressLine2 = resolveText(contact.addressLine2, resolveText(brand.addressLine2, fallbackContact.addressLine2));
  const hasAddress = contact.showAddress && Boolean(addressLine1 || addressLine2);

  const whatsappDisplay = resolveText(
    contact.whatsappDisplay,
    resolveText(brand.whatsappDisplay, fallbackContact.whatsappDisplay)
  );
  const contactEmail = resolveText(contact.email, resolveText(brand.contactEmail, fallbackContact.email));

  return (
    <footer className="border-t border-gray-900 bg-gray-950 py-16 text-gray-300">
      <Container>
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="col-span-1 premium-reveal">
            <div className="flex items-center gap-3">
              {brand.logoImage ? (
                <span className="relative h-11 w-11 overflow-hidden rounded-lg border border-white/15 bg-white">
                  <CatalogImage
                    src={brand.logoImage}
                    alt={`Logo ${brandName}`}
                    className="h-full w-full object-cover"
                    fallback={{ style: 'institutional', seed: 'footer-brand-logo', label: brandShortName || brandName }}
                  />
                </span>
              ) : null}
              <div>
                <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-white">{brandName}</h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-gray-500">{brandTagline}</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-gray-400">{brandSignature}</p>

            {hasInstagram && (
              <div className="mt-5 flex space-x-3">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialLinkClassName}
                  aria-label={`Instagram ${instagramHandle}`}
                  title={instagramHandle}
                >
                  <Instagram className="h-[18px] w-[18px]" />
                </a>
              </div>
            )}
          </div>

          <div className="premium-reveal premium-reveal-delay-1">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Navegação</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className={footerLinkClassName}>
                  Início
                </Link>
              </li>
              <li>
                <Link to="/produtos" className={footerLinkClassName}>
                  Coleção
                </Link>
              </li>
              <li>
                <Link to="/sobre" className={footerLinkClassName}>
                  Sobre a marca
                </Link>
              </li>
              <li>
                <Link to="/contato" className={footerLinkClassName}>
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div className="premium-reveal premium-reveal-delay-2">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Assinatura</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {signatureItems.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
            <a
              href={footerWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-focus premium-interactive mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:-translate-y-px hover:bg-white/10 focus-visible:ring-white"
            >
              <WhatsAppLogo className="h-4 w-4" />
              {footerCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="premium-reveal premium-reveal-delay-3">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Contato</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              {hasAddress && (
                <li className="flex items-start">
                  <MapPin className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                  <span>
                    {addressLine1}
                    {addressLine1 && addressLine2 ? <br /> : null}
                    {addressLine2}
                  </span>
                </li>
              )}
              {whatsappDisplay && (
                <li className="flex items-center">
                  <Phone className="mr-3 h-5 w-5 shrink-0 text-gray-500" />
                  <span>{whatsappDisplay}</span>
                </li>
              )}
              {contactEmail && (
                <li className="flex items-center">
                  <Mail className="mr-3 h-5 w-5 shrink-0 text-gray-500" />
                  <span>{contactEmail}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 text-xs text-gray-500 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {brandName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className={footerLinkClassName}>
              Política de Privacidade
            </a>
            <a href="#" className={footerLinkClassName}>
              Termos de Serviço
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};
