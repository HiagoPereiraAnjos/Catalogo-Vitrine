import { ProductCreateInput } from '../../../types';
import { buildPlaceholderImage } from '../../../data/placeholders';
import { slugify } from '../../../utils/product';
import { isPersistedImageSource } from '../../../utils/imageSources';

export type BulkImportFormat = 'json' | 'csv';

export interface ImportRawItem {
  rowNumber: number;
  data: Record<string, unknown>;
}

export interface BulkImportSource {
  format: BulkImportFormat;
  fileName: string;
  items: ImportRawItem[];
}

export interface BulkImportPreviewRow {
  rowNumber: number;
  name: string;
  sku: string;
  category: string;
  gender: string;
  collection?: string;
  season?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  price: number | null;
  imagesCount: number;
  errors: string[];
  product?: ProductCreateInput;
}

export interface BulkImportPreviewData {
  format: BulkImportFormat;
  totalCount: number;
  validCount: number;
  invalidCount: number;
  rows: BulkImportPreviewRow[];
  validRows: BulkImportPreviewRow[];
  invalidRows: BulkImportPreviewRow[];
  validProducts: ProductCreateInput[];
}

interface BuildBulkImportPreviewOptions {
  collectionOverride?: string;
  existingSkus?: string[];
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_LABEL_LENGTH = 24;

const normalizeFieldKey = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const FIELD_ALIASES = {
  name: ['name', 'nome'],
  sku: ['sku', 'codigo', 'codigoproduto', 'cod'],
  slug: ['slug'],
  description: ['description', 'descricao', 'desc'],
  price: ['price', 'preco', 'valor'],
  featuredImage: ['featuredimage', 'imagemdestaque', 'imageurl', 'image', 'imagemprincipal'],
  images: ['images', 'imagens', 'galeria', 'gallery'],
  category: ['category', 'categoria'],
  gender: ['gender', 'genero', 'sexo'],
  sizes: ['sizes', 'tamanhos', 'size', 'tamanho'],
  colors: ['colors', 'cores', 'lavagens', 'cor', 'corlavagem'],
  collection: ['collection', 'colecao'],
  season: ['season', 'temporada', 'launchseason'],
  fit: ['fit', 'modelagem'],
  material: ['material', 'tecido'],
  composition: ['composition', 'composicao'],
  highlights: ['highlights', 'destaques'],
  careInstructions: ['careinstructions', 'cuidados'],
  stockStatus: ['stockstatus', 'statusestoque'],
  createdAt: ['createdat', 'datacriacao'],
  isFeatured: ['isfeatured', 'destaque'],
  isNew: ['isnew', 'novo'],
  label: ['label', 'badge', 'selo']
} as const;

type FieldAliasKey = keyof typeof FIELD_ALIASES;

const parseCsvRows = (content: string) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (insideQuotes) {
      if (char === '"') {
        if (content[index + 1] === '"') {
          currentValue += '"';
          index += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        currentValue += char;
      }

      continue;
    }

    if (char === '"') {
      insideQuotes = true;
      continue;
    }

    if (char === ',') {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if (char === '\n') {
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    currentValue += char;
  }

  if (insideQuotes) {
    throw new Error('CSV inválido: aspas não foram fechadas.');
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
};

const readJsonItems = (content: string) => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('JSON inválido. Verifique a sintaxe do arquivo.');
  }

  const items = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { products?: unknown[] }).products)
      ? (parsed as { products: unknown[] }).products
      : null;

  if (!items) {
    throw new Error('JSON deve ser um array de produtos ou um objeto com a chave "products".');
  }

  return items.map((entry, index) => ({
    rowNumber: index + 1,
    data: entry && typeof entry === 'object' && !Array.isArray(entry) ? (entry as Record<string, unknown>) : {}
  }));
};

const readCsvItems = (content: string) => {
  const rows = parseCsvRows(content.trim());

  if (rows.length < 2) {
    throw new Error('CSV inválido. Informe cabeçalho e ao menos uma linha de produto.');
  }

  const headers = rows[0]
    .map((header) => header.replace(/^\uFEFF/, '').trim())
    .filter(Boolean);

  if (headers.length === 0) {
    throw new Error('CSV inválido. O cabeçalho está vazio.');
  }

  const dataRows = rows.slice(1);

  const items: ImportRawItem[] = dataRows
    .map((cells, rowIndex) => {
      const hasValue = cells.some((cell) => cell.trim().length > 0);
      if (!hasValue) {
        return null;
      }

      const rowData: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        rowData[header] = cells[index] ?? '';
      });

      return {
        rowNumber: rowIndex + 2,
        data: rowData
      };
    })
    .filter((entry): entry is ImportRawItem => entry !== null);

  if (items.length === 0) {
    throw new Error('CSV sem dados válidos para importação.');
  }

  return items;
};

