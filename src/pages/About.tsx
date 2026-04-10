import { ArrowRight, CheckCircle2, Gem, Leaf, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CatalogImage } from '../components/CatalogImage';
import { Container } from '../components/Container';
import { defaultSiteSettings } from '../data/defaultSiteSettings';
import { usePageSeo } from '../hooks/usePageSeo';
import { useSiteSettings } from '../hooks/useSiteSettings';

const resolveText = (value: string, fallback: string) => {
  const sanitized = value.trim();
  return sanitized || fallback;
};

const resolveList = (value: string[], fallback: string[]) => {
  const sanitized = value.map((item) => item.trim()).filter(Boolean);
  return sanitized.length > 0 ? sanitized : fallback;
};

const splitParagraphs = (value: string) =>
  value
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export default function About() {
  const { settings } = useSiteSettings();
  const brand = settings.brand;
  const about = settings.about;
  const seo = settings.seo;
  const aboutFallback = defaultSiteSettings.about;

  const title = resolveText(about.title, aboutFallback.title);
  const subtitle = resolveText(about.subtitle, aboutFallback.subtitle);
  const heroImage = resolveText(about.heroImage, aboutFallback.heroImage);
  const mainImage = resolveText(about.mainImage, aboutFallback.mainImage);
  const storyTitle = resolveText(about.storyTitle, aboutFallback.storyTitle);
  const storyText = resolveText(about.storyText, aboutFallback.storyText);
  const institutionalMainText = resolveText(about.institutionalMainText, aboutFallback.institutionalMainText);
  const missionTitle = resolveText(about.missionTitle, aboutFallback.missionTitle);
  const missionText = resolveText(about.missionText, aboutFallback.missionText);
  const valuesTitle = resolveText(about.valuesTitle, aboutFallback.valuesTitle);
  const values = resolveList(about.values, aboutFallback.values);
  const positioningTitle = resolveText(about.positioningTitle, aboutFallback.positioningTitle);
  const positioningText = resolveText(about.positioningText, aboutFallback.positioningText);
  const positioningPhrases = resolveList(about.positioningPhrases, aboutFallback.positioningPhrases);
  const differentialsTitle = resolveText(about.differentialsTitle, aboutFallback.differentialsTitle);
  const differentials = resolveList(about.differentials, aboutFallback.differentials);
  const galleryImages = resolveList(about.galleryImages, aboutFallback.galleryImages).slice(0, 6);
  const storyParagraphs = splitParagraphs(storyText);

  usePageSeo({
    title: seo.about.title || defaultSiteSettings.seo.about.title,
    description: seo.about.description || defaultSiteSettings.seo.about.description,
    image: heroImage,
    type: 'article',
    keywords: seo.primaryKeywords || defaultSiteSettings.seo.primaryKeywords
  });

  const pillarCards = [
    {
      icon: Gem,
      title: valuesTitle,
      description: values.join(' • ')
    },
    {
      icon: Sparkles,
      title: missionTitle,
      description: missionText
    },
    {
      icon: Leaf,
      title: differentialsTitle,
      description: differentials.join(' • ')
    }
  ];

  return (
    <article className="bg-transparent">
      <section className="relative h-[62vh] min-h-[500px] overflow-hidden" aria-labelledby="about-page-title">
        <CatalogImage
          src={heroImage}
          alt={`${brand.name} - editorial institucional`}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
          fallback={{ style: 'institutional', seed: 'about-hero', label: 'Equipe da marca' }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <Container className="relative z-10 flex h-full items-end pb-16">
          <div className="max-w-3xl text-white">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-gray-200">Sobre a marca</p>
            <h1
              id="about-page-title"
              className="text-4xl font-light leading-tight md:text-6xl"
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
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="section-eyebrow mb-3">História da marca</p>
              <h2 className="section-title mb-6">{storyTitle}</h2>
              <div className="space-y-4 leading-relaxed text-gray-600">
                {storyParagraphs.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="relative">
              <CatalogImage
                src={mainImage}
                alt={`${brand.name} - imagem institucional`}
                className="h-[560px] w-full rounded-3xl object-cover"
                referrerPolicy="no-referrer"
                fallback={{ style: 'lookbook', seed: 'about-main', label: 'Imagem institucional' }}
              />
              <div className="surface-card absolute -bottom-6 -left-6 max-w-xs p-5">
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-gray-500">Proposta de valor</p>
                <p className="text-sm text-gray-700">{institutionalMainText}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-shell premium-reveal premium-reveal-delay-1 bg-gray-100/70">
        <Container>
          <div className="mb-10 max-w-3xl">
            <p className="section-eyebrow mb-3">Posicionamento</p>
            <h2 className="section-title mb-4">{positioningTitle}</h2>
            <p className="section-support">{positioningText}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {positioningPhrases.map((phrase, index) => (
              <article key={`${phrase}-${index}`} className="surface-card surface-card-hover p-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Assinatura {index + 1}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{phrase}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-shell premium-reveal premium-reveal-delay-2">
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {pillarCards.map((pillar) => (
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
              <h2 className="section-title mb-4 text-3xl">Imagens institucionais</h2>
              <p className="section-support">
                Conteúdo visual com foco em autenticidade, modelagem e valor percebido da coleção.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {galleryImages.map((image, index) => (
                <CatalogImage
                  key={`${image}-${index}`}
                  src={image}
                  alt={`${brand.name} - galeria institucional ${index + 1}`}
                  className="h-72 w-full rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                  fallback={{
                    style: 'lookbook',
                    seed: `about-gallery-${index + 1}`,
                    label: `Galeria institucional ${index + 1}`
                  }}
                />
              ))}
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
            {differentials.slice(0, 3).map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </Container>
      </section>
    </article>
  );
}
