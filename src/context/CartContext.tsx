import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AddCartItemInput, CartItem } from '../types';
import { StorageService } from '../services/storageService';

const CART_STORAGE_KEY = 'catalog_cart_v1';
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;
const DEFAULT_SIZE_LABEL = 'Unico';
const DEFAULT_COLOR_LABEL = 'Padrao';

type AddItemStatus = 'added' | 'merged' | 'invalid';

interface AddCartItemResult {
  item: CartItem | null;
  status: AddItemStatus;
  errorMessage?: string;
}

type CartNoticeTone = 'success' | 'info' | 'warning';

interface CartNotice {
  id: number;
  tone: CartNoticeTone;
  message: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  uniqueItems: number;
  totalAmount: number;
  quantityByProductId: Record<string, number>;
  isDrawerOpen: boolean;
  cartNotice: CartNotice | null;
  addItem: (input: AddCartItemInput) => AddCartItemResult;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateSize: (lineId: string, size: string) => void;
  updateColor: (lineId: string, color: string) => void;
  updateFit: (lineId: string, fit: string) => void;
  clearCart: () => void;
  clearCartNotice: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

type CartItemPartial = Partial<CartItem> & {
  lineId?: unknown;
  productId?: unknown;
  name?: unknown;
  sku?: unknown;
  image?: unknown;
  price?: unknown;
  quantity?: unknown;
  selectedSize?: unknown;
  selectedColor?: unknown;
  selectedFit?: unknown;
  subtotal?: unknown;
  sizeOptions?: unknown;
  colorOptions?: unknown;
  fitOptions?: unknown;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const clampQuantity = (value: number) => Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, Math.floor(value)));

const normalizeText = (value: unknown, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const sanitized = value.trim();
  return sanitized.length > 0 ? sanitized : fallback;
};

const normalizePrice = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const normalizeQuantity = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return MIN_QUANTITY;
  }

  return clampQuantity(parsed);
};

const normalizeOptionList = (value: unknown, fallbackValue: string) => {
  if (!Array.isArray(value)) {
    return [fallbackValue];
  }

  const sanitized = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  const uniqueValues = Array.from(new Set(sanitized));
  if (uniqueValues.length === 0) {
    return [fallbackValue];
  }

  return uniqueValues;
};

const normalizeOptionListAllowEmpty = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const sanitized = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return Array.from(new Set(sanitized));
};

const resolveSelection = (value: unknown, options: string[], fallbackValue: string) => {
  const normalizedValue = normalizeText(value);
  if (normalizedValue && options.includes(normalizedValue)) {
    return normalizedValue;
  }

  return options[0] || fallbackValue;
};

const resolveSelectionOrEmpty = (value: unknown, options: string[]) => {
  const normalizedValue = normalizeText(value);
  if (normalizedValue && options.includes(normalizedValue)) {
    return normalizedValue;
  }

  return '';
};

const calculateSubtotal = (price: number, quantity: number) => Number((price * quantity).toFixed(2));

const withSubtotal = (item: Omit<CartItem, 'subtotal'>): CartItem => ({
  ...item,
  subtotal: calculateSubtotal(item.price, item.quantity)
});

const generateLineId = (productId: string) => {
  const randomSuffix = Math.random().toString(36).slice(2, 9);
  return `${productId}-${Date.now()}-${randomSuffix}`;
};

const buildVariantKey = (item: Pick<CartItem, 'productId' | 'selectedSize' | 'selectedColor' | 'selectedFit'>) =>
  `${item.productId}::${item.selectedSize.toLowerCase()}::${item.selectedColor.toLowerCase()}::${item.selectedFit.toLowerCase()}`;

const mergeOptionValues = (left: string[], right: string[], selectedValue: string) => {
  const merged = Array.from(new Set([...left, ...right, selectedValue].map((item) => item.trim()).filter(Boolean)));
  return merged.length > 0 ? merged : selectedValue ? [selectedValue] : [];
};

const mergeCartItemsByVariant = (items: CartItem[]) => {
  const mergedByVariant = new Map<string, CartItem>();

  items.forEach((item) => {
    const key = buildVariantKey(item);
    const existing = mergedByVariant.get(key);

    if (!existing) {
      mergedByVariant.set(key, item);
      return;
    }

    const mergedQuantity = clampQuantity(existing.quantity + item.quantity);
    const mergedItem: CartItem = {
      ...existing,
      quantity: mergedQuantity,
      subtotal: calculateSubtotal(existing.price, mergedQuantity),
      sizeOptions: mergeOptionValues(existing.sizeOptions, item.sizeOptions, existing.selectedSize),
      colorOptions: mergeOptionValues(existing.colorOptions, item.colorOptions, existing.selectedColor),
      fitOptions: mergeOptionValues(existing.fitOptions, item.fitOptions, existing.selectedFit)
    };

    mergedByVariant.set(key, mergedItem);
  });

  return Array.from(mergedByVariant.values());
};