export const parseBulkImportFile = async (file: File): Promise<BulkImportSource> => {
  const content = await file.text();
  const fileName = file.name;
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error('O arquivo está vazio.');
  }

  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'json') {
    return {
      format: 'json',
      fileName,
      items: readJsonItems(trimmed)
    };
  }

  if (extension === 'csv') {
    return {
      format: 'csv',
      fileName,
      items: readCsvItems(trimmed)
    };
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return {
      format: 'json',
      fileName,
      items: readJsonItems(trimmed)
    };
  }

  return {
    format: 'csv',
    fileName,
    items: readCsvItems(trimmed)
  };
};

const isValidUrl = (value: string) => {
  if (!value) {
    return false;
  }

  return isPersistedImageSource(value);
};

const normalizeText = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
};

const normalizeArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizeText(item)).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  const separatorPattern = /[|\n;]/;
  const values = separatorPattern.test(trimmed) ? trimmed.split(/[|\n;]/) : trimmed.split(',');

  return values.map((item) => item.trim()).filter(Boolean);
};

const normalizeBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLocaleLowerCase('pt-BR');
  return ['1', 'true', 'sim', 'yes', 'y', 'x'].includes(normalized);
};

const normalizeStockStatus = (value: unknown): 'in_stock' | 'low_stock' | 'out_of_stock' => {
  if (typeof value !== 'string') {
    return 'in_stock';
  }

  const normalized = value.trim().toLocaleLowerCase('pt-BR');

  if (
    normalized === 'low_stock' ||
    normalized === 'low' ||
    normalized.includes('reduz') ||
    normalized.includes('pouca')
  ) {
    return 'low_stock';
  }

  if (
    normalized === 'out_of_stock' ||
    normalized === 'out' ||
    normalized.includes('indispon') ||
    normalized.includes('esgot')
  ) {
    return 'out_of_stock';
  }

  return 'in_stock';
};

const normalizePrice = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const sanitized = value.trim().replace(/[^\d,.-]/g, '');

  if (!sanitized) {
    return null;
  }

  let normalizedValue = sanitized;

  if (sanitized.includes(',') && sanitized.includes('.')) {
    normalizedValue =
      sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.')
        ? sanitized.replace(/\./g, '').replace(',', '.')
        : sanitized.replace(/,/g, '');
  } else if (sanitized.includes(',')) {
    normalizedValue = sanitized.replace(',', '.');
  }

  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeDate = (value: unknown) => {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return null;
};

const toFieldMap = (data: Record<string, unknown>) => {
  const fieldMap = new Map<string, unknown>();

  Object.entries(data).forEach(([key, value]) => {
    const normalizedKey = normalizeFieldKey(key);
    if (!normalizedKey || fieldMap.has(normalizedKey)) {
      return;
    }

    fieldMap.set(normalizedKey, value);
  });

  return fieldMap;
};

const getFieldValue = (fieldMap: Map<string, unknown>, fieldName: FieldAliasKey) => {
  const aliases = FIELD_ALIASES[fieldName];

  for (const alias of aliases) {
    const normalizedAlias = normalizeFieldKey(alias);
    if (fieldMap.has(normalizedAlias)) {
      return fieldMap.get(normalizedAlias);
    }
  }

  return undefined;
};

const normalizeSkuKey = (value: string) => value.trim().toLocaleLowerCase('pt-BR');

