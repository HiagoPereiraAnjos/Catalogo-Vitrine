import { StockStatus } from '../../types';

export interface ProductFormState {
  name: string;
  description: string;
  price: string;
  category: string;
  gender: string;
  featuredImage: string;
  images: string;
  sku: string;
  sizes: string;
  colors: string;
  collection: string;
  season: string;
  fit: string;
  material: string;
  composition: string;
  highlights: string;
  careInstructions: string;
  stockStatus: StockStatus;
  slug: string;
  isFeatured: boolean;
  isNew: boolean;
  label: string;
}

export type FormErrors = Partial<Record<keyof ProductFormState, string>>;

export type NoticeType = 'success' | 'error';

export interface Notice {
  type: NoticeType;
  message: string;
}

export type AdminStatusFilter = 'all' | 'featured' | 'new';

export interface CollectionOption {
  name: string;
  count: number;
}

