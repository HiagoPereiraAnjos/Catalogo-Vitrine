import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Layers3, Trash2 } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { categories as baseCategories, genders } from '../data';
import { Product, ProductCreateInput } from '../types';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Modal } from '../components/Modal';
import { usePageSeo } from '../hooks/usePageSeo';
import { CategoriesService, isSameCategory, normalizeCategoryName } from '../services/categoriesService';
import { ImageStorageService } from '../services/imageStorageService';
import {
  MAX_PRODUCT_IMAGES_PER_PRODUCT,
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB,
  isLocalImageRefSource,
  isPersistedImageSource,
  isPreviewImageSource,
  splitImageInput,
  validateImageUploadFiles
} from '../utils/imageSources';
import { sortProductsByNewest } from '../utils/product';
import {
  AdminAccessSplash,
  AdminHeader,
  AdminNoticeToast,
  AdminStatsCards,
  BrandSettingsPanel,
  BulkImportModal,
  CollectionActions,
  CollectionWizard,
  ConfirmDialog,
  ProductEditor,
  ProductsList
} from './admin/components';
import { AdminStatusFilter, CollectionOption, FormErrors, Notice, ProductFormState } from './admin/types';

const getInitialFormData = (defaultCategory: string = baseCategories[1] || 'CalÃ§as'): ProductFormState => ({
  name: '',
  description: '',
  price: '',
  category: defaultCategory,
  gender: genders[1],
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

const splitByComma = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const splitByLineOrComma = (value: string) =>
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

const generateAutoSku = (name: string) => {
  const base = normalizeSkuSeed(name).slice(0, 14) || 'PRODUTO';
  const suffix = Date.now().toString().slice(-6);
  return `SKU-${base}-${suffix}`;
};

const buildAutoDescription = (name: string, category: string, collection?: string) => {
  const cleanName = name.trim() || 'Produto';
  const cleanCategory = category.trim() || 'catalogo';
  const cleanCollection = collection?.trim();

  if (cleanCollection) {
    return `${cleanName} da colecao ${cleanCollection}, com acabamento premium e caimento confortavel.`;
  }

  return `${cleanName} em ${cleanCategory.toLowerCase()}, com qualidade premium para o dia a dia.`;
};

interface UploadDraftImage {
  id: string;
  file: File;
  objectUrl: string;
}

interface UploadProgressState {
  isPreparing: boolean;
  prepareCompleted: number;
  prepareTotal: number;
  isPersisting: boolean;
  persistCompleted: number;
  persistTotal: number;
}

interface BuildFormErrorsOptions {
  hasFeaturedUploadDraft?: boolean;
  persistedGalleryRefs?: string[];
  galleryUploadDraftCount?: number;
}

type GalleryEntry =
  | { id: string; kind: 'url'; value: string }
  | { id: string; kind: 'localRef'; value: string }
  | { id: string; kind: 'draft'; draft: UploadDraftImage };

const INITIAL_UPLOAD_PROGRESS: UploadProgressState = {
  isPreparing: false,
  prepareCompleted: 0,
  prepareTotal: 0,
  isPersisting: false,
  persistCompleted: 0,
  persistTotal: 0
};

const createUploadDraftId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `upload-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const createUploadDraft = (file: File): UploadDraftImage => ({
  id: createUploadDraftId(),
  file,
  objectUrl: URL.createObjectURL(file)
});

const revokeUploadDraft = (draft?: UploadDraftImage | null) => {
  if (!draft) {
    return;
  }

  URL.revokeObjectURL(draft.objectUrl);
};

const revokeUploadDrafts = (drafts: UploadDraftImage[]) => {
  drafts.forEach((draft) => revokeUploadDraft(draft));
};

const getFilesFromEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
  const fileList = event.target.files;
  const files = fileList
    ? Array.from({ length: fileList.length }, (_, index) => fileList.item(index)).filter(
        (file): file is File => file !== null
      )
    : [];

  event.target.value = '';
  return files;
};

const isRecentProduct = (createdAt: string) => {
  const createdAtTime = Date.parse(createdAt);
  if (!Number.isFinite(createdAtTime)) {
    return false;
  }

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - createdAtTime <= THIRTY_DAYS;
};

const buildFormErrors = (formData: ProductFormState, options: BuildFormErrorsOptions = {}): FormErrors => {
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

const getFieldClassName = (hasError: boolean) =>
  `field-control ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
  }`;

const normalizeCollectionKey = (value: string) => value.trim().toLocaleLowerCase('pt-BR');
const normalizeSkuKey = (value: string) => value.trim().toLocaleLowerCase('pt-BR');

const buildDuplicateSku = (baseSku: string, index: number, usedSkuKeys: Set<string>) => {
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

export default function AdminDashboard() {
  const { products, isLoading, addProduct, addProductsBulk, updateProduct, deleteProduct } = useProducts();

  usePageSeo({
    title: 'Painel Administrativo',
    description: 'Ãrea administrativa da Denim Premium para gerenciamento interno do catÃ¡logo digital.',
    noIndex: true
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductFormState>(getInitialFormData());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<AdminStatusFilter>('all');
  const [featuredImageDraft, setFeaturedImageDraft] = useState<UploadDraftImage | null>(null);
  const [galleryImageDrafts, setGalleryImageDrafts] = useState<UploadDraftImage[]>([]);
  const [persistedGalleryImageRefs, setPersistedGalleryImageRefs] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>(INITIAL_UPLOAD_PROGRESS);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryError, setNewCategoryError] = useState('');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCollectionWizardOpen, setIsCollectionWizardOpen] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [isDuplicatingCollection, setIsDuplicatingCollection] = useState(false);
  const featuredDraftRef = useRef<UploadDraftImage | null>(null);
  const galleryDraftsRef = useRef<UploadDraftImage[]>([]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setCustomCategories(CategoriesService.getCustomCategories());
  }, []);

  useEffect(() => {
    featuredDraftRef.current = featuredImageDraft;
  }, [featuredImageDraft]);

  useEffect(() => {
    galleryDraftsRef.current = galleryImageDrafts;
  }, [galleryImageDrafts]);

  useEffect(
    () => () => {
      revokeUploadDraft(featuredDraftRef.current);
      revokeUploadDrafts(galleryDraftsRef.current);
    },
    []
  );

  const featuredCount = useMemo(() => products.filter((product) => product.isFeatured).length, [products]);
  const newCount = useMemo(
    () => products.filter((product) => product.isNew || isRecentProduct(product.createdAt)).length,
    [products]
  );

  const categoryOptions = useMemo(
    () =>
      CategoriesService.buildCategoryOptions(
        baseCategories,
        customCategories,
        products.map((product) => product.category)
      ),
    [customCategories, products]
  );

  const defaultCategoryOptions = useMemo(
    () => baseCategories.filter((category) => !isSameCategory(category, 'Todos')),
    []
  );

  const productCategoryOptions = useMemo(
    () => categoryOptions.filter((category) => !isSameCategory(category, 'Todos')),
    [categoryOptions]
  );

  const customCategoryOptions = useMemo(
    () => customCategories.filter((category) => !isSameCategory(category, 'Todos')),
    [customCategories]
  );

  const categoriesCount = useMemo(() => productCategoryOptions.length, [productCategoryOptions]);

  const collectionOptions = useMemo<CollectionOption[]>(() => {
    const collectionMap = new Map<string, number>();

    products.forEach((product) => {
      const collection = product.collection?.trim();
      if (!collection) {
        return;
      }

      collectionMap.set(collection, (collectionMap.get(collection) || 0) + 1);
    });

    return Array.from(collectionMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = adminSearch.trim().toLowerCase();
    const sorted = sortProductsByNewest(products);

    return sorted.filter((product) => {
      const matchesSearch =
        query.length === 0 ||
        [
          product.name,
          product.sku,
          product.slug,
          product.category,
          product.gender,
          product.label || '',
          product.collection || '',
          product.season || '',
          product.fit || '',
          product.material || '',
          product.composition || ''
        ]
          .some((field) => field?.toLowerCase().includes(query));

      const matchesStatus =
        adminStatusFilter === 'all' ||
        (adminStatusFilter === 'featured' && product.isFeatured) ||
        (adminStatusFilter === 'new' && (product.isNew || isRecentProduct(product.createdAt)));

      return matchesSearch && matchesStatus;
    });
  }, [products, adminSearch, adminStatusFilter]);

  const galleryImages = useMemo(() => splitImageInput(formData.images), [formData.images]);

  const setFeaturedDraft = (nextDraft: UploadDraftImage | null, options?: { revokePrevious?: boolean }) => {
    setFeaturedImageDraft((previousDraft) => {
      if (options?.revokePrevious !== false && previousDraft && previousDraft !== nextDraft) {
        revokeUploadDraft(previousDraft);
      }

      return nextDraft;
    });
  };

  const clearFeaturedImageDraft = () => {
    setFeaturedDraft(null, { revokePrevious: true });
  };

  const clearGalleryImageDrafts = () => {
    setGalleryImageDrafts((previousDrafts) => {
      revokeUploadDrafts(previousDrafts);
      return [];
    });
  };

  const resetUploadState = () => {
    clearFeaturedImageDraft();
    clearGalleryImageDrafts();
    setPersistedGalleryImageRefs([]);
    setUploadProgress(INITIAL_UPLOAD_PROGRESS);
    setImageUploadError(null);
  };

  const setFieldValue = <K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const createGalleryEntryId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const galleryEntries = useMemo<GalleryEntry[]>(
    () => [
      ...galleryImages.map((value, index) => ({ id: `url-${index}`, kind: 'url' as const, value })),
      ...persistedGalleryImageRefs.map((value, index) => ({ id: `ref-${index}`, kind: 'localRef' as const, value })),
      ...galleryImageDrafts.map((draft) => ({ id: `draft-${draft.id}`, kind: 'draft' as const, draft }))
    ],
    [galleryImages, persistedGalleryImageRefs, galleryImageDrafts]
  );

  const featuredManagerImage = useMemo(() => {
    if (featuredImageDraft) {
      return {
        id: `featured-draft-${featuredImageDraft.id}`,
        src: featuredImageDraft.objectUrl,
        isFeatured: true,
        sizeBytes: featuredImageDraft.file.size,
        sourceLabel: 'Upload local',
        canSetFeatured: false
      };
    }

    const featuredImage = formData.featuredImage.trim();
    if (!featuredImage) {
      return null;
    }

    return {
      id: `featured-${featuredImage}`,
      src: featuredImage,
      isFeatured: true,
      sourceLabel: isLocalImageRefSource(featuredImage) ? 'Imagem local' : 'URL',
      canSetFeatured: false
    };
  }, [featuredImageDraft, formData.featuredImage]);

  const galleryManagerImages = useMemo(
    () =>
      galleryEntries.map((entry) => {
        if (entry.kind === 'draft') {
          return {
            id: entry.id,
            src: entry.draft.objectUrl,
            isFeatured: false,
            sizeBytes: entry.draft.file.size,
            sourceLabel: 'Upload local',
            canSetFeatured: true
          };
        }

        return {
          id: entry.id,
          src: entry.value,
          isFeatured: false,
          sourceLabel: entry.kind === 'localRef' ? 'Imagem local' : 'URL',
          canSetFeatured: true
        };
      }),
    [galleryEntries]
  );

  const managedImages = useMemo(
    () => (featuredManagerImage ? [featuredManagerImage, ...galleryManagerImages] : galleryManagerImages),
    [featuredManagerImage, galleryManagerImages]
  );

  const previewImages = useMemo(() => managedImages.map((image) => image.src), [managedImages]);

  const hasInvalidPreviewImage = useMemo(
    () => previewImages.some((imageUrl) => !isPreviewImageSource(imageUrl)),
    [previewImages]
  );

  const totalImageCount = managedImages.length;

  const genderOptions = useMemo(() => genders.filter((gender) => gender !== 'Todos'), []);

  const syncGalleryEntries = (nextEntries: GalleryEntry[], preservedDraftIds: Set<string> = new Set()) => {
    const nextUrlImages = nextEntries.filter((entry): entry is Extract<GalleryEntry, { kind: 'url' }> => entry.kind === 'url');
    const nextRefImages = nextEntries.filter(
      (entry): entry is Extract<GalleryEntry, { kind: 'localRef' }> => entry.kind === 'localRef'
    );
    const nextDraftImages = nextEntries.filter(
      (entry): entry is Extract<GalleryEntry, { kind: 'draft' }> => entry.kind === 'draft'
    );

    setFieldValue('images', nextUrlImages.map((entry) => entry.value).join('\n'));
    setPersistedGalleryImageRefs(nextRefImages.map((entry) => entry.value));
    setGalleryImageDrafts((previousDrafts) => {
      const nextDrafts = nextDraftImages.map((entry) => entry.draft);
      const nextDraftIds = new Set(nextDrafts.map((draft) => draft.id));

      previousDrafts.forEach((draft) => {
        if (!nextDraftIds.has(draft.id) && !preservedDraftIds.has(draft.id)) {
          revokeUploadDraft(draft);
        }
      });

      return nextDrafts;
    });
  };

  const handleFeaturedImageInputChange = (value: string) => {
    if (featuredImageDraft) {
      clearFeaturedImageDraft();
    }

    setFieldValue('featuredImage', value);
    setImageUploadError(null);
  };

  const handleImagesInputChange = (value: string) => {
    setFieldValue('images', value);
    setImageUploadError(null);
  };

  const buildUploadDrafts = (files: File[]) => {
    setUploadProgress({
      isPreparing: true,
      prepareCompleted: 0,
      prepareTotal: files.length,
      isPersisting: false,
      persistCompleted: 0,
      persistTotal: 0
    });

    const drafts: UploadDraftImage[] = [];

    try {
      files.forEach((file, index) => {
        drafts.push(createUploadDraft(file));
        setUploadProgress((previousState) => ({
          ...previousState,
          prepareCompleted: index + 1
        }));
      });

      return drafts;
    } catch (error) {
      revokeUploadDrafts(drafts);
      throw error;
    } finally {
      setUploadProgress((previousState) => ({
        ...previousState,
        isPreparing: false
      }));
    }
  };

  const handleFeaturedFilesUpload = async (inputFiles: File[]) => {
    if (inputFiles.length === 0) {
      return;
    }

    const file = inputFiles[0];
    const validationError = validateImageUploadFiles([file]);
    if (validationError) {
      setFormErrors((prev) => ({ ...prev, featuredImage: validationError }));
      setImageUploadError(validationError);
      return;
    }

    const hasFeaturedSource = Boolean(featuredImageDraft || formData.featuredImage.trim());
    if (!hasFeaturedSource && totalImageCount >= MAX_PRODUCT_IMAGES_PER_PRODUCT) {
      const limitError = `Use no máximo ${MAX_PRODUCT_IMAGES_PER_PRODUCT} imagens por produto.`;
      setFormErrors((prev) => ({ ...prev, images: limitError }));
      setImageUploadError(limitError);
      return;
    }

    try {
      const [nextDraft] = buildUploadDrafts([file]);
      setFeaturedDraft(nextDraft || null, { revokePrevious: true });
      setFormErrors((prev) => ({ ...prev, featuredImage: undefined, images: undefined }));
      setImageUploadError(null);
    } catch (error) {
      console.error('Erro ao preparar imagem de destaque', error);
      setFormErrors((prev) => ({ ...prev, featuredImage: 'Não foi possível preparar a imagem de destaque.' }));
      setImageUploadError('Não foi possível preparar a imagem de destaque. Tente novamente.');
    }
  };

  const handleGalleryFilesUpload = async (inputFiles: File[]) => {
    if (inputFiles.length === 0) {
      return;
    }

    const validationError = validateImageUploadFiles(inputFiles);
    if (validationError) {
      setFormErrors((prev) => ({ ...prev, images: validationError }));
      setImageUploadError(validationError);
      return;
    }

    if (totalImageCount + inputFiles.length > MAX_PRODUCT_IMAGES_PER_PRODUCT) {
      const limitError = `Use no máximo ${MAX_PRODUCT_IMAGES_PER_PRODUCT} imagens por produto.`;
      setFormErrors((prev) => ({ ...prev, images: limitError }));
      setImageUploadError(limitError);
      return;
    }

    try {
      const nextDrafts = buildUploadDrafts(inputFiles);
      const hasFeaturedSource = Boolean(featuredImageDraft || formData.featuredImage.trim());
      let draftsForGallery = nextDrafts;

      if (!hasFeaturedSource && nextDrafts.length > 0) {
        const [featuredDraftFromGallery, ...remainingDrafts] = nextDrafts;
        setFeaturedDraft(featuredDraftFromGallery, { revokePrevious: true });
        draftsForGallery = remainingDrafts;
      }

      if (draftsForGallery.length > 0) {
        setGalleryImageDrafts((previousDrafts) => [...previousDrafts, ...draftsForGallery]);
      }

      setFormErrors((prev) => ({ ...prev, images: undefined, featuredImage: undefined }));
      setImageUploadError(null);
    } catch (error) {
      console.error('Erro ao preparar galeria', error);
      setFormErrors((prev) => ({ ...prev, images: 'Não foi possível preparar as imagens da galeria.' }));
      setImageUploadError('Não foi possível preparar as imagens da galeria. Tente novamente.');
    }
  };

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleFeaturedFilesUpload(getFilesFromEvent(event));
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleGalleryFilesUpload(getFilesFromEvent(event));
  };

  const handleGalleryDropUpload = async (files: File[]) => {
    await handleGalleryFilesUpload(files);
  };

  const clearUploadedGalleryImages = () => {
    clearGalleryImageDrafts();
    setPersistedGalleryImageRefs([]);
    setFormErrors((prev) => ({ ...prev, images: undefined }));
    setImageUploadError(null);
  };

  const handleRemoveManagedImage = (imageId: string) => {
    if (featuredManagerImage && imageId === featuredManagerImage.id) {
      if (featuredImageDraft) {
        clearFeaturedImageDraft();
      }
      setFieldValue('featuredImage', '');
      setImageUploadError(null);
      return;
    }

    const nextEntries = galleryEntries.filter((entry) => entry.id !== imageId);
    if (nextEntries.length === galleryEntries.length) {
      return;
    }

    syncGalleryEntries(nextEntries);
    setImageUploadError(null);
  };

  const handleSetManagedFeatured = (imageId: string) => {
    if (featuredManagerImage && imageId === featuredManagerImage.id) {
      return;
    }

    const selectedEntryIndex = galleryEntries.findIndex((entry) => entry.id === imageId);
    if (selectedEntryIndex === -1) {
      return;
    }

    const selectedEntry = galleryEntries[selectedEntryIndex];
    const nextEntries = galleryEntries.filter((entry) => entry.id !== imageId);
    const preservedDraftIds = new Set<string>();

    if (featuredImageDraft) {
      nextEntries.unshift({ id: createGalleryEntryId('draft-demote'), kind: 'draft', draft: featuredImageDraft });
      preservedDraftIds.add(featuredImageDraft.id);
    } else {
      const currentFeaturedImage = formData.featuredImage.trim();
      if (currentFeaturedImage) {
        if (isLocalImageRefSource(currentFeaturedImage)) {
          nextEntries.unshift({ id: createGalleryEntryId('ref-demote'), kind: 'localRef', value: currentFeaturedImage });
        } else if (isPersistedImageSource(currentFeaturedImage)) {
          nextEntries.unshift({ id: createGalleryEntryId('url-demote'), kind: 'url', value: currentFeaturedImage });
        }
      }
    }

    if (selectedEntry.kind === 'draft') {
      preservedDraftIds.add(selectedEntry.draft.id);
      setFeaturedDraft(selectedEntry.draft, { revokePrevious: false });
      setFieldValue('featuredImage', '');
    } else {
      setFeaturedDraft(null, { revokePrevious: false });
      setFieldValue('featuredImage', selectedEntry.value);
    }

    syncGalleryEntries(nextEntries, preservedDraftIds);
    setImageUploadError(null);
  };

  const handleMoveManagedImage = (imageId: string, direction: 'left' | 'right') => {
    const currentIndex = galleryEntries.findIndex((entry) => entry.id === imageId);
    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= galleryEntries.length) {
      return;
    }

    const nextEntries = [...galleryEntries];
    const [movedItem] = nextEntries.splice(currentIndex, 1);
    nextEntries.splice(targetIndex, 0, movedItem);
    syncGalleryEntries(nextEntries);
  };

  const handleReorderManagedImages = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return;
    }

    if (featuredManagerImage && targetId === featuredManagerImage.id) {
      handleSetManagedFeatured(sourceId);
      return;
    }

    const sourceIndex = galleryEntries.findIndex((entry) => entry.id === sourceId);
    const targetIndex = galleryEntries.findIndex((entry) => entry.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const nextEntries = [...galleryEntries];
    const [movedItem] = nextEntries.splice(sourceIndex, 1);
    nextEntries.splice(targetIndex, 0, movedItem);
    syncGalleryEntries(nextEntries);
  };

  const openCategoryModal = () => {
    setNewCategoryName('');
    setNewCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setNewCategoryName('');
    setNewCategoryError('');
    setIsCategoryModalOpen(false);
  };

  const handleCreateCategory = (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedCategoryName = normalizeCategoryName(newCategoryName);

    if (normalizedCategoryName.length < 2) {
      setNewCategoryError('Informe um nome com ao menos 2 caracteres.');
      return;
    }

    if (normalizedCategoryName.length > 32) {
      setNewCategoryError('Use atÃ© 32 caracteres para a categoria.');
      return;
    }

    if (categoryOptions.some((category) => isSameCategory(category, normalizedCategoryName))) {
      setNewCategoryError('Essa categoria jÃ¡ existe.');
      return;
    }

    const updatedCustomCategories = CategoriesService.saveCustomCategories([
      ...customCategories,
      normalizedCategoryName
    ]);
    setCustomCategories(updatedCustomCategories);
    setNewCategoryError('');
    setIsCategoryModalOpen(false);
    setNewCategoryName('');
    setNotice({ type: 'success', message: `Categoria "${normalizedCategoryName}" criada com sucesso.` });
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    const isCategoryInUse = products.some((product) => isSameCategory(product.category, categoryToDelete));

    if (isCategoryInUse) {
      setNotice({
        type: 'error',
        message: `NÃ£o foi possÃ­vel excluir "${categoryToDelete}". Existem produtos vinculados a essa categoria.`
      });
      return;
    }

    const updatedCustomCategories = CategoriesService.saveCustomCategories(
      customCategories.filter((category) => !isSameCategory(category, categoryToDelete))
    );

    setCustomCategories(updatedCustomCategories);

    if (isSameCategory(formData.category, categoryToDelete)) {
      const nextCategoryOptions = CategoriesService.buildCategoryOptions(
        baseCategories,
        updatedCustomCategories,
        products.map((product) => product.category)
      ).filter((category) => !isSameCategory(category, 'Todos'));

      const nextDefaultCategory = nextCategoryOptions[0] || defaultCategoryOptions[0] || 'CalÃ§as';
      setFieldValue('category', nextDefaultCategory);
    }

    setNotice({ type: 'success', message: `Categoria "${categoryToDelete}" excluÃ­da com sucesso.` });
  };

  const openForm = (product?: Product) => {
    resetUploadState();

    if (product) {
      const productGallery = product.images.slice(1);
      const editableGalleryImages = productGallery.filter(
        (image) => !isLocalImageRefSource(image) && !image.trim().startsWith('data:image/')
      );
      const localGalleryRefs = productGallery.filter((image) => isLocalImageRefSource(image));

      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        gender: product.gender,
        featuredImage: product.featuredImage,
        images: editableGalleryImages.join('\n'),
        sku: product.sku || '',
        sizes: product.sizes.join(', '),
        colors: product.colors?.join(', ') || '',
        collection: product.collection || '',
        season: product.season || '',
        fit: product.fit || '',
        material: product.material || '',
        composition: product.composition || '',
        highlights: product.highlights?.join('\n') || '',
        careInstructions: product.careInstructions?.join('\n') || '',
        stockStatus: product.stockStatus,
        slug: product.slug,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
        label: product.label || ''
      });
      setPersistedGalleryImageRefs(localGalleryRefs);
    } else {
      setEditingProduct(null);
      setFormData(getInitialFormData(productCategoryOptions[0]));
      setPersistedGalleryImageRefs([]);
    }

    setUploadProgress(INITIAL_UPLOAD_PROGRESS);
    setImageUploadError(null);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting || uploadProgress.isPersisting) {
      return;
    }

    resetUploadState();
    setIsFormOpen(false);
    setFormErrors({});
  };

  const buildProductPayload = (featuredImageFromState: string, uploadedGalleryRefs: string[]): ProductCreateInput => {
    const resolvedCategory =
      formData.category && formData.category !== 'Todos'
        ? formData.category
        : productCategoryOptions[0] || baseCategories[1] || 'Calcas';
    const resolvedGender =
      formData.gender && formData.gender !== 'Todos' ? formData.gender : genderOptions[0] || 'Unissex';
    const resolvedSku = formData.sku.trim() || generateAutoSku(formData.name);
    const resolvedDescription =
      formData.description.trim() || buildAutoDescription(formData.name, resolvedCategory, formData.collection);
    const resolvedSizes = splitByComma(formData.sizes);
    const resolvedFeaturedImage = featuredImageFromState.trim();
    const images = Array.from(
      new Set([
        resolvedFeaturedImage,
        ...galleryImages,
        ...persistedGalleryImageRefs,
        ...uploadedGalleryRefs
      ].filter(Boolean))
    );
    const collection = formData.collection.trim();
    const season = formData.season.trim();
    const fit = formData.fit.trim();
    const material = formData.material.trim();
    const composition = formData.composition.trim();
    const highlights = splitByLineOrComma(formData.highlights);
    const careInstructions = splitByLineOrComma(formData.careInstructions);

    return {
      name: formData.name.trim(),
      description: resolvedDescription,
      price: Number(formData.price),
      category: resolvedCategory,
      gender: resolvedGender,
      featuredImage: resolvedFeaturedImage || images[0] || '',
      images,
      sku: resolvedSku,
      sizes: resolvedSizes.length > 0 ? resolvedSizes : ['Unico'],
      colors: splitByComma(formData.colors),
      collection: collection || undefined,
      season: season || undefined,
      fit: fit || undefined,
      material: material || undefined,
      composition: composition || undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
      careInstructions: careInstructions.length > 0 ? careInstructions : undefined,
      stockStatus: formData.stockStatus,
      slug: formData.slug.trim() || undefined,
      isFeatured: formData.isFeatured,
      isNew: formData.isNew,
      label: formData.label.trim() || undefined
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = buildFormErrors(formData, {
      hasFeaturedUploadDraft: Boolean(featuredImageDraft),
      persistedGalleryRefs: persistedGalleryImageRefs,
      galleryUploadDraftCount: galleryImageDrafts.length
    });

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setNotice({ type: 'error', message: 'Confira os campos principais e tente novamente.' });
      return;
    }

    setIsSubmitting(true);

    let savedUploadRefs: string[] = [];

    try {
      let resolvedFeaturedImage = formData.featuredImage.trim();
      const filesToPersist = [
        ...(featuredImageDraft ? [featuredImageDraft.file] : []),
        ...galleryImageDrafts.map((draft) => draft.file)
      ];

      if (filesToPersist.length > 0) {
        setUploadProgress({
          isPreparing: false,
          prepareCompleted: 0,
          prepareTotal: 0,
          isPersisting: true,
          persistCompleted: 0,
          persistTotal: filesToPersist.length
        });

        savedUploadRefs = await ImageStorageService.saveFiles(filesToPersist, (completed, total) => {
          setUploadProgress((previousState) => ({
            ...previousState,
            isPersisting: true,
            persistCompleted: completed,
            persistTotal: total
          }));
        });
      }

      const uploadedGalleryRefs = featuredImageDraft ? savedUploadRefs.slice(1) : savedUploadRefs;
      if (featuredImageDraft && savedUploadRefs[0]) {
        resolvedFeaturedImage = savedUploadRefs[0];
      }

      const productData = buildProductPayload(resolvedFeaturedImage, uploadedGalleryRefs);

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setNotice({ type: 'success', message: 'Produto atualizado com sucesso.' });
      } else {
        await addProduct(productData);
        setNotice({ type: 'success', message: 'Produto cadastrado com sucesso.' });
      }

      resetUploadState();
      setIsFormOpen(false);
      setFormErrors({});
      setUploadProgress(INITIAL_UPLOAD_PROGRESS);
    } catch (error) {
      console.error('Erro ao salvar produto', error);

      if (savedUploadRefs.length > 0) {
        await Promise.all(savedUploadRefs.map((ref) => ImageStorageService.deleteByRef(ref).catch(() => undefined)));
      }

      setNotice({ type: 'error', message: 'Não foi possível salvar o produto. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
      setUploadProgress((previousState) => ({
        ...previousState,
        isPersisting: false
      }));
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteProduct) {
      return;
    }

    try {
      await deleteProduct(pendingDeleteProduct.id);
      setNotice({ type: 'success', message: 'Produto removido com sucesso.' });
      setPendingDeleteProduct(null);
    } catch (error) {
      console.error('Erro ao excluir produto', error);
      setNotice({ type: 'error', message: 'NÃ£o foi possÃ­vel excluir o produto. Tente novamente.' });
    }
  };

  const handleConfirmBulkImport = async (
    importedProducts: ProductCreateInput[],
    metadata: { validCount: number; invalidCount: number }
  ) => {
    setIsImportingBulk(true);

    try {
      await addProductsBulk(importedProducts);
      setIsBulkImportOpen(false);
      setNotice({
        type: 'success',
        message:
          metadata.invalidCount > 0
            ? `ImportaÃ§Ã£o concluÃ­da: ${metadata.validCount} produto(s) importado(s) e ${metadata.invalidCount} linha(s) ignorada(s).`
            : `ImportaÃ§Ã£o concluÃ­da: ${metadata.validCount} produto(s) importado(s).`
      });
    } catch (error) {
      console.error('Erro ao importar em massa', error);
      setNotice({ type: 'error', message: 'NÃ£o foi possÃ­vel concluir a importaÃ§Ã£o em massa.' });
    } finally {
      setIsImportingBulk(false);
    }
  };

  const handleConfirmCollectionWizard = async (
    createdProducts: ProductCreateInput[],
    metadata: { collectionName: string; season: string; productCount: number; imageCount: number }
  ) => {
    if (createdProducts.length === 0) {
      setNotice({ type: 'error', message: 'Nenhum produto valido foi gerado pelo wizard.' });
      return;
    }

    setIsCreatingCollection(true);

    try {
      await addProductsBulk(createdProducts);
      setIsCollectionWizardOpen(false);
      setNotice({
        type: 'success',
        message: metadata.collectionName
          ? `Colecao "${metadata.collectionName}" criada com sucesso com ${metadata.productCount} produto(s).`
          : `Colecao criada com sucesso com ${metadata.productCount} produto(s).`
      });
    } catch (error) {
      console.error('Erro ao criar colecao pelo wizard', error);
      setNotice({ type: 'error', message: 'Nao foi possivel criar a colecao pelo wizard.' });
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleDuplicateCollection = async ({
    sourceCollection,
    targetCollection,
    markAsNew
  }: {
    sourceCollection: string;
    targetCollection: string;
    markAsNew: boolean;
  }) => {
    const sourceKey = normalizeCollectionKey(sourceCollection);
    const sourceProducts = products.filter(
      (product) => normalizeCollectionKey(product.collection || '') === sourceKey
    );

    if (sourceProducts.length === 0) {
      setNotice({
        type: 'error',
        message: `NÃ£o existem produtos na coleÃ§Ã£o "${sourceCollection}" para duplicar.`
      });
      return;
    }

    setIsDuplicatingCollection(true);

    try {
      const usedSkuKeys = new Set<string>(products.map((product) => normalizeSkuKey(product.sku)));
      const now = Date.now();

      const duplicatedPayload: ProductCreateInput[] = sourceProducts.map((product, index) => ({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        gender: product.gender,
        featuredImage: product.featuredImage,
        images: [...product.images],
        sku: buildDuplicateSku(product.sku, index, usedSkuKeys),
        sizes: [...product.sizes],
        colors: product.colors ? [...product.colors] : undefined,
        collection: targetCollection,
        season: product.season || targetCollection,
        fit: product.fit,
        material: product.material,
        composition: product.composition,
        highlights: product.highlights ? [...product.highlights] : undefined,
        careInstructions: product.careInstructions ? [...product.careInstructions] : undefined,
        stockStatus: product.stockStatus,
        createdAt: new Date(now + index * 1000).toISOString(),
        isFeatured: product.isFeatured,
        isNew: markAsNew ? true : product.isNew,
        label: markAsNew ? product.label || 'Nova coleÃ§Ã£o' : product.label
      }));

      await addProductsBulk(duplicatedPayload);

      setNotice({
        type: 'success',
        message: `ColeÃ§Ã£o duplicada com sucesso. ${duplicatedPayload.length} produto(s) foram copiados para "${targetCollection}".`
      });
    } catch (error) {
      console.error('Erro ao duplicar coleÃ§Ã£o', error);
      setNotice({ type: 'error', message: 'NÃ£o foi possÃ­vel duplicar a coleÃ§Ã£o selecionada.' });
    } finally {
      setIsDuplicatingCollection(false);
    }
  };

  if (!isAuthenticated) {
    return <AdminAccessSplash onEnter={() => setIsAuthenticated(true)} />;
  }

  if (isLoading) {
    return (
      <Container className="section-shell-tight">
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-white" />
      </Container>
    );
  }

  return (
    <Container className="section-shell-tight w-full space-y-8">
      <AnimatePresence>{notice && <AdminNoticeToast notice={notice} />}</AnimatePresence>

      <AdminHeader
        onExit={() => setIsAuthenticated(false)}
        onOpenCategory={openCategoryModal}
        onOpenCollectionWizard={() => setIsCollectionWizardOpen(true)}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
        onOpenProduct={() => openForm()}
      />

      <AdminStatsCards
        totalProducts={products.length}
        featuredCount={featuredCount}
        newCount={newCount}
        categoriesCount={categoriesCount}
      />

      <BrandSettingsPanel />

      <CollectionActions
        collections={collectionOptions}
        isDuplicating={isDuplicatingCollection}
        onDuplicateCollection={handleDuplicateCollection}
      />

      <ProductsList
        products={filteredProducts}
        searchQuery={adminSearch}
        statusFilter={adminStatusFilter}
        onSearchChange={setAdminSearch}
        onStatusFilterChange={setAdminStatusFilter}
        onEdit={(product) => openForm(product)}
        onDelete={(product) => setPendingDeleteProduct(product)}
        onCreateProduct={() => openForm()}
        onCreateCollection={() => setIsCollectionWizardOpen(true)}
      />

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title="Nova categoria"
        description="Crie uma categoria para organizar produtos e filtros do catÃ¡logo."
        maxWidthClassName="sm:max-w-lg"
      >
        <form onSubmit={handleCreateCategory} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome da categoria *</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(event) => {
                setNewCategoryName(event.target.value);
                if (newCategoryError) {
                  setNewCategoryError('');
                }
              }}
              placeholder="Ex: Linha Premium"
              className={getFieldClassName(Boolean(newCategoryError))}
              autoFocus
            />
            {newCategoryError && <p className="mt-1 text-xs text-red-600">{newCategoryError}</p>}
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Categorias atuais</p>
            <div className="max-h-24 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-wrap gap-2">
                {productCategoryOptions.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">Excluir categorias criadas</p>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3">
              {customCategoryOptions.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhuma categoria personalizada para excluir.</p>
              ) : (
                <div className="space-y-2">
                  {customCategoryOptions.map((category) => (
                    <div
                      key={category}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <span className="text-sm text-gray-700">{category}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Categorias em uso por produtos nÃ£o podem ser excluÃ­das.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closeCategoryModal}>
              Cancelar
            </Button>
            <Button type="submit">
              <Layers3 className="h-4 w-4" />
              Criar categoria
            </Button>
          </div>
        </form>
      </Modal>

      <BulkImportModal
        isOpen={isBulkImportOpen}
        isImporting={isImportingBulk}
        existingSkus={products.map((product) => product.sku).filter(Boolean)}
        onClose={() => {
          if (isImportingBulk) {
            return;
          }

          setIsBulkImportOpen(false);
        }}
        onConfirmImport={handleConfirmBulkImport}
      />

      <CollectionWizard
        isOpen={isCollectionWizardOpen}
        isSubmitting={isCreatingCollection}
        categoryOptions={productCategoryOptions}
        genderOptions={genderOptions}
        existingSkus={products.map((product) => product.sku).filter(Boolean)}
        onClose={() => {
          if (isCreatingCollection) {
            return;
          }

          setIsCollectionWizardOpen(false);
        }}
        onConfirm={handleConfirmCollectionWizard}
      />

      <ProductEditor
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        isEditing={Boolean(editingProduct)}
        formData={formData}
        formErrors={formErrors}
        productCategoryOptions={productCategoryOptions}
        genderOptions={genderOptions}
        imageItems={managedImages}
        hasInvalidPreviewImage={hasInvalidPreviewImage}
        maxUploadSizeMb={MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}
        maxImageCount={MAX_PRODUCT_IMAGES_PER_PRODUCT}
        totalImageCount={totalImageCount}
        uploadedGalleryCount={galleryImageDrafts.length + persistedGalleryImageRefs.length}
        hasFeaturedUploadDraft={Boolean(featuredImageDraft)}
        isUploadPreparing={uploadProgress.isPreparing}
        uploadPrepareCompleted={uploadProgress.prepareCompleted}
        uploadPrepareTotal={uploadProgress.prepareTotal}
        isPersistingUploads={uploadProgress.isPersisting}
        uploadPersistCompleted={uploadProgress.persistCompleted}
        uploadPersistTotal={uploadProgress.persistTotal}
        uploadError={imageUploadError}
        onClose={closeForm}
        onSubmit={handleSubmit}
        onFieldChange={setFieldValue}
        onFeaturedImageChange={handleFeaturedImageInputChange}
        onImagesInputChange={handleImagesInputChange}
        onFeaturedImageUpload={handleFeaturedImageUpload}
        onGalleryUpload={handleGalleryUpload}
        onGalleryDropUpload={handleGalleryDropUpload}
        onClearUploadedGallery={clearUploadedGalleryImages}
        onRemoveImage={handleRemoveManagedImage}
        onSetFeaturedImage={handleSetManagedFeatured}
        onMoveImage={handleMoveManagedImage}
        onReorderImages={handleReorderManagedImages}
        getFieldClassName={getFieldClassName}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteProduct)}
        title="Confirmar exclusÃ£o"
        description="Essa aÃ§Ã£o remove o produto do catÃ¡logo local imediatamente."
        itemName={pendingDeleteProduct?.name}
        itemCode={pendingDeleteProduct?.sku || pendingDeleteProduct?.id}
        onCancel={() => setPendingDeleteProduct(null)}
        onConfirm={handleDelete}
      />
    </Container>
  );
}





