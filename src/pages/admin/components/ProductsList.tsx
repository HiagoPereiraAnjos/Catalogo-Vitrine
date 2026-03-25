import React from 'react';
import { BadgeCheck, Clock3, Edit3, Package, Search, Trash2, WandSparkles } from 'lucide-react';
import { Product } from '../../../types';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { formatPrice } from '../../../utils/formatters';
import { getProductBadge, getStockStatusMeta } from '../../../utils/product';
import { CatalogImage } from '../../../components/CatalogImage';
import { AdminStatusFilter } from '../types';

interface ProductsListProps {
  products: Product[];
  searchQuery: string;
  statusFilter: AdminStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: AdminStatusFilter) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCreateProduct: () => void;
  onCreateCollection?: () => void;
}

const statusFilters: Array<{ value: AdminStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'featured', label: 'Destaque' },
  { value: 'new', label: 'Novos' }
];

const formatDate = (date: string) => {
  const parsed = Date.parse(date);
  if (!Number.isFinite(parsed)) {
    return '-';
  }

  return new Date(parsed).toLocaleDateString('pt-BR');
};

const ProductMetaBadge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>
);

export const ProductsList = ({
  products,
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onEdit,
  onDelete,
  onCreateProduct,
  onCreateCollection
}: ProductsListProps) => {
  return (
    <section className="surface-card-strong premium-reveal overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Produtos cadastrados</h2>
            <p className="text-sm text-gray-500">Visualize, filtre e edite os itens do catálogo com contexto comercial.</p>
            {onCreateCollection && (
              <button
                type="button"
                onClick={onCreateCollection}
                className="premium-interactive mt-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-gray-700 hover:border-gray-300 hover:bg-gray-100"
              >
                <WandSparkles className="h-3.5 w-3.5" />
                Cadastro guiado em lote
              </button>
            )}
          </div>

          <div className="w-full max-w-md">
            <div className="group relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-gray-700" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar por nome, SKU, slug, categoria..."
                className="field-control py-2.5 pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onStatusFilterChange(filter.value)}
              className={`premium-interactive rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                statusFilter === filter.value
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {products.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {products.map((product) => {
            const badge = getProductBadge(product);
            const stockStatus = getStockStatusMeta(product.stockStatus);

            return (
              <article
                key={product.id}
                className="group px-5 py-4 transition-all duration-200 hover:bg-gray-50/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:px-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <CatalogImage
                      src={product.featuredImage}
                      alt={product.name}
                      className="h-20 w-16 rounded-lg border border-gray-200 object-cover"
                      fallback={{
                        category: product.category,
                        gender: product.gender,
                        style: 'editorial',
                        seed: product.id,
                        label: product.collection || product.name
                      }}
                    />

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-gray-900">{product.name}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">/{product.slug}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <ProductMetaBadge className="border-gray-200 bg-gray-100 text-gray-700">{product.category}</ProductMetaBadge>
                        <ProductMetaBadge className="border-gray-200 bg-gray-100 text-gray-700">{product.gender}</ProductMetaBadge>
                        {product.collection && (
                          <ProductMetaBadge className="border-indigo-200 bg-indigo-50 text-indigo-700">
                            {product.collection}
                          </ProductMetaBadge>
                        )}
                        {product.season && (
                          <ProductMetaBadge className="border-purple-200 bg-purple-50 text-purple-700">
                            {product.season}
                          </ProductMetaBadge>
                        )}
                        {product.isFeatured && (
                          <ProductMetaBadge className="border-amber-200 bg-amber-100 text-amber-700">Destaque</ProductMetaBadge>
                        )}
                        {product.isNew && <ProductMetaBadge className="border-emerald-200 bg-emerald-100 text-emerald-700">Novo</ProductMetaBadge>}
                        {badge && !product.isFeatured && !product.isNew && (
                          <ProductMetaBadge className="border-blue-200 bg-blue-100 text-blue-700">{badge}</ProductMetaBadge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-gray-600 lg:mr-8">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-gray-400" />
                      <span>SKU: {product.sku || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${stockStatus.toneClassName}`}>
                        {stockStatus.shortLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-gray-400" />
                      <span>Criado em {formatDate(product.createdAt)}</span>
                    </div>
                    <div className="font-semibold text-gray-900">{formatPrice(product.price)}</div>
                  </div>

                  <div className="flex items-center gap-2 opacity-100 transition-opacity duration-200 lg:opacity-85 lg:group-hover:opacity-100">
                    <Button variant="outline" size="sm" onClick={() => onEdit(product)} className="shadow-none">
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onDelete(product)} className="shadow-none">
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-6">
          <EmptyState
            icon={Package}
            title="Nenhum produto encontrado"
            description="Ajuste a busca/filtro ou cadastre um novo item para continuar."
            actionLabel="Cadastrar produto"
            onAction={onCreateProduct}
          />
        </div>
      )}
    </section>
  );
};

