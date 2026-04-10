import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FolderUp,
  ImagePlus,
  Layers3,
  Loader2,
  Sparkles,
  Trash2,
  WandSparkles
} from 'lucide-react';
import { Button } from '../../../components/Button';
import { CatalogImage } from '../../../components/CatalogImage';
import { Modal } from '../../../components/Modal';
import { ImageStorageService } from '../../../services/imageStorageService';
import { ProductCreateInput } from '../../../types';
import {
  IMAGE_UPLOAD_ACCEPT_ATTR,
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB,
  validateImageUploadFiles
} from '../../../utils/imageSources';
import {
  buildCollectionImageDraft,
  buildDefaultDescription,
  CollectionWizardDraftProduct,
  CollectionWizardImageDraft,
  ensureUniqueSku,
  groupCollectionImageDrafts,
  MAX_COLLECTION_WIZARD_IMAGES,
  normalizeSkuKey,
  parseCommaList,
  parsePriceInput,
  revokeCollectionImageDraft,
  revokeCollectionImageDrafts,
  toDraftProductId,
  toProductSlug
} from '../utils/collectionWizard';

interface ConfirmSummary {
  collectionName: string;
  season: string;
  productCount: number;
  imageCount: number;
}

interface CollectionWizardProps {
  isOpen: boolean;
  isSubmitting: boolean;
  categoryOptions: string[];
  genderOptions: string[];
  existingSkus: string[];
  onClose: () => void;
  onConfirm: (products: ProductCreateInput[], summary: ConfirmSummary) => Promise<void> | void;
}

const WIZARD_STEPS = [
  'Dados da coleção',
  'Upload de imagens',
  'Agrupamento automático',
  'Edição em lote',
  'Revisão',
  'Confirmação'
] as const;

const DEFAULT_SIZES = '38, 40, 42, 44';

