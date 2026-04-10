import { categories as baseCategories } from '../../../data';
import {
  MAX_PRODUCT_IMAGES_PER_PRODUCT,
  isPersistedImageSource,
  splitImageInput
} from '../../../utils/imageSources';
import { FormErrors, ProductFormState } from '../types';

interface BuildFormErrorsOptions {
  hasFeaturedUploadDraft?: boolean;
  persistedGalleryRefs?: string[];
  galleryUploadDraftCount?: number;
}

export const getInitialFormData = (
  defaultCategory: string = baseCategories[1] || 'Calças',
  defaultGender: string = 'Masculino'
): ProductFormState => ({
  name: '',
  description: '',
  price: '',
  category: defaultCategory,
  gender: defaultGender,
  featuredImage: '',
  images: '',
  sku: '',
  sizes: '',
  colors: '',
  collection: '',
  season: '',
  fit: '',
  material: '',
  composition: '',
  highlights: '',
  careInstructions: '',
  stockStatus: 'in_stock',
  slug: '',
  isFeatured: false,
  isNew: false,
  label: ''
});

export const splitByComma = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const splitByLineOrComma = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeSkuSeed = (value: string) =>
  value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const generateAutoSku = (name: string) => {
  const base = normalizeSkuSeed(name).slice(0, 14) || 'PRODUTO';
  const suffix = Date.now().toString().slice(-6);
  return `SKU-${base}-${suffix}`;
};

export const buildAutoDescription = (name: string, category: string, collection?: string) => {
  const cleanName = name.trim() || 'Produto';
  const cleanCategory = category.trim() || 'catálogo';
  const cleanCollection = collection?.trim();

  if (cleanCollection) {
    return `${cleanName} da coleção ${cleanCollection}, com acabamento premium e caimento confortável.`;
  }

  return `${cleanName} em ${cleanCategory.toLowerCase()}, com qualidade premium para o dia a dia.`;
};

export const isRecentProduct = (createdAt: string) => {
  const createdAtTime = Date.parse(createdAt);
  if (!Number.isFinite(createdAtTime)) {
    return false;
  }

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - createdAtTime <= THIRTY_DAYS;
};

export const buildFormErrors = (
  formData: ProductFormState,
  options: BuildFormErrorsOptions = {}
): FormErrors => {
  const errors: FormErrors = {};
  const parsedPrice = Number(formData.price);
  const galleryImages = splitImageInput(formData.images);
  const featuredImage = formData.featuredImage.trim();
  const persistedGalleryRefs = options.persistedGalleryRefs || [];
  const hasFeaturedUploadDraft = options.hasFeaturedUploadDraft || false;
  const galleryUploadDraftCount = options.galleryUploadDraftCount || 0;

  if (!formData.name.trim() || formData.name.trim().length < 3) {
    errors.name = 'Informe um nome com ao menos 3 caracteres.';
  }

  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    errors.price = 'Informe um preço válido maior que zero.';
  }

  if (!hasFeaturedUploadDraft && featuredImage && !isPersistedImageSource(featuredImage)) {
    errors.featuredImage = 'Use uma URL válida para a imagem de destaque.';
  }

  const invalidGalleryUrl = [...galleryImages, ...persistedGalleryRefs].find((url) => !isPersistedImageSource(url));
  if (invalidGalleryUrl) {
    errors.images = 'A galeria possui uma URL inválida.';
  }

  const imagesSet = new Set<string>();
  if (hasFeaturedUploadDraft) {
    imagesSet.add('__featured_upload_draft__');
  } else if (featuredImage) {
    imagesSet.add(featuredImage);
  }

  galleryImages.forEach((image) => imagesSet.add(image));
  persistedGalleryRefs.forEach((image) => imagesSet.add(image));

  const totalImagesCount = imagesSet.size + galleryUploadDraftCount;
  if (totalImagesCount > MAX_PRODUCT_IMAGES_PER_PRODUCT) {
    errors.images = `Use no máximo ${MAX_PRODUCT_IMAGES_PER_PRODUCT} imagens por produto.`;
  }

  if (formData.collection.trim().length > 48) {
    errors.collection = 'Use até 48 caracteres para coleção.';
  }

  if (formData.season.trim().length > 48) {
    errors.season = 'Use até 48 caracteres para temporada.';
  }

  if (formData.fit.trim().length > 48) {
    errors.fit = 'Use até 48 caracteres para fit/modelagem.';
  }

  if (formData.material.trim().length > 64) {
    errors.material = 'Use até 64 caracteres para material.';
  }

  if (formData.composition.trim().length > 80) {
    errors.composition = 'Use até 80 caracteres para composição.';
  }

  if (splitByLineOrComma(formData.highlights).some((item) => item.length < 3)) {
    errors.highlights = 'Cada highlight deve ter ao menos 3 caracteres.';
  }

  if (splitByLineOrComma(formData.careInstructions).some((item) => item.length < 3)) {
    errors.careInstructions = 'Cada cuidado deve ter ao menos 3 caracteres.';
  }

  if (formData.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())) {
    errors.slug = 'Use apenas letras minúsculas, números e hifens.';
  }

  if (formData.label.trim().length > 24) {
    errors.label = 'A label deve ter no máximo 24 caracteres.';
  }

  if (!['in_stock', 'low_stock', 'out_of_stock'].includes(formData.stockStatus)) {
    errors.stockStatus = 'Selecione um status de estoque válido.';
  }

  return errors;
};

export const getFieldClassName = (hasError: boolean) =>
  `field-control ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
  }`;

export const normalizeCollectionKey = (value: string) => value.trim().toLocaleLowerCase('pt-BR');
export const normalizeSkuKey = (value: string) => value.trim().toLocaleLowerCase('pt-BR');

export const buildDuplicateSku = (baseSku: string, index: number, usedSkuKeys: Set<string>) => {
  const seed = baseSku.trim() || `SKU-COL-${index + 1}`;
  const normalizedSeed = seed.replace(/\s+/g, '-').toUpperCase();

  let nextSku = normalizedSeed;
  let suffix = 1;

  while (usedSkuKeys.has(normalizeSkuKey(nextSku))) {
    nextSku = `${normalizedSeed}-C${suffix}`;
    suffix += 1;
  }

  usedSkuKeys.add(normalizeSkuKey(nextSku));
  return nextSku;
};
