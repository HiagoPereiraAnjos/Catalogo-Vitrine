import { ArrowRight, CheckCircle2, Gem, Leaf, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { usePageSeo } from '../hooks/usePageSeo';
import { CatalogImage } from '../components/CatalogImage';
import { useSiteSettings } from '../hooks/useSiteSettings';

const highlights = [
  {
    title: 'Curadoria premium',
    description: 'Cada peça passa por seleção de tecido, lavagem e caimento para manter um padrão consistente.'
  },
  {
    title: 'Estilo atemporal',
    description: 'Criamos uma base versátil, com design contemporâneo e foco em uso real no dia a dia.'
  },
  {
    title: 'Processo consciente',
    description: 'Priorizamos fornecedores e técnicas que reduzem impacto sem comprometer qualidade.'
  }
];

const pillars = [
  {
    icon: Gem,
    title: 'Qualidade',
    description: 'Materiais selecionados, acabamento preciso e revisão de cada detalhe antes do envio.'
  },
  {
    icon: Sparkles,
    title: 'Estilo',
    description: 'Linhas limpas, proporções equilibradas e lavagens que valorizam diferentes perfis.'
  },
  {
    icon: Leaf,
    title: 'Autenticidade',
    description: 'Uma marca com identidade própria, sem excessos, com foco em relevância e durabilidade.'
  }
];

export default function About() {
  const { settings } = useSiteSettings();
  const brand = settings.brand;
  usePageSeo({
    title: 'Sobre a Denim Premium',
    description:
      'Conheça a história, posicionamento e diferenciais da Denim Premium: jeans premium com design autoral, qualidade técnica e autenticidade.',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=1200&auto=format&fit=crop',
    type: 'article',
    keywords: 'sobre marca de jeans, denim premium, história da marca, moda jeans premium'
  });

  return (
    <article className="bg-transparent">
      <section className="relative h-[62vh] min-h-[500px] overflow-hidden" aria-labelledby="about-page-title">
        <CatalogImage
          src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=2000&auto=format&fit=crop"
          alt="Equipe de moda em estúdio"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
          fallback={{ style: 'institutional', seed: 'about-hero', label: 'Equipe de moda em estudio' }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <Container className="relative z-10 flex h-full items-end pb-16">
          <div className="max-w-3xl text-white">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-gray-200">Sobre a marca</p>
            <h1 id="about-page-title" className="text-4xl font-light leading-tight md:text-6xl" style={{ fontFamily: 'var(--font-serif)' }}>
              Marca de jeans com linguagem comercial premium
            </h1>
            <p className="mt-5 max-w-2xl text-base text-gray-200 md:text-lg">
              A {brand.name} nasceu para unir design autoral, conforto real e acabamentos de alto padrão em uma proposta elegante e escalável.
            </p>
          </div>
        </Container>
      </section>

      <section className="section-shell premium-reveal">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="section-eyebrow mb-3">Nossa história</p>
              <h2 className="section-title mb-6">De uma pequena curadoria para uma marca de referência</h2>
              <div className="space-y-4 leading-relaxed text-gray-600">
                <p>
                  Começamos com uma seleção enxuta de modelos jeans para clientes que buscavam melhor caimento e mais qualidade no acabamento.
                </p>
                <p>
                  Com o tempo, evoluímos para uma coleção própria, com direção criativa focada em versatilidade, autenticidade e resultado visual sofisticado.
                </p>
                <p>
                  Hoje, o catálogo combina peças essenciais e novidades estratégicas para compor uma vitrine atual, com assinatura clara de marca.
                </p>
              </div>
            </div>

            <div className="relative">
              <CatalogImage
                src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1400&auto=format&fit=crop"
                alt="Produção de moda com denim"
                className="h-[560px] w-full rounded-3xl object-cover"
                referrerPolicy="no-referrer"
                fallback={{ style: 'lookbook', seed: 'about-history', label: 'Producao de moda com denim' }}
              />
              <div className="surface-card absolute -bottom-6 -left-6 max-w-xs p-5">
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-gray-500">Proposta de valor</p>
                <p className="text-sm text-gray-700">Entregar peças premium com linguagem contemporânea, sem perder performance comercial no uso diário.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-shell premium-reveal premium-reveal-delay-1 bg-gray-100/70">
        <Container>
          <div className="mb-10 max-w-3xl">
            <p className="section-eyebrow mb-3">Posicionamento</p>
            <h2 className="section-title mb-4">Uma marca para quem valoriza design limpo e presença</h2>
            <p className="section-support">
              Nossa assinatura combina modelagens atuais, materiais duráveis e acabamento premium para gerar confiança e desejo em cada peça.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="surface-card surface-card-hover p-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-shell premium-reveal premium-reveal-delay-2">
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="surface-card surface-card-hover p-6">
                <pillar.icon className="mb-4 h-6 w-6 text-gray-900" />
                <h3 className="mb-3 text-xl font-semibold text-gray-900">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{pillar.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="premium-reveal premium-reveal-delay-3 pb-20">
        <Container>
          <div className="surface-card-strong p-8 md:p-10">
            <div className="mb-8 max-w-2xl">
              <p className="section-eyebrow mb-3">Universo da marca</p>
              <h2 className="section-title mb-4 text-3xl">Imagem institucional com assinatura visual consistente</h2>
              <p className="section-support">Direção artística focada em autenticidade, textura e comportamento real de uso das peças.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <CatalogImage
                src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop"
                alt="Editorial de jeans premium com foco em textura e modelagem"
                className="h-72 w-full rounded-2xl object-cover"
                referrerPolicy="no-referrer"
                fallback={{ style: 'lookbook', seed: 'about-gallery-1', label: 'Editorial de jeans premium' }}
              />
              <CatalogImage
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop"
                alt="Look urbano com peça jeans de cintura alta"
                className="h-72 w-full rounded-2xl object-cover"
                referrerPolicy="no-referrer"
                fallback={{ style: 'lookbook', seed: 'about-gallery-2', label: 'Look urbano denim' }}
              />
              <CatalogImage
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop"
                alt="Campanha institucional com jaqueta jeans premium"
                className="h-72 w-full rounded-2xl object-cover"
                referrerPolicy="no-referrer"
                fallback={{ style: 'lookbook', seed: 'about-gallery-3', label: 'Campanha institucional denim' }}
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-shell-tight premium-reveal bg-gray-950 text-white">
        <Container>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl" style={{ fontFamily: 'var(--font-serif)' }}>
                Pronto para conhecer a coleção completa?
              </h2>
              <p className="mt-3 text-gray-300">
                Explore nossas peças e fale com nosso time para orientação de estilo, tamanho e conversão de look.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/produtos"
                className="premium-focus premium-interactive inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:-translate-y-px hover:bg-gray-100 focus-visible:ring-white"
              >
                Ver produtos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/contato"
                className="premium-focus premium-interactive inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:-translate-y-px hover:bg-white/10 focus-visible:ring-white"
              >
                Falar com a marca
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Qualidade revisada em cada lote
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Curadoria de lavagens e modelagens
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Atendimento consultivo via WhatsApp
            </div>
          </div>
        </Container>
      </section>
    </article>
  );
}

