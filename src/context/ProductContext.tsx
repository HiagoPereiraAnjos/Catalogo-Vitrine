import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ProductCreateInput, ProductUpdateInput } from '../types';
import { ProductsService } from '../services/productsService';

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  addProduct: (product: ProductCreateInput) => Promise<void>;
  addProductsBulk: (products: ProductCreateInput[]) => Promise<void>;
  updateProduct: (id: string, product: ProductUpdateInput) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);
const MOJIBAKE_PATTERN = /\u00C3.|\u00C2.|\uFFFD/;

const hasPotentialMojibake = (value: string) => MOJIBAKE_PATTERN.test(value);

const hasCorruptedProductText = (product: Product) =>
  hasPotentialMojibake(product.name) ||
  hasPotentialMojibake(product.category) ||
  hasPotentialMojibake(product.gender) ||
  hasPotentialMojibake(product.description);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ProductsService.getProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (products.length === 0) {
      return;
    }

    if (products.some(hasCorruptedProductText)) {
      fetchProducts();
    }
  }, [products, fetchProducts]);

  const addProduct = useCallback(async (product: ProductCreateInput) => {
    try {
      const newProduct = await ProductsService.createProduct(product);
      setProducts((prev) => [newProduct, ...prev]);
    } catch (err) {
      console.error('Failed to add product', err);
      throw err;
    }
  }, []);

  const addProductsBulk = useCallback(async (items: ProductCreateInput[]) => {
    if (items.length === 0) {
      return;
    }

    try {
      const importedProducts = await ProductsService.createProductsBulk(items);
      setProducts((prev) => [...importedProducts, ...prev]);
    } catch (err) {
      console.error('Failed to import products in bulk', err);
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updatedProduct: ProductUpdateInput) => {
    try {
      const updated = await ProductsService.updateProduct(id, updatedProduct);
      setProducts((prev) => prev.map((product) => (product.id === id ? updated : product)));
    } catch (err) {
      console.error('Failed to update product', err);
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await ProductsService.deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      console.error('Failed to delete product', err);
      throw err;
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      products,
      isLoading,
      error,
      addProduct,
      addProductsBulk,
      updateProduct,
      deleteProduct,
      refreshProducts: fetchProducts
    }),
    [products, isLoading, error, addProduct, addProductsBulk, updateProduct, deleteProduct, fetchProducts]
  );

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within ProductProvider');
  return context;
};

