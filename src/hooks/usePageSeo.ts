import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getBrandSettingsSnapshot } from '../utils/siteBrand';

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

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

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

  if (/^https?:\/\//i.test(pathOrUrl)) {
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
    const siteUrl = resolveSiteUrl();
    const pageUrl = toAbsoluteUrl(`${location.pathname}${location.search}`, siteUrl);
    const imageUrl = toAbsoluteUrl(image || DEFAULT_OG_IMAGE, siteUrl);
    const pageTitle = `${title} | ${brand.name}`;

    document.title = pageTitle;

    upsertMetaTag('meta[name="description"]', { name: 'description', content: description });
    upsertMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex, nofollow' : 'index, follow'
    });
    upsertMetaTag('meta[name="keywords"]', {
      name: 'keywords',
      content: keywords || 'jeans premium, catálogo digital, moda jeans, denim'
    });

    upsertMetaTag('meta[property="og:site_name"]', { property: 'og:site_name', content: brand.name });
    upsertMetaTag('meta[property="og:locale"]', { property: 'og:locale', content: 'pt_BR' });
    upsertMetaTag('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMetaTag('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    upsertMetaTag('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMetaTag('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
    upsertMetaTag('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    upsertMetaTag('meta[property="og:image:alt"]', { property: 'og:image:alt', content: title });

    upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMetaTag('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });

    upsertLinkTag('link[rel="canonical"]', { rel: 'canonical', href: pageUrl });
  }, [description, image, keywords, location.pathname, location.search, noIndex, title, type]);
};
