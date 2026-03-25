import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { CatalogImage } from '../components/CatalogImage';
import { sortProductsByNewest } from '../utils/product';
import { PLACEHOLDER_LIBRARY, buildInstitutionalPlaceholder } from '../data/placeholders';
import { buildWhatsAppHref, whatsappOutlineButtonClass, whatsappPrimaryButtonClass } from '../utils/whatsapp';
import { usePageSeo } from '../hooks/usePageSeo';
import { WhatsAppLogo } from '../components/icons/WhatsAppLogo';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function Home() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { settings } = useSiteSettings();
  const brand = settings.brand;

  const hasFeaturedProducts = products.some((product) => product.isFeatured);
  const featuredBase = hasFeaturedProducts ? products.filter((product) => product.isFeatured) : products;
  const featuredProducts = sortProductsByNewest(featuredBase).slice(0, 4);
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
  const heroLookbookImage = PLACEHOLDER_LIBRARY.lookbook[1];
  const masculinePlaceholder = PLACEHOLDER_LIBRARY.audience.masculino[0];
  const femininePlaceholder = PLACEHOLDER_LIBRARY.audience.feminino[0];
  const highlightsPlaceholder = PLACEHOLDER_LIBRARY.lookbook[0];
  const brandInstitutionalImage =
    brand.institutionalImage || buildInstitutionalPlaceholder('home-brand-signature', 'Estudio Denim');

  usePageSeo({
    title: 'Catálogo Digital de Jeans Premium',
    description:
      'Explore a coleção de jeans premium da Denim Premium com modelagens masculinas, femininas e unissex, lavagens autorais e atendimento consultivo.',
    image: heroLookbookImage,
    type: 'website',
    keywords: 'catálogo jeans premium, moda jeans, jeans masculino, jeans feminino, denim premium'
  });

  return (
    <article className="bg-transparent">
      <section className="relative flex min-h-[610px] items-center justify-center overflow-hidden" aria-labelledby="home-hero-title">
        <div className="absolute inset-0">
          <CatalogImage
            src={heroLookbookImage}
            alt="Editorial de jeans premium"
            className="h-full w-full object-cover object-top"
            fallback={{ style: 'lookbook', seed: 'home-hero', label: 'Editorial Denim' }}
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
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.28em] text-gray-200 md:text-sm">
              {brand.heroEyebrow}
            </span>
            <h1 id="home-hero-title" className="text-5xl font-light leading-tight md:text-7xl" style={{ fontFamily: 'var(--font-serif)' }}>
              Jeans premium para
              <br />
              <span className="font-medium italic">marcar presença</span>
            </h1>
            <p className="mb-10 mt-6 max-w-2xl text-lg font-light text-gray-200 md:text-xl">
              Peças com modelagem precisa, lavagens autorais e acabamento de alto padrão para um guarda-roupa atual e comercial.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => navigate('/produtos')}
                variant="light"
                size="md"
                className="px-10 py-3 text-sm font-semibold"
              >
                Ver coleção completa
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href={homeHeroWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className={whatsappOutlineButtonClass}
              >
                Quero consultoria no WhatsApp
                <WhatsAppLogo className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="section-shell premium-reveal bg-gray-100/70" aria-labelledby="home-categories-title">
        <Container>
          <h2 id="home-categories-title" className="sr-only">
            Categorias de jeans premium
          </h2>
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
                fallback={{ style: 'lookbook', seed: 'home-masculino', label: 'Colecao masculina' }}
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
                fallback={{ style: 'lookbook', seed: 'home-feminino', label: 'Colecao feminina' }}
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

      <section className="section-shell premium-reveal premium-reveal-delay-1" aria-labelledby="home-featured-title">
        <Container>
          <div className="mb-14 flex flex-col items-center text-center">
            <p className="section-eyebrow mb-3">Seleção da semana</p>
            <h2 id="home-featured-title" className="section-title mb-4 text-4xl md:text-5xl">
              Peças de maior conversão no catálogo
            </h2>
            <div className="section-divider mb-6" />
            <p className="section-support max-w-2xl">
              Modelagens com mais saída, excelentes para compor vitrines e looks comerciais em diferentes perfis.
            </p>
            {seasonalProducts.length > 0 && (
              <p className="mt-4 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
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

      {collectionHighlights.length > 0 && (
        <section className="section-shell premium-reveal premium-reveal-delay-2 bg-white/70" aria-labelledby="home-collections-title">
          <Container>
            <div className="mb-10 text-center">
              <p className="section-eyebrow mb-3">Campanhas e drops</p>
              <h2 id="home-collections-title" className="section-title text-4xl">
                Coleções em evidência
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Organização visual por coleção para facilitar planejamento de vitrine, campanhas e conteúdos sazonais.
              </p>
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
                    <p className="mt-1 text-sm text-gray-500">{collection.count} peça(s) nessa coleção</p>
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
      )}

      <section className="section-shell premium-reveal premium-reveal-delay-3 bg-gray-950 text-white" aria-labelledby="home-brand-title">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <CatalogImage
                src={brandInstitutionalImage}
                alt="Estúdio Denim Premium"
                className="h-[560px] w-full rounded-3xl object-cover"
                fallback={{ style: 'institutional', seed: 'home-brand', label: 'Estudio Denim Premium' }}
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="mb-4 block text-xs uppercase tracking-[0.2em] text-gray-400">Assinatura de marca</span>
              <h2 id="home-brand-title" className="text-4xl font-light leading-tight md:text-5xl" style={{ fontFamily: 'var(--font-serif)' }}>
                Estilo comercial com
                <br />
                <span className="font-medium italic">acabamento premium</span>
              </h2>
              <p className="mb-5 mt-7 text-lg font-light leading-relaxed text-gray-300">
                A {brand.shortName} combina design limpo, qualidade técnica e narrativa visual para construir uma marca memorável em jeanswear.
              </p>
              <p className="mb-9 text-lg font-light leading-relaxed text-gray-300">
                Da seleção de tecido ao atendimento final, nossa operação foi pensada para gerar confiança, recorrência e percepção de valor.
              </p>

              <div className="grid grid-cols-1 gap-4 border-t border-gray-800 pt-8 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-800 bg-white/[0.03] p-4">
                  <ShieldCheck className="mb-3 h-7 w-7 text-white" />
                  <h3 className="font-semibold">Padrão premium</h3>
                  <p className="mt-1 text-sm text-gray-400">Revisão de qualidade em cada lote</p>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-white/[0.03] p-4">
                  <Truck className="mb-3 h-7 w-7 text-white" />
                  <h3 className="font-semibold">Entrega eficiente</h3>
                  <p className="mt-1 text-sm text-gray-400">Fluxo ágil para todo o Brasil</p>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-white/[0.03] p-4">
                  <RotateCcw className="mb-3 h-7 w-7 text-white" />
                  <h3 className="font-semibold">Suporte consultivo</h3>
                  <p className="mt-1 text-sm text-gray-400">Acompanhamento de compra e troca</p>
                </div>
              </div>

              <Link
                to="/sobre"
                className="premium-focus premium-interactive mt-9 inline-flex items-center text-sm font-semibold text-white hover:text-blue-200 focus-visible:ring-white"
              >
                Conhecer a história da marca
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-shell premium-reveal bg-gray-100/80" aria-labelledby="home-whatsapp-title">
        <Container>
          <div className="surface-card-strong flex flex-col items-center justify-between gap-8 p-8 md:flex-row md:p-12">
            <div className="text-center md:text-left">
              <p className="section-eyebrow mb-3">Conversão assistida</p>
              <h2 id="home-whatsapp-title" className="section-title text-3xl">
                Quer ajuda para fechar o look ideal?
              </h2>
              <p className="mt-3 max-w-2xl text-gray-600">
                Fale com um consultor da marca e receba orientação de tamanho, modelagem e combinação de peças.
              </p>
            </div>
            <a
              href={homeSupportWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${whatsappPrimaryButtonClass} shrink-0`}
            >
              <WhatsAppLogo className="h-5 w-5" />
              Receber atendimento imediato
            </a>
          </div>
        </Container>
      </section>
    </article>
  );
}
