import { ChangeEvent } from 'react';
import { Filter, SlidersHorizontal, Sparkles, Search } from 'lucide-react';
import { sortOptions } from '../constants';

interface ProductsToolbarProps {
  searchQuery: string;
  sortBy: string;
  resultsCount: number;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onOpenMobileFilters: () => void;
}

const getResultsLabel = (resultsCount: number, isLoading: boolean) => {
  if (isLoading) {
    return 'Atualizando seleção';
  }

  if (resultsCount === 1) {
    return '1 peça encontrada';
  }

  return `${resultsCount} peças encontradas`;
};

export const ProductsToolbar = ({
  searchQuery,
  sortBy,
  resultsCount,
  isLoading,
  onSearchChange,
  onSortChange,
  onOpenMobileFilters
}: ProductsToolbarProps) => {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSortChange(event.target.value);
  };

  return (
    <div className="surface-card-strong premium-reveal overflow-hidden">
      <div className="border-b border-gray-100 px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            <Sparkles className="h-3.5 w-3.5 text-gray-400" />
            Curadoria ativa
          </p>
          <span
            aria-live="polite"
            className={`inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-all duration-200 ${
              isLoading ? 'border-blue-100 bg-blue-50/60 text-blue-700' : ''
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? 'animate-[soft-pulse_1.3s_ease-in-out_infinite] bg-blue-600' : 'bg-gray-900'}`} />
            {getResultsLabel(resultsCount, isLoading)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4 md:px-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <div className="w-full lg:max-w-xl">
          <label htmlFor="products-search" className="mb-2 block text-sm font-medium text-gray-900">
            Buscar no catálogo
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400 transition-colors duration-200 group-focus-within:text-gray-700" />
            </div>
            <input
              id="products-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="field-control rounded-full pl-9"
              placeholder="Ex: jaqueta, wide leg, SKU..."
            />
          </div>
        </div>

        <div className="min-w-[220px]">
          <label htmlFor="products-sort" className="mb-2 block text-sm font-medium text-gray-900">
            Ordenação
          </label>
          <div className="group relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-gray-700" />
            <select
              id="products-sort"
              value={sortBy}
              onChange={handleSortChange}
              className="field-control rounded-full py-2.5 pl-9"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="premium-interactive premium-focus inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:-translate-y-px hover:bg-gray-100 focus-visible:ring-gray-900 focus-visible:ring-offset-2 lg:hidden"
          onClick={onOpenMobileFilters}
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filtros
        </button>
      </div>
    </div>
  );
};
