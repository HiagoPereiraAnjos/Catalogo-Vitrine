import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useProducts } from '../context/ProductContext';
import { categories as baseCategories, genders } from '../data';
import { Product, ProductCreateInput } from '../types';
import { Container } from '../components/Container';
import { usePageSeo } from '../hooks/usePageSeo';
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
  AdminModuleSwitcher,
  AdminNoticeToast,
  AdminStatsCards,
  BulkImportModal,
  CategoryManagerModal,
  CollectionActions,
  CollectionWizard,
  ConfirmDialog,
  ProductEditor,
  ProductsList,
  SiteCustomizationPanel
} from './admin/components';
import { AdminModuleKey, AdminStatusFilter, CollectionOption, FormErrors, ProductFormState } from './admin/types';
import { useTransientNotice } from './admin/hooks/useTransientNotice';
import { useCategoryManager } from './admin/hooks/useCategoryManager';
import {
  buildAutoDescription,
  buildDuplicateSku,
  buildFormErrors,
  generateAutoSku,
  getFieldClassName,
  getInitialFormData,
  isRecentProduct,
  normalizeCollectionKey,
  normalizeSkuKey,
  splitByComma,
  splitByLineOrComma
} from './admin/utils/productForm';

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

const getUploadFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

export default function AdminDashboard() {
  const { products, isLoading, addProduct, addProductsBulk, updateProduct, deleteProduct } = useProducts();

  usePageSeo({
    title: 'Painel Administrativo',
    description: 'Área administrativa da Denim Premium para gerenciamento interno do catálogo digital.',
    noIndex: true
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductFormState>(getInitialFormData());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const { notice, setNotice } = useTransientNotice();
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<AdminStatusFilter>('all');
  const [activeModule, setActiveModule] = useState<AdminModuleKey>('products');
  const [featuredImageDraft, setFeaturedImageDraft] = useState<UploadDraftImage | null>(null);
  const [galleryImageDrafts, setGalleryImageDrafts] = useState<UploadDraftImage[]>([]);
  const [persistedGalleryImageRefs, setPersistedGalleryImageRefs] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>(INITIAL_UPLOAD_PROGRESS);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCollectionWizardOpen, setIsCollectionWizardOpen] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [isDuplicatingCollection, setIsDuplicatingCollection] = useState(false);
  const featuredDraftRef = useRef<UploadDraftImage | null>(null);
  const galleryDraftsRef = useRef<UploadDraftImage[]>([]);

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

  const {
    productCategoryOptions,
    customCategoryOptions,
    categoriesCount,
    isCategoryModalOpen,
    newCategoryName,
    newCategoryError,
    handleNewCategoryNameChange,
    openCategoryModal,
    closeCategoryModal,
    handleCreateCategory,
    handleDeleteCategory
  } = useCategoryManager({
    products,
    onNotice: setNotice
  });

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

    if (uploadProgress.isPreparing || uploadProgress.isPersisting || isSubmitting) {
      setFormErrors((prev) => ({ ...prev, images: undefined, featuredImage: undefined }));
      setImageUploadError('Aguarde o upload atual terminar para adicionar outra imagem.');
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

    if (uploadProgress.isPreparing || uploadProgress.isPersisting || isSubmitting) {
      setFormErrors((prev) => ({ ...prev, images: undefined }));
      setImageUploadError('Aguarde o upload atual terminar para adicionar novas imagens.');
      return;
    }

    const existingUploadKeys = new Set<string>();
    if (featuredImageDraft) {
      existingUploadKeys.add(getUploadFileKey(featuredImageDraft.file));
    }
    galleryImageDrafts.forEach((draft) => existingUploadKeys.add(getUploadFileKey(draft.file)));

    const batchUniqueByKey = new Map<string, File>();
    inputFiles.forEach((file) => {
      const key = getUploadFileKey(file);
      if (existingUploadKeys.has(key) || batchUniqueByKey.has(key)) {
        return;
      }

      batchUniqueByKey.set(key, file);
    });

    const filesToUpload = Array.from(batchUniqueByKey.values());
    if (filesToUpload.length === 0) {
      setFormErrors((prev) => ({ ...prev, images: undefined }));
      setImageUploadError('As imagens selecionadas já foram adicionadas anteriormente.');
      return;
    }

    const validationError = validateImageUploadFiles(filesToUpload);
    if (validationError) {
      setFormErrors((prev) => ({ ...prev, images: validationError }));
      setImageUploadError(validationError);
      return;
    }

    if (totalImageCount + filesToUpload.length > MAX_PRODUCT_IMAGES_PER_PRODUCT) {
      const limitError = `Use no máximo ${MAX_PRODUCT_IMAGES_PER_PRODUCT} imagens por produto.`;
      setFormErrors((prev) => ({ ...prev, images: limitError }));
      setImageUploadError(limitError);
      return;
    }

    try {
      const nextDrafts = buildUploadDrafts(filesToUpload);
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
    setFormErrors((prev) => ({ ...prev, images: undefined }));
    setImageUploadError(null);
  };

  const handleRemoveManagedImage = (imageId: string) => {
    if (featuredManagerImage && imageId === featuredManagerImage.id) {
      const nextEntries = [...galleryEntries];
      if (nextEntries.length === 0) {
        if (featuredImageDraft) {
          clearFeaturedImageDraft();
        }
        setFieldValue('featuredImage', '');
        setImageUploadError(null);
        return;
      }

      const [nextFeaturedEntry, ...remainingEntries] = nextEntries;
      const preservedDraftIds = new Set<string>();

      if (nextFeaturedEntry.kind === 'draft') {
        preservedDraftIds.add(nextFeaturedEntry.draft.id);
        setFeaturedDraft(nextFeaturedEntry.draft, { revokePrevious: true });
        setFieldValue('featuredImage', '');
      } else {
        clearFeaturedImageDraft();
        setFieldValue('featuredImage', nextFeaturedEntry.value);
      }

      syncGalleryEntries(remainingEntries, preservedDraftIds);
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
      setNotice({ type: 'error', message: 'Não foi possível excluir o produto. Tente novamente.' });
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
            ? `Importação concluída: ${metadata.validCount} produto(s) importado(s) e ${metadata.invalidCount} linha(s) ignorada(s).`
            : `Importação concluída: ${metadata.validCount} produto(s) importado(s).`
      });
    } catch (error) {
      console.error('Erro ao importar em massa', error);
      setNotice({ type: 'error', message: 'Não foi possível concluir a importação em massa.' });
    } finally {
      setIsImportingBulk(false);
    }
  };

  const handleConfirmCollectionWizard = async (
    createdProducts: ProductCreateInput[],
    metadata: { collectionName: string; season: string; productCount: number; imageCount: number }
  ) => {
    if (createdProducts.length === 0) {
      setNotice({ type: 'error', message: 'Nenhum produto válido foi gerado pelo wizard.' });
      return;
    }

    setIsCreatingCollection(true);

    try {
      await addProductsBulk(createdProducts);
      setIsCollectionWizardOpen(false);
      setNotice({
        type: 'success',
        message: metadata.collectionName
          ? `Coleção "${metadata.collectionName}" criada com sucesso com ${metadata.productCount} produto(s).`
          : `Coleção criada com sucesso com ${metadata.productCount} produto(s).`
      });
    } catch (error) {
      console.error('Erro ao criar coleção pelo wizard', error);
      setNotice({ type: 'error', message: 'Não foi possível criar a coleção pelo wizard.' });
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
        message: `Não existem produtos na coleção "${sourceCollection}" para duplicar.`
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
        label: markAsNew ? product.label || 'Nova coleção' : product.label
      }));

      await addProductsBulk(duplicatedPayload);

      setNotice({
        type: 'success',
        message: `Coleção duplicada com sucesso. ${duplicatedPayload.length} produto(s) foram copiados para "${targetCollection}".`
      });
    } catch (error) {
      console.error('Erro ao duplicar coleção', error);
      setNotice({ type: 'error', message: 'Não foi possível duplicar a coleção selecionada.' });
    } finally {
      setIsDuplicatingCollection(false);
    }
  };

  const isCustomizationModule =
    activeModule === 'site' || activeModule === 'seo' || activeModule === 'appearance';
  const customizationInitialSection =
    activeModule === 'seo' ? 'seo' : activeModule === 'appearance' ? 'appearance' : 'brand';

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
        onOpenCategory={() => {
          setActiveModule('products');
          openCategoryModal();
        }}
        onOpenCollectionWizard={() => {
          setActiveModule('collections');
          setIsCollectionWizardOpen(true);
        }}
        onOpenBulkImport={() => {
          setActiveModule('collections');
          setIsBulkImportOpen(true);
        }}
        onOpenProduct={() => {
          setActiveModule('products');
          openForm();
        }}
      />

      <AdminStatsCards
        totalProducts={products.length}
        featuredCount={featuredCount}
        newCount={newCount}
        categoriesCount={categoriesCount}
      />

      <AdminModuleSwitcher activeModule={activeModule} onChange={setActiveModule} />

      {isCustomizationModule ? (
        <SiteCustomizationPanel initialSection={customizationInitialSection} />
      ) : (
        <>
          {activeModule === 'orders' ? (
            <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-600">
              A sacola pública já está ativa com finalização pelo WhatsApp. Neste momento, a gestão de atendimento
              fica centralizada em "Contato" (número, link e CTA), enquanto este módulo permanece reservado para
              futuras evoluções de operação.
            </section>
          ) : (
            <>
              {activeModule === 'collections' && (
                <CollectionActions
                  collections={collectionOptions}
                  isDuplicating={isDuplicatingCollection}
                  onDuplicateCollection={handleDuplicateCollection}
                />
              )}

              {activeModule === 'media' && (
                <section className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  O módulo de mídia usa o editor de produto para upload, capa, ordenação e galeria. Clique em
                  "Editar" para abrir o gerenciador visual de imagens e manter o padrão premium no catálogo.
                </section>
              )}

              <ProductsList
                products={filteredProducts}
                searchQuery={adminSearch}
                statusFilter={adminStatusFilter}
                onSearchChange={setAdminSearch}
                onStatusFilterChange={setAdminStatusFilter}
                onEdit={(product) => openForm(product)}
                onDelete={(product) => setPendingDeleteProduct(product)}
                onCreateProduct={() => openForm()}
                onCreateCollection={() => {
                  setActiveModule('collections');
                  setIsCollectionWizardOpen(true);
                }}
              />
            </>
          )}
        </>
      )}

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        onSubmit={handleCreateCategory}
        newCategoryName={newCategoryName}
        newCategoryError={newCategoryError}
        onNewCategoryNameChange={handleNewCategoryNameChange}
        productCategoryOptions={productCategoryOptions}
        customCategoryOptions={customCategoryOptions}
        onDeleteCategory={(category) =>
          handleDeleteCategory(category, formData.category, (nextCategory) => setFieldValue('category', nextCategory))
        }
        getFieldClassName={getFieldClassName}
      />

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
        uploadedGalleryCount={galleryImageDrafts.length}
        localGalleryCount={persistedGalleryImageRefs.length}
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
        title="Confirmar exclusão"
        description="Essa ação remove o produto do catálogo local imediatamente."
        itemName={pendingDeleteProduct?.name}
        itemCode={pendingDeleteProduct?.sku || pendingDeleteProduct?.id}
        onCancel={() => setPendingDeleteProduct(null)}
        onConfirm={handleDelete}
      />
    </Container>
  );
}







