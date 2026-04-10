import React from 'react';
import { CheckCircle2, Tags } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { FormErrors, ProductFormState } from '../types';
import { ProductFormSection } from './ProductFormSection';
import { ProductImageManager, ProductImageManagerItem } from './ProductImageManager';

interface ProductEditorProps {
  isOpen: boolean;
  isSubmitting: boolean;
  isEditing: boolean;
  formData: ProductFormState;
  formErrors: FormErrors;
  productCategoryOptions: string[];
  genderOptions: string[];
  imageItems: ProductImageManagerItem[];
  hasInvalidPreviewImage: boolean;
  maxUploadSizeMb: number;
  maxImageCount: number;
  totalImageCount: number;
  uploadedGalleryCount: number;
  localGalleryCount: number;
  hasFeaturedUploadDraft: boolean;
  isUploadPreparing: boolean;
  uploadPrepareCompleted: number;
  uploadPrepareTotal: number;
  isPersistingUploads: boolean;
  uploadPersistCompleted: number;
  uploadPersistTotal: number;
  uploadError: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFieldChange: <K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => void;
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

const stockStatusOptions = [
  { value: 'in_stock', label: 'Disponível' },
  { value: 'low_stock', label: 'Últimas unidades' },
  { value: 'out_of_stock', label: 'Indisponível' }
] as const;

export const ProductEditor = ({
  isOpen,
  isSubmitting,
  isEditing,
  formData,
  formErrors,
  productCategoryOptions,
  genderOptions,
  imageItems,
  hasInvalidPreviewImage,
  maxUploadSizeMb,
  maxImageCount,
  totalImageCount,
  uploadedGalleryCount,
  localGalleryCount,
  hasFeaturedUploadDraft,
  isUploadPreparing,
  uploadPrepareCompleted,
  uploadPrepareTotal,
  isPersistingUploads,
  uploadPersistCompleted,
  uploadPersistTotal,
  uploadError,
  onClose,
  onSubmit,
  onFieldChange,
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
}: ProductEditorProps) => {
  const isSaving = isSubmitting || isPersistingUploads;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar produto' : 'Novo produto'}
      description="Fluxo guiado: preencha dados básicos, adicione fotos e salve."
      maxWidthClassName="sm:max-w-6xl"
      bodyClassName="p-0"
    >
      <form onSubmit={onSubmit} className="max-h-[78vh] space-y-6 overflow-y-auto p-6">
        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Cadastro guiado</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">1. Dados básicos</div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">2. Mídia do produto</div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">3. Revisar e salvar</div>
          </div>
        </section>

        <ProductFormSection
          title="Dados básicos"
          description="Obrigatório apenas: nome e preço. Os demais campos podem ser preenchidos depois."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome do produto *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => onFieldChange('name', event.target.value)}
                placeholder="Ex: Calça Jeans Skinny"
                className={getFieldClassName(Boolean(formErrors.name))}
              />
              {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Preço (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(event) => onFieldChange('price', event.target.value)}
                placeholder="0.00"
                className={getFieldClassName(Boolean(formErrors.price))}
              />
              {formErrors.price && <p className="mt-1 text-xs text-red-600">{formErrors.price}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">SKU (opcional)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(event) => onFieldChange('sku', event.target.value)}
                placeholder="Se vazio, será gerado automático"
                className={getFieldClassName(Boolean(formErrors.sku))}
              />
              {formErrors.sku && <p className="mt-1 text-xs text-red-600">{formErrors.sku}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Categoria</label>
              <select
                value={formData.category}
                onChange={(event) => onFieldChange('category', event.target.value)}
                className={getFieldClassName(Boolean(formErrors.category))}
              >
                {productCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {formErrors.category && <p className="mt-1 text-xs text-red-600">{formErrors.category}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Gênero</label>
              <select
                value={formData.gender}
                onChange={(event) => onFieldChange('gender', event.target.value)}
                className={getFieldClassName(Boolean(formErrors.gender))}
              >
                {genderOptions.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
              {formErrors.gender && <p className="mt-1 text-xs text-red-600">{formErrors.gender}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Coleção</label>
              <input
                type="text"
                value={formData.collection}
                onChange={(event) => onFieldChange('collection', event.target.value)}
                placeholder="Ex: Outono/Inverno 2026"
                className={getFieldClassName(Boolean(formErrors.collection))}
              />
              {formErrors.collection && <p className="mt-1 text-xs text-red-600">{formErrors.collection}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Temporada / Drop</label>
              <input
                type="text"
                value={formData.season}
                onChange={(event) => onFieldChange('season', event.target.value)}
                placeholder="Ex: Drop Denim Lab"
                className={getFieldClassName(Boolean(formErrors.season))}
              />
              {formErrors.season && <p className="mt-1 text-xs text-red-600">{formErrors.season}</p>}
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Descrição (opcional)</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(event) => onFieldChange('description', event.target.value)}
                placeholder="Se deixar em branco, uma descrição simples será gerada automaticamente."
                className={getFieldClassName(Boolean(formErrors.description))}
              />
              {formErrors.description && <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>}
            </div>
          </div>
        </ProductFormSection>

        <ProductFormSection
          title="Mídia"
          description="Adicione fotos por upload ou URL. O sistema organiza imagem principal e galeria."
        >
          <ProductImageManager
            featuredImage={formData.featuredImage}
            imagesInput={formData.images}
            formErrors={formErrors}
            imageItems={imageItems}
            hasInvalidPreviewImage={hasInvalidPreviewImage}
            maxUploadSizeMb={maxUploadSizeMb}
            maxImageCount={maxImageCount}
            totalImageCount={totalImageCount}
            uploadedGalleryCount={uploadedGalleryCount}
            localGalleryCount={localGalleryCount}
            hasFeaturedUploadDraft={hasFeaturedUploadDraft}
            isUploadPreparing={isUploadPreparing}
            uploadPrepareCompleted={uploadPrepareCompleted}
            uploadPrepareTotal={uploadPrepareTotal}
            isPersistingUploads={isPersistingUploads}
            uploadPersistCompleted={uploadPersistCompleted}
            uploadPersistTotal={uploadPersistTotal}
            uploadError={uploadError}
            onFeaturedImageChange={onFeaturedImageChange}
            onImagesInputChange={onImagesInputChange}
            onFeaturedImageUpload={onFeaturedImageUpload}
            onGalleryUpload={onGalleryUpload}
            onGalleryDropUpload={onGalleryDropUpload}
            onClearUploadedGallery={onClearUploadedGallery}
            onRemoveImage={onRemoveImage}
            onSetFeaturedImage={onSetFeaturedImage}
            onMoveImage={onMoveImage}
            onReorderImages={onReorderImages}
            getFieldClassName={getFieldClassName}
          />
        </ProductFormSection>

        <ProductFormSection
          title="Variações e coleção"
          description="Defina tamanhos, cores, status e selos comerciais para exibir no catálogo."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tamanhos</label>
              <input
                type="text"
                value={formData.sizes}
                onChange={(event) => onFieldChange('sizes', event.target.value)}
                placeholder="Ex: P, M, G ou 38, 40, 42"
                className={getFieldClassName(Boolean(formErrors.sizes))}
              />
              {formErrors.sizes && <p className="mt-1 text-xs text-red-600">{formErrors.sizes}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Cores / lavagens</label>
              <input
                type="text"
                value={formData.colors}
                onChange={(event) => onFieldChange('colors', event.target.value)}
                placeholder="Ex: Azul escuro, Preto"
                className={getFieldClassName(Boolean(formErrors.colors))}
              />
              {formErrors.colors && <p className="mt-1 text-xs text-red-600">{formErrors.colors}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.stockStatus}
                onChange={(event) => onFieldChange('stockStatus', event.target.value as ProductFormState['stockStatus'])}
                className={getFieldClassName(Boolean(formErrors.stockStatus))}
              >
                {stockStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {formErrors.stockStatus && <p className="mt-1 text-xs text-red-600">{formErrors.stockStatus}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Selo (opcional)</label>
              <div className="relative">
                <Tags className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.label}
                  onChange={(event) => onFieldChange('label', event.target.value)}
                  placeholder="Ex: Nova coleção"
                  className={`${getFieldClassName(Boolean(formErrors.label))} pl-9`}
                />
              </div>
              {formErrors.label && <p className="mt-1 text-xs text-red-600">{formErrors.label}</p>}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(event) => onFieldChange('isFeatured', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Destacar no catálogo
            </label>

            <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(event) => onFieldChange('isNew', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Marcar como novidade
            </label>
          </div>
        </ProductFormSection>

        <ProductFormSection
          title="Detalhes opcionais"
          description="Use apenas se quiser enriquecer a página do produto."
        >
          <details className="rounded-xl border border-gray-200 bg-white p-3" open={false}>
            <summary className="cursor-pointer text-sm font-medium text-gray-700">Mostrar campos avançados</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug (opcional)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(event) => onFieldChange('slug', event.target.value)}
                  placeholder="calca-jeans-skinny"
                  className={getFieldClassName(Boolean(formErrors.slug))}
                />
                {formErrors.slug && <p className="mt-1 text-xs text-red-600">{formErrors.slug}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Fit / modelagem</label>
                <input
                  type="text"
                  value={formData.fit}
                  onChange={(event) => onFieldChange('fit', event.target.value)}
                  placeholder="Ex: Slim com conforto | Reta | Wide"
                  className={getFieldClassName(Boolean(formErrors.fit))}
                />
                <p className="mt-1 text-xs text-gray-500">Use `|` para oferecer mais de uma modelagem na página da peça.</p>
                {formErrors.fit && <p className="mt-1 text-xs text-red-600">{formErrors.fit}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Material</label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(event) => onFieldChange('material', event.target.value)}
                  placeholder="Ex: Denim premium"
                  className={getFieldClassName(Boolean(formErrors.material))}
                />
                {formErrors.material && <p className="mt-1 text-xs text-red-600">{formErrors.material}</p>}
              </div>

              <div className="md:col-span-3 lg:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Composição</label>
                <input
                  type="text"
                  value={formData.composition}
                  onChange={(event) => onFieldChange('composition', event.target.value)}
                  placeholder="Ex: 98% algodão, 2% elastano"
                  className={getFieldClassName(Boolean(formErrors.composition))}
                />
                {formErrors.composition && <p className="mt-1 text-xs text-red-600">{formErrors.composition}</p>}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Destaques (1 por linha)</label>
                <textarea
                  rows={3}
                  value={formData.highlights}
                  onChange={(event) => onFieldChange('highlights', event.target.value)}
                  placeholder={'- Acabamento premium\n- Lavagem autoral'}
                  className={getFieldClassName(Boolean(formErrors.highlights))}
                />
                {formErrors.highlights && <p className="mt-1 text-xs text-red-600">{formErrors.highlights}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Cuidados (1 por linha)</label>
                <textarea
                  rows={3}
                  value={formData.careInstructions}
                  onChange={(event) => onFieldChange('careInstructions', event.target.value)}
                  placeholder={'- Lavar do avesso\n- Secar à sombra'}
                  className={getFieldClassName(Boolean(formErrors.careInstructions))}
                />
                {formErrors.careInstructions && <p className="mt-1 text-xs text-red-600">{formErrors.careInstructions}</p>}
              </div>
            </div>
          </details>
        </ProductFormSection>

        <div className="sticky bottom-0 -mx-6 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-600" aria-live="polite">
              {isSaving ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isPersistingUploads ? 'Salvando imagens e produto...' : 'Salvando produto...'}
                </span>
              ) : (
                'Dica: você pode salvar com poucos campos e completar depois.'
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving || hasInvalidPreviewImage}>
                {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar produto'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
