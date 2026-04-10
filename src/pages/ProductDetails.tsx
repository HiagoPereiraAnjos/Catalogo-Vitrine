import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Palette,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { Container } from '../components/Container';
import { EmptyState } from '../components/EmptyState';
import { ProductCard } from '../components/ProductCard';
import { CatalogImage } from '../components/CatalogImage';
import { formatPrice } from '../utils/formatters';
import { getProductBadge, getStockStatusMeta } from '../utils/product';
import { buildWhatsAppHref, whatsappPrimaryButtonClass } from '../utils/whatsapp';
import { usePageSeo } from '../hooks/usePageSeo';
import { WhatsAppLogo } from '../components/icons/WhatsAppLogo';
import { Product } from '../types';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { defaultSiteSettings } from '../data/defaultSiteSettings';

interface ProductNarrative {
  fit: string;
  material: string;
  composition: string;
  careInstructions: string[];
  collection: string;
  season: string;
  qualityNote: string;
  highlights: string[];
}

const getPrimaryProductImage = (product?: Product) => product?.featuredImage || product?.images?.[0] || '';

const getFitOptions = (fitValue?: string) => {
  const source = (fitValue || '').trim();
  if (!source) {
    return [];
  }

  if (!source.includes('|')) {
    return [source];
  }

  return source
    .split('|')
    .map((option) => option.trim())
    .filter(Boolean);
};

const normalizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const fitByCategory: Record<string, string> = {
  calcas: 'Slim com conforto estruturado',
  jaquetas: 'Regular contemporânea',
  shorts: 'Relaxed com caimento moderno',
  camisas: 'Regular leve',
  saias: 'A-line equilibrada',
  macacoes: 'Straight utilitário'
};

const materialByCategory: Record<string, string> = {
  calcas: 'Denim premium com toque macio',
  jaquetas: 'Denim encorpado de alta durabilidade',
  shorts: 'Denim flexível com acabamento suave',
  camisas: 'Denim leve respirável',
  saias: 'Denim médio com estrutura confortável',
  macacoes: 'Denim técnico com caimento firme'
};

const compositionByCategory: Record<string, string> = {
  calcas: '98% algodão, 2% elastano',
  jaquetas: '100% algodão',
  shorts: '99% algodão, 1% elastano',
  camisas: '100% algodão',
  saias: '98% algodão, 2% elastano',
  macacoes: '99% algodão, 1% elastano'
};

const careByCategory: Record<string, string> = {
  calcas: 'Lavar do avesso em ciclo delicado, secagem natural e ferro em baixa temperatura.',
  jaquetas: 'Lavar à mão ou ciclo suave, evitar secadora e armazenar em local ventilado.',
  shorts: 'Lavar em água fria, não alvejar e secar à sombra para preservar a lavagem.',
  camisas: 'Lavagem suave com cores similares e passar em baixa temperatura.',
  saias: 'Lavar do avesso, secagem natural e evitar produtos abrasivos.',
  macacoes: 'Lavar em ciclo delicado, não torcer e secar em superfície plana.'
};

const collectionByCategory: Record<string, string> = {
  calcas: 'Linha Essenciais de Denim',
  jaquetas: 'Linha Outerwear Denim',
  shorts: 'Linha Verão Urbano',
  camisas: 'Linha Casual Premium',
  saias: 'Linha Feminina Contemporânea',
  macacoes: 'Linha Studio Utility'
};

const resolveCollectionBadge = (product: Product) => {
  const badge = getProductBadge(product);

  if (badge) {
    const normalized = badge.trim().toLowerCase();
    if (normalized === 'novo') {
      const createdAtDate = Date.parse(product.createdAt);
      const year = Number.isFinite(createdAtDate) ? new Date(createdAtDate).getFullYear() : new Date().getFullYear();
      return `Nova coleção ${year}`;
    }

    return badge;
  }

  const categoryKey = normalizeKey(product.category);
  if (categoryKey === 'calcas') {
    return 'Essencial';
  }

  return 'Curadoria premium';
};