const toNormalizedProduct = (
  raw: ImportRawItem,
  options: {
    collectionOverride?: string;
    existingSkuKeys: Set<string>;
    seenSkuKeys: Set<string>;
  }
): BulkImportPreviewRow => {
  const fieldMap = toFieldMap(raw.data);
  const errors: string[] = [];

  const name = normalizeText(getFieldValue(fieldMap, 'name'));
  const sku = normalizeText(getFieldValue(fieldMap, 'sku'));
  const description = normalizeText(getFieldValue(fieldMap, 'description'));
  const category = normalizeText(getFieldValue(fieldMap, 'category'));
  const gender = normalizeText(getFieldValue(fieldMap, 'gender'));
  const label = normalizeText(getFieldValue(fieldMap, 'label'));
  const rawSlug = normalizeText(getFieldValue(fieldMap, 'slug'));
  const season = normalizeText(getFieldValue(fieldMap, 'season'));
  const fit = normalizeText(getFieldValue(fieldMap, 'fit'));
  const material = normalizeText(getFieldValue(fieldMap, 'material'));
  const composition = normalizeText(getFieldValue(fieldMap, 'composition'));
  const highlights = normalizeArray(getFieldValue(fieldMap, 'highlights'));
  const careInstructions = normalizeArray(getFieldValue(fieldMap, 'careInstructions'));
  const stockStatus = normalizeStockStatus(getFieldValue(fieldMap, 'stockStatus'));

  const rawCollection = normalizeText(getFieldValue(fieldMap, 'collection'));
  const collection = normalizeText(options.collectionOverride) || rawCollection;

  const price = normalizePrice(getFieldValue(fieldMap, 'price'));
  const sizes = normalizeArray(getFieldValue(fieldMap, 'sizes'));
  const colors = normalizeArray(getFieldValue(fieldMap, 'colors'));
  const createdAt = normalizeDate(getFieldValue(fieldMap, 'createdAt'));
  const isFeatured = normalizeBoolean(getFieldValue(fieldMap, 'isFeatured'));
  const isNew = normalizeBoolean(getFieldValue(fieldMap, 'isNew'));

  const featuredImage = normalizeText(getFieldValue(fieldMap, 'featuredImage'));
  const galleryImages = normalizeArray(getFieldValue(fieldMap, 'images'));
  const allImages = Array.from(new Set([featuredImage, ...galleryImages].filter(Boolean)));
  const resolvedFeaturedImage = featuredImage || allImages[0] || '';
  const resolvedImages = Array.from(new Set([resolvedFeaturedImage, ...allImages].filter(Boolean)));

  const slug = rawSlug ? slugify(rawSlug) : slugify(name);

  if (!name || name.length < 3) {
    errors.push('Nome obrigatório (mínimo de 3 caracteres).');
  }

  if (!sku) {
    errors.push('SKU obrigatório.');
  } else {
    const skuKey = normalizeSkuKey(sku);
    if (options.existingSkuKeys.has(skuKey)) {
      errors.push('SKU já existente no catálogo.');
    } else if (options.seenSkuKeys.has(skuKey)) {
      errors.push('SKU duplicado no arquivo.');
    } else {
      options.seenSkuKeys.add(skuKey);
    }
  }

  if (!description || description.length < 12) {
    errors.push('Descrição obrigatória (mínimo de 12 caracteres).');
  }

  if (!Number.isFinite(price) || (price ?? 0) <= 0) {
    errors.push('Preço inválido. Informe valor maior que zero.');
  }

  if (!category || category.toLocaleLowerCase('pt-BR') === 'todos') {
    errors.push('Categoria obrigatória.');
  }

  if (!gender || gender.toLocaleLowerCase('pt-BR') === 'todos') {
    errors.push('Gênero obrigatório.');
  }

  if (sizes.length === 0) {
    errors.push('Informe ao menos um tamanho.');
  }

  if (!resolvedFeaturedImage) {
    errors.push('Informe featuredImage ou images para gerar imagem de destaque.');
  } else if (!isValidUrl(resolvedFeaturedImage)) {
    errors.push('Imagem de destaque inválida.');
  }

  if (resolvedImages.length === 0) {
    errors.push('Galeria vazia. Informe ao menos uma imagem.');
  } else if (resolvedImages.some((image) => !isValidUrl(image))) {
    errors.push('Galeria possui URL de imagem inválida.');
  }

  if (label.length > MAX_LABEL_LENGTH) {
    errors.push(`Label deve ter no máximo ${MAX_LABEL_LENGTH} caracteres.`);
  }

  if (fit.length > 64) {
    errors.push('Fit/modelagem deve ter no máximo 64 caracteres.');
  }

  if (material.length > 80) {
    errors.push('Material deve ter no máximo 80 caracteres.');
  }

  if (composition.length > 100) {
    errors.push('Composição deve ter no máximo 100 caracteres.');
  }

  if (rawSlug && !slug) {
    errors.push('Slug inválido.');
  } else if (slug && !SLUG_PATTERN.test(slug)) {
    errors.push('Slug deve conter apenas letras minúsculas, números e hífen.');
  }

  if (!createdAt) {
    errors.push('createdAt inválido.');
  }

  const product: ProductCreateInput | undefined =
    errors.length === 0
      ? {
          name,
          sku,
          slug: slug || undefined,
          description,
          price: price as number,
          featuredImage: resolvedFeaturedImage,
          images: resolvedImages,
          category,
          gender,
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
          createdAt: createdAt as string,
          isFeatured,
          isNew,
          label: label || undefined
        }
      : undefined;

  return {
    rowNumber: raw.rowNumber,
    name,
    sku,
    category,
    gender,
    collection: collection || undefined,
    season: season || undefined,
    stockStatus,
    price,
    imagesCount: resolvedImages.length,
    errors,
    product
  };
};

