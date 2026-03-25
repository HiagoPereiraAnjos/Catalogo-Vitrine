import React from 'react';
import { ArrowRight, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { buildWhatsAppHref } from '../utils/whatsapp';
import { Container } from './Container';
import { WhatsAppLogo } from './icons/WhatsAppLogo';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { CatalogImage } from './CatalogImage';

const footerLinkClassName =
  'premium-focus premium-interactive rounded-sm -ml-1 px-1 text-gray-300 hover:text-white focus-visible:ring-white';

const socialLinkClassName =
  'premium-focus premium-interactive inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-gray-400 hover:border-white/35 hover:bg-white/[0.08] hover:text-white focus-visible:ring-white';

export const Footer: React.FC = () => {
  const location = useLocation();
  const { settings } = useSiteSettings();
  const brand = settings.brand;

  const footerWhatsAppHref = buildWhatsAppHref({
    context: 'floating',
    routePath: location.pathname,
    intent: 'general'
  });

  const hasAddress = Boolean(brand.addressLine1 || brand.addressLine2);

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
                    alt={`Logo ${brand.name}`}
                    className="h-full w-full object-cover"
                    fallback={{ style: 'institutional', seed: 'footer-brand-logo', label: brand.shortName || brand.name }}
                  />
                </span>
              ) : null}
              <div>
                <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-white">{brand.name}</h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-gray-500">{brand.tagline}</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-gray-400">{brand.signature}</p>

            {brand.instagramUrl && (
              <div className="mt-5 flex space-x-3">
                <a
                  href={brand.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialLinkClassName}
                  aria-label="Instagram"
                >
                  <Instagram className="h-[18px] w-[18px]" />
                </a>
              </div>
            )}
          </div>

          <div className="premium-reveal premium-reveal-delay-1">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Navegacao</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className={footerLinkClassName}>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/produtos" className={footerLinkClassName}>
                  Colecao
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
              <li>Modelagens orientadas por caimento real.</li>
              <li>Lavagens autorais com visual sofisticado.</li>
              <li>Atendimento consultivo e humano.</li>
              <li>Marca com linguagem comercial elegante.</li>
            </ul>
            <a
              href={footerWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-focus premium-interactive mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:-translate-y-px hover:bg-white/10 focus-visible:ring-white"
            >
              <WhatsAppLogo className="h-4 w-4" />
              Tirar duvidas no WhatsApp
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
                    {brand.addressLine1}
                    {brand.addressLine1 && brand.addressLine2 ? <br /> : null}
                    {brand.addressLine2}
                  </span>
                </li>
              )}
              {brand.whatsappDisplay && (
                <li className="flex items-center">
                  <Phone className="mr-3 h-5 w-5 shrink-0 text-gray-500" />
                  <span>{brand.whatsappDisplay}</span>
                </li>
              )}
              {brand.contactEmail && (
                <li className="flex items-center">
                  <Mail className="mr-3 h-5 w-5 shrink-0 text-gray-500" />
                  <span>{brand.contactEmail}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 text-xs text-gray-500 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className={footerLinkClassName}>
              Politica de Privacidade
            </a>
            <a href="#" className={footerLinkClassName}>
              Termos de Servico
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};
