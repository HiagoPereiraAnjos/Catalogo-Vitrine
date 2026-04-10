export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  selectedFit: string;
  subtotal: number;
  sizeOptions: string[];
  colorOptions: string[];
  fitOptions: string[];
}

export interface AddCartItemInput {
  productId: string;
  name: string;
  sku?: string;
  image: string;
  price: number;
  quantity?: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedFit?: string;
  sizeOptions?: string[];
  colorOptions?: string[];
  fitOptions?: string[];
  requiresSizeSelection?: boolean;
  requiresColorSelection?: boolean;
  requiresFitSelection?: boolean;
}

export interface UpdateCartItemVariantInput {
  lineId: string;
  value: string;
}