const normalizeStoredItem = (value: CartItemPartial): CartItem | null => {
  const productId = normalizeText(value.productId);
  const name = normalizeText(value.name);
  const image = normalizeText(value.image);

  if (!productId || !name || !image) {
    return null;
  }

  const price = normalizePrice(value.price);
  const quantity = normalizeQuantity(value.quantity);
  const sizeOptions = normalizeOptionList(value.sizeOptions, DEFAULT_SIZE_LABEL);
  const colorOptions = normalizeOptionList(value.colorOptions, DEFAULT_COLOR_LABEL);
  const fitOptions = normalizeOptionListAllowEmpty(value.fitOptions);
  const selectedSize = resolveSelection(value.selectedSize, sizeOptions, DEFAULT_SIZE_LABEL);
  const selectedColor = resolveSelection(value.selectedColor, colorOptions, DEFAULT_COLOR_LABEL);
  const selectedFit = resolveSelection(value.selectedFit, fitOptions, '');
  const lineId = normalizeText(value.lineId, generateLineId(productId));

  return withSubtotal({
    lineId,
    productId,
    name,
    sku: normalizeText(value.sku),
    image,
    price,
    quantity,
    selectedSize,
    selectedColor,
    selectedFit,
    sizeOptions,
    colorOptions,
    fitOptions
  });
};

const readStoredCartItems = () => {
  const stored = StorageService.get<unknown>(CART_STORAGE_KEY, []);
  if (!Array.isArray(stored)) {
    return [];
  }

  const normalized = stored
    .map((item) => normalizeStoredItem((item || {}) as CartItemPartial))
    .filter((item): item is CartItem => Boolean(item));

  return mergeCartItemsByVariant(normalized);
};

