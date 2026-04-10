import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { ImageStorageService } from '../services/imageStorageService';
import { getBrandSettingsSnapshot, getSeoSettingsSnapshot } from '../utils/siteBrand';

type PageType = 'website' | 'article' | 'product';

interface PageSeoOptions {
  title: string;
  description: string;
  image?: string;
  type?: PageType;
  noIndex?: boolean;
  keywords?: string;
}

const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop';
const DEFAULT_KEYWORDS = 'jeans premium, catálogo digital, moda jeans, denim';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const resolveText = (value: string | undefined, fallback: string) => {
  const sanitized = typeof value === 'string' ? value.trim() : '';
  return sanitized || fallback;
};

const resolveSiteUrl = () => {
  const brand = getBrandSettingsSnapshot();

  if (brand.siteUrl) {
    return normalizeBaseUrl(brand.siteUrl);
  }

  const fallbackSiteUrl = 'https://denimpremium.com';

  if (typeof window !== 'undefined') {
    return normalizeBaseUrl(window.location.origin);
  }

  return fallbackSiteUrl;
};

export const toAbsoluteUrl = (pathOrUrl: string, siteUrl = resolveSiteUrl()) => {
  if (!pathOrUrl) {
    return siteUrl;
  }

  if (/^(https?:|blob:|data:|local-image:)/i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl}${path}`;
};

const upsertMetaTag = (selector: string, attributes: Record<string, string>) => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag?.setAttribute(key, value);
  });
};

const upsertLinkTag = (selector: string, attributes: Record<string, string>) => {
  let tag = document.head.querySelector<HTMLLinkElement>(selector);

  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag?.setAttribute(key, value);
  });
};

export const usePageSeo = ({
  title,
  description,
  image,
  type = 'website',
  noIndex = false,
  keywords
}: PageSeoOptions) => {
  const location = useLocation();

  useEffect(() => {
    const brand = getBrandSettingsSnapshot();
    const seo = getSeoSettingsSnapshot();
    const siteUrl = resolveSiteUrl();
    const pageUrl = toAbsoluteUrl(`${location.pathname}${location.search}`, siteUrl);

    const fallbackSeo = defaultSiteSettings.seo;
    const effectiveTitle = resolveText(title, resolveText(seo.defaultTitle, fallbackSeo.defaultTitle));
    const effectiveDescription = resolveText(
      description,
      resolveText(seo.defaultDescription, fallbackSeo.defaultDescription)
    );
    const titleSuffix = resolveText(
      seo.institutionalTitle,
      resolveText(seo.defaultTitle, brand.name || fallbackSeo.defaultTitle)
    );
    const effectiveKeywords = resolveText(
      keywords,
      resolveText(seo.primaryKeywords, fallbackSeo.primaryKeywords || DEFAULT_KEYWORDS)
    );

    const fallbackImage = resolveText(seo.defaultOgImage, fallbackSeo.defaultOgImage || DEFAULT_OG_IMAGE);
    const preferredImage = resolveText(image, fallbackImage || DEFAULT_OG_IMAGE);

    const pageTitle = effectiveTitle === titleSuffix ? effectiveTitle : `${effectiveTitle} | ${titleSuffix}`;

    const applyMetaTags = (imageUrl: string) => {
      document.title = pageTitle;

      upsertMetaTag('meta[name="description"]', { name: 'description', content: effectiveDescription });
      upsertMetaTag('meta[name="robots"]', {
        name: 'robots',
        content: noIndex ? 'noindex, nofollow' : 'index, follow'
      });
      upsertMetaTag('meta[name="keywords"]', {
        name: 'keywords',
        content: effectiveKeywords
      });

      upsertMetaTag('meta[property="og:site_name"]', { property: 'og:site_name', content: brand.name });
      upsertMetaTag('meta[property="og:locale"]', { property: 'og:locale', content: 'pt_BR' });
      upsertMetaTag('meta[property="og:type"]', { property: 'og:type', content: type });
      upsertMetaTag('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
      upsertMetaTag('meta[property="og:description"]', { property: 'og:description', content: effectiveDescription });
      upsertMetaTag('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
      upsertMetaTag('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
      upsertMetaTag('meta[property="og:image:alt"]', { property: 'og:image:alt', content: effectiveTitle });

      upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
      upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
      upsertMetaTag('meta[name="twitter:description"]', {
        name: 'twitter:description',
        content: effectiveDescription
      });
      upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });

      upsertLinkTag('link[rel="canonical"]', { rel: 'canonical', href: pageUrl });
    };

    let isCancelled = false;

    if (ImageStorageService.isLocalRef(preferredImage)) {
      void ImageStorageService.resolveRefToObjectUrl(preferredImage)
        .then((resolvedImage) => {
          if (isCancelled) {
            return;
          }

          const imageUrl = toAbsoluteUrl(resolvedImage || fallbackImage || DEFAULT_OG_IMAGE, siteUrl);
          applyMetaTags(imageUrl);
        })
        .catch((error) => {
          console.error('Falha ao resolver imagem de SEO local.', error);
          if (!isCancelled) {
            applyMetaTags(toAbsoluteUrl(fallbackImage || DEFAULT_OG_IMAGE, siteUrl));
          }
        });
    } else {
      applyMetaTags(toAbsoluteUrl(preferredImage || DEFAULT_OG_IMAGE, siteUrl));
    }

    return () => {
      isCancelled = true;
    };
  }, [description, image, keywords, location.pathname, location.search, noIndex, title, type]);
};
