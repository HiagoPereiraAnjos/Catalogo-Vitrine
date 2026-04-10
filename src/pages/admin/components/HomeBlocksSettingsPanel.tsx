import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Save, XCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CatalogImage } from '../../../components/CatalogImage';
import { useProducts } from '../../../context/ProductContext';
import { defaultSiteSettings } from '../../../data/defaultSiteSettings';
import { useSiteSettings } from '../../../hooks/useSiteSettings';
import { HomeSectionKey, SiteHomeSettings } from '../../../types/siteSettings';
import { sortProductsByNewest } from '../../../utils/product';

type NoticeType = 'success' | 'error';

interface StatusMessage {
  type: NoticeType;
  message: string;
}

const getFieldClassName = (hasError = false) =>
  `field-control ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
  }`;

const HOME_SECTION_KEYS: HomeSectionKey[] = [
  'categories',
  'featured',
  'collections',
  'institutional',
  'benefits',
  'finalCta'
];

const sectionMeta: Array<{
  key: HomeSectionKey;
  label: string;
  description: string;
  visibilityField:
    | 'showCategories'
    | 'showFeaturedProducts'
    | 'showCollections'
    | 'showInstitutional'
    | 'showBenefits'
    | 'showFinalCta';
}> = [
  {
    key: 'categories',
    label: 'Categorias em destaque',
    description: 'Bloco com linhas Masculino, Feminino e Mais procurados.',
    visibilityField: 'showCategories'
  },
  {
    key: 'featured',
    label: 'Produtos em destaque',
    description: 'Grade principal com produtos prioritários da vitrine.',
    visibilityField: 'showFeaturedProducts'
  },
  {
    key: 'collections',
    label: 'Coleções / novidades',
    description: 'Campanhas, drops e coleções em evidência.',
    visibilityField: 'showCollections'
  },
  {
    key: 'institutional',
    label: 'Bloco institucional',
    description: 'Mensagem de marca e posicionamento premium.',
    visibilityField: 'showInstitutional'
  },
  {
    key: 'benefits',
    label: 'Benefícios',
    description: 'Diferenciais comerciais da marca.',
    visibilityField: 'showBenefits'
  },
  {
    key: 'finalCta',
    label: 'CTA final',
    description: 'Chamada final para contato e conversão.',
    visibilityField: 'showFinalCta'
  }
];

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const isValidFinalCtaHref = (value: string) => {
  const href = value.trim();

  if (!href) {
    return true;
  }

  if (href.startsWith('/') || href.startsWith('#')) {
    return true;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
    return true;
  }

  return false;
};

const normalizeSectionOrder = (value: HomeSectionKey[]) => {
  const uniqueSections: HomeSectionKey[] = [];

  value.forEach((section) => {
    if (HOME_SECTION_KEYS.includes(section) && !uniqueSections.includes(section)) {
      uniqueSections.push(section);
    }
  });

  HOME_SECTION_KEYS.forEach((section) => {
    if (!uniqueSections.includes(section)) {
      uniqueSections.push(section);
    }
  });

  return uniqueSections;
};

const sanitizeHomeBlocks = (home: SiteHomeSettings): SiteHomeSettings => ({
  ...home,
  sectionOrder: normalizeSectionOrder(home.sectionOrder),
  categoriesTitle: home.categoriesTitle.trim(),
  categoriesSubtitle: home.categoriesSubtitle.trim(),
  featuredTitle: home.featuredTitle.trim(),
  featuredSubtitle: home.featuredSubtitle.trim(),
  collectionsTitle: home.collectionsTitle.trim(),
  collectionsSubtitle: home.collectionsSubtitle.trim(),
  institutionalEyebrow: home.institutionalEyebrow.trim(),
  institutionalTitle: home.institutionalTitle.trim(),
  institutionalBodyPrimary: home.institutionalBodyPrimary.trim(),
  institutionalBodySecondary: home.institutionalBodySecondary.trim(),
  benefitsTitle: home.benefitsTitle.trim(),
  benefitsSubtitle: home.benefitsSubtitle.trim(),
  benefitsItems: home.benefitsItems.map((item) => item.trim()).filter(Boolean),
  finalCtaEyebrow: home.finalCtaEyebrow.trim(),
  finalCtaTitle: home.finalCtaTitle.trim(),
  finalCtaSubtitle: home.finalCtaSubtitle.trim(),
  finalCtaLabel: home.finalCtaLabel.trim(),
  finalCtaHref: home.finalCtaHref.trim(),
  featuredProductIds: Array.from(new Set(home.featuredProductIds.map((item) => item.trim()).filter(Boolean)))
});

