import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Image as ImageIcon, Loader2, MoveLeft, MoveRight, Star, Trash2, Upload } from 'lucide-react';
import { CatalogImage } from '../../../components/CatalogImage';
import { FormErrors } from '../types';
import { isLocalImageRefSource, isPreviewImageSource } from '../../../utils/imageSources';

export interface ProductImageManagerItem {
  id: string;
  src: string;
  isFeatured: boolean;
  sizeBytes?: number;
  sourceLabel: string;
  canSetFeatured: boolean;
}

interface ProductImageManagerProps {
  featuredImage: string;
  imagesInput: string;
  uploadedGalleryCount: number;
  totalImageCount: number;
  maxImageCount: number;
  hasFeaturedUploadDraft: boolean;
  isUploadPreparing: boolean;
  uploadPrepareCompleted: number;
  uploadPrepareTotal: number;
  isPersistingUploads: boolean;
  uploadPersistCompleted: number;
  uploadPersistTotal: number;
  uploadError: string | null;
  formErrors: FormErrors;
  imageItems: ProductImageManagerItem[];
  hasInvalidPreviewImage: boolean;
  maxUploadSizeMb: number;
  onFeaturedImageChange: (value: string) => void;
  onImagesInputChange: (value: string) => void;
  onFeaturedImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  onGalleryUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  onGalleryDropUpload: (files: File[]) => Promise<void> | void;
  onClearUploadedGallery: () => void;
  onRemoveImage: (imageId: string) => void;
  onSetFeaturedImage: (imageId: string) => void;
  onMoveImage: (imageId: string, direction: 'left' | 'right') => void;
  onReorderImages: (sourceId: string, targetId: string) => void;
  getFieldClassName: (hasError: boolean) => string;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) {
    return null;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const filterImageFiles = (files: File[]) => files.filter((file) => file.type.startsWith('image/'));

export const ProductImageManager = ({
  featuredImage,
  imagesInput,
  uploadedGalleryCount,
  totalImageCount,
  maxImageCount,
  hasFeaturedUploadDraft,
  isUploadPreparing,
  uploadPrepareCompleted,
  uploadPrepareTotal,
  isPersistingUploads,
  uploadPersistCompleted,
  uploadPersistTotal,
  uploadError,
  formErrors,
  imageItems,
  hasInvalidPreviewImage,
  maxUploadSizeMb,
  onFeaturedImageChange,
  onImagesInputChange,
  onFeaturedImageUpload,
  onGalleryUpload,
  onGalleryDropUpload,
  onClearUploadedGallery,
  onRemoveImage,
  onSetFeaturedImage,
  onMoveImage,
  onReorderImages,
  getFieldClassName
}: ProductImageManagerProps) => {
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);

  const isStoredFeaturedImage = isLocalImageRefSource(featuredImage);
  const isDataFeaturedImage = featuredImage.trim().startsWith('data:image/');
  const hasHiddenFeaturedImageSource = hasFeaturedUploadDraft || isStoredFeaturedImage || isDataFeaturedImage;
  const featuredImageInputValue = hasHiddenFeaturedImageSource ? '' : featuredImage;
  const isAtLimit = totalImageCount >= maxImageCount;
  const firstMovableIndex = imageItems.some((item) => item.isFeatured) ? 1 : 0;

  const imageItemsMap = useMemo(() => new Map(imageItems.map((item) => [item.id, item])), [imageItems]);

  const handleDropzoneDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
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

    const droppedFiles = filterImageFiles(Array.from(event.dataTransfer.files));
    if (droppedFiles.length === 0) {
      return;
    }

    await onGalleryDropUpload(droppedFiles);
  };

  const handleImageDragStart = (imageId: string) => {
    setDraggedImageId(imageId);
  };

  const handleImageDrop = (targetId: string) => {
    if (!draggedImageId || draggedImageId === targetId) {
      setDraggedImageId(null);
      return;
    }

    if (!imageItemsMap.has(draggedImageId)) {
      setDraggedImageId(null);
      return;
    }

    onReorderImages(draggedImageId, targetId);
    setDraggedImageId(null);
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Imagem destaque (URL) *</label>
          <input
            type="url"
            value={featuredImageInputValue}
            onChange={(event) => onFeaturedImageChange(event.target.value)}
            placeholder={hasHiddenFeaturedImageSource ? 'Imagem local selecionada' : 'https://...'}
            className={getFieldClassName(Boolean(formErrors.featuredImage))}
          />
          {formErrors.featuredImage && <p className="mt-1 text-xs text-red-600">{formErrors.featuredImage}</p>}

          <label className="premium-interactive mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Upload da imagem destaque
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="sr-only"
              onChange={onFeaturedImageUpload}
            />
          </label>

          {hasHiddenFeaturedImageSource && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-gray-600">
                {hasFeaturedUploadDraft
                  ? 'Imagem de destaque pronta para salvar.'
                  : isStoredFeaturedImage
                    ? 'Imagem de destaque armazenada localmente no navegador.'
                    : 'Imagem de destaque em formato interno.'}
              </p>
              <button
                type="button"
                onClick={() => onFeaturedImageChange('')}
                className="premium-interactive premium-focus rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:ring-gray-900"
              >
                Remover
              </button>
            </div>
          )}

          <p className="mt-1 text-xs text-gray-500">Arquivos JPG, PNG ou WEBP com até {maxUploadSizeMb}MB.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Galeria (URLs, uma por linha)</label>
          <textarea
            rows={3}
            value={imagesInput}
            onChange={(event) => onImagesInputChange(event.target.value)}
            placeholder={`https://img1.jpg\nhttps://img2.jpg`}
            className={getFieldClassName(Boolean(formErrors.images))}
          />
          {formErrors.images && <p className="mt-1 text-xs text-red-600">{formErrors.images}</p>}

          <label className="premium-interactive mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Upload múltiplo da galeria
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={onGalleryUpload}
            />
          </label>

          {uploadedGalleryCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-gray-600">{uploadedGalleryCount} imagem(ns) local(is) pronta(s) para salvar.</p>
              <button
                type="button"
                onClick={onClearUploadedGallery}
                className="premium-interactive premium-focus rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:ring-gray-900"
              >
                Limpar uploads
              </button>
            </div>
          )}

          <p className="mt-1 text-xs text-gray-500">Você pode combinar URLs e imagens enviadas por upload.</p>
        </div>
      </div>

      <div
        className={`mt-4 rounded-xl border border-dashed p-4 transition-colors ${
          isDropzoneActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 bg-white'
        }`}
        onDragOver={handleDropzoneDragOver}
        onDragEnter={handleDropzoneDragOver}
        onDragLeave={handleDropzoneDragLeave}
        onDrop={handleDropzoneDrop}
      >
        <p className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <ArrowLeftRight className="h-4 w-4" />
          Arraste imagens aqui para upload da galeria
        </p>
        <p className="mt-1 text-xs text-gray-500">Upload múltiplo com preview em tempo real e sem base64.</p>
      </div>

      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <span className={isAtLimit ? 'font-semibold text-amber-700' : ''}>
            {totalImageCount} de {maxImageCount} imagens utilizadas
          </span>
          {isUploadPreparing && uploadPrepareTotal > 0 && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Processando {uploadPrepareCompleted}/{uploadPrepareTotal}
            </span>
          )}
          {isPersistingUploads && uploadPersistTotal > 0 && (
            <span className="inline-flex items-center gap-1 text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Salvando {uploadPersistCompleted}/{uploadPersistTotal}
            </span>
          )}
        </div>

        {isAtLimit && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Limite atingido. Remova uma imagem para adicionar outra.
          </p>
        )}

        {(isUploadPreparing && uploadPrepareTotal > 0) || (isPersistingUploads && uploadPersistTotal > 0) ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gray-700 transition-all"
              style={{
                width: `${
                  isPersistingUploads && uploadPersistTotal > 0
                    ? Math.max(6, (uploadPersistCompleted / uploadPersistTotal) * 100)
                    : uploadPrepareTotal > 0
                      ? Math.max(6, (uploadPrepareCompleted / uploadPrepareTotal) * 100)
                      : 0
                }%`
              }}
            />
          </div>
        ) : null}

        {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <ImageIcon className="h-4 w-4 text-gray-500" />
            Gerenciamento da galeria
          </h4>
          <span className="text-xs text-gray-500">{imageItems.length} imagem(ns)</span>
        </div>

        {imageItems.length === 0 ? (
          <p className="text-sm text-gray-500">Adicione URLs ou faça upload para visualizar e organizar a galeria.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {imageItems.map((image, index) => {
              const validImage = isPreviewImageSource(image.src);
              const sizeLabel = formatFileSize(image.sizeBytes);
              const canMoveLeft = !image.isFeatured && index > firstMovableIndex;
              const canMoveRight = !image.isFeatured && index < imageItems.length - 1;

              return (
                <article
                  key={image.id}
                  className={`rounded-xl border bg-white p-2 transition-colors ${
                    image.isFeatured ? 'border-gray-900 shadow-sm' : 'border-gray-200'
                  }`}
                  draggable={!image.isFeatured}
                  onDragStart={() => handleImageDragStart(image.id)}
                  onDragOver={(event) => {
                    if (draggedImageId && draggedImageId !== image.id) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleImageDrop(image.id);
                  }}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    {validImage ? (
                      <CatalogImage
                        src={image.src}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                        fallback={{
                          style: 'editorial',
                          seed: `admin-image-${index}`,
                          label: 'Imagem do produto'
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-2 text-center text-xs text-red-600">
                        Imagem inválida
                      </div>
                    )}
                    {image.isFeatured && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        <Star className="h-3 w-3" />
                        Principal
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className="truncate text-[11px] font-medium text-gray-700">{image.sourceLabel}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{sizeLabel || 'Sem metadados'}</span>
                      {!image.isFeatured && <span>{index}</span>}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => onSetFeaturedImage(image.id)}
                      disabled={image.isFeatured || !image.canSetFeatured}
                      className="premium-interactive rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveImage(image.id)}
                      className="premium-interactive rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                    >
                      Remover
                    </button>
                  </div>

                  {!image.isFeatured && (
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => onMoveImage(image.id, 'left')}
                        disabled={!canMoveLeft}
                        className="premium-interactive inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <MoveLeft className="h-3 w-3" />
                        Esquerda
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveImage(image.id, 'right')}
                        disabled={!canMoveRight}
                        className="premium-interactive inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <MoveRight className="h-3 w-3" />
                        Direita
                      </button>
                    </div>
                  )}

                  {!image.isFeatured && (
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">Arraste para reordenar</p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {hasInvalidPreviewImage && (
          <p className="mt-3 text-xs text-red-600">Existem imagens inválidas na galeria. Revise antes de salvar.</p>
        )}
      </div>
    </>
  );
};
