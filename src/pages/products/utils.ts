import { Product } from '../../types';
import { getPriceRangeLabel } from './constants';

export interface ActiveFilterTag {
  key: string;
  label: string;
}

interface BuildActiveFilterTagsParams {
  searchQuery: string;
  selectedCategory: string;
  selectedGender: string;
  selectedCollection: string;
  selectedSize: string;
  selectedColor: string;
  priceRange: string;
}

export const getAvailableSizes = (products: Product[]) => {
  const sizes = new Set<string>();
  products.forEach((product) => product.sizes?.forEach((size) => sizes.add(size)));
  return Array.from(sizes).sort();
};

export const getAvailableColors = (products: Product[]) => {
  const colors = new Set<string>();
  products.forEach((product) => product.colors?.forEach((color) => colors.add(color)));
  return Array.from(colors).sort();
};

export const getAvailableCollections = (products: Product[]) => {
  const collections = new Set<string>();
  products.forEach((product) => {
    if (product.collection?.trim()) {
      collections.add(product.collection.trim());
    }
  });

  return Array.from(collections).sort((a, b) =>
    a.localeCompare(b, 'pt-BR', {
      sensitivity: 'base'
    })
  );
};

export const buildActiveFilterTags = ({
  searchQuery,
  selectedCategory,
  selectedGender,
  selectedCollection,
  selectedSize,
  selectedColor,
  priceRange
}: BuildActiveFilterTagsParams): ActiveFilterTag[] => {
  const tags: ActiveFilterTag[] = [];

  if (searchQuery.trim()) {
    tags.push({ key: 'search', label: `Busca: ${searchQuery}` });
  }
  if (selectedCategory !== 'Todos') {
    tags.push({ key: 'category', label: selectedCategory });
  }
  if (selectedGender !== 'Todos') {
    tags.push({ key: 'gender', label: selectedGender });
  }
  if (selectedCollection !== 'Todos') {
    tags.push({ key: 'collection', label: `Coleção: ${selectedCollection}` });
  }
  if (selectedSize !== 'Todos') {
    tags.push({ key: 'size', label: `Tam: ${selectedSize}` });
  }
  if (selectedColor !== 'Todos') {
    tags.push({ key: 'color', label: `Cor: ${selectedColor}` });
  }

  const priceLabel = getPriceRangeLabel(priceRange);
  if (priceLabel) {
    tags.push({ key: 'price', label: priceLabel });
  }

  return tags;
};

