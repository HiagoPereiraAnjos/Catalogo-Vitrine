import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Search } from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';
import { ProductCard } from '../../../components/ProductCard';
import { ProductCardSkeleton } from '../../../components/Skeleton';
import { Product } from '../../../types';
import { ActiveFilterTag } from '../utils';

interface ProductsGridProps {
  products: Product[];
  isLoading: boolean;
  activeFilters: ActiveFilterTag[];
  onClearFilters: () => void;
}

const skeletonItems = [1, 2, 3, 4, 5, 6, 7, 8];

export const ProductsGrid = ({ products, isLoading, activeFilters, onClearFilters }: ProductsGridProps) => {
  const hasActiveFilters = activeFilters.length > 0;
  const defaultCurationTags = Array.from(
    new Set([
      ...products.map((product) => product.collection).filter(Boolean),
      ...products.map((product) => product.season).filter(Boolean)
    ])
  )
    .slice(0, 3)
    .map((tag) => tag as string);

  const fallbackCurationTags = defaultCurationTags.length > 0 ? defaultCurationTags : ['Nova coleção', 'Destaques', 'Essenciais'];

  const visibleTags = hasActiveFilters ? activeFilters.map((filter) => filter.label) : fallbackCurationTags;

  return (
    <>
      <section className="premium-reveal mb-6 flex flex-wrap items-center gap-2" aria-label="Curadoria e filtros ativos">
        <span className="text-sm text-gray-500">{hasActiveFilters ? 'Refino ativo:' : 'Curadoria da coleção:'}</span>
        <AnimatePresence initial={false}>
          {visibleTags.map((label) => (
            <motion.span
              key={label}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className={`badge-chip premium-chip ${hasActiveFilters ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
            >
              {label}
            </motion.span>
          ))}
        </AnimatePresence>
        {hasActiveFilters && (
          <button type="button" onClick={onClearFilters} className="premium-interactive ml-1 text-sm font-medium text-blue-700 hover:text-blue-900">
            Limpar tudo
          </button>
        )}
      </section>

      {isLoading ? (
        <section aria-label="Carregando produtos" className="premium-reveal space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Atualizando curadoria da coleção...
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
            {skeletonItems.map((item) => (
              <ProductCardSkeleton key={item} />
            ))}
          </div>
        </section>
      ) : products.length > 0 ? (
        <motion.section
          layout
          className="premium-reveal grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3"
          aria-live="polite"
          aria-label="Produtos encontrados"
        >
          <AnimatePresence mode="popLayout">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </AnimatePresence>
        </motion.section>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <EmptyState
            icon={Search}
            title="Nenhuma peça encontrada"
            description="Não encontramos produtos com os filtros atuais. Ajuste os critérios para revelar novas peças da curadoria."
            actionLabel="Limpar seleção"
            onAction={onClearFilters}
          />
        </motion.div>
      )}
    </>
  );
};
