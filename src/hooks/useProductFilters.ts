import { useState, useMemo, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { sortProductsByNewest } from '../utils/product';

export const useProductFilters = (initialSearch: string, products: Product[]) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedGender, setSelectedGender] = useState('Todos');
  const [selectedCollection, setSelectedCollection] = useState('Todos');
  const [priceRange, setPriceRange] = useState('Todos');
  const [selectedSize, setSelectedSize] = useState('Todos');
  const [selectedColor, setSelectedColor] = useState('Todos');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const searchableValues = [
        product.name,
        product.description,
        product.sku,
        product.collection || '',
        product.season || '',
        product.fit || '',
        product.material || '',
        product.composition || '',
        product.highlights?.join(' ') || ''
      ];

      const matchesSearch =
        !normalizedSearchQuery ||
        searchableValues.some((value) => value.toLowerCase().includes(normalizedSearchQuery));
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const matchesGender = selectedGender === 'Todos' || product.gender === selectedGender;
      const matchesCollection = selectedCollection === 'Todos' || product.collection === selectedCollection;
      const matchesSize = selectedSize === 'Todos' || product.sizes.includes(selectedSize);
      const matchesColor = selectedColor === 'Todos' || product.colors?.includes(selectedColor);

      let matchesPrice = true;
      if (priceRange === 'ate-150') matchesPrice = product.price <= 150;
      else if (priceRange === '150-250') matchesPrice = product.price > 150 && product.price <= 250;
      else if (priceRange === 'acima-250') matchesPrice = product.price > 250;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesGender &&
        matchesCollection &&
        matchesPrice &&
        matchesSize &&
        matchesColor
      );
    });

    switch (sortBy) {
      case 'lowest-price':
        return [...result].sort((a, b) => a.price - b.price);
      case 'highest-price':
        return [...result].sort((a, b) => b.price - a.price);
      case 'name-asc':
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
      default:
        return sortProductsByNewest(result);
    }
  }, [
    products,
    normalizedSearchQuery,
    selectedCategory,
    selectedGender,
    selectedCollection,
    priceRange,
    selectedSize,
    selectedColor,
    sortBy
  ]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setSelectedGender('Todos');
    setSelectedCollection('Todos');
    setPriceRange('Todos');
    setSelectedSize('Todos');
    setSelectedColor('Todos');
    setSortBy('newest');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedGender,
    setSelectedGender,
    selectedCollection,
    setSelectedCollection,
    priceRange,
    setPriceRange,
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    sortBy,
    setSortBy,
    filteredProducts,
    clearFilters
  };
};