const buildProductNarrative = (product: Product): ProductNarrative => {
  const categoryKey = normalizeKey(product.category);
  const firstColor = product.colors?.[0] || 'autorais';

  const fit = fitByCategory[categoryKey] || 'Regular contemporânea';
  const material = materialByCategory[categoryKey] || 'Denim premium selecionado';
  const composition = compositionByCategory[categoryKey] || '100% algodão';
  const care = careByCategory[categoryKey] || 'Lavar em ciclo suave e secar à sombra.';

  const collection = product.collection?.trim() || collectionByCategory[categoryKey] || 'Linha Signature Denim';
  const season = product.season?.trim() || 'Coleção atual';
  const highlights =
    product.highlights && product.highlights.length > 0
      ? product.highlights
      : [
          `Modelagem ${fit.toLowerCase()} com presença elegante e atual.`,
          `Lavagens ${firstColor.toLowerCase()} com leitura visual premium.`,
          'Versatilidade para combinações casuais, urbanas e comerciais.'
        ];
  const careInstructions =
    product.careInstructions && product.careInstructions.length > 0 ? product.careInstructions : [care];

  return {
    fit: product.fit?.trim() || fit,
    material: product.material?.trim() || material,
    composition: product.composition?.trim() || composition,
    careInstructions,
    collection,
    season,
    qualityNote:
      'Acabamento revisado peça a peça para manter padrão de caimento, toque e presença visual premium.',
    highlights
  };
};

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, isLoading } = useProducts();
  const { addItem, openCart, quantityByProductId } = useCart();
  const { settings } = useSiteSettings();
  const brand = settings.brand;
  const seo = settings.seo;

  const [product, setProduct] = useState(products.find((item) => item.id === id));
  const [mainImage, setMainImage] = useState(getPrimaryProductImage(product));
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedFit, setSelectedFit] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartFeedback, setCartFeedback] = useState<{ type: 'success' | 'info' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    const foundProduct = products.find((item) => item.id === id);
    setProduct(foundProduct);
    if (foundProduct) {
      setMainImage(getPrimaryProductImage(foundProduct));
    }
  }, [id, products]);

  useEffect(() => {
    if (!product) {
      setSelectedSize('');
      setSelectedColor('');
      setSelectedFit('');
      setQuantity(1);
      setCartFeedback(null);
      return;
    }

    const sizeOptions = product.sizes.length > 0 ? product.sizes : ['Unico'];
    const colorOptions = product.colors && product.colors.length > 0 ? product.colors : ['Padrao'];
    const fitOptions = getFitOptions(product.fit);

    const defaultSize = sizeOptions.length === 1 ? sizeOptions[0] : '';
    const defaultColor = colorOptions.length === 1 ? colorOptions[0] : '';
    const defaultFit = fitOptions.length === 1 ? fitOptions[0] : '';

    setSelectedSize(defaultSize);
    setSelectedColor(defaultColor);
    setSelectedFit(defaultFit);
    setQuantity(1);
    setCartFeedback(null);
  }, [product]);

  const seoTitleBase = seo.productDetails.title || defaultSiteSettings.seo.productDetails.title;
  const seoDescriptionFallback = seo.productDetails.description || defaultSiteSettings.seo.productDetails.description;

  const productSeoTitle = product ? `${product.name} | ${seoTitleBase}` : seoTitleBase;
  const productSeoDescription = product
    ? `${product.name}. SKU ${product.sku || product.id}. ${product.category} ${product.gender} por ${formatPrice(
        product.price
      )}. Coleção ${product.collection || brand.name} ${product.season ? `- ${product.season}` : ''}. ${seoDescriptionFallback}`
    : seoDescriptionFallback;

  usePageSeo({
    title: productSeoTitle,
    description: productSeoDescription,
    image: product?.featuredImage,
    type: 'product',
    keywords: seo.primaryKeywords || defaultSiteSettings.seo.primaryKeywords
  });

  if (isLoading) {
    return (
      <Container className="py-24 text-center">
        <div className="mx-auto max-w-lg animate-pulse space-y-4">
          <div className="h-10 w-28 rounded-full bg-gray-200" />
          <div className="h-96 rounded-3xl bg-gray-200" />
          <div className="h-5 w-2/3 rounded bg-gray-200" />
          <div className="h-5 w-1/2 rounded bg-gray-200" />
        </div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="section-shell-tight">
        <EmptyState
          icon={ShoppingBag}
          title="Produto não encontrado"
          description="O item que você buscou não está mais disponível no catálogo."
          actionLabel="Voltar para coleção"
          onAction={() => navigate('/produtos')}
        />
      </Container>
    );
  }

  const relatedProducts = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
  const images = product.images;
  const badge = resolveCollectionBadge(product);
  const narrative = buildProductNarrative(product);
  const stockStatus = getStockStatusMeta(product.stockStatus);

  const productWhatsAppHref = buildWhatsAppHref({
    context: 'product',
    intent: 'product-details',
    productName: product.name,
    productCode: product.sku || product.id,
    productPrice: formatPrice(product.price)
  });

  const sizeOptions = product.sizes.length > 0 ? product.sizes : ['Unico'];
  const colorOptions = product.colors && product.colors.length > 0 ? product.colors : ['Padrao'];
  const fitOptions = getFitOptions(product.fit);
  const requiresSizeSelection = sizeOptions.length > 1;
  const requiresColorSelection = colorOptions.length > 1;
  const requiresFitSelection = fitOptions.length > 1;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const inCartQuantity = quantityByProductId[product.id] || 0;
  const isSelectionValid =
    (!requiresSizeSelection || Boolean(selectedSize)) &&
    (!requiresColorSelection || Boolean(selectedColor)) &&
    (!requiresFitSelection || Boolean(selectedFit));

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    const missingSelections: string[] = [];
    if (requiresSizeSelection && !selectedSize) {
      missingSelections.push('tamanho');
    }
    if (requiresColorSelection && !selectedColor) {
      missingSelections.push('cor/lavagem');
    }
    if (requiresFitSelection && !selectedFit) {
      missingSelections.push('modelagem');
    }

    if (missingSelections.length > 0) {
      const readableList = missingSelections.join(', ');
      setCartFeedback({
        type: 'warning',
        message: `Antes de adicionar, escolha ${readableList}.`
      });
      return;
    }

    const result = addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      image: product.featuredImage,
      price: product.price,
      quantity,
      selectedSize: selectedSize || sizeOptions[0] || 'Unico',
      selectedColor: selectedColor || colorOptions[0] || 'Padrao',
      selectedFit: selectedFit || fitOptions[0] || '',
      sizeOptions,
      colorOptions,
      fitOptions,
      requiresSizeSelection,
      requiresColorSelection,
      requiresFitSelection
    });

    if (result.status === 'invalid') {
      setCartFeedback({
        type: 'warning',
        message: result.errorMessage || 'Selecione as variações obrigatórias para adicionar a peça.'
      });
      return;
    }

    setCartFeedback({
      type: result.status === 'added' ? 'success' : 'info',
      message:
        result.status === 'added'
          ? `${quantity} unidade(s) adicionada(s) na sua sacola.`
          : `Sacola atualizada com mais ${quantity} unidade(s).`
    });
  };

  return (
    <Container as="article" className="section-shell-tight">
      <button
        onClick={() => navigate(-1)}
        className="premium-interactive premium-focus mb-8 inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:-translate-y-px hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-900"
        aria-label="Voltar para a página anterior"
        type="button"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para a coleção
      </button>

      <section className="premium-reveal mb-16 grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]" aria-labelledby="product-title">
        <div className="space-y-4" aria-label="Galeria de imagens do produto">
          <div className="surface-card-strong overflow-hidden">
            <div className="relative aspect-[4/5] bg-gray-100 md:aspect-[5/6]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mainImage}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  <CatalogImage
                    src={mainImage}
                    alt={`${product.name} em destaque`}
                    className="h-full w-full object-cover"
                    fallback={{
                      category: product.category,
                      gender: product.gender,
                      style: 'editorial',
                      seed: `${product.id}-main`,
                      label: product.collection || product.name
                    }}
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden="true" />
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-800 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Curadoria premium
              </div>
              <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {images.length} imagem(ns)
              </span>
            </div>
          </div>

          {images.length > 1 && (
            <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
              {images.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    onClick={() => setMainImage(img)}
                    className={`premium-interactive premium-focus relative h-24 w-[76px] flex-shrink-0 overflow-hidden rounded-xl border sm:h-28 sm:w-[88px] focus-visible:ring-gray-900 ${
                      mainImage === img
                        ? 'border-gray-900 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.65)]'
                        : 'border-gray-200 hover:border-gray-400'
                  }`}
                  aria-label={`Visualizar imagem ${index + 1}`}
                  aria-pressed={mainImage === img}
                  type="button"
                >
                  <CatalogImage
                    src={img}
                    alt={`${product.name} - Imagem ${index + 1}`}
                    className="h-full w-full object-cover"
                    fallback={{
                      category: product.category,
                      gender: product.gender,
                      style: 'editorial',
                      seed: `${product.id}-thumb-${index}`,
                      label: product.collection || product.name
                    }}
                  />
                  {mainImage === img && <span className="absolute inset-x-1 bottom-1 h-0.5 rounded-full bg-gray-900" aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <motion.section
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="surface-card-strong flex h-fit flex-col p-6 md:p-8 xl:sticky xl:top-24"
          aria-label="Informações do produto"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="badge-chip premium-chip">{product.category}</span>
            <span className="badge-chip premium-chip">{product.gender}</span>
            {narrative.collection && (
              <span className="badge-chip premium-chip border-[rgba(var(--theme-primary-rgb),0.22)] bg-[rgba(var(--theme-highlight-rgb),0.62)] text-[var(--theme-primary)]">
                {narrative.collection}
              </span>
            )}
            {narrative.season && (
              <span className="badge-chip premium-chip border-[rgba(var(--theme-primary-rgb),0.2)] bg-[rgba(var(--theme-highlight-rgb),0.45)] text-[var(--theme-primary-subtle)]">
                {narrative.season}
              </span>
            )}
            <span className="badge-chip premium-chip border-[rgba(var(--theme-primary-rgb),0.22)] bg-[rgba(var(--theme-highlight-rgb),0.62)] text-[var(--theme-primary)]">
              {badge}
            </span>
            <span className={`badge-chip premium-chip ${stockStatus.toneClassName}`}>{stockStatus.shortLabel}</span>
          </div>

          <h1
            id="product-title"
            className="text-3xl tracking-tight text-gray-900 md:text-4xl"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {product.name}
          </h1>

          <div className="mb-5 mt-3 flex items-center text-sm text-gray-500">
            <Tag className="mr-1 h-4 w-4" />
            <span>SKU: {product.sku || product.id}</span>
          </div>

          <div className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</div>
          <p className="mb-7 mt-2 text-sm text-gray-500">
            Curadoria com alta saída comercial e atendimento consultivo para modelagem e tamanho ideais.
          </p>

          <p className="mb-6 leading-relaxed text-gray-600">{product.description}</p>

          <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-700">Destaques da peça</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {narrative.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Modelagem / Fit</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{narrative.fit}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Material</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{narrative.material}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Composição</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{narrative.composition}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Coleção</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{narrative.collection}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Temporada</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{narrative.season}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 flex items-center text-sm font-medium text-gray-900">
              <Palette className="mr-2 h-4 w-4" />
              Cor / lavagem
              {requiresColorSelection && <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">Obrigatório</span>}
            </h2>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color);
                    setCartFeedback(null);
                  }}
                  className={`badge-chip premium-chip border px-3 py-1.5 text-xs font-semibold ${
                    selectedColor === color
                      ? 'border-[var(--theme-primary)] bg-[rgba(var(--theme-highlight-rgb),0.7)] text-[var(--theme-primary)]'
                      : 'border-gray-300 bg-gray-50 text-gray-700'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
            {requiresColorSelection && !selectedColor && (
              <p className="mt-2 text-xs font-medium text-amber-700">Escolha uma cor/lavagem para evitar pedido ambíguo.</p>
            )}
          </div>

          <div className="mb-6">
            <h2 className="mb-3 flex items-center text-sm font-medium text-gray-900">
              <Ruler className="mr-2 h-4 w-4" />
              Tamanho
              {requiresSizeSelection && <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">Obrigatório</span>}
            </h2>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setCartFeedback(null);
                  }}
                  className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-semibold ${
                    selectedSize === size
                      ? 'border-[var(--theme-primary)] bg-[rgba(var(--theme-highlight-rgb),0.7)] text-[var(--theme-primary)]'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                  aria-pressed={selectedSize === size}
                >
                  {size}
                </button>
              ))}
            </div>
            {requiresSizeSelection && !selectedSize && (
              <p className="mt-2 text-xs font-medium text-amber-700">Selecione o tamanho para incluir na sacola.</p>
            )}
          </div>

          {fitOptions.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 flex items-center text-sm font-medium text-gray-900">
                <Tag className="mr-2 h-4 w-4" />
                Modelagem
                {requiresFitSelection && (
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">Obrigatório</span>
                )}
              </h2>
              <div className="flex flex-wrap gap-2">
                {fitOptions.map((fitOption) => (
                  <button
                    key={fitOption}
                    type="button"
                    onClick={() => {
                      setSelectedFit(fitOption);
                      setCartFeedback(null);
                    }}
                    className={`badge-chip premium-chip border px-3 py-1.5 text-xs font-semibold ${
                      selectedFit === fitOption
                        ? 'border-[var(--theme-primary)] bg-[rgba(var(--theme-highlight-rgb),0.7)] text-[var(--theme-primary)]'
                        : 'border-gray-300 bg-gray-50 text-gray-700'
                    }`}
                    aria-pressed={selectedFit === fitOption}
                  >
                    {fitOption}
                  </button>
                ))}
              </div>
              {requiresFitSelection && !selectedFit && (
                <p className="mt-2 text-xs font-medium text-amber-700">Escolha a modelagem para concluir esta seleção.</p>
              )}
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Seleção atual</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-700">
              <span className="rounded-full border border-gray-300 bg-white px-2.5 py-1">Tamanho: {selectedSize || 'Não selecionado'}</span>
              <span className="rounded-full border border-gray-300 bg-white px-2.5 py-1">
                Cor/Lavagem: {selectedColor || 'Não selecionada'}
              </span>
              {fitOptions.length > 0 && (
                <span className="rounded-full border border-gray-300 bg-white px-2.5 py-1">
                  Modelagem: {selectedFit || 'Não selecionada'}
                </span>
              )}
            </div>
          </div>

          <div className="mb-7 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-700">Cuidados com a peça</h2>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-gray-600">
              {narrative.careInstructions.map((careInstruction) => (
                <li key={careInstruction} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>{careInstruction}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800">
              <ShieldCheck className="h-4 w-4" />
              Valor percebido premium
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/80">{narrative.qualityNote}</p>
          </div>

          <div className="mt-7 border-t border-gray-100 pt-7">
            {inCartQuantity > 0 && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                <p className="font-semibold">Você já selecionou {inCartQuantity} unidade(s) desta peça.</p>
                <button
                  type="button"
                  onClick={openCart}
                  className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] underline underline-offset-2"
                >
                  Revisar sacola
                </button>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-600">Quantidade</span>
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setQuantity((previous) => Math.max(1, previous - 1))}
                  className="premium-interactive flex h-9 w-9 items-center justify-center rounded-l-full text-gray-600 hover:bg-gray-100"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-10 px-2 text-center text-sm font-semibold text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((previous) => Math.min(99, previous + 1))}
                  className="premium-interactive flex h-9 w-9 items-center justify-center rounded-r-full text-gray-600 hover:bg-gray-100"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="premium-focus premium-interactive inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent bg-[var(--theme-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_-18px_rgba(var(--theme-primary-rgb),0.72)] hover:bg-[var(--theme-primary-strong)] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <ShoppingBag className="h-5 w-5" />
              {isOutOfStock
                ? 'Produto indisponível'
                : !isSelectionValid
                  ? 'Escolha as variações para adicionar'
                  : inCartQuantity > 0
                    ? 'Adicionar mais unidades'
                    : 'Adicionar a sacola'}
            </button>

            {cartFeedback && (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                  cartFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : cartFeedback.type === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-blue-200 bg-blue-50 text-blue-800'
                }`}
              >
                <p>{cartFeedback.message}</p>
                {cartFeedback.type !== 'warning' && (
                  <button
                    type="button"
                    onClick={openCart}
                    className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] underline underline-offset-2"
                  >
                    Revisar sacola
                  </button>
                )}
              </div>
            )}

            <a
              href={productWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${whatsappPrimaryButtonClass} mt-4 w-full`}
              aria-label={`Receber atendimento para ${product.name} no WhatsApp`}
            >
              <WhatsAppLogo className="h-5 w-5" />
              Falar com especialista no WhatsApp
            </a>

            <p className="mt-4 text-center text-xs text-gray-500">
              Monte a sacola para pedido assistido e envie quando quiser para o time comercial.
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="badge-chip border-green-100 bg-green-50 text-green-700">Consultoria de tamanho</span>
              <span className="badge-chip border-green-100 bg-green-50 text-green-700">Suporte imediato</span>
            </div>
          </div>
        </motion.section>
      </section>

      {relatedProducts.length > 0 && (
        <section className="premium-reveal border-t border-gray-200 pt-14" aria-labelledby="related-products-title">
          <div className="surface-card-strong p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="section-eyebrow mb-2">Curadoria complementar</p>
                <h2 id="related-products-title" className="section-title text-3xl">
                  Você também pode gostar
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Peças da mesma família de estilo para elevar conversão e montar looks completos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        </section>
      )}
    </Container>
  );
};

