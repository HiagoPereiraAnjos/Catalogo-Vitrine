import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { categories as baseCategories, genders } from '../data';
import { useProducts } from '../context/ProductContext';
import { useProductFilters } from '../hooks/useProductFilters';
import { Container } from '../components/Container';
import { ProductsHeader } from './products/components/ProductsHeader';
import { ProductsToolbar } from './products/components/ProductsToolbar';
import { ProductsFilters } from './products/components/ProductsFilters';
import { MobileFiltersDrawer } from './products/components/MobileFiltersDrawer';
import { ProductsGrid } from './products/components/ProductsGrid';
import { buildActiveFilterTags, getAvailableCollections, getAvailableColors, getAvailableSizes } from './products/utils';
import { usePageSeo } from '../hooks/usePageSeo';
import { CategoriesService } from '../services/categoriesService';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { defaultSiteSettings } from '../data/defaultSiteSettings';

export default function Products() {
  const location = useLocation();
  const initialSearch = useMemo(() => new URLSearchParams(location.search).get('search') || '', [location.search]);

  const { products, isLoading: isProductsLoading } = useProducts();
  const { settings } = useSiteSettings();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!isProductsLoading) {
      const timer = setTimeout(() => {
        setIsLocalLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    setIsLocalLoading(true);
  }, [isProductsLoading]);

  useEffect(() => {
    setCustomCategories(CategoriesService.getCustomCategories());
  }, []);

  const isLoading = isProductsLoading || isLocalLoading;

  const {
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
  } = useProductFilters(initialSearch, products);

  const availableSizes = useMemo(() => getAvailableSizes(products), [products]);
  const availableColors = useMemo(() => getAvailableColors(products), [products]);
  const availableCollections = useMemo(() => getAvailableCollections(products), [products]);
  const availableCategories = useMemo(
    () => CategoriesService.buildCategoryOptions(baseCategories, customCategories, products.map((product) => product.category)),
    [customCategories, products]
  );

  const activeFilters = useMemo(
    () =>
      buildActiveFilterTags({
        searchQuery,
        selectedCategory,
        selectedGender,
        selectedCollection,
        selectedSize,
        selectedColor,
        priceRange
      }),
    [searchQuery, selectedCategory, selectedGender, selectedCollection, selectedSize, selectedColor, priceRange]
  );

  const openMobileFilters = useCallback(() => setIsMobileFiltersOpen(true), []);
  const closeMobileFilters = useCallback(() => setIsMobileFiltersOpen(false), []);
  const seo = settings.seo;
  const seoImage = products[0]?.featuredImage || defaultSiteSettings.seo.defaultOgImage;

  const sharedFilterProps = useMemo(
    () => ({
      categories: availableCategories,
      genders,
      collections: availableCollections,
      availableSizes,
      availableColors,
      selectedCategory,
      selectedGender,
      selectedCollection,
      priceRange,
      selectedSize,
      selectedColor,
      onCategoryChange: setSelectedCategory,
      onGenderChange: setSelectedGender,
      onCollectionChange: setSelectedCollection,
      onPriceRangeChange: setPriceRange,
      onSizeChange: setSelectedSize,
      onColorChange: setSelectedColor,
      onClearFilters: clearFilters
    }),
    [
      availableCategories,
      availableCollections,
      availableColors,
      availableSizes,
      clearFilters,
      priceRange,
      selectedCategory,
      selectedCollection,
      selectedColor,
      selectedGender,
      selectedSize
    ]
  );

  usePageSeo({
    title: seo.products.title || defaultSiteSettings.seo.products.title,
    description: seo.products.description || defaultSiteSettings.seo.products.description,
    image: seoImage,
    type: 'website',
    keywords: seo.primaryKeywords || defaultSiteSettings.seo.primaryKeywords
  });

  return (
    <Container as="article" className="section-shell-tight">
      <section className="premium-reveal mb-8 space-y-5 border-b border-gray-200 pb-8" aria-labelledby="products-page-title">
        <ProductsHeader headingId="products-page-title" title="Coleção de Jeans" />
        <ProductsToolbar
          searchQuery={searchQuery}
          sortBy={sortBy}
          resultsCount={filteredProducts.length}
          isLoading={isLoading}
          onSearchChange={setSearchQuery}
          onSortChange={setSortBy}
          onOpenMobileFilters={openMobileFilters}
        />
      </section>

      <div className="flex flex-col gap-x-8 gap-y-8 lg:flex-row">
        <MobileFiltersDrawer isOpen={isMobileFiltersOpen} onClose={closeMobileFilters}>
          <ProductsFilters {...sharedFilterProps} idPrefix="mobile-products" />
        </MobileFiltersDrawer>

        <aside className="premium-reveal premium-reveal-delay-1 hidden lg:block lg:w-[280px] lg:flex-shrink-0" aria-label="Filtros do catálogo de produtos">
          <div className="sticky top-24">
            <ProductsFilters {...sharedFilterProps} idPrefix="desktop-products" />
          </div>
        </aside>

        <section className="premium-reveal premium-reveal-delay-2 flex-1" aria-label="Lista de produtos">
          <ProductsGrid
            products={filteredProducts}
            isLoading={isLoading}
            activeFilters={activeFilters}
            onClearFilters={clearFilters}
          />
        </section>
      </div>
    </Container>
  );
}

