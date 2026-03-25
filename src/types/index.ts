export * from './siteSettings';

export type Category = 'Todos' | 'Cal\u00E7as' | 'Jaquetas' | 'Shorts' | 'Camisas' | 'Saias' | 'Macac\u00F5es';
export type Gender = 'Todos' | 'Masculino' | 'Feminino' | 'Unissex';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: Category | string;
  gender: Gender | string;
  featuredImage: string;
  images: string[];
  featuredImageId?: string;
  imageIds?: string[];
  sku: string;
  sizes: string[];
  colors?: string[];
  collection?: string;
  season?: string;
  fit?: string;
  material?: string;
  composition?: string;
  highlights?: string[];
  careInstructions?: string[];
  stockStatus: StockStatus;
  createdAt: string;
  isFeatured: boolean;
  isNew: boolean;
  label?: string;
}

export type ProductCreateInput = Omit<Product, 'id' | 'slug' | 'createdAt' | 'stockStatus'> &
  Partial<Pick<Product, 'slug' | 'createdAt' | 'stockStatus'>>;

export type ProductUpdateInput = Partial<Omit<Product, 'id'>>;

export interface FilterOptions {
  searchQuery: string;
  category: string;
  gender: string;
  collection: string;
  season: string;
  priceRange: string;
  size: string;
  color: string;
  sortBy: string;
}
