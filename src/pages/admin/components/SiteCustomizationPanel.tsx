import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Home,
  Info,
  Loader2,
  Palette,
  PhoneCall,
  RotateCcw,
  Search,
  Store
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CatalogImage } from '../../../components/CatalogImage';
import { Modal } from '../../../components/Modal';
import { defaultSiteSettings } from '../../../data/defaultSiteSettings';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { SiteSettingsModuleKey } from '../../../types/siteSettings';
import { AboutSettingsPanel } from './AboutSettingsPanel';
import { AppearanceSettingsPanel } from './AppearanceSettingsPanel';
import { BrandSettingsPanel } from './BrandSettingsPanel';
import { ContactSettingsPanel } from './ContactSettingsPanel';
import { HomeBlocksSettingsPanel } from './HomeBlocksSettingsPanel';
import { HomeHeroSettingsPanel } from './HomeHeroSettingsPanel';
import { SeoSettingsPanel } from './SeoSettingsPanel';

type NoticeType = 'success' | 'error';

export type SiteCustomizationSectionKey = 'brand' | 'home' | 'about' | 'contact' | 'seo' | 'appearance';
type HomePanelKey = 'hero' | 'blocks';
type SectionGroupKey = 'brandIdentity' | 'siteContent' | 'visibility';

type ResetTarget =
  | {
      mode: 'module';
      moduleKey: SiteSettingsModuleKey;
      sectionLabel: string;
    }
  | { mode: 'all' };

interface StatusMessage {
  type: NoticeType;
  message: string;
}

interface SectionGroup {
  key: SectionGroupKey;
  label: string;
  description: string;
}

interface CustomizationSection {
  key: SiteCustomizationSectionKey;
  label: string;
  description: string;
  helperText: string;
  impactDescription: string;
  impactAreas: string[];
  moduleKey: SiteSettingsModuleKey;
  icon: LucideIcon;
  group: SectionGroupKey;
}

const SECTION_GROUPS: SectionGroup[] = [
  {
    key: 'brandIdentity',
    label: 'Marca e identidade',
    description: 'Quem é a marca e como ela é percebida.'
  },
  {
    key: 'siteContent',
    label: 'Conteúdo e relacionamento',
    description: 'Mensagem comercial e páginas institucionais.'
  },
  {
    key: 'visibility',
    label: 'Descoberta e presença',
    description: 'Busca, compartilhamento e consistência visual.'
  }
];

const CUSTOMIZATION_SECTIONS: CustomizationSection[] = [
  {
    key: 'brand',
    label: 'Marca',
    description: 'Logo, assinatura e canais oficiais.',
    helperText: 'Defina nome da marca, slogan, contatos e imagens institucionais.',
    impactDescription: 'Esses dados aparecem nas áreas fixas do site e reforçam credibilidade.',
    impactAreas: ['Cabeçalho e rodapé', 'Resumo institucional da Home', 'Informações de contato em páginas públicas'],
    moduleKey: 'brand',
    icon: Store,
    group: 'brandIdentity'
  },
  {
    key: 'appearance',
    label: 'Aparência',
    description: 'Cores, botões e estilo visual.',
    helperText: 'Ajuste a identidade visual do site com combinações seguras e legíveis.',
    impactDescription: 'A aparência muda o tom visual geral sem alterar estrutura do layout.',
    impactAreas: ['Botões e badges', 'Destaques de seções', 'Fundo e contraste de componentes'],
    moduleKey: 'appearance',
    icon: Palette,
    group: 'brandIdentity'
  },
  {
    key: 'home',
    label: 'Home',
    description: 'Hero, blocos e narrativa comercial.',
    helperText: 'Edite banner principal, textos da vitrine e ordem dos blocos da Home.',
    impactDescription: 'Essa seção afeta a primeira impressão e os principais caminhos de conversão.',
    impactAreas: ['Banner principal (desktop e mobile)', 'Blocos de categorias, destaques e benefícios', 'CTA final e links de contato'],
    moduleKey: 'home',
    icon: Home,
    group: 'siteContent'
  },
  {
    key: 'about',
    label: 'Sobre',
    description: 'História, missão e diferenciais.',
    helperText: 'Organize textos e imagens institucionais da página Sobre.',
    impactDescription: 'Conteúdo institucional claro aumenta confiança e valor percebido.',
    impactAreas: ['Hero da página Sobre', 'Bloco de história e posicionamento', 'Galeria institucional'],
    moduleKey: 'about',
    icon: Info,
    group: 'siteContent'
  },
  {
    key: 'contact',
    label: 'Contato',
    description: 'Canais, endereço e CTA principal.',
    helperText: 'Configure WhatsApp, e-mail, redes sociais e chamada de atendimento.',
    impactDescription: 'Facilita o contato do cliente e reduz fricção no atendimento.',
    impactAreas: ['Página /contato', 'Botões de chamada para atendimento', 'Dados exibidos em canais institucionais'],
    moduleKey: 'contact',
    icon: PhoneCall,
    group: 'siteContent'
  },
  {
    key: 'seo',
    label: 'SEO',
    description: 'Títulos, descrições e imagem social.',
    helperText: 'Defina como o site aparece no Google e no compartilhamento de links.',
    impactDescription: 'Ajustes de SEO melhoram descoberta e apresentação da marca fora do site.',
    impactAreas: ['Título e descrição das páginas principais', 'Imagem de compartilhamento (Open Graph)', 'Palavras-chave de contexto'],
    moduleKey: 'seo',
    icon: Search,
    group: 'visibility'
  }
];