export const CollectionWizard = ({
  isOpen,
  isSubmitting,
  categoryOptions,
  genderOptions,
  existingSkus,
  onClose,
  onConfirm
}: CollectionWizardProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [collectionName, setCollectionName] = useState('');
  const [season, setSeason] = useState('');
  const [defaultCategory, setDefaultCategory] = useState(categoryOptions[0] || '');
  const [defaultGender, setDefaultGender] = useState(genderOptions[0] || '');
  const [imageDrafts, setImageDrafts] = useState<CollectionWizardImageDraft[]>([]);
  const [productDrafts, setProductDrafts] = useState<CollectionWizardDraftProduct[]>([]);
  const [batchPriceInput, setBatchPriceInput] = useState('');
  const [batchCategory, setBatchCategory] = useState(categoryOptions[0] || '');
  const [batchGender, setBatchGender] = useState(genderOptions[0] || '');
  const [batchSizesInput, setBatchSizesInput] = useState(DEFAULT_SIZES);
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isPersistingImages, setIsPersistingImages] = useState(false);
  const [persistCompleted, setPersistCompleted] = useState(0);
  const [persistTotal, setPersistTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [productErrorsById, setProductErrorsById] = useState<Record<string, string[]>>({});
  const [groupedImageSignature, setGroupedImageSignature] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageDraftsRef = useRef<CollectionWizardImageDraft[]>([]);

  const isBusy = isSubmitting || isPersistingImages || isProcessingUpload;

  const imageDraftById = useMemo(() => new Map(imageDrafts.map((item) => [item.id, item])), [imageDrafts]);
  const imageSignature = useMemo(() => imageDrafts.map((item) => item.fileKey).join('|'), [imageDrafts]);
  const groupedImages = useMemo(() => groupCollectionImageDrafts(imageDrafts), [imageDrafts]);
  const isGroupingOutdated = groupedImageSignature !== imageSignature;
  const hasReachedUploadLimit = imageDrafts.length >= MAX_COLLECTION_WIZARD_IMAGES;
  const totalDroppedImages = useMemo(
    () => groupedImages.reduce((total, group) => total + group.droppedImageCount, 0),
    [groupedImages]
  );

  useEffect(() => {
    imageDraftsRef.current = imageDrafts;
  }, [imageDrafts]);

  useEffect(
    () => () => {
      revokeCollectionImageDrafts(imageDraftsRef.current);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      revokeCollectionImageDrafts(imageDraftsRef.current);
      imageDraftsRef.current = [];
      setStepIndex(0);
      setCollectionName('');
      setSeason('');
      setDefaultCategory(categoryOptions[0] || '');
      setDefaultGender(genderOptions[0] || '');
      setImageDrafts([]);
      setProductDrafts([]);
      setBatchPriceInput('');
      setBatchCategory(categoryOptions[0] || '');
      setBatchGender(genderOptions[0] || '');
      setBatchSizesInput(DEFAULT_SIZES);
      setIsDropzoneActive(false);
      setIsProcessingUpload(false);
      setIsPersistingImages(false);
      setPersistCompleted(0);
      setPersistTotal(0);
      setErrorMessage('');
      setProductErrorsById({});
      setGroupedImageSignature('');
      return;
    }

    setDefaultCategory((value) => value || categoryOptions[0] || '');
    setDefaultGender((value) => value || genderOptions[0] || '');
    setBatchCategory((value) => value || categoryOptions[0] || '');
    setBatchGender((value) => value || genderOptions[0] || '');
  }, [isOpen, categoryOptions, genderOptions]);

  const closeWizard = () => {
    if (isBusy) {
      return;
    }

    onClose();
  };

  const appendFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    if (isBusy) {
      setErrorMessage('Aguarde o processamento atual terminar para adicionar novas imagens.');
      return;
    }

    const validationError = validateImageUploadFiles(files);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const existingFileKeys = new Set(imageDraftsRef.current.map((item) => item.fileKey));
    const uniqueFiles = files.filter((file) => !existingFileKeys.has(`${file.name}-${file.size}-${file.lastModified}`));

    if (uniqueFiles.length === 0) {
      setErrorMessage('As imagens selecionadas já foram adicionadas.');
      return;
    }

    if (imageDraftsRef.current.length + uniqueFiles.length > MAX_COLLECTION_WIZARD_IMAGES) {
      setErrorMessage(`Use no máximo ${MAX_COLLECTION_WIZARD_IMAGES} imagens por coleção no wizard.`);
      return;
    }

    setIsProcessingUpload(true);
    setErrorMessage('');

    const nextDrafts: CollectionWizardImageDraft[] = [];

    try {
      uniqueFiles.forEach((file) => {
        nextDrafts.push(buildCollectionImageDraft(file));
      });

      setImageDrafts((previous) => [...previous, ...nextDrafts]);
    } catch (error) {
      nextDrafts.forEach((draft) => revokeCollectionImageDraft(draft));
      setErrorMessage('Não foi possível preparar as imagens selecionadas.');
      console.error('Erro ao preparar imagens do wizard', error);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    const files = fileList
      ? Array.from({ length: fileList.length }, (_, index) => fileList.item(index)).filter(
          (file): file is File => file !== null
        )
      : [];

    event.target.value = '';
    await appendFiles(files);
  };

  const handleDropzoneDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isBusy || hasReachedUploadLimit) {
      return;
    }
    if (!isDropzoneActive) {
      setIsDropzoneActive(true);
    }
  };

  const handleDropzoneDragLeave: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDropzoneActive(false);
  };

  const handleDropzoneDrop: React.DragEventHandler<HTMLDivElement> = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDropzoneActive(false);

    if (isBusy) {
      setErrorMessage('Aguarde o processamento atual terminar para adicionar novas imagens.');
      return;
    }

    if (hasReachedUploadLimit) {
      setErrorMessage(`Use no máximo ${MAX_COLLECTION_WIZARD_IMAGES} imagens por coleção no wizard.`);
      return;
    }

    const fileList = event.dataTransfer.files;
    const droppedFiles = fileList
      ? Array.from({ length: fileList.length }, (_, index) => fileList.item(index)).filter(
          (file): file is File => file !== null
        )
      : [];

    await appendFiles(droppedFiles);
  };

  const handleRemoveImageDraft = (draftId: string) => {
    setImageDrafts((previous) => {
      const target = previous.find((draft) => draft.id === draftId);
      if (!target) {
        return previous;
      }

      revokeCollectionImageDraft(target);
      return previous.filter((draft) => draft.id !== draftId);
    });

    setProductDrafts((previous) =>
      previous
        .map((product) => ({ ...product, imageIds: product.imageIds.filter((imageId) => imageId !== draftId) }))
        .filter((product) => product.imageIds.length > 0)
    );
    setProductErrorsById({});
  };

  const handleClearImages = () => {
    revokeCollectionImageDrafts(imageDraftsRef.current);
    imageDraftsRef.current = [];
    setImageDrafts([]);
    setProductDrafts([]);
    setGroupedImageSignature('');
    setProductErrorsById({});
    setErrorMessage('');
  };
  const regenerateProductDrafts = () => {
    if (groupedImages.length === 0) {
      setProductDrafts([]);
      setGroupedImageSignature(imageSignature);
      setErrorMessage('Envie imagens para gerar produtos automaticamente.');
      return;
    }

    const existingByGroup = new Map<string, CollectionWizardDraftProduct>(
      productDrafts.map((product): [string, CollectionWizardDraftProduct] => [product.groupKey, product])
    );
    const usedSkuKeys = new Set(existingSkus.map((sku) => normalizeSkuKey(sku)).filter(Boolean));

    const nextDrafts: CollectionWizardDraftProduct[] = groupedImages.map((group, index) => {
      const existing = existingByGroup.get(group.groupKey);
      const draftName = existing?.name?.trim() || group.displayName;
      const candidateSku = existing?.sku?.trim() || group.skuSeed;

      return {
        id: existing?.id || toDraftProductId(group.groupKey),
        groupKey: group.groupKey,
        name: draftName,
        sku: ensureUniqueSku(candidateSku, usedSkuKeys),
        description: existing?.description || buildDefaultDescription(draftName, collectionName.trim(), season.trim()),
        priceInput: existing?.priceInput || '',
        category: existing?.category || defaultCategory,
        gender: existing?.gender || defaultGender,
        sizesInput: existing?.sizesInput || DEFAULT_SIZES,
        collection: existing?.collection || collectionName.trim(),
        season: existing?.season || season.trim(),
        isFeatured: existing?.isFeatured ?? index === 0,
        isNew: existing?.isNew ?? true,
        label: existing?.label || '',
        imageIds: group.imageIds,
        droppedImageCount: group.droppedImageCount
      };
    });

    setProductDrafts(nextDrafts);
    setGroupedImageSignature(imageSignature);
    setErrorMessage('');
    setProductErrorsById({});
  };

  const applyBatchValues = () => {
    if (productDrafts.length === 0) {
      setErrorMessage('Gere os produtos automaticamente antes de aplicar edição em lote.');
      return;
    }

    const hasBatchPrice = batchPriceInput.trim().length > 0;
    const hasBatchSizes = batchSizesInput.trim().length > 0;

    if (!hasBatchPrice && !hasBatchSizes && !batchCategory && !batchGender) {
      setErrorMessage('Informe ao menos um campo para aplicar em lote.');
      return;
    }

    setProductDrafts((previous) =>
      previous.map((product) => ({
        ...product,
        priceInput: hasBatchPrice ? batchPriceInput : product.priceInput,
        category: batchCategory || product.category,
        gender: batchGender || product.gender,
        sizesInput: hasBatchSizes ? batchSizesInput : product.sizesInput,
        collection: collectionName.trim() || product.collection,
        season: season.trim() || product.season
      }))
    );
    setErrorMessage('');
  };

  const updateProductDraft = (draftId: string, patch: Partial<CollectionWizardDraftProduct>) => {
    setProductDrafts((previous) => previous.map((item) => (item.id === draftId ? { ...item, ...patch } : item)));

    setProductErrorsById((previous) => {
      if (!previous[draftId]) {
        return previous;
      }

      const nextErrors = { ...previous };
      delete nextErrors[draftId];
      return nextErrors;
    });
  };

  const removeProductDraft = (draftId: string) => {
    setProductDrafts((previous) => previous.filter((item) => item.id !== draftId));
    setProductErrorsById((previous) => {
      if (!previous[draftId]) {
        return previous;
      }

      const nextErrors = { ...previous };
      delete nextErrors[draftId];
      return nextErrors;
    });
  };

  const validateProductDrafts = () => {
    const nextErrors: Record<string, string[]> = {};
    const existingSkuKeys = new Set(existingSkus.map((sku) => normalizeSkuKey(sku)).filter(Boolean));
    const draftSkuCount = new Map<string, number>();

    productDrafts.forEach((product) => {
      const normalizedSku = normalizeSkuKey(product.sku);
      if (!normalizedSku) {
        return;
      }

      draftSkuCount.set(normalizedSku, (draftSkuCount.get(normalizedSku) || 0) + 1);
    });

    productDrafts.forEach((product) => {
      const errors: string[] = [];
      const normalizedSku = normalizeSkuKey(product.sku);
      const parsedPrice = parsePriceInput(product.priceInput);
      const sizes = parseCommaList(product.sizesInput);

      if (product.name.trim().length < 3) {
        errors.push('Nome com mínimo de 3 caracteres.');
      }

      if (product.sku.trim().length < 4) {
        errors.push('SKU com mínimo de 4 caracteres.');
      } else if (existingSkuKeys.has(normalizedSku)) {
        errors.push('SKU já existe no catálogo.');
      } else if ((draftSkuCount.get(normalizedSku) || 0) > 1) {
        errors.push('SKU duplicado dentro do wizard.');
      }

      if (!Number.isFinite(parsedPrice) || (parsedPrice ?? 0) <= 0) {
        errors.push('Preço inválido. Informe um valor maior que zero.');
      }

      if (!product.category || product.category.toLocaleLowerCase('pt-BR') === 'todos') {
        errors.push('Selecione uma categoria válida.');
      }

      if (!product.gender || product.gender.toLocaleLowerCase('pt-BR') === 'todos') {
        errors.push('Selecione um gênero válido.');
      }

      if (sizes.length === 0) {
        errors.push('Informe ao menos um tamanho.');
      }

      if (!product.collection.trim()) {
        errors.push('Coleção obrigatória.');
      }

      if (product.imageIds.length === 0) {
        errors.push('Produto sem imagens.');
      } else if (product.imageIds.some((imageId) => !imageDraftById.has(imageId))) {
        errors.push('Existe imagem removida que precisa ser atualizada.');
      }

      if (errors.length > 0) {
        nextErrors[product.id] = errors;
      }
    });

    setProductErrorsById(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goToNextStep = () => {
    if (stepIndex === 0) {
      if (collectionName.trim().length < 2) {
        setErrorMessage('Informe o nome da coleção com ao menos 2 caracteres.');
        return;
      }

      if (!defaultCategory || !defaultGender) {
        setErrorMessage('Selecione categoria e gênero padrão para continuar.');
        return;
      }
    }

    if (stepIndex === 1 && imageDrafts.length === 0) {
      setErrorMessage('Adicione imagens para continuar.');
      return;
    }

    if (stepIndex === 2) {
      if (isGroupingOutdated || productDrafts.length === 0) {
        regenerateProductDrafts();
      }

      if (groupedImages.length === 0) {
        setErrorMessage('Não foi possível criar grupos de produtos a partir das imagens.');
        return;
      }
    }

    if (stepIndex === 4) {
      if (productDrafts.length === 0) {
        setErrorMessage('Nenhum produto disponivel para confirmar.');
        return;
      }

      if (!validateProductDrafts()) {
        setErrorMessage('Revise os produtos com erros antes de confirmar.');
        return;
      }
    }

    setErrorMessage('');
    setStepIndex((current) => Math.min(WIZARD_STEPS.length - 1, current + 1));
  };

  const goToPreviousStep = () => {
    setErrorMessage('');
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const handleConfirmSave = async () => {
    if (isBusy) {
      return;
    }

    if (productDrafts.length === 0) {
      setErrorMessage('Não existem produtos para salvar.');
      return;
    }

    if (!validateProductDrafts()) {
      setStepIndex(4);
      setErrorMessage('Revise os produtos com erros antes da confirmação final.');
      return;
    }

    const uniqueImageIds: string[] = Array.from(
      new Set<string>(productDrafts.flatMap((product) => product.imageIds))
    );
    if (uniqueImageIds.length === 0) {
      setErrorMessage('Nenhuma imagem valida encontrada para salvar.');
      return;
    }

    const imageQueue = uniqueImageIds
      .map((imageId) => imageDraftById.get(imageId))
      .filter((image): image is CollectionWizardImageDraft => Boolean(image));

    if (imageQueue.length !== uniqueImageIds.length) {
      setErrorMessage('Algumas imagens foram removidas. Reagrupe os produtos e tente novamente.');
      return;
    }

    const now = Date.now();
    const filesToPersist = imageQueue.map((image) => image.file);
    let savedRefs: string[] = [];

    setIsPersistingImages(true);
    setPersistCompleted(0);
    setPersistTotal(filesToPersist.length);
    setErrorMessage('');

    try {
      savedRefs = await ImageStorageService.saveFiles(filesToPersist, (completed, total) => {
        setPersistCompleted(completed);
        setPersistTotal(total);
      });

      const refsByImageId = new Map<string, string>();
      uniqueImageIds.forEach((imageId, index) => {
        const ref = savedRefs[index];
        if (ref) {
          refsByImageId.set(imageId, ref);
        }
      });

      const payload: ProductCreateInput[] = productDrafts.map((product, index) => {
        const images = product.imageIds
          .map((imageId) => refsByImageId.get(imageId))
          .filter((imageRef): imageRef is string => Boolean(imageRef));
        const name = product.name.trim();

        return {
          name,
          sku: product.sku.trim(),
          slug: toProductSlug(name) || undefined,
          description: product.description.trim() || buildDefaultDescription(name, product.collection, product.season),
          price: parsePriceInput(product.priceInput) || 0,
          featuredImage: images[0] || '',
          images,
          category: product.category,
          gender: product.gender,
          sizes: parseCommaList(product.sizesInput),
          collection: product.collection.trim() || undefined,
          season: product.season.trim() || undefined,
          stockStatus: 'in_stock',
          createdAt: new Date(now + index * 1000).toISOString(),
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          label: product.label.trim() || undefined
        };
      });

      await onConfirm(payload, {
        collectionName: collectionName.trim(),
        season: season.trim(),
        productCount: payload.length,
        imageCount: uniqueImageIds.length
      });
    } catch (error) {
      console.error('Erro ao salvar coleção no wizard', error);

      if (savedRefs.length > 0) {
        await Promise.all(savedRefs.map((ref) => ImageStorageService.deleteByRef(ref).catch(() => undefined)));
      }

      setErrorMessage('Não foi possível salvar a coleção. Tente novamente.');
    } finally {
      setIsPersistingImages(false);
    }
  };

  const renderStep1 = () => (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome da coleção *</label>
          <input
            type="text"
            value={collectionName}
            onChange={(event) => setCollectionName(event.target.value)}
            placeholder="Ex: Outono Inverno 2026"
            className="field-control"
          />
          <p className="mt-1 text-xs text-gray-500">Esse nome sera aplicado aos produtos gerados no wizard.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Temporada / Campanha</label>
          <input
            type="text"
            value={season}
            onChange={(event) => setSeason(event.target.value)}
            placeholder="Ex: Drop Denim Signature"
            className="field-control"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Categoria padrão *</label>
          <select value={defaultCategory} onChange={(event) => setDefaultCategory(event.target.value)} className="field-control">
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Gênero padrão *</label>
          <select value={defaultGender} onChange={(event) => setDefaultGender(event.target.value)} className="field-control">
            {genderOptions.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
  const renderStep2 = () => (
    <section className="space-y-4">
      <div
        className={`rounded-2xl border border-dashed p-6 transition-colors ${
          isDropzoneActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 bg-white'
        }`}
        onDragOver={handleDropzoneDragOver}
        onDragEnter={handleDropzoneDragOver}
        onDragLeave={handleDropzoneDragLeave}
        onDrop={handleDropzoneDrop}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
              <ImagePlus className="h-4 w-4" />
              Upload múltiplo de imagens
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Arraste e solte ou selecione arquivos JPG, PNG ou WEBP de até {MAX_PRODUCT_IMAGE_UPLOAD_SIZE_MB}MB.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy || hasReachedUploadLimit}
          >
            <FolderUp className="h-4 w-4" />
            Selecionar imagens
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_UPLOAD_ACCEPT_ATTR}
          multiple
          className="sr-only"
          disabled={isBusy || hasReachedUploadLimit}
          onChange={handleFileInputChange}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
        <span>
          {imageDrafts.length} imagem(ns) selecionada(s) de {MAX_COLLECTION_WIZARD_IMAGES}
        </span>
        {isProcessingUpload && (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processando uploads...
          </span>
        )}
        {hasReachedUploadLimit && (
          <span className="font-medium text-amber-700">
            Limite atingido. Remova imagens para adicionar novas.
          </span>
        )}
        {imageDrafts.length > 0 && (
          <button
            type="button"
            onClick={handleClearImages}
            disabled={isBusy}
            className="premium-interactive rounded-md border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-700 hover:bg-gray-100"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {imageDrafts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {imageDrafts.map((image) => (
            <article key={image.id} className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <CatalogImage
                  src={image.objectUrl}
                  alt={image.fileName}
                  className="h-full w-full object-cover"
                  fallback={{ style: 'editorial', seed: image.id, label: 'Imagem' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImageDraft(image.id)}
                  disabled={isBusy}
                  className="premium-interactive absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-100 bg-white/95 text-red-600 hover:bg-red-50"
                  aria-label={`Remover ${image.fileName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 truncate text-[11px] font-medium text-gray-700">{image.fileName}</p>
              <p className="text-[11px] text-gray-500">{Math.max(1, Math.round(image.sizeBytes / 1024))} KB</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          Nenhuma imagem adicionada ainda.
        </p>
      )}
    </section>
  );

  const renderStep3 = () => (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Agrupamento automático por nome de arquivo</p>
          <p className="text-xs text-gray-500">
            Exemplo: JEANS-001-1.jpg + JEANS-001-2.jpg vira um produto JEANS-001. Sem padrão reconhecido, cada arquivo vira um produto.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={regenerateProductDrafts} disabled={imageDrafts.length === 0}>
          <WandSparkles className="h-4 w-4" />
          Agrupar imagens
        </Button>
      </div>

      {isGroupingOutdated && productDrafts.length > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          As imagens foram alteradas. Clique em "Agrupar imagens" para atualizar os produtos gerados.
        </p>
      )}

      {totalDroppedImages > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          {totalDroppedImages} imagem(ns) excederam o limite por produto e foram desconsideradas no agrupamento.
        </p>
      )}

      {groupedImages.length > 0 ? (
        <div className="space-y-3">
          {groupedImages.map((group) => {
            const firstImage = imageDraftById.get(group.imageIds[0]);

            return (
              <article key={group.groupKey} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  {firstImage ? (
                    <CatalogImage
                      src={firstImage.objectUrl}
                      alt={group.displayName}
                      className="h-full w-full object-cover"
                      fallback={{ style: 'editorial', seed: group.groupKey, label: group.displayName }}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{group.displayName}</p>
                  <p className="truncate text-xs text-gray-500">SKU base: {group.skuSeed}</p>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <p>{group.imageIds.length} imagem(ns)</p>
                  {group.droppedImageCount > 0 && <p className="font-medium text-amber-700">+{group.droppedImageCount} excedente(s)</p>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          Sem grupos gerados. Adicione imagens na etapa anterior.
        </p>
      )}
    </section>
  );
  const renderStep4 = () => (
    <section className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-800">Editar varios produtos ao mesmo tempo</p>
        <p className="mt-1 text-xs text-gray-500">Aplique preço, categoria, gênero e tamanhos para todos os itens.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Preço (R$)</label>
            <input type="text" value={batchPriceInput} onChange={(event) => setBatchPriceInput(event.target.value)} className="field-control py-2" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Categoria</label>
            <select value={batchCategory} onChange={(event) => setBatchCategory(event.target.value)} className="field-control py-2">
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Gênero</label>
            <select value={batchGender} onChange={(event) => setBatchGender(event.target.value)} className="field-control py-2">
              {genderOptions.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Tamanhos</label>
            <input type="text" value={batchSizesInput} onChange={(event) => setBatchSizesInput(event.target.value)} className="field-control py-2" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-600">{productDrafts.length} produto(s) pronto(s) para receber os valores.</p>
          <Button type="button" variant="outline" onClick={applyBatchValues} disabled={productDrafts.length === 0}>
            Aplicar para todos
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {productDrafts.map((product) => {
          const preview = imageDraftById.get(product.imageIds[0]);

          return (
            <article key={product.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-12 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  {preview && (
                    <CatalogImage
                      src={preview.objectUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      fallback={{ style: 'editorial', seed: product.id, label: product.name }}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{product.name}</p>
                  <p className="truncate text-xs text-gray-500">{product.sku}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">{product.category}</span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">{product.gender}</span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">{product.sizesInput}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );

  const renderStep5 = () => (
    <section className="space-y-4">
      <p className="text-sm text-gray-600">Revise os produtos e ajuste os campos individualmente antes de confirmar.</p>

      {productDrafts.length > 0 ? (
        <div className="space-y-4">
          {productDrafts.map((product) => {
            const preview = imageDraftById.get(product.imageIds[0]);
            const errors = productErrorsById[product.id] || [];

            return (
              <article key={product.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-18 w-14 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      {preview && (
                        <CatalogImage
                          src={preview.objectUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          fallback={{ style: 'editorial', seed: product.id, label: product.name }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.imageIds.length} imagem(ns) na galeria</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProductDraft(product.id)}
                    className="premium-interactive inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover item
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">Nome</label>
                    <input type="text" value={product.name} onChange={(event) => updateProductDraft(product.id, { name: event.target.value })} className="field-control py-2" />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">SKU</label>
                    <input type="text" value={product.sku} onChange={(event) => updateProductDraft(product.id, { sku: event.target.value })} className="field-control py-2" />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Preço</label>
                    <input type="text" value={product.priceInput} onChange={(event) => updateProductDraft(product.id, { priceInput: event.target.value })} className="field-control py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Categoria</label>
                    <select value={product.category} onChange={(event) => updateProductDraft(product.id, { category: event.target.value })} className="field-control py-2">
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Gênero</label>
                    <select value={product.gender} onChange={(event) => updateProductDraft(product.id, { gender: event.target.value })} className="field-control py-2">
                      {genderOptions.map((gender) => (
                        <option key={gender} value={gender}>
                          {gender}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Tamanhos</label>
                    <input type="text" value={product.sizesInput} onChange={(event) => updateProductDraft(product.id, { sizesInput: event.target.value })} className="field-control py-2" />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Label</label>
                    <input type="text" value={product.label} onChange={(event) => updateProductDraft(product.id, { label: event.target.value })} className="field-control py-2" />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Descrição</label>
                    <textarea rows={3} value={product.description} onChange={(event) => updateProductDraft(product.id, { description: event.target.value })} className="field-control py-2" />
                  </div>

                  <div className="space-y-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">Campanha</label>
                    <input type="text" value={product.collection} onChange={(event) => updateProductDraft(product.id, { collection: event.target.value })} className="field-control py-2" />
                    <input type="text" value={product.season} onChange={(event) => updateProductDraft(product.id, { season: event.target.value })} className="field-control py-2" />

                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={product.isFeatured} onChange={(event) => updateProductDraft(product.id, { isFeatured: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
                        Destaque
                      </label>

                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={product.isNew} onChange={(event) => updateProductDraft(product.id, { isNew: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
                        Novo
                      </label>
                    </div>
                  </div>
                </div>

                {errors.length > 0 && (
                  <ul className="mt-3 space-y-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {errors.map((error) => (
                      <li key={error}>- {error}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          Nenhum produto para revisar.
        </p>
      )}
    </section>
  );

  const renderStep6 = () => (
    <section className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-base font-semibold tracking-tight text-gray-900">Resumo da coleção</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.1em] text-gray-500">Coleção</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{collectionName || '-'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.1em] text-gray-500">Temporada</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{season || '-'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.1em] text-gray-500">Produtos</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{productDrafts.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.1em] text-gray-500">Imagens</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{imageDrafts.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Sparkles className="h-4 w-4 text-gray-500" />
          Confirmação final
        </p>
        <p className="mt-1 text-xs text-gray-500">Ao confirmar, os produtos serão salvos no catálogo local.</p>

        {isPersistingImages && persistTotal > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Persistindo imagens no navegador</span>
              <span>{persistCompleted}/{persistTotal}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-gray-800 transition-all" style={{ width: `${Math.max(6, (persistCompleted / persistTotal) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const renderCurrentStep = () => {
    if (stepIndex === 0) {
      return renderStep1();
    }

    if (stepIndex === 1) {
      return renderStep2();
    }

    if (stepIndex === 2) {
      return renderStep3();
    }

    if (stepIndex === 3) {
      return renderStep4();
    }

    if (stepIndex === 4) {
      return renderStep5();
    }

    return renderStep6();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeWizard}
      title="Collection Wizard"
      description="Crie uma coleção completa com upload visual e edição em lote, sem depender de CSV."
      maxWidthClassName="sm:max-w-7xl"
      bodyClassName="p-0"
    >
      <div className="max-h-[84vh] overflow-y-auto p-6">
        <div className="mb-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {WIZARD_STEPS.map((step, index) => {
            const isCurrent = index === stepIndex;
            const isDone = index < stepIndex;

            return (
              <div
                key={step}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                  isCurrent
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : isDone
                      ? 'border-gray-200 bg-gray-50 text-gray-700'
                      : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                <div className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold">
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <p className="mt-1">{step}</p>
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        {renderCurrentStep()}
      </div>

      <div className="border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
            <Layers3 className="h-3.5 w-3.5" />
            Etapa {stepIndex + 1} de {WIZARD_STEPS.length}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={closeWizard} disabled={isBusy}>
              Cancelar
            </Button>

            <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={stepIndex === 0 || isBusy}>
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>

            {stepIndex === WIZARD_STEPS.length - 1 ? (
              <Button type="button" onClick={handleConfirmSave} disabled={isBusy || productDrafts.length === 0}>
                {(isBusy || isPersistingImages) && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar e salvar
              </Button>
            ) : (
              <Button type="button" onClick={goToNextStep} disabled={isBusy}>
                Avançar
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};


