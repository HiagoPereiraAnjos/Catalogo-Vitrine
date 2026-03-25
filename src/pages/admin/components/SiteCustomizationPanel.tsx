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

type SectionKey = 'brand' | 'home' | 'about' | 'contact' | 'seo' | 'appearance';
type HomePanelKey = 'hero' | 'blocks';

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

interface CustomizationSection {
  key: SectionKey;
  label: string;
  description: string;
  helperText: string;
  moduleKey: SiteSettingsModuleKey;
  icon: LucideIcon;
}

const CUSTOMIZATION_SECTIONS: CustomizationSection[] = [
  {
    key: 'brand',
    label: 'Marca',
    description: 'Logo, assinatura e canais oficiais.',
    helperText: 'Atualize nome da marca, slogan, contatos e imagens institucionais.',
    moduleKey: 'brand',
    icon: Store
  },
  {
    key: 'home',
    label: 'Home',
    description: 'Hero, blocos e narrativa comercial.',
    helperText: 'Edite hero, textos da vitrine, visibilidade e ordem dos blocos da Home.',
    moduleKey: 'home',
    icon: Home
  },
  {
    key: 'about',
    label: 'Sobre',
    description: 'Historia, missao e diferenciais.',
    helperText: 'Controle todo o conteudo institucional da pagina Sobre.',
    moduleKey: 'about',
    icon: Info
  },
  {
    key: 'contact',
    label: 'Contato',
    description: 'Canais, endereco e CTA principal.',
    helperText: 'Configure WhatsApp, e-mail, redes sociais e textos da pagina de contato.',
    moduleKey: 'contact',
    icon: PhoneCall
  },
  {
    key: 'seo',
    label: 'SEO',
    description: 'Titulos, descricoes e imagem social.',
    helperText: 'Ajuste os metadados principais para busca e compartilhamento.',
    moduleKey: 'seo',
    icon: Search
  },
  {
    key: 'appearance',
    label: 'Aparencia',
    description: 'Cores, botoes e preset visual.',
    helperText: 'Personalize o tema com opcoes seguras para manter o visual premium.',
    moduleKey: 'appearance',
    icon: Palette
  }
];

const getSectionByKey = (sectionKey: SectionKey) =>
  CUSTOMIZATION_SECTIONS.find((section) => section.key === sectionKey) || CUSTOMIZATION_SECTIONS[0];

const formatUpdatedAt = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) {
    return 'Ainda nao salvo';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(timestamp));
};

