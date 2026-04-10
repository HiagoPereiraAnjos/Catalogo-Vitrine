import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { categories as baseCategories } from '../../../data';
import { Product } from '../../../types';
import { CategoriesService, isSameCategory, normalizeCategoryName } from '../../../services/categoriesService';
import { Notice } from '../types';

interface UseCategoryManagerParams {
  products: Product[];
  onNotice: (notice: Notice) => void;
}

export const useCategoryManager = ({ products, onNotice }: UseCategoryManagerParams) => {
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryError, setNewCategoryError] = useState('');

  useEffect(() => {
    setCustomCategories(CategoriesService.getCustomCategories());
  }, []);

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

  const handleNewCategoryNameChange = (value: string) => {
    setNewCategoryName(value);
    if (newCategoryError) {
      setNewCategoryError('');
    }
  };

  const handleCreateCategory = (event: FormEvent) => {
    event.preventDefault();

    const normalizedCategoryName = normalizeCategoryName(newCategoryName);

    if (normalizedCategoryName.length < 2) {
      setNewCategoryError('Informe um nome com ao menos 2 caracteres.');
      return;
    }

    if (normalizedCategoryName.length > 32) {
      setNewCategoryError('Use até 32 caracteres para a categoria.');
      return;
    }

    if (categoryOptions.some((category) => isSameCategory(category, normalizedCategoryName))) {
      setNewCategoryError('Essa categoria já existe.');
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
    onNotice({ type: 'success', message: `Categoria "${normalizedCategoryName}" criada com sucesso.` });
  };

  const handleDeleteCategory = (
    categoryToDelete: string,
    selectedCategory?: string,
    onSelectedCategoryFallback?: (nextCategory: string) => void
  ) => {
    const isCategoryInUse = products.some((product) => isSameCategory(product.category, categoryToDelete));

    if (isCategoryInUse) {
      onNotice({
        type: 'error',
        message: `Não foi possível excluir "${categoryToDelete}". Existem produtos vinculados a essa categoria.`
      });
      return;
    }

    const updatedCustomCategories = CategoriesService.saveCustomCategories(
      customCategories.filter((category) => !isSameCategory(category, categoryToDelete))
    );

    setCustomCategories(updatedCustomCategories);

    if (selectedCategory && isSameCategory(selectedCategory, categoryToDelete) && onSelectedCategoryFallback) {
      const nextCategoryOptions = CategoriesService.buildCategoryOptions(
        baseCategories,
        updatedCustomCategories,
        products.map((product) => product.category)
      ).filter((category) => !isSameCategory(category, 'Todos'));

      const nextDefaultCategory = nextCategoryOptions[0] || defaultCategoryOptions[0] || 'Calças';
      onSelectedCategoryFallback(nextDefaultCategory);
    }

    onNotice({ type: 'success', message: `Categoria "${categoryToDelete}" excluída com sucesso.` });
  };

  return {
    categoryOptions,
    defaultCategoryOptions,
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
  };
};
