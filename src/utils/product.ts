import { Product, StockStatus } from '../types';
import { buildPlaceholderImage } from '../data/placeholders';
import { isPersistedImageSource } from './imageSources';

export interface ProductImageInput {
  featuredImage?: string;
  images?: string[];
  imageUrl?: string;
  category?: string;
  gender?: string;
  name?: string;
  seed?: string | number;
  placeholderStyle?: 'editorial' | 'lookbook' | 'institutional' | 'neutral';
}

const cleanString = (value: string | undefined) => value?.trim() || '';

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const resolveProductImages = (input: ProductImageInput) => {
  const explicitImages = Array.isArray(input.images)
    ? input.images.map((item) => item.trim()).filter((item) => isPersistedImageSource(item))
    : [];

  const fallbackImage = buildPlaceholderImage({
    category: input.category,
    gender: input.gender,
    style: input.placeholderStyle || 'editorial',
    seed: input.seed || input.name || 'catalog-product',
    label: input.name || 'Denim Collection'
  });

  const featuredCandidate =
    [cleanString(input.featuredImage), cleanString(input.imageUrl), explicitImages[0]].find((value) =>
      isPersistedImageSource(value)
    ) || fallbackImage;
  const images = Array.from(new Set([featuredCandidate, ...explicitImages]));

  return {
    featuredImage: featuredCandidate,
    images
  };
};

export const getProductBadge = (product: Pick<Product, 'label' | 'isNew' | 'isFeatured' | 'collection' | 'season'>) => {
  if (product.label?.trim()) {
    return product.label.trim();
  }

  if (product.isNew) {
    return 'Novo drop';
  }

  if (product.isFeatured) {
    return 'Destaque';
  }

  if (product.season?.trim()) {
    return product.season.trim();
  }

  if (product.collection?.trim()) {
    return product.collection.trim();
  }

  return null;
};

export const getStockStatusMeta = (
  status: StockStatus = 'in_stock'
): { label: string; toneClassName: string; shortLabel: string } => {
  if (status === 'low_stock') {
    return {
      label: 'Estoque reduzido',
      shortLabel: 'Poucas unidades',
      toneClassName: 'border-amber-200 bg-amber-50 text-amber-700'
    };
  }

  if (status === 'out_of_stock') {
    return {
      label: 'Indisponível no momento',
      shortLabel: 'Indisponível',
      toneClassName: 'border-red-200 bg-red-50 text-red-700'
    };
  }

  return {
    label: 'Disponível para atendimento',
    shortLabel: 'Disponível',
    toneClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  };
};

export const sortProductsByNewest = (products: Product[]) =>
  [...products].sort((a, b) => {
    const timeA = Date.parse(a.createdAt);
    const timeB = Date.parse(b.createdAt);

    if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) {
      return timeB - timeA;
    }

    return b.id.localeCompare(a.id);
  });
