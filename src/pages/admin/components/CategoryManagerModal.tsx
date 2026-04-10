import React from 'react';
import { Layers3, Trash2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';

interface CategoryManagerModalProps {
  isOpen: boolean;
  newCategoryName: string;
  newCategoryError: string;
  productCategoryOptions: string[];
  customCategoryOptions: string[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onNewCategoryNameChange: (value: string) => void;
  onDeleteCategory: (category: string) => void;
  getFieldClassName: (hasError: boolean) => string;
}

export const CategoryManagerModal = ({
  isOpen,
  newCategoryName,
  newCategoryError,
  productCategoryOptions,
  customCategoryOptions,
  onClose,
  onSubmit,
  onNewCategoryNameChange,
  onDeleteCategory,
  getFieldClassName
}: CategoryManagerModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Nova categoria"
    description="Crie uma categoria para organizar produtos e filtros do catálogo."
    maxWidthClassName="sm:max-w-lg"
  >
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome da categoria *</label>
        <input
          type="text"
          value={newCategoryName}
          onChange={(event) => onNewCategoryNameChange(event.target.value)}
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
                    onClick={() => onDeleteCategory(category)}
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
        <p className="mt-1 text-xs text-gray-500">Categorias em uso por produtos não podem ser excluídas.</p>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          <Layers3 className="h-4 w-4" />
          Criar categoria
        </Button>
      </div>
    </form>
  </Modal>
);
