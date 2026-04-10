import { Fragment, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { CatalogImage } from '../components/CatalogImage';
import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { PLACEHOLDER_LIBRARY, buildInstitutionalPlaceholder } from '../data/placeholders';
import { buildWhatsAppHref, whatsappOutlineButtonClass, whatsappPrimaryButtonClass } from '../utils/whatsapp';
import { usePageSeo } from '../hooks/usePageSeo';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { isLocalImageRefSource } from '../utils/imageSources';
import { sortProductsByNewest } from '../utils/product';
import { HomeSectionKey, Product } from '../types';

const isHttpLink = (value: string) => /^https?:\/\//i.test(value);
const isProtocolLink = (value: string) => /^[a-z][a-z0-9+.-]*:/i.test(value);

const HOME_SECTION_KEYS: HomeSectionKey[] = [
  'categories',
  'featured',
  'collections',
  'institutional',
  'benefits',
  'finalCta'
];

const normalizeSectionOrder = (value: HomeSectionKey[], fallback: HomeSectionKey[]) => {
  const uniqueSections: HomeSectionKey[] = [];

  value.forEach((section) => {
    if (HOME_SECTION_KEYS.includes(section) && !uniqueSections.includes(section)) {
      uniqueSections.push(section);
    }
  });

  fallback.forEach((section) => {
    if (!uniqueSections.includes(section)) {
      uniqueSections.push(section);
    }
  });

  return uniqueSections;
};

export default function Home() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { settings } = useSiteSettings();
  const brand = settings.brand;
  const home = settings.home;
  const seo = settings.seo;

  const hasFeaturedProducts = products.some((product) => product.isFeatured);
  const automaticFeaturedBase = hasFeaturedProducts ? products.filter((product) => product.isFeatured) : products;
  const automaticFeaturedProducts = sortProductsByNewest(automaticFeaturedBase).slice(0, 4);

  const manualFeaturedProducts = home.featuredProductIds
    .map((productId) => products.find((product) => product.id === productId))
    .filter((product): product is Product => Boolean(product));

  const featuredProducts =
    manualFeaturedProducts.length > 0 ? manualFeaturedProducts.slice(0, 4) : automaticFeaturedProducts;

  const seasonalProducts = sortProductsByNewest(
    products.filter((product) => product.isNew || Boolean(product.season))
  ).slice(0, 4);

  type CollectionHighlight = {
    name: string;
    season: string;
    image: string;
    count: number;
  };

  const collectionHighlights: CollectionHighlight[] = Array.from<CollectionHighlight>(
    products.reduce<Map<string, CollectionHighlight>>((collectionMap, product) => {
      const collectionName = product.collection?.trim();
      if (!collectionName) {
        return collectionMap;
      }

      if (!collectionMap.has(collectionName)) {
        collectionMap.set(collectionName, {
          name: collectionName,
          season: product.season || 'Coleção atual',
          image: product.featuredImage,
          count: 0
        });
      }

      const nextCollection = collectionMap.get(collectionName);
      if (nextCollection) {
        nextCollection.count += 1;
      }

      return collectionMap;
    }, new Map<string, CollectionHighlight>())
      .values()
  ).slice(0, 3);

  const homeHeroWhatsAppHref = buildWhatsAppHref({ context: 'home', intent: 'hero' });
  const homeSupportWhatsAppHref = buildWhatsAppHref({ context: 'home', intent: 'size-help' });

  const heroLookbookImage = home.heroDesktopImage || PLACEHOLDER_LIBRARY.lookbook[1];
  const heroMobileLookbookImage =
    home.heroMobileImage || home.heroDesktopImage || PLACEHOLDER_LIBRARY.lookbook[2] || heroLookbookImage;
  const heroEyebrow = home.heroEyebrow || brand.heroEyebrow;
  const heroTag = home.heroTag.trim();
  const heroTitle = home.heroTitle || defaultSiteSettings.home.heroTitle;
  const heroSubtitle = home.heroSubtitle || defaultSiteSettings.home.heroSubtitle;
  const primaryCtaLabel = home.primaryCtaLabel || defaultSiteSettings.home.primaryCtaLabel;
  const primaryCtaHref = home.primaryCtaHref || defaultSiteSettings.home.primaryCtaHref;
  const secondaryCtaLabel = home.secondaryCtaLabel || defaultSiteSettings.home.secondaryCtaLabel;
  const secondaryCtaHref = home.secondaryCtaHref || homeHeroWhatsAppHref;

  const categoriesTitle = home.categoriesTitle || defaultSiteSettings.home.categoriesTitle;
  const categoriesSubtitle = home.categoriesSubtitle || defaultSiteSettings.home.categoriesSubtitle;
  const featuredTitle = home.featuredTitle || defaultSiteSettings.home.featuredTitle;
  const featuredSubtitle = home.featuredSubtitle || defaultSiteSettings.home.featuredSubtitle;
  const collectionsTitle = home.collectionsTitle || defaultSiteSettings.home.collectionsTitle;
  const collectionsSubtitle = home.collectionsSubtitle || defaultSiteSettings.home.collectionsSubtitle;

  const institutionalEyebrow = home.institutionalEyebrow || defaultSiteSettings.home.institutionalEyebrow;
  const institutionalTitle = home.institutionalTitle || defaultSiteSettings.home.institutionalTitle;
  const institutionalBodyPrimary =
    home.institutionalBodyPrimary || defaultSiteSettings.home.institutionalBodyPrimary;
  const institutionalBodySecondary =
    home.institutionalBodySecondary || defaultSiteSettings.home.institutionalBodySecondary;

  const benefitsTitle = home.benefitsTitle || defaultSiteSettings.home.benefitsTitle;
  const benefitsSubtitle = home.benefitsSubtitle || defaultSiteSettings.home.benefitsSubtitle;
  const benefitsItems =
    home.benefitsItems.length > 0 ? home.benefitsItems.slice(0, 3) : defaultSiteSettings.home.benefitsItems;

  const finalCtaEyebrow = home.finalCtaEyebrow || defaultSiteSettings.home.finalCtaEyebrow;
  const finalCtaTitle = home.finalCtaTitle || defaultSiteSettings.home.finalCtaTitle;
  const finalCtaSubtitle = home.finalCtaSubtitle || defaultSiteSettings.home.finalCtaSubtitle;
  const finalCtaLabel = home.finalCtaLabel || defaultSiteSettings.home.finalCtaLabel;
  const finalCtaHref = home.finalCtaHref || homeSupportWhatsAppHref;

  const masculinePlaceholder = PLACEHOLDER_LIBRARY.audience.masculino[0];
  const femininePlaceholder = PLACEHOLDER_LIBRARY.audience.feminino[0];
  const highlightsPlaceholder = PLACEHOLDER_LIBRARY.lookbook[0];
  const brandInstitutionalImage =
    brand.institutionalImage || buildInstitutionalPlaceholder('home-brand-signature', 'Estúdio Denim');
  const institutionalImageLabel = `Estúdio ${brand.name}`;
  const heroSeoImage = isLocalImageRefSource(heroLookbookImage)
    ? PLACEHOLDER_LIBRARY.lookbook[1]
    : heroLookbookImage;

  const sectionOrder = normalizeSectionOrder(home.sectionOrder, defaultSiteSettings.home.sectionOrder);

  const sectionVisibility: Record<HomeSectionKey, boolean> = {
    categories: home.showCategories,
    featured: home.showFeaturedProducts,
    collections: home.showCollections,
    institutional: home.showInstitutional,
    benefits: home.showBenefits,
    finalCta: home.showFinalCta
  };

  usePageSeo({
    title: seo.home.title || defaultSiteSettings.seo.home.title,
    description: seo.home.description || defaultSiteSettings.seo.home.description,
    image: heroSeoImage,
    type: 'website',
    keywords: seo.primaryKeywords || defaultSiteSettings.seo.primaryKeywords
  });

  const handleCtaLink = (href: string) => {
    const normalizedHref = href.trim();
    if (!normalizedHref) {
      return;
    }

    if (normalizedHref.startsWith('#')) {
      if (typeof window !== 'undefined') {
        window.location.hash = normalizedHref.slice(1);
      }
      return;
    }

    if (/^(mailto:|tel:)/i.test(normalizedHref)) {
      if (typeof window !== 'undefined') {
        window.location.href = normalizedHref;
      }
      return;
    }

    if (isHttpLink(normalizedHref)) {
      if (typeof window !== 'undefined') {
        window.open(normalizedHref, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (isProtocolLink(normalizedHref)) {
      if (typeof window !== 'undefined') {
        window.location.href = normalizedHref;
      }
      return;
    }

    const routePath = normalizedHref.startsWith('/')
      ? normalizedHref
      : `/${normalizedHref.replace(/^\/+/, '')}`;
    navigate(routePath);
  };

  const sectionBlocks: Record<HomeSectionKey, ReactNode> = {
    categories: (
      <section className="section-shell premium-reveal bg-gray-100/70" aria-labelledby="home-categories-title">
        <Container>
          <div className="mb-10 text-center">
            <p className="section-eyebrow mb-3">Linhas principais</p>
            <h2 id="home-categories-title" className="section-title text-4xl">
              {categoriesTitle}
            </h2>
            <p className="mt-3 text-sm text-gray-600">{categoriesSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Link
              to="/produtos"
              className="group relative block h-[390px] overflow-hidden rounded-3xl border border-white/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              aria-label="Ver produtos da categoria masculino"
            >
              <CatalogImage
                src={masculinePlaceholder}
                alt="Coleção masculina"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                fallback={{ style: 'lookbook', seed: 'home-masculino', label: 'Coleção masculina' }}
              />
              <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/40" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                  Masculino
                </h3>
                <span className="mt-2 flex translate-y-4 items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  Explorar linha
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            <Link
              to="/produtos"
              className="group relative block h-[390px] overflow-hidden rounded-3xl border border-white/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              aria-label="Ver produtos da categoria feminino"
            >
              <CatalogImage
                src={femininePlaceholder}
                alt="Coleção feminina"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                fallback={{ style: 'lookbook', seed: 'home-feminino', label: 'Coleção feminina' }}
              />
              <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/40" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                  Feminino
                </h3>
                <span className="mt-2 flex translate-y-4 items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  Explorar linha
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            <Link
              to="/produtos"
              className="group relative block h-[390px] overflow-hidden rounded-3xl border border-white/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              aria-label="Ver produtos mais procurados"
            >
              <CatalogImage
                src={highlightsPlaceholder}
                alt="Peças mais procuradas"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                fallback={{ style: 'lookbook', seed: 'home-destaques', label: 'Mais procurados' }}
              />
              <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/40" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                  Mais procurados
                </h3>
                <span className="mt-2 flex translate-y-4 items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  Ver destaques
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </div>
        </Container>
      </section>
    ),

    featured: (
      <section className="section-shell premium-reveal premium-reveal-delay-1" aria-labelledby="home-featured-title">
        <Container>
          <div className="mb-14 flex flex-col items-center text-center">
            <p className="section-eyebrow mb-3">Seleção da semana</p>
            <h2 id="home-featured-title" className="section-title mb-4 text-4xl md:text-5xl">
              {featuredTitle}
            </h2>
            <div className="section-divider mb-6" />
            <p className="section-support max-w-2xl">{featuredSubtitle}</p>
            {seasonalProducts.length > 0 && (
              <p className="mt-4 inline-flex items-center rounded-full border border-[rgba(var(--theme-primary-rgb),0.22)] bg-[rgba(var(--theme-highlight-rgb),0.62)] px-3 py-1 text-xs font-medium text-[var(--theme-primary)]">
                {seasonalProducts.length} destaque(s) sazonal(is) ativo(s)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button
              type="button"
              onClick={() => navigate('/produtos')}
              variant="outline"
              className="border-gray-900 px-10 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white"
            >
              Ver todos os produtos
            </Button>
          </div>
        </Container>
      </section>
    ),

    collections:
      collectionHighlights.length > 0 ? (
        <section className="section-shell premium-reveal premium-reveal-delay-2 bg-white/70" aria-labelledby="home-collections-title">
          <Container>
            <div className="mb-10 text-center">
              <p className="section-eyebrow mb-3">Campanhas e drops</p>
              <h2 id="home-collections-title" className="section-title text-4xl">
                {collectionsTitle}
              </h2>
              <p className="mt-3 text-sm text-gray-600">{collectionsSubtitle}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {collectionHighlights.map((collection) => (
                <Link
                  key={collection.name}
                  to={`/produtos?search=${encodeURIComponent(collection.name)}`}
                  className="group surface-card surface-card-hover overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <CatalogImage
                      src={collection.image}
                      alt={collection.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      fallback={{
                        style: 'editorial',
                        seed: `home-collection-${collection.name}`,
                        label: collection.name
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-800">
                      {collection.season}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-gray-900">{collection.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{collection.count} peça(s) nesta coleção</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
                      Explorar coleção
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null,

    institutional: (
      <section className="section-shell premium-reveal premium-reveal-delay-3 bg-gray-950 text-white" aria-labelledby="home-brand-title">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <CatalogImage
                src={brandInstitutionalImage}
                alt={institutionalImageLabel}
                className="h-[560px] w-full rounded-3xl object-cover"
                fallback={{ style: 'institutional', seed: 'home-brand', label: institutionalImageLabel }}
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-gray-400">{institutionalEyebrow}</span>
              <h2 id="home-brand-title" className="text-4xl font-light leading-tight md:text-5xl" style={{ fontFamily: 'var(--font-serif)' }}>
                {institutionalTitle}
              </h2>
              <p className="mb-5 mt-7 text-lg font-light leading-relaxed text-gray-300">{institutionalBodyPrimary}</p>
              <p className="mb-9 text-lg font-light leading-relaxed text-gray-300">{institutionalBodySecondary}</p>

              <Link
                to="/sobre"
                className="premium-focus premium-interactive mt-9 inline-flex items-center text-sm font-semibold text-white hover:text-[rgba(var(--theme-highlight-rgb),0.95)] focus-visible:ring-white"
              >
                Conhecer a história da marca
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    ),

    benefits: (
      <section className="section-shell premium-reveal bg-white/80" aria-labelledby="home-benefits-title">
        <Container>
          <div className="mb-10 text-center">
            <p className="section-eyebrow mb-3">Diferenciais</p>
            <h2 id="home-benefits-title" className="section-title text-4xl">
              {benefitsTitle}
            </h2>
            <p className="mt-3 text-sm text-gray-600">{benefitsSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {benefitsItems.map((benefit, index) => {
              const icon = index === 0 ? ShieldCheck : index === 1 ? Truck : RotateCcw;
              const BenefitIcon = icon;

              return (
                <article key={`${benefit}-${index}`} className="surface-card surface-card-hover p-4">
                  <BenefitIcon className="mb-3 h-6 w-6 text-gray-900" />
                  <p className="text-sm leading-relaxed text-gray-700">{benefit}</p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>
    ),

    finalCta: (
      <section className="section-shell premium-reveal bg-gray-100/80" aria-labelledby="home-final-cta-title">
        <Container>
          <div className="surface-card-strong flex flex-col items-center justify-between gap-8 p-8 md:flex-row md:p-12">
            <div className="text-center md:text-left">
              <p className="section-eyebrow mb-3">{finalCtaEyebrow}</p>
              <h2 id="home-final-cta-title" className="section-title text-3xl">
                {finalCtaTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-gray-600">{finalCtaSubtitle}</p>
            </div>

            <button
              type="button"
              onClick={() => handleCtaLink(finalCtaHref)}
              className={`${whatsappPrimaryButtonClass} shrink-0`}
            >
              <ArrowRight className="h-5 w-5" />
              {finalCtaLabel}
            </button>
          </div>
        </Container>
      </section>
    )
  };

  return (
    <article className="bg-transparent">
      <section className="relative flex min-h-[610px] items-center justify-center overflow-hidden" aria-labelledby="home-hero-title">
        <div className="absolute inset-0">
          <CatalogImage
            src={heroLookbookImage}
            alt="Editorial de jeans premium para desktop"
            className="hidden h-full w-full object-cover object-top md:block"
            fallback={{ style: 'lookbook', seed: 'home-hero', label: 'Editorial Denim' }}
          />
          <CatalogImage
            src={heroMobileLookbookImage}
            alt="Editorial de jeans premium para mobile"
            className="h-full w-full object-cover object-center md:hidden"
            fallback={{ style: 'lookbook', seed: 'home-hero-mobile', label: 'Editorial Denim Mobile' }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <Container className="relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mx-auto flex max-w-3xl flex-col items-center"
          >
            {heroTag && (
              <span className="mb-4 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                {heroTag}
              </span>
            )}
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.28em] text-gray-200 md:text-sm">
              {heroEyebrow}
            </span>
            <h1 id="home-hero-title" className="text-5xl font-light leading-tight md:text-7xl" style={{ fontFamily: 'var(--font-serif)' }}>
              {heroTitle}
            </h1>
            <p className="mb-10 mt-6 max-w-2xl text-lg font-light text-gray-200 md:text-xl">{heroSubtitle}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => handleCtaLink(primaryCtaHref)}
                variant="light"
                size="md"
                className="px-10 py-3 text-sm font-semibold"
              >
                {primaryCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => handleCtaLink(secondaryCtaHref)}
                className={whatsappOutlineButtonClass}
              >
                {secondaryCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </Container>
      </section>

      {sectionOrder.map((sectionKey) => {
        if (!sectionVisibility[sectionKey]) {
          return null;
        }

        const sectionBlock = sectionBlocks[sectionKey];
        if (!sectionBlock) {
          return null;
        }

        return <Fragment key={sectionKey}>{sectionBlock}</Fragment>;
      })}
    </article>
  );
}

