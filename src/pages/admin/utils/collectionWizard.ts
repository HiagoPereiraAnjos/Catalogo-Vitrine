import { MAX_PRODUCT_IMAGES_PER_PRODUCT } from '../../../utils/imageSources';
import { slugify } from '../../../utils/product';

export const MAX_COLLECTION_WIZARD_IMAGES = 120;

export interface CollectionWizardImageDraft {
  id: string;
  file: File;
  objectUrl: string;
  fileKey: string;
  fileName: string;
  sizeBytes: number;
}

export interface CollectionWizardImageGroup {
  groupKey: string;
  displayName: string;
  skuSeed: string;
  imageIds: string[];
  droppedImageCount: number;
}

export interface CollectionWizardDraftProduct {
  id: string;
  groupKey: string;
  name: string;
  sku: string;
  description: string;
  priceInput: string;
  category: string;
  gender: string;
  sizesInput: string;
  collection: string;
  season: string;
  isFeatured: boolean;
  isNew: boolean;
  label: string;
  imageIds: string[];
  droppedImageCount: number;
}

const createDraftId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `wizard-image-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const trimFileExtension = (value: string) => value.replace(/\.[^/.]+$/, '').trim();

const normalizeToken = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const KNOWN_VARIANT_SUFFIXES = new Set([
  'frente',
  'frontal',
  'front',
  'costas',
  'back',
  'verso',
  'lado',
  'lateral',
  'detalhe',
  'detail',
  'zoom',
  'look',
  'lookbook'
]);

const NUMERIC_VARIANT_PATTERN = /^(?:img|imagem|foto)?\d{1,3}$/i;
const VERSION_VARIANT_PATTERN = /^v\d{1,2}$/i;

const isLikelyVariantSuffix = (lastSegment: string, previousSegment: string, segmentCount: number) => {
  const normalizedLast = lastSegment.toLocaleLowerCase('pt-BR');
  const normalizedPrevious = previousSegment.toLocaleLowerCase('pt-BR');

  if (KNOWN_VARIANT_SUFFIXES.has(normalizedLast)) {
    return true;
  }

  if (VERSION_VARIANT_PATTERN.test(normalizedLast)) {
    return true;
  }

  if (NUMERIC_VARIANT_PATTERN.test(normalizedLast)) {
    // Ex: JEANS-001-1 / JEANS-001-2 -> remove o ultimo trecho
    if (segmentCount >= 3) {
      return true;
    }

    // Ex: JEANS-IMG1
    return normalizedLast.startsWith('img') || normalizedLast.startsWith('imagem') || normalizedLast.startsWith('foto');
  }

  // Ex: JEANS-001-A / JEANS-001-B
  if (/^[a-z]{1,2}$/i.test(normalizedLast) && /\d/.test(normalizedPrevious)) {
    return true;
  }

  return false;
};

const extractGroupingPrefix = (fileName: string) => {
  const withoutExt = trimFileExtension(fileName).replace(/\s*\(\d+\)\s*$/, '');
  const normalized = normalizeToken(withoutExt);

  if (!normalized) {
    return 'produto';
  }

  const segments = normalized.split('-').map((segment) => segment.trim()).filter(Boolean);
  if (segments.length < 2) {
    return normalized;
  }

  const lastSegment = segments[segments.length - 1];
  const previousSegment = segments[segments.length - 2] || '';

  if (!isLikelyVariantSuffix(lastSegment, previousSegment, segments.length)) {
    return normalized;
  }

  const prefix = normalizeToken(segments.slice(0, -1).join('-'));
  return prefix || normalized;
};

const normalizeGroupKey = (fileName: string) => {
  const prefix = extractGroupingPrefix(fileName);
  const normalized = normalizeToken(prefix || 'produto');
  return normalized.toLocaleLowerCase('pt-BR');
};

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const buildDisplayName = (groupKey: string) => {
  const text = groupKey.replace(/[-_]+/g, ' ').trim();
  return toTitleCase(text || 'Produto');
};

const buildSkuSeed = (groupKey: string) => {
  const value = groupKey.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return value || 'PRODUTO';
};

const naturalSortByName = (left: CollectionWizardImageDraft, right: CollectionWizardImageDraft) =>
  left.fileName.localeCompare(right.fileName, 'pt-BR', { sensitivity: 'base', numeric: true });

export const buildCollectionImageDraft = (file: File): CollectionWizardImageDraft => ({
  id: createDraftId(),
  file,
  objectUrl: URL.createObjectURL(file),
  fileKey: `${file.name}-${file.size}-${file.lastModified}`,
  fileName: file.name,
  sizeBytes: file.size
});

export const revokeCollectionImageDraft = (draft: CollectionWizardImageDraft) => {
  URL.revokeObjectURL(draft.objectUrl);
};

export const revokeCollectionImageDrafts = (drafts: CollectionWizardImageDraft[]) => {
  drafts.forEach((draft) => revokeCollectionImageDraft(draft));
};

export const groupCollectionImageDrafts = (images: CollectionWizardImageDraft[]): CollectionWizardImageGroup[] => {
  const groupedMap = new Map<
    string,
    {
      groupKey: string;
      displayName: string;
      skuSeed: string;
      items: CollectionWizardImageDraft[];
      firstIndex: number;
    }
  >();

  images.forEach((image, index) => {
    const groupKey = normalizeGroupKey(image.fileName);
    const existing = groupedMap.get(groupKey);

    if (existing) {
      existing.items.push(image);
      return;
    }

    groupedMap.set(groupKey, {
      groupKey,
      displayName: buildDisplayName(groupKey),
      skuSeed: buildSkuSeed(groupKey),
      items: [image],
      firstIndex: index
    });
  });

  return Array.from(groupedMap.values())
    .sort((left, right) => left.firstIndex - right.firstIndex)
    .map((group) => {
      const orderedItems = [...group.items].sort(naturalSortByName);
      const droppedImageCount = Math.max(0, orderedItems.length - MAX_PRODUCT_IMAGES_PER_PRODUCT);
      const limitedItems = orderedItems.slice(0, MAX_PRODUCT_IMAGES_PER_PRODUCT);

      return {
        groupKey: group.groupKey,
        displayName: group.displayName,
        skuSeed: group.skuSeed,
        imageIds: limitedItems.map((item) => item.id),
        droppedImageCount
      };
    });
};

export const normalizeSkuKey = (value: string) => value.trim().toLocaleLowerCase('pt-BR');

export const ensureUniqueSku = (baseSku: string, usedSkuKeys: Set<string>) => {
  const seed = baseSku.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]+/g, '');
  const fallback = seed || 'SKU-PRODUTO';
  let nextSku = fallback;
  let suffix = 1;

  while (usedSkuKeys.has(normalizeSkuKey(nextSku))) {
    nextSku = `${fallback}-${suffix}`;
    suffix += 1;
  }

  usedSkuKeys.add(normalizeSkuKey(nextSku));
  return nextSku;
};

export const parseCommaList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const parsePriceInput = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  const normalized = cleaned
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=.*\.)/g, '')
    .replace(',', '.');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const buildDefaultDescription = (name: string, collection: string, season: string) => {
  const suffix = [collection.trim(), season.trim()].filter(Boolean).join(' - ');
  if (suffix) {
    return `${name} da coleção ${suffix}.`;
  }

  return `${name} com acabamento premium e curadoria da marca.`;
};

export const toDraftProductId = (groupKey: string) => `draft-${groupKey}`;

export const toProductSlug = (name: string) => slugify(name.trim());