export const HomeBlocksSettingsPanel = () => {
  const { settings, saveModuleSettings } = useSiteSettings();
  const { products } = useProducts();

  const [formData, setFormData] = useState<SiteHomeSettings>(settings.home);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    setFormData(settings.home);
  }, [settings.home]);

  const sortedProducts = useMemo(() => sortProductsByNewest(products), [products]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(settings.home),
    [formData, settings.home]
  );

  const benefitsItemsText = useMemo(() => formData.benefitsItems.join('\n'), [formData.benefitsItems]);

  const selectedProductsCount = formData.featuredProductIds.length;

  const setField = <K extends keyof SiteHomeSettings>(field: K, value: SiteHomeSettings[K]) => {
    setFormData((previousState) => ({
      ...previousState,
      [field]: value
    }));
  };

  const moveSection = (section: HomeSectionKey, direction: 'up' | 'down') => {
    setFormData((previousState) => {
      const currentOrder = normalizeSectionOrder(previousState.sectionOrder);
      const index = currentOrder.indexOf(section);

      if (index === -1) {
        return previousState;
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentOrder.length) {
        return previousState;
      }

      const nextOrder = [...currentOrder];
      [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];

      return {
        ...previousState,
        sectionOrder: nextOrder
      };
    });
  };

  const toggleFeaturedProduct = (productId: string) => {
    setFormData((previousState) => {
      const alreadySelected = previousState.featuredProductIds.includes(productId);

      if (alreadySelected) {
        return {
          ...previousState,
          featuredProductIds: previousState.featuredProductIds.filter((id) => id !== productId)
        };
      }

      if (previousState.featuredProductIds.length >= 4) {
        setStatus({ type: 'error', message: 'Selecione no máximo 4 produtos para destaque manual.' });
        return previousState;
      }

      return {
        ...previousState,
        featuredProductIds: [...previousState.featuredProductIds, productId]
      };
    });
  };

  const validateForm = () => {
    if (!isValidFinalCtaHref(formData.finalCtaHref)) {
      return 'Link do CTA final inválido.';
    }

    if (formData.benefitsItems.length === 0) {
      return 'Informe ao menos 1 benefício para o bloco de benefícios.';
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setIsSaving(true);

    try {
      const payload = sanitizeHomeBlocks(formData);
      saveModuleSettings('home', payload);
      setStatus({ type: 'success', message: 'Blocos da Home salvos com sucesso.' });
    } catch (error) {
      console.error('Falha ao salvar Home Blocos', error);
      setStatus({ type: 'error', message: 'Não foi possível salvar as configurações da Home.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings.home);
    setStatus({ type: 'success', message: 'Alterações locais descartadas.' });
  };

  const effectiveSectionOrder = normalizeSectionOrder(formData.sectionOrder);

  return (
    <section className="premium-reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_22px_44px_-34px_rgba(17,24,39,0.55)] md:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Home</p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Blocos</h2>
          <p className="mt-1 text-sm text-gray-600">Controle visibilidade, ordem, textos e destaques da Home.</p>
        </div>

        {status && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {status.message}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Visibilidade e ordem</h3>
          <p className="mt-1 text-xs text-gray-500">Ative/desative blocos e reordene com setas.</p>

          <div className="mt-4 space-y-2">
            {effectiveSectionOrder.map((sectionKey) => {
              const section = sectionMeta.find((item) => item.key === sectionKey);
              if (!section) {
                return null;
              }

              const visibilityValue = formData[section.visibilityField] as boolean;
              const sectionIndex = effectiveSectionOrder.indexOf(section.key);

              return (
                <div
                  key={section.key}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <label className="inline-flex items-start gap-2.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={visibilityValue}
                      onChange={(event) => setField(section.visibilityField, event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="font-medium text-gray-900">{section.label}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{section.description}</span>
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveSection(section.key, 'up')}
                      disabled={sectionIndex === 0}
                      className="premium-interactive rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Mover ${section.label} para cima`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section.key, 'down')}
                      disabled={sectionIndex === effectiveSectionOrder.length - 1}
                      className="premium-interactive rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Mover ${section.label} para baixo`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Títulos e textos dos blocos</h3>
          <p className="mt-1 text-xs text-gray-500">Personalize mensagem comercial e narrativa da Home.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Categorias - título</label>
              <input
                type="text"
                value={formData.categoriesTitle}
                onChange={(event) => setField('categoriesTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Categorias - subtítulo</label>
              <input
                type="text"
                value={formData.categoriesSubtitle}
                onChange={(event) => setField('categoriesSubtitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Destaques - título</label>
              <input
                type="text"
                value={formData.featuredTitle}
                onChange={(event) => setField('featuredTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Destaques - subtítulo</label>
              <input
                type="text"
                value={formData.featuredSubtitle}
                onChange={(event) => setField('featuredSubtitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Coleções - título</label>
              <input
                type="text"
                value={formData.collectionsTitle}
                onChange={(event) => setField('collectionsTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Coleções - subtítulo</label>
              <input
                type="text"
                value={formData.collectionsSubtitle}
                onChange={(event) => setField('collectionsSubtitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Institucional - selo</label>
              <input
                type="text"
                value={formData.institutionalEyebrow}
                onChange={(event) => setField('institutionalEyebrow', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Institucional - título</label>
              <input
                type="text"
                value={formData.institutionalTitle}
                onChange={(event) => setField('institutionalTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Institucional - texto 1</label>
              <textarea
                rows={2}
                value={formData.institutionalBodyPrimary}
                onChange={(event) => setField('institutionalBodyPrimary', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Institucional - texto 2</label>
              <textarea
                rows={2}
                value={formData.institutionalBodySecondary}
                onChange={(event) => setField('institutionalBodySecondary', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Benefícios - título</label>
              <input
                type="text"
                value={formData.benefitsTitle}
                onChange={(event) => setField('benefitsTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Benefícios - subtítulo</label>
              <input
                type="text"
                value={formData.benefitsSubtitle}
                onChange={(event) => setField('benefitsSubtitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Benefícios (1 por linha)</label>
              <textarea
                rows={4}
                value={benefitsItemsText}
                onChange={(event) => setField('benefitsItems', splitLines(event.target.value))}
                className={getFieldClassName()}
                placeholder={'Padrão premium\nEntrega eficiente\nSuporte consultivo'}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">CTA final - selo</label>
              <input
                type="text"
                value={formData.finalCtaEyebrow}
                onChange={(event) => setField('finalCtaEyebrow', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">CTA final - título</label>
              <input
                type="text"
                value={formData.finalCtaTitle}
                onChange={(event) => setField('finalCtaTitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">CTA final - subtítulo</label>
              <textarea
                rows={2}
                value={formData.finalCtaSubtitle}
                onChange={(event) => setField('finalCtaSubtitle', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">CTA final - texto do botão</label>
              <input
                type="text"
                value={formData.finalCtaLabel}
                onChange={(event) => setField('finalCtaLabel', event.target.value)}
                className={getFieldClassName()}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">CTA final - link do botão</label>
              <input
                type="text"
                value={formData.finalCtaHref}
                onChange={(event) => setField('finalCtaHref', event.target.value)}
                className={getFieldClassName(!isValidFinalCtaHref(formData.finalCtaHref))}
                placeholder="https://wa.me/... ou /contato"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Produtos em destaque</h3>
          <p className="mt-1 text-xs text-gray-500">
            Selecione até 4 produtos para destaque manual. Se vazio, o sistema usa destaque automático.
          </p>

          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
            <p className="mb-2 text-xs text-gray-500">Selecionados: {selectedProductsCount}/4</p>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {sortedProducts.map((product) => {
                const checked = formData.featuredProductIds.includes(product.id);

                return (
                  <label
                    key={product.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFeaturedProduct(product.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                      <CatalogImage
                        src={product.featuredImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        fallback={{ style: 'editorial', seed: product.id, label: product.name }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="truncate text-xs text-gray-500">{product.sku}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">As alterações controlam visibilidade, ordem e copy dos blocos da Home.</p>

          <div className="flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || isSaving}>
              Descartar
            </Button>
            <Button type="submit" disabled={!isDirty || isSaving}>
              {isSaving ? <Save className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Salvando...' : 'Salvar blocos'}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};
