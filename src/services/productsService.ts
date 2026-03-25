import { Product, ProductCreateInput, ProductUpdateInput, StockStatus } from '../types';
import { mockProducts } from '../data';
import { StorageService } from './storageService';
import { resolveProductImages, slugify } from '../utils/product';
import { ImageStorageService } from './imageStorageService';
import { isLocalImageRefSource, isPersistedImageSource } from '../utils/imageSources';

const STORAGE_KEY = 'catalog_products';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type StoredProductRecord = Partial<Product> & {
  id?: string | number;
  imageUrl?: string;
  imageIds?: string[];
  featuredImageId?: string;
};

const MOJIBAKE_PATTERN = /\u00C3.|\u00C2.|\uFFFD/;

const decodeLatin1AsUtf8 = (value: string) => {
  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return value;
  }
};

const fixPotentialMojibake = (value: string) => {
  let nextValue = value;

  for (let i = 0; i < 4; i += 1) {
    if (!MOJIBAKE_PATTERN.test(nextValue)) {
      break;
    }

    const decoded = decodeLatin1AsUtf8(nextValue);
    if (!decoded || decoded === nextValue) {
      break;
    }

    nextValue = decoded;
  }

  return nextValue;
};

const normalizeCatalogText = (value: string) =>
  value
    .replace(/\bCalcas\b/gi, 'Calças')
    .replace(/\bMacacoes\b/gi, 'Macacões')
    .replace(/\bCatalogo\b/gi, 'Catálogo')
    .replace(/\bColecao\b/gi, 'Coleção')
    .replace(/\bUnisex\b/gi, 'Unissex')
    .replace(/\bComposicao\b/gi, 'Composição');

const sanitizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  return normalizeCatalogText(fixPotentialMojibake(value).trim());
};

const sanitizeId = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
};

const sanitizeStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeText(item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const cleaned = sanitizeText(value);
    if (!cleaned) {
      return [];
    }

    return cleaned
      .split(/[|,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const sanitizeImageIds = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

const dedupe = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const toBoolean = (value: unknown) => value === true;

const parseTimestamp = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const getCreatedAtFromId = (id: string) => {
  const parsed = Number(id);
  if (Number.isFinite(parsed) && parsed > 1_000_000_000_000) {
    return new Date(parsed).toISOString();
  }

  return null;
};

const generateProductId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const normalizeStockStatus = (value: unknown): StockStatus => {
  const input = sanitizeText(value).toLowerCase();

  if (!input) {
    return 'in_stock';
  }

  if (
    input === 'low_stock' ||
    input === 'baixo' ||
    input === 'baixo_estoque' ||
    input.includes('reduz') ||
    input.includes('pouca')
  ) {
    return 'low_stock';
  }

  if (
    input === 'out_of_stock' ||
    input === 'esgotado' ||
    input.includes('indispon') ||
    input.includes('sem estoque')
  ) {
    return 'out_of_stock';
  }

  return 'in_stock';
};

const buildSlugBase = (record: StoredProductRecord, id: string, name: string) => {
  const explicitSlug = sanitizeText(record.slug);
  const slugFromInput = slugify(explicitSlug);
  if (slugFromInput) {
    return slugFromInput;
  }

  const slugFromName = slugify(name);
  if (slugFromName) {
    return `${slugFromName}-${id}`;
  }

  return `produto-${id}`;
};

const buildUniqueSlug = (baseSlug: string, usedSlugs: Set<string>) => {
  let nextSlug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(nextSlug)) {
    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(nextSlug);
  return nextSlug;
};

const getImageIdFromSource = async (source: string) => {
  const normalizedSource = source.trim();
  if (!normalizedSource) {
    return '';
  }

  if (isLocalImageRefSource(normalizedSource)) {
    return ImageStorageService.parseImageId(normalizedSource);
  }

  if (!isPersistedImageSource(normalizedSource)) {
    return '';
  }

  return ImageStorageService.saveExternalImage(normalizedSource);
};

const resolveImageIds = async (record: StoredProductRecord, imageSources: string[]) => {
  const explicitImageIds = sanitizeImageIds(record.imageIds);
  if (explicitImageIds.length > 0) {
    return dedupe(explicitImageIds);
  }

  const resolvedImageIds: string[] = [];
  for (const imageSource of imageSources) {
    const imageId = await getImageIdFromSource(imageSource);
    if (imageId) {
      resolvedImageIds.push(imageId);
    }
  }

  return dedupe(resolvedImageIds);
};

const resolveFeaturedImageId = async (
  record: StoredProductRecord,
  legacyFeaturedSource: string,
  imageIds: string[]
) => {
  const explicitFeaturedId = sanitizeText(record.featuredImageId);
  if (explicitFeaturedId) {
    return explicitFeaturedId;
  }

  const legacyFeaturedId = await getImageIdFromSource(legacyFeaturedSource);
  if (legacyFeaturedId) {
    return legacyFeaturedId;
  }

  return imageIds[0] || '';
};

const toImageSourceFromId = (imageId: string) => ImageStorageService.buildLocalRef(imageId);

const normalizeProductRecord = async (
  record: StoredProductRecord,
  index: number,
  usedSlugs: Set<string>
): Promise<Product> => {
  const id = sanitizeId(record.id) || generateProductId();
  const name = sanitizeText(record.name) || 'Produto sem nome';
  const description = sanitizeText(record.description);
  const price = Number(record.price);
  const category = sanitizeText(record.category) || 'Todos';
  const gender = sanitizeText(record.gender) || 'Todos';
  const sku = sanitizeText(record.sku);
  const sizes = sanitizeStringArray(record.sizes);
  const colors = sanitizeStringArray(record.colors);
  const collection = sanitizeText(record.collection);
  const season = sanitizeText(record.season);
  const fit = sanitizeText(record.fit);
  const material = sanitizeText(record.material);
  const composition = sanitizeText(record.composition);
  const highlights = sanitizeStringArray(record.highlights);
  const careInstructions = sanitizeStringArray(record.careInstructions);
  const stockStatus = normalizeStockStatus(record.stockStatus);
  const label = sanitizeText(record.label);

  const legacyImageData = resolveProductImages({
    featuredImage: sanitizeText(record.featuredImage),
    imageUrl: sanitizeText(record.imageUrl),
    images: sanitizeStringArray(record.images),
    category,
    gender,
    name,
    seed: id,
    placeholderStyle: 'editorial'
  });

  const imageIds = await resolveImageIds(record, legacyImageData.images);
  const featuredImageId = await resolveFeaturedImageId(record, legacyImageData.featuredImage, imageIds);

  const normalizedImageIds = dedupe([featuredImageId, ...imageIds]);
  const imageSources = normalizedImageIds.map(toImageSourceFromId);
  const featuredImageSource = featuredImageId
    ? toImageSourceFromId(featuredImageId)
    : imageSources[0] || legacyImageData.featuredImage;

  const fallbackCreatedAt = getCreatedAtFromId(id) || new Date(Date.now() - index * 60_000).toISOString();
  const createdAtTimestamp = parseTimestamp(record.createdAt);
  const createdAt = createdAtTimestamp !== null ? new Date(createdAtTimestamp).toISOString() : fallbackCreatedAt;

  return {
    id,
    slug: buildUniqueSlug(buildSlugBase(record, id, name), usedSlugs),
    name,
    description,
    price: Number.isFinite(price) ? price : 0,
    category,
    gender,
    featuredImage: featuredImageSource,
    images: imageSources.length > 0 ? imageSources : [featuredImageSource],
    featuredImageId: featuredImageId || undefined,
    imageIds: normalizedImageIds.length > 0 ? normalizedImageIds : undefined,
    sku,
    sizes,
    colors: colors.length > 0 ? colors : undefined,
    collection: collection || undefined,
    season: season || undefined,
    fit: fit || undefined,
    material: material || undefined,
    composition: composition || undefined,
    highlights: highlights.length > 0 ? highlights : undefined,
    careInstructions: careInstructions.length > 0 ? careInstructions : undefined,
    stockStatus,
    createdAt,
    isFeatured: toBoolean(record.isFeatured),
    isNew: toBoolean(record.isNew),
    label: label || undefined
  };
};

const cloneProduct = (product: Product): Product => ({
  ...product,
  images: [...product.images],
  imageIds: product.imageIds ? [...product.imageIds] : undefined,
  sizes: [...product.sizes],
  colors: product.colors ? [...product.colors] : undefined,
  highlights: product.highlights ? [...product.highlights] : undefined,
  careInstructions: product.careInstructions ? [...product.careInstructions] : undefined
});

const cloneProducts = (products: Product[]) => products.map(cloneProduct);

const normalizeProducts = async (records: StoredProductRecord[]) => {
  const usedSlugs = new Set<string>();
  const normalizedProducts: Product[] = [];

  for (let index = 0; index < records.length; index += 1) {
    const normalized = await normalizeProductRecord(records[index], index, usedSlugs);
    normalizedProducts.push(normalized);
  }

  return normalizedProducts;
};

const normalizeImageIdsFromProduct = (product: Product) => {
  if (product.imageIds && product.imageIds.length > 0) {
    return dedupe(product.imageIds.map((id) => id.trim()).filter(Boolean));
  }

  return dedupe(
    [product.featuredImage, ...product.images]
      .map((source) => (isLocalImageRefSource(source) ? ImageStorageService.parseImageId(source) : ''))
      .filter(Boolean)
  );
};

const serializeProductForStorage = (product: Product): StoredProductRecord => {
  const normalizedImageIds = normalizeImageIdsFromProduct(product);
  const featuredImageId =
    sanitizeText(product.featuredImageId) ||
    (isLocalImageRefSource(product.featuredImage) ? ImageStorageService.parseImageId(product.featuredImage) : '') ||
    normalizedImageIds[0] ||
    '';

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    gender: product.gender,
    sku: product.sku,
    sizes: [...product.sizes],
    colors: product.colors ? [...product.colors] : undefined,
    collection: product.collection,
    season: product.season,
    fit: product.fit,
    material: product.material,
    composition: product.composition,
    highlights: product.highlights ? [...product.highlights] : undefined,
    careInstructions: product.careInstructions ? [...product.careInstructions] : undefined,
    stockStatus: product.stockStatus,
    createdAt: product.createdAt,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    label: product.label,
    featuredImageId: featuredImageId || undefined,
    imageIds: normalizedImageIds
  };
};

const serializeProductsForStorage = (products: Product[]) => products.map(serializeProductForStorage);

const getImageIdsFromProduct = (product: Product) => normalizeImageIdsFromProduct(product);

const findUnusedImageIds = (products: Product[], candidateIds: string[]) => {
  if (candidateIds.length === 0) {
    return [];
  }

  const usedImageIds = new Set(products.flatMap((product) => getImageIdsFromProduct(product)));
  return candidateIds.filter((id) => !usedImageIds.has(id));
};

const cleanupUnusedImages = async (imageIds: string[]) => {
  if (imageIds.length === 0) {
    return;
  }

  await Promise.all(imageIds.map((imageId) => ImageStorageService.deleteImage(imageId).catch(() => undefined)));
};

const getNormalizedProductsFromStorage = async () => {
  const saved = StorageService.get<StoredProductRecord[] | null>(STORAGE_KEY, null);

  if (Array.isArray(saved)) {
    const normalized = await normalizeProducts(saved);
    StorageService.set(STORAGE_KEY, serializeProductsForStorage(normalized));
    return normalized;
  }

  const normalizedMocks = await normalizeProducts(mockProducts);
  StorageService.set(STORAGE_KEY, serializeProductsForStorage(normalizedMocks));
  return normalizedMocks;
};

export const ProductsService = {
  getProducts: async (): Promise<Product[]> => {
    await delay(500);
    return cloneProducts(await getNormalizedProductsFromStorage());
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    await delay(300);
    const products = await getNormalizedProductsFromStorage();
    const found = products.find((product) => product.id === id);
    return found ? cloneProduct(found) : undefined;
  },

  createProduct: async (product: ProductCreateInput): Promise<Product> => {
    await delay(500);
    const products = await getNormalizedProductsFromStorage();
    const usedSlugs = new Set(products.map((item) => item.slug));

    const newProduct = await normalizeProductRecord(
      {
        ...product,
        id: generateProductId(),
        createdAt: product.createdAt || new Date().toISOString()
      },
      0,
      usedSlugs
    );

    const updatedProducts = [newProduct, ...products];
    StorageService.set(STORAGE_KEY, serializeProductsForStorage(updatedProducts));
    return cloneProduct(newProduct);
  },

  createProductsBulk: async (items: ProductCreateInput[]): Promise<Product[]> => {
    await delay(700);

    if (items.length === 0) {
      return [];
    }

    const products = await getNormalizedProductsFromStorage();
    const usedSlugs = new Set(products.map((item) => item.slug));
    const now = Date.now();

    const importedProducts: Product[] = [];
    for (let index = 0; index < items.length; index += 1) {
      const normalized = await normalizeProductRecord(
        {
          ...items[index],
          id: generateProductId(),
          createdAt: items[index].createdAt || new Date(now + index * 1000).toISOString()
        },
        index,
        usedSlugs
      );
      importedProducts.push(normalized);
    }

    const updatedProducts = [...importedProducts, ...products];
    StorageService.set(STORAGE_KEY, serializeProductsForStorage(updatedProducts));

    return cloneProducts(importedProducts);
  },

  updateProduct: async (id: string, product: ProductUpdateInput): Promise<Product> => {
    await delay(500);
    const products = await getNormalizedProductsFromStorage();
    const index = products.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error('Product not found');
    }

    const existingProduct = products[index];
    const usedSlugs = new Set(products.filter((item) => item.id !== id).map((item) => item.slug));

    const updatedProduct = await normalizeProductRecord(
      {
        ...existingProduct,
        ...product,
        id,
        createdAt: product.createdAt || existingProduct.createdAt
      },
      index,
      usedSlugs
    );

    products[index] = updatedProduct;
    StorageService.set(STORAGE_KEY, serializeProductsForStorage(products));
    await cleanupUnusedImages(findUnusedImageIds(products, getImageIdsFromProduct(existingProduct)));
    return cloneProduct(updatedProduct);
  },

  deleteProduct: async (id: string): Promise<void> => {
    await delay(500);
    const products = await getNormalizedProductsFromStorage();
    const productToDelete = products.find((product) => product.id === id);
    const updatedProducts = products.filter((product) => product.id !== id);
    StorageService.set(STORAGE_KEY, serializeProductsForStorage(updatedProducts));

    if (productToDelete) {
      await cleanupUnusedImages(findUnusedImageIds(updatedProducts, getImageIdsFromProduct(productToDelete)));
    }
  }
};

