import { LOCAL_IMAGE_REF_PREFIX } from '../services/imageStorageService';

export const MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB = 5;
export const MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES = MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024;
export const MAX_PRODUCT_IMAGES_PER_PRODUCT = 10;
export const IMAGE_UPLOAD_ACCEPT_ATTR = 'image/jpeg,image/jpg,image/png,image/webp';
export const IMAGE_UPLOAD_FORMATS_LABEL = 'JPG, PNG ou WEBP';

const ACCEPTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ACCEPTED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const SVG_DATA_URI_PREFIX = 'data:image/svg+xml';

const normalizeSource = (value?: string | null) => (typeof value === 'string' ? value.trim() : '');

export const isSvgDataUri = (value?: string | null) =>
  normalizeSource(value).toLowerCase().startsWith(SVG_DATA_URI_PREFIX);

export const isLocalImageRefSource = (value?: string | null) =>
  normalizeSource(value).startsWith(LOCAL_IMAGE_REF_PREFIX);

export const isPersistedImageSource = (value?: string | null) => {
  const normalized = normalizeSource(value);

  if (!normalized) {
    return false;
  }

  if (isLocalImageRefSource(normalized) || isSvgDataUri(normalized) || normalized.startsWith('/')) {
    return true;
  }

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isPreviewImageSource = (value?: string | null) => {
  const normalized = normalizeSource(value);

  if (!normalized) {
    return false;
  }

  return normalized.startsWith('blob:') || isPersistedImageSource(normalized);
};

export const splitImageInput = (value: string) =>
  value
    .split(/\r?\n/)
    .flatMap((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return [];
      }

      if (trimmedLine.startsWith('data:image/')) {
        return [trimmedLine];
      }

      return trimmedLine
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    });

const hasAcceptedExtension = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return Boolean(extension && ACCEPTED_IMAGE_EXTENSIONS.has(extension));
};

export const isAcceptedImageFileType = (file: File) => {
  if (ACCEPTED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }

  if (!file.type) {
    return hasAcceptedExtension(file.name);
  }

  return false;
};

const formatUnsupportedFileError = (fileName: string) =>
  `O arquivo "${fileName}" não é suportado. Use ${IMAGE_UPLOAD_FORMATS_LABEL}.`;

const formatFileSizeError = (fileName: string) =>
  `A imagem "${fileName}" excede ${MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}MB.`;

export const validateImageUploadFiles = (files: File[]) => {
  if (files.length === 0) {
    return 'Selecione ao menos uma imagem para upload.';
  }

  const invalidTypeFile = files.find((file) => !isAcceptedImageFileType(file));
  if (invalidTypeFile) {
    return formatUnsupportedFileError(invalidTypeFile.name);
  }

  const fileTooLarge = files.find((file) => file.size > MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES);
  if (fileTooLarge) {
    return formatFileSizeError(fileTooLarge.name);
  }

  return null;
};
