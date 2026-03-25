import React, { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPrice } from '../utils/formatters';
import { getProductBadge, getStockStatusMeta } from '../utils/product';
import { CatalogImage } from './CatalogImage';

interface ProductCardProps {
  product: Product;
}

const resolveCollectionBadge = (product: Product) => {
  if (product.isNew && product.season?.trim()) {
    return product.season.trim();
  }

  const explicitBadge = getProductBadge(product);
  return explicitBadge || 'Essencial';
};

const ProductCardComponent: React.FC<ProductCardProps> = ({ product }) => {
  const badge = resolveCollectionBadge(product);
  const stockStatus = getStockStatusMeta(product.stockStatus);
  const titleId = `product-card-title-${product.id}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="group surface-card surface-card-hover premium-reveal-delay-1 flex h-full flex-col overflow-hidden"
      aria-labelledby={titleId}
      itemScope
      itemType="https://schema.org/Product"
    >
      <Link
        to={`/produto/${product.id}`}
        className="premium-focus flex h-full flex-col focus-visible:ring-gray-900"
        aria-label={`Ver detalhes da peça ${product.name}`}
      >
        <div className="relative mb-0 aspect-[4/5] w-full overflow-hidden bg-gray-100">
          <CatalogImage
            src={product.featuredImage}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.06]"
            fallback={{
              category: product.category,
              gender: product.gender,
              style: 'editorial',
              seed: product.id,
              label: product.collection || product.name
            }}
            itemProp="image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

          <AnimatePresence>
            {badge && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="badge-chip absolute left-3 top-3 z-10 border-gray-200/80 bg-white/95 text-[11px] uppercase shadow-sm"
              >
                {badge}
              </motion.span>
            )}
          </AnimatePresence>

          <div className="absolute inset-x-4 bottom-4 translate-y-3 rounded-full border border-white/80 bg-white/95 px-4 py-2 opacity-0 shadow-md backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-900">
              Ver peça
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-start justify-between gap-4">
            <h3
              id={titleId}
              className="line-clamp-2 text-base font-semibold tracking-tight text-gray-900 transition-colors group-hover:text-blue-700"
              itemProp="name"
            >
              {product.name}
            </h3>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
            <span className="uppercase tracking-[0.14em]">{product.category}</span>
            <span>/</span>
            <span className="uppercase tracking-[0.14em]">{product.gender}</span>
            {product.collection && (
              <>
                <span>/</span>
                <span className="uppercase tracking-[0.14em] text-indigo-600">{product.collection}</span>
              </>
            )}
          </div>

          {product.sku && <p className="mb-3 text-xs text-gray-400">SKU: {product.sku}</p>}

          <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 transition-colors group-hover:text-gray-900">
              Detalhes
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${stockStatus.toneClassName}`}>
              {stockStatus.shortLabel}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  const prev = prevProps.product;
  const next = nextProps.product;

  return (
    prev === next ||
    (prev.id === next.id &&
      prev.name === next.name &&
      prev.price === next.price &&
      prev.featuredImage === next.featuredImage &&
      prev.label === next.label &&
      prev.collection === next.collection &&
      prev.season === next.season &&
      prev.stockStatus === next.stockStatus &&
      prev.isFeatured === next.isFeatured &&
      prev.isNew === next.isNew)
  );
});
