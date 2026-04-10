import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { Footer } from './Footer';
import { buildWhatsAppHref } from '../utils/whatsapp';
import { WhatsAppLogo } from './icons/WhatsAppLogo';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { ImageStorageService } from '../services/imageStorageService';
import { applyAppearanceTheme } from '../utils/appearanceTheme';
import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { CartDrawer } from './CartDrawer';
import { CartActionToast } from './CartActionToast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { settings } = useSiteSettings();
  const brand = settings.brand;
  const contact = settings.contact;
  const isPublicRoute = !location.pathname.startsWith('/admin');
  const shouldShowFloatingWhatsApp = isPublicRoute && location.pathname !== '/sacola';
  const floatingWhatsAppHref = buildWhatsAppHref({
    context: 'floating',
    routePath: location.pathname,
    intent: 'general'
  });
  const floatingHint = contact.ctaDescription || defaultSiteSettings.contact.ctaDescription;
  const floatingLabel = contact.primaryCtaLabel || defaultSiteSettings.contact.primaryCtaLabel;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    applyAppearanceTheme(settings.appearance);
  }, [settings.appearance]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    let isMounted = true;

    const applyFavicon = async () => {
      const faviconSource = brand.faviconImage.trim();
      const existingLink = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');

      if (!faviconSource) {
        existingLink?.remove();
        return;
      }

      const resolvedSource = ImageStorageService.isLocalRef(faviconSource)
        ? await ImageStorageService.resolveRefToObjectUrl(faviconSource)
        : faviconSource;

      if (!isMounted || !resolvedSource) {
        return;
      }

      const iconLink = existingLink || document.createElement('link');
      iconLink.setAttribute('rel', 'icon');
      iconLink.setAttribute('href', resolvedSource);
      if (!existingLink) {
        document.head.appendChild(iconLink);
      }
    };

    applyFavicon().catch((error) => {
      console.error('Falha ao aplicar favicon da marca', error);
    });

    return () => {
      isMounted = false;
    };
  }, [brand.faviconImage]);

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-gray-900 focus:shadow-lg"
      >
        Pular para o conteúdo principal
      </a>
      <Header />
      <main id="main-content" className="flex w-full flex-1 flex-col">
        {children}
      </main>

      <Footer />

      {shouldShowFloatingWhatsApp && (
        <a
          href={floatingWhatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group fixed right-4 z-50 premium-reveal premium-reveal-delay-2"
          style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          aria-label={`Falar no WhatsApp ${contact.whatsappDisplay || ''}`.trim()}
        >
          <span className="pointer-events-none absolute bottom-[calc(100%+0.75rem)] right-2 hidden whitespace-nowrap rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 lg:block">
            {floatingHint}
          </span>
          <span
            className="absolute -inset-1 rounded-full bg-green-500/25 blur-md opacity-80 transition-opacity duration-200 group-hover:opacity-100"
            style={{ animation: 'soft-pulse 2.1s ease-in-out infinite' }}
            aria-hidden="true"
          />
          <span className="premium-interactive premium-focus relative inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-green-500/60 bg-green-600 text-white shadow-[0_18px_35px_-24px_rgba(22,163,74,0.9)] hover:-translate-y-0.5 hover:bg-green-700 focus-visible:ring-green-500 focus-visible:ring-offset-2 sm:h-auto sm:w-auto sm:px-5 sm:py-3">
            <WhatsAppLogo className="h-5 w-5" />
            <span className="hidden text-sm font-semibold sm:inline">{floatingLabel}</span>
          </span>
        </a>
      )}

      {isPublicRoute && <CartDrawer />}
      {isPublicRoute && <CartActionToast />}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