export const buildBulkImportPreview = (
  source: BulkImportSource,
  options: BuildBulkImportPreviewOptions = {}
): BulkImportPreviewData => {
  const existingSkuKeys = new Set((options.existingSkus ?? []).map((sku) => normalizeSkuKey(sku)).filter(Boolean));
  const seenSkuKeys = new Set<string>();

  const rows = source.items.map((item) =>
    toNormalizedProduct(item, {
      collectionOverride: options.collectionOverride,
      existingSkuKeys,
      seenSkuKeys
    })
  );

  const validRows = rows.filter((row) => row.errors.length === 0 && row.product);
  const invalidRows = rows.filter((row) => row.errors.length > 0);
  const validProducts = validRows
    .map((row) => row.product)
    .filter((product): product is ProductCreateInput => Boolean(product));

  return {
    format: source.format,
    totalCount: rows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    rows,
    validRows,
    invalidRows,
    validProducts
  };
};

const IMPORT_SAMPLE_IMAGE = buildPlaceholderImage({
  category: 'calcas',
  gender: 'masculino',
  style: 'editorial',
  seed: 'bulk-template-1',
  label: 'Calca Jeans'
});

const IMPORT_SAMPLE_IMAGE_2 = buildPlaceholderImage({
  category: 'jaquetas',
  gender: 'feminino',
  style: 'editorial',
  seed: 'bulk-template-2',
  label: 'Jaqueta Jeans'
});

export const BULK_IMPORT_JSON_TEMPLATE = JSON.stringify(
  [
    {
      name: 'Calça Jeans Slim Comfort',
      sku: 'CJ-SC-M-2026-001',
      slug: 'calca-jeans-slim-comfort',
      description: 'Calça jeans slim com elastano e lavagem premium para uso diário.',
      price: 189.9,
      featuredImage: IMPORT_SAMPLE_IMAGE,
      images: [IMPORT_SAMPLE_IMAGE, IMPORT_SAMPLE_IMAGE_2],
      category: 'Calças',
      gender: 'Masculino',
      sizes: ['38', '40', '42', '44'],
      colors: ['Azul Escuro', 'Preto'],
      collection: 'Outono/Inverno 2026',
      season: 'Drop Denim Lab',
      fit: 'Slim com conforto',
      material: 'Denim premium',
      composition: '98% algodão, 2% elastano',
      highlights: ['Lavagem premium', 'Alta elasticidade'],
      careInstructions: ['Lavar do avesso', 'Secar à sombra'],
      stockStatus: 'in_stock',
      createdAt: '2026-03-24T12:00:00.000Z',
      isFeatured: true,
      isNew: true,
      label: 'Nova coleção'
    },
    {
      name: 'Jaqueta Jeans Cropped',
      sku: 'JJ-CR-F-2026-002',
      description: 'Jaqueta cropped com acabamento premium e lavagem média.',
      price: 259.9,
      featuredImage: IMPORT_SAMPLE_IMAGE_2,
      images: [IMPORT_SAMPLE_IMAGE_2],
      category: 'Jaquetas',
      gender: 'Feminino',
      sizes: ['P', 'M', 'G'],
      colors: ['Azul Médio'],
      collection: 'Outono/Inverno 2026',
      season: 'Drop Denim Lab',
      fit: 'Regular contemporânea',
      material: 'Denim encorpado',
      composition: '100% algodão',
      highlights: ['Estrutura premium'],
      careInstructions: ['Não usar secadora'],
      stockStatus: 'low_stock',
      isFeatured: false,
      isNew: true
    }
  ],
  null,
  2
);

export const BULK_IMPORT_CSV_TEMPLATE = `name,sku,slug,description,price,featuredImage,images,category,gender,sizes,colors,collection,season,fit,material,composition,highlights,careInstructions,stockStatus,createdAt,isFeatured,isNew,label
Calça Jeans Slim Comfort,CJ-SC-M-2026-001,calca-jeans-slim-comfort,Calça jeans slim com elastano e lavagem premium para uso diário.,189.90,"${IMPORT_SAMPLE_IMAGE}","${IMPORT_SAMPLE_IMAGE}|${IMPORT_SAMPLE_IMAGE_2}",Calças,Masculino,"38|40|42|44","Azul Escuro|Preto",Outono/Inverno 2026,Drop Denim Lab,Slim com conforto,Denim premium,"98% algodão, 2% elastano","Lavagem premium|Alta elasticidade","Lavar do avesso|Secar à sombra",in_stock,2026-03-24T12:00:00.000Z,true,true,Nova coleção
Jaqueta Jeans Cropped,JJ-CR-F-2026-002,,Jaqueta cropped com acabamento premium e lavagem média.,259.90,"${IMPORT_SAMPLE_IMAGE_2}","${IMPORT_SAMPLE_IMAGE_2}",Jaquetas,Feminino,"P|M|G",Azul Médio,Outono/Inverno 2026,Drop Denim Lab,Regular contemporânea,Denim encorpado,100% algodão,Estrutura premium,Não usar secadora,low_stock,,false,true,`;