const getSectionByKey = (sectionKey: SiteCustomizationSectionKey) =>
  CUSTOMIZATION_SECTIONS.find((section) => section.key === sectionKey) || CUSTOMIZATION_SECTIONS[0];

const formatUpdatedAt = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) {
    return 'Ainda não salvo';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(timestamp));
};

interface SiteCustomizationPanelProps {
  initialSection?: SiteCustomizationSectionKey;
}

export const SiteCustomizationPanel = ({ initialSection = 'brand' }: SiteCustomizationPanelProps) => {
  const { settings, error, resetModuleSettings, resetSettings } = useSiteSettings();
  const [activeSection, setActiveSection] = useState<SiteCustomizationSectionKey>(initialSection);
  const [activeHomePanel, setActiveHomePanel] = useState<HomePanelKey>('hero');
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [pendingReset, setPendingReset] = useState<ResetTarget | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timer = setTimeout(() => setStatus(null), 4200);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (activeSection !== 'home') {
      setActiveHomePanel('hero');
    }
  }, [activeSection]);

  const activeSectionMeta = useMemo(() => getSectionByKey(activeSection), [activeSection]);
  const updatedAtLabel = useMemo(() => formatUpdatedAt(settings.updatedAt), [settings.updatedAt]);

  const groupedSections = useMemo(
    () =>
      SECTION_GROUPS.map((group) => ({
        ...group,
        sections: CUSTOMIZATION_SECTIONS.filter((section) => section.group === group.key)
      })),
    []
  );

  const handleConfirmReset = () => {
    if (!pendingReset) {
      return;
    }

    setIsResetting(true);

    try {
      if (pendingReset.mode === 'all') {
        resetSettings();
        setStatus({ type: 'success', message: 'Todos os módulos foram restaurados para o padrão.' });
      } else {
        resetModuleSettings(pendingReset.moduleKey);
        setStatus({
          type: 'success',
          message: `A seção "${pendingReset.sectionLabel}" voltou para o padrão.`
        });
      }
    } catch (caughtError) {
      console.error('Falha ao resetar personalização', caughtError);
      setStatus({
        type: 'error',
        message:
          pendingReset.mode === 'all'
            ? 'Não foi possível restaurar todos os módulos.'
            : `Não foi possível restaurar a seção "${pendingReset.sectionLabel}".`
      });
    } finally {
      setIsResetting(false);
      setPendingReset(null);
    }
  };

  const renderActiveSection = () => {
    if (activeSection === 'home') {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3 md:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Partes da Home</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveHomePanel('hero')}
                aria-pressed={activeHomePanel === 'hero'}
                className={`premium-focus premium-interactive rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  activeHomePanel === 'hero'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                Hero
              </button>
              <button
                type="button"
                onClick={() => setActiveHomePanel('blocks')}
                aria-pressed={activeHomePanel === 'blocks'}
                className={`premium-focus premium-interactive rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  activeHomePanel === 'blocks'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                Blocos
              </button>
            </div>
          </div>

          <div className={activeHomePanel === 'hero' ? 'block' : 'hidden md:block'}>
            <HomeHeroSettingsPanel />
          </div>
          <div className={activeHomePanel === 'blocks' ? 'block' : 'hidden md:block'}>
            <HomeBlocksSettingsPanel />
          </div>
        </div>
      );
    }

    if (activeSection === 'brand') {
      return <BrandSettingsPanel />;
    }

    if (activeSection === 'about') {
      return <AboutSettingsPanel />;
    }

    if (activeSection === 'contact') {
      return <ContactSettingsPanel />;
    }

    if (activeSection === 'seo') {
      return <SeoSettingsPanel />;
    }

    return <AppearanceSettingsPanel />;
  };

  const renderPreview = () => {
    if (activeSection === 'brand') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-gray-200 bg-white p-2.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Logo</p>
              <div className="aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <CatalogImage
                  src={settings.brand.logoImage}
                  alt={settings.brand.name}
                  className="h-full w-full object-cover"
                  fallback={{ style: 'editorial', label: 'Logo' }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-2.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Institucional</p>
              <div className="aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <CatalogImage
                  src={settings.brand.institutionalImage}
                  alt={`${settings.brand.name} institucional`}
                  className="h-full w-full object-cover"
                  fallback={{ style: 'institutional', label: 'Marca' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
            <p className="text-sm font-semibold text-gray-900">{settings.brand.name}</p>
            <p className="mt-1 line-clamp-2">{settings.brand.tagline || defaultSiteSettings.brand.tagline}</p>
            <p className="mt-2 font-medium text-gray-800">Contato público</p>
            <p className="mt-1">{settings.brand.whatsappDisplay || defaultSiteSettings.brand.whatsappDisplay}</p>
            <p>{settings.brand.contactEmail || defaultSiteSettings.brand.contactEmail}</p>
          </div>
        </div>
      );
    }

    if (activeSection === 'home') {
      const previewMobileImage = settings.home.heroMobileImage || settings.home.heroDesktopImage;

      return (
        <div className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Hero desktop</p>
              <div className="aspect-[16/10] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <CatalogImage
                  src={settings.home.heroDesktopImage}
                  alt={settings.home.heroTitle}
                  className="h-full w-full object-cover"
                  fallback={{ style: 'editorial', label: 'Hero desktop' }}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Mobile</p>
              <div className="aspect-[9/16] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <CatalogImage
                  src={previewMobileImage}
                  alt={`${settings.home.heroTitle} mobile`}
                  className="h-full w-full object-cover"
                  fallback={{ style: 'editorial', label: 'Hero mobile' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="line-clamp-2 text-sm font-semibold text-gray-900">
              {settings.home.heroTitle || defaultSiteSettings.home.heroTitle}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {settings.home.heroSubtitle || defaultSiteSettings.home.heroSubtitle}
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === 'appearance') {
      const previewColors = [
        { label: 'Primária', value: settings.appearance.primaryColor },
        { label: 'Destaque', value: settings.appearance.highlightColor },
        { label: 'Apoio', value: settings.appearance.supportColor },
        { label: 'Fundo', value: settings.appearance.backgroundColor }
      ];

      return (
        <div className="space-y-2.5">
          {previewColors.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: item.value }} />
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </div>
              <span className="text-[11px] font-mono text-gray-500">{item.value}</span>
            </div>
          ))}

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">Aplicação</p>
            <p className="mt-1 text-xs text-gray-600">Botões, badges e destaques seguem essa paleta no site público.</p>
          </div>
        </div>
      );
    }

    if (activeSection === 'about') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Hero</p>
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <CatalogImage
                  src={settings.about.heroImage}
                  alt={settings.about.title}
                  className="h-full w-full object-cover"
                  fallback={{ style: 'editorial', label: 'Sobre hero' }}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Institucional</p>
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <CatalogImage
                  src={settings.about.mainImage}
                  alt={settings.about.storyTitle}
                  className="h-full w-full object-cover"
                  fallback={{ style: 'institutional', label: 'Sobre principal' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-sm font-semibold text-gray-900">{settings.about.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{settings.about.subtitle}</p>
          </div>
        </div>
      );
    }

    if (activeSection === 'contact') {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
          <p className="text-sm font-semibold text-gray-900">{settings.contact.title}</p>
          <p className="mt-1 line-clamp-2 text-gray-500">{settings.contact.subtitle}</p>
          <p className="mt-2 font-medium text-gray-800">Canais ativos</p>
          <p className="mt-1">{settings.contact.whatsappDisplay}</p>
          <p>{settings.contact.email}</p>
          {settings.contact.showAddress && (
            <p className="mt-2">
              {settings.contact.addressLine1}
              <br />
              {settings.contact.addressLine2}
            </p>
          )}
        </div>
      );
    }

    const seoImage = settings.seo.defaultOgImage || defaultSiteSettings.seo.defaultOgImage;

    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            Imagem de compartilhamento
          </p>
          <div className="aspect-[1.91/1] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
            <CatalogImage
              src={seoImage}
              alt="Imagem social de SEO"
              className="h-full w-full object-cover"
              fallback={{ style: 'institutional', label: 'Open Graph' }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Prévia meta</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{settings.seo.institutionalTitle}</p>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{settings.seo.defaultDescription}</p>
        </div>
      </div>
    );
  };

  const hasStatusError = Boolean(error) || status?.type === 'error';
  const StatusIcon = hasStatusError ? AlertTriangle : CheckCircle2;

  return (
    <>
      <section className="premium-reveal rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_26px_58px_-44px_rgba(17,24,39,0.58)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Editor do site</p>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Personalização visual</h2>
            <p className="mt-1 text-sm text-gray-600">
              Faça ajustes por área, revise a prévia e salve dentro de cada módulo.
            </p>
            <p className="mt-2 text-xs text-gray-500">Última atualização salva: {updatedAtLabel}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setPendingReset({
                  mode: 'module',
                  moduleKey: activeSectionMeta.moduleKey,
                  sectionLabel: activeSectionMeta.label
                })
              }
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar seção
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPendingReset({ mode: 'all' })}>
              <AlertTriangle className="h-4 w-4" />
              Restaurar tudo
            </Button>
          </div>
        </div>

        {(status || error) && (
          <div className="mt-4">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                hasStatusError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {error || status?.message}
            </span>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">Fluxo recomendado</p>
          <p className="mt-1 text-sm text-blue-900">
            1) Edite os campos da seção atual, 2) confira a prévia rápida ao lado, 3) clique em salvar no módulo para publicar.
          </p>
        </div>

        <div className="mt-6 space-y-5 xl:grid xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-5 xl:space-y-0">
          <div className="space-y-3 xl:hidden">
            <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Módulos</p>
              {groupedSections.map((group) => (
                <div key={`mobile-${group.key}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{group.label}</p>
                  <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
                    {group.sections.map((section) => {
                      const Icon = section.icon;
                      const isActive = section.key === activeSection;

                      return (
                        <button
                          key={`mobile-${section.key}`}
                          type="button"
                          onClick={() => setActiveSection(section.key)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`premium-focus premium-interactive inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            isActive
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-200 bg-white text-gray-700'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="whitespace-nowrap">{section.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <details className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Preview rápido
              </summary>
              <div className="mt-3">{renderPreview()}</div>
            </details>
          </div>

          <aside className="hidden space-y-4 xl:block">
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Módulos</p>

              {groupedSections.map((group) => (
                <div key={group.key} className="space-y-1.5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{group.label}</p>
                    <p className="text-[11px] text-gray-500">{group.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    {group.sections.map((section) => {
                      const Icon = section.icon;
                      const isActive = section.key === activeSection;
                      return (
                        <button
                          key={section.key}
                          type="button"
                          onClick={() => setActiveSection(section.key)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`premium-focus premium-interactive w-full rounded-xl border px-3 py-2 text-left transition ${
                            isActive
                              ? 'border-gray-900 bg-gray-900 text-white shadow-[0_14px_26px_-20px_rgba(17,24,39,0.9)]'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <span className="flex items-start gap-2.5">
                            <Icon className={`mt-0.5 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                            <span>
                              <span className={`block text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                {section.label}
                              </span>
                              <span className={`mt-0.5 block text-xs ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                                {section.description}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Preview rápido</p>
              <div className="mt-3">{renderPreview()}</div>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Você está editando: {activeSectionMeta.label}</h3>
              <p className="mt-1 text-xs text-gray-600">{activeSectionMeta.helperText}</p>
              <p className="mt-2 text-xs text-gray-500">
                As mudanças só ficam visíveis no site público depois do botão de salvar dentro do módulo.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Impacto no site público</p>
              <p className="mt-1 text-sm text-amber-900">{activeSectionMeta.impactDescription}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900">
                {activeSectionMeta.impactAreas.map((item) => (
                  <li key={item} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>

            {renderActiveSection()}
          </div>
        </div>
      </section>

      <Modal
        isOpen={Boolean(pendingReset)}
        onClose={() => {
          if (!isResetting) {
            setPendingReset(null);
          }
        }}
        title={pendingReset?.mode === 'all' ? 'Restaurar todo o site para o padrão' : 'Restaurar seção para o padrão'}
        description={
          pendingReset?.mode === 'all'
            ? 'Essa ação remove as personalizações salvas de todos os módulos.'
            : `Essa ação remove as personalizações da seção ${pendingReset?.sectionLabel || ''}.`
        }
        maxWidthClassName="sm:max-w-lg"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">Confirme para continuar.</p>
            <p className="mt-1 text-xs text-red-700/90">
              {pendingReset?.mode === 'all'
                ? 'Você perderá todas as personalizações atuais e o site voltará ao padrão.'
                : 'Você perderá as personalizações atuais desta seção.'}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPendingReset(null)} disabled={isResetting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmReset} disabled={isResetting}>
              {isResetting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isResetting ? 'Restaurando...' : 'Restaurar agora'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