const buildItemFromInput = (input: AddCartItemInput): AddCartItemResult => {
  const productId = normalizeText(input.productId);
  const name = normalizeText(input.name);
  const image = normalizeText(input.image);

  if (!productId || !name || !image) {
    return {
      item: null,
      status: 'invalid',
      errorMessage: 'Dados do produto incompletos para adicionar na sacola.'
    };
  }

  const sizeOptions = normalizeOptionList(input.sizeOptions, DEFAULT_SIZE_LABEL);
  const colorOptions = normalizeOptionList(input.colorOptions, DEFAULT_COLOR_LABEL);
  const fitOptions = normalizeOptionListAllowEmpty(input.fitOptions);

  const selectedSizeCandidate = resolveSelectionOrEmpty(input.selectedSize, sizeOptions);
  const selectedColorCandidate = resolveSelectionOrEmpty(input.selectedColor, colorOptions);
  const selectedFitCandidate = resolveSelectionOrEmpty(input.selectedFit, fitOptions);

  const requiresSizeSelection = Boolean(input.requiresSizeSelection ?? sizeOptions.length > 1);
  const requiresColorSelection = Boolean(input.requiresColorSelection ?? colorOptions.length > 1);
  const requiresFitSelection = Boolean(input.requiresFitSelection ?? fitOptions.length > 1);

  if (requiresSizeSelection && !selectedSizeCandidate) {
    return {
      item: null,
      status: 'invalid',
      errorMessage: 'Selecione o tamanho da peça antes de adicionar.'
    };
  }

  if (requiresColorSelection && !selectedColorCandidate) {
    return {
      item: null,
      status: 'invalid',
      errorMessage: 'Selecione a cor/lavagem antes de adicionar.'
    };
  }

  if (requiresFitSelection && !selectedFitCandidate) {
    return {
      item: null,
      status: 'invalid',
      errorMessage: 'Selecione a modelagem antes de adicionar.'
    };
  }

  const selectedSize = selectedSizeCandidate || sizeOptions[0] || DEFAULT_SIZE_LABEL;
  const selectedColor = selectedColorCandidate || colorOptions[0] || DEFAULT_COLOR_LABEL;
  const selectedFit = selectedFitCandidate || fitOptions[0] || '';

  const item = withSubtotal({
    lineId: generateLineId(productId),
    productId,
    name,
    sku: normalizeText(input.sku),
    image,
    price: normalizePrice(input.price),
    quantity: normalizeQuantity(input.quantity),
    selectedSize,
    selectedColor,
    selectedFit,
    sizeOptions,
    colorOptions,
    fitOptions
  });

  return {
    item,
    status: 'added'
  };
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCartItems());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState<CartNotice | null>(null);

  const pushCartNotice = useCallback((tone: CartNoticeTone, message: string) => {
    setCartNotice({
      id: Date.now() + Math.random(),
      tone,
      message
    });
  }, []);

  const addItem = useCallback((input: AddCartItemInput): AddCartItemResult => {
    const prepared = buildItemFromInput(input);
    if (!prepared.item || prepared.status === 'invalid') {
      pushCartNotice('warning', prepared.errorMessage || 'Selecione as variações obrigatórias para continuar.');
      return prepared;
    }

    const candidateItem = prepared.item;
    let result: AddCartItemResult = { item: candidateItem, status: 'added' };

    setItems((previousItems) => {
      const matchingIndex = previousItems.findIndex(
        (item) =>
          item.productId === candidateItem.productId &&
          item.selectedSize === candidateItem.selectedSize &&
          item.selectedColor === candidateItem.selectedColor &&
          item.selectedFit === candidateItem.selectedFit
      );

      if (matchingIndex === -1) {
        result = { item: candidateItem, status: 'added' };
        return [candidateItem, ...previousItems];
      }

      const existing = previousItems[matchingIndex];
      const mergedQuantity = clampQuantity(existing.quantity + candidateItem.quantity);
      const mergedItem: CartItem = {
        ...existing,
        quantity: mergedQuantity,
        subtotal: calculateSubtotal(existing.price, mergedQuantity),
        sizeOptions: mergeOptionValues(existing.sizeOptions, candidateItem.sizeOptions, existing.selectedSize),
        colorOptions: mergeOptionValues(existing.colorOptions, candidateItem.colorOptions, existing.selectedColor),
        fitOptions: mergeOptionValues(existing.fitOptions, candidateItem.fitOptions, existing.selectedFit)
      };

      const nextItems = [...previousItems];
      nextItems[matchingIndex] = mergedItem;
      result = { item: mergedItem, status: 'merged' };
      return nextItems;
    });

    const addedLabel = `"${result.item?.name || 'Item'}" adicionado na sacola.`;
    const mergedLabel = `"${result.item?.name || 'Item'}" já estava na sacola e teve a quantidade atualizada.`;
    pushCartNotice(result.status === 'added' ? 'success' : 'info', result.status === 'added' ? addedLabel : mergedLabel);

    return result;
  }, [pushCartNotice]);

  const removeItem = useCallback((lineId: string) => {
    setItems((previousItems) => previousItems.filter((item) => item.lineId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    const safeQuantity = clampQuantity(quantity);

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.lineId === lineId
          ? {
              ...item,
              quantity: safeQuantity,
              subtotal: calculateSubtotal(item.price, safeQuantity)
            }
          : item
      )
    );
  }, []);

  const updateSize = useCallback((lineId: string, size: string) => {
    const normalizedSize = normalizeText(size, DEFAULT_SIZE_LABEL);

    setItems((previousItems) => {
      const updated = previousItems.map((item) => {
        if (item.lineId !== lineId) {
          return item;
        }

        const nextSizeOptions = mergeOptionValues(item.sizeOptions, [normalizedSize], normalizedSize);
        return {
          ...item,
          selectedSize: normalizedSize,
          sizeOptions: nextSizeOptions
        };
      });

      return mergeCartItemsByVariant(updated);
    });
  }, []);

  const updateColor = useCallback((lineId: string, color: string) => {
    const normalizedColor = normalizeText(color, DEFAULT_COLOR_LABEL);

    setItems((previousItems) => {
      const updated = previousItems.map((item) => {
        if (item.lineId !== lineId) {
          return item;
        }

        const nextColorOptions = mergeOptionValues(item.colorOptions, [normalizedColor], normalizedColor);
        return {
          ...item,
          selectedColor: normalizedColor,
          colorOptions: nextColorOptions
        };
      });

      return mergeCartItemsByVariant(updated);
    });
  }, []);

  const updateFit = useCallback((lineId: string, fit: string) => {
    const normalizedFit = normalizeText(fit);

    setItems((previousItems) => {
      const updated = previousItems.map((item) => {
        if (item.lineId !== lineId) {
          return item;
        }

        const nextFitOptions = mergeOptionValues(item.fitOptions, [normalizedFit], normalizedFit);
        return {
          ...item,
          selectedFit: normalizedFit,
          fitOptions: nextFitOptions
        };
      });

      return mergeCartItemsByVariant(updated);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const clearCartNotice = useCallback(() => {
    setCartNotice(null);
  }, []);

  const openCart = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsDrawerOpen((previousState) => !previousState);
  }, []);

  useEffect(() => {
    StorageService.set(CART_STORAGE_KEY, items);
  }, [items]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) {
        return;
      }

      setItems(readStoredCartItems());
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const uniqueItems = items.length;
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items]);
  const quantityByProductId = useMemo(() => {
    const quantityMap: Record<string, number> = {};
    items.forEach((item) => {
      quantityMap[item.productId] = (quantityMap[item.productId] || 0) + item.quantity;
    });
    return quantityMap;
  }, [items]);

  const contextValue = useMemo(
    () => ({
      items,
      totalItems,
      uniqueItems,
      totalAmount,
      quantityByProductId,
      isDrawerOpen,
      cartNotice,
      addItem,
      removeItem,
      updateQuantity,
      updateSize,
      updateColor,
      updateFit,
      clearCart,
      clearCartNotice,
      openCart,
      closeCart,
      toggleCart
    }),
    [
      items,
      totalItems,
      uniqueItems,
      totalAmount,
      quantityByProductId,
      isDrawerOpen,
      cartNotice,
      addItem,
      removeItem,
      updateQuantity,
      updateSize,
      updateColor,
      updateFit,
      clearCart,
      clearCartNotice,
      openCart,
      closeCart,
      toggleCart
    ]
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
};