export const SiteCustomizationPanel = () => {
  const { settings, error, resetModuleSettings, resetSettings } = useSiteSettings();
  const [activeSection, setActiveSection] = useState<SectionKey>('brand');
  const [activeHomePanel, setActiveHomePanel] = useState<HomePanelKey>('hero');
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [pendingReset, setPendingReset] = useState<ResetTarget | null>(null);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleConfirmReset = () => {
    if (!pendingReset) {
      return;
    }

    setIsResetting(true);

    try {
      if (pendingReset.mode === 'all') {
        resetSettings();
        setStatus({ type: 'success', message: 'Todas as personalizacoes foram restauradas para o padrao.' });
      } else {
        resetModuleSettings(pendingReset.moduleKey);
        setStatus({
          type: 'success',
          message: `A secao "${pendingReset.sectionLabel}" foi restaurada para o padrao.`
        });
      }
    } catch (caughtError) {
      console.error('Falha ao resetar personalizacao', caughtError);
      setStatus({
        type: 'error',
        message:
          pendingReset.mode === 'all'
            ? 'Nao foi possivel resetar todas as personalizacoes.'
            : `Nao foi possivel resetar a secao "${pendingReset.sectionLabel}".`
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
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Secoes da Home</p>
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
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <CatalogImage
                src={settings.brand.logoImage}
                alt={settings.brand.name}
                className="h-full w-full object-cover"
                fallback={{ style: 'editorial', label: 'Logo' }}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{settings.brand.name}</p>
              <p className="line-clamp-2 text-xs text-gray-500">{settings.brand.tagline}</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-800">Contato atual</p>
            <p className="mt-1">{settings.brand.whatsappDisplay || defaultSiteSettings.brand.whatsappDisplay}</p>
            <p>{settings.brand.contactEmail || defaultSiteSettings.brand.contactEmail}</p>
          </div>
        </div>
      );
    }

    if (activeSection === 'home') {
      return (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="aspect-[16/10]">
              <CatalogImage
                src={settings.home.heroDesktopImage}
                alt={settings.home.heroTitle}
                className="h-full w-full object-cover"
                fallback={{ style: 'editorial', label: 'Hero' }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="line-clamp-2 text-sm font-semibold text-gray-900">{settings.home.heroTitle}</p>
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{settings.home.heroSubtitle}</p>
          </div>
        </div>
      );
    }

    if (activeSection === 'appearance') {
      const previewColors = [
        { label: 'Primaria', value: settings.appearance.primaryColor },
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
        </div>
      );
    }

    if (activeSection === 'about') {
      return (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="aspect-[4/3]">
              <CatalogImage
                src={settings.about.heroImage}
                alt={settings.about.title}
                className="h-full w-full object-cover"
                fallback={{ style: 'editorial', label: 'Sobre' }}
              />
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
          <p className="mt-2">{settings.contact.whatsappDisplay}</p>
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

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Previa meta</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">{settings.seo.institutionalTitle}</p>
        <p className="mt-1 text-xs text-gray-500">{settings.seo.defaultDescription}</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Configuracao do site</p>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Personalizacao visual</h2>
            <p className="mt-1 text-sm text-gray-600">Edite os modulos como um mini CMS, com preview e fallbacks seguros.</p>
            <p className="mt-2 text-xs text-gray-500">Ultima atualizacao salva: {updatedAtLabel}</p>
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
              Resetar secao atual
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPendingReset({ mode: 'all' })}>
              <AlertTriangle className="h-4 w-4" />
              Resetar tudo
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

        <div className="mt-6 space-y-5 xl:grid xl:grid-cols-[264px_minmax(0,1fr)] xl:gap-5 xl:space-y-0">
          <div className="space-y-3 xl:hidden">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Modulos</p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {CUSTOMIZATION_SECTIONS.map((section) => {
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

            <details className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Preview rapido
              </summary>
              <div className="mt-3">{renderPreview()}</div>
            </details>
          </div>

          <aside className="hidden space-y-4 xl:block">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Modulos</p>
              <nav className="mt-3 space-y-1.5">
                {CUSTOMIZATION_SECTIONS.map((section) => {
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
              </nav>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Preview rapido</p>
              <div className="mt-3">{renderPreview()}</div>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">{activeSectionMeta.label}</h3>
              <p className="mt-1 text-xs text-gray-600">{activeSectionMeta.helperText}</p>
              <p className="mt-2 text-xs text-gray-500">
                Dica: faca os ajustes, use o botao de salvar dentro do modulo e acompanhe os previews ao lado.
              </p>
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
        title={pendingReset?.mode === 'all' ? 'Resetar todas as personalizacoes' : 'Resetar secao atual'}
        description={
          pendingReset?.mode === 'all'
            ? 'Essa acao restaura todo o conteudo do site para os valores padrao.'
            : `Essa acao restaura os dados da secao ${pendingReset?.sectionLabel || ''}.`
        }
        maxWidthClassName="sm:max-w-lg"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">Confirme para continuar.</p>
            <p className="mt-1 text-xs text-red-700/90">
              {pendingReset?.mode === 'all'
                ? 'Voce perdera as personalizacoes salvas de todos os modulos.'
                : 'Voce perdera as personalizacoes salvas desta secao.'}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPendingReset(null)} disabled={isResetting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmReset} disabled={isResetting}>
              {isResetting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar reset
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
