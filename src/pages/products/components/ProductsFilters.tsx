import { ReactNode } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/Button';
import { priceRangeOptions } from '../constants';

interface ProductsFiltersProps {
  idPrefix?: string;
  categories: string[];
  genders: string[];
  collections: string[];
  availableSizes: string[];
  availableColors: string[];
  selectedCategory: string;
  selectedGender: string;
  selectedCollection: string;
  priceRange: string;
  selectedSize: string;
  selectedColor: string;
  onCategoryChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onCollectionChange: (value: string) => void;
  onPriceRangeChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onClearFilters: () => void;
}

interface RadioOptionProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

interface FilterSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const FilterSection = ({ title, subtitle, children }: FilterSectionProps) => (
  <section className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 transition-colors duration-200 hover:border-gray-200 hover:bg-gray-50">
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const RadioOption = ({ id, name, label, checked, onChange }: RadioOptionProps) => (
  <label
    htmlFor={id}
    className={`premium-interactive flex cursor-pointer items-center gap-3 rounded-xl border px-2.5 py-2 ${
      checked ? 'border-gray-300 bg-white' : 'border-transparent hover:border-gray-200 hover:bg-white/70'
    }`}
  >
    <input
      id={id}
      name={name}
      type="radio"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 border-gray-300 text-gray-900 transition-colors focus:ring-gray-400"
    />
    <span className={`text-sm transition-colors ${checked ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
  </label>
);

const getSizeButtonClassName = (isSelected: boolean) =>
  `premium-interactive rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
    isSelected
      ? 'border-gray-900 bg-gray-900 text-white'
      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
  }`;

export const ProductsFilters = ({
  idPrefix = 'products-filters',
  categories,
  genders,
  collections,
  availableSizes,
  availableColors,
  selectedCategory,
  selectedGender,
  selectedCollection,
  priceRange,
  selectedSize,
  selectedColor,
  onCategoryChange,
  onGenderChange,
  onCollectionChange,
  onPriceRangeChange,
  onSizeChange,
  onColorChange,
  onClearFilters
}: ProductsFiltersProps) => {
  const categoryGroupName = `${idPrefix}-category`;
  const genderGroupName = `${idPrefix}-gender`;
  const collectionGroupName = `${idPrefix}-collection`;
  const priceGroupName = `${idPrefix}-price`;
  const colorGroupName = `${idPrefix}-color`;
  const isMobile = idPrefix.includes('mobile');

  return (
    <div className="surface-card premium-reveal space-y-6 p-5 md:p-6">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <Filter className="h-3.5 w-3.5" />
          Filtros de curadoria
        </p>
      </div>

      {isMobile && (
        <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Os filtros são aplicados em tempo real para acelerar sua seleção.
        </p>
      )}

      <FilterSection title="Categoria" subtitle="Escolha o tipo de peça">
        <fieldset>
          <legend className="sr-only">Categoria</legend>
          <div className="space-y-1.5">
            {categories.map((category, index) => (
              <div key={category}>
                <RadioOption
                  id={`${idPrefix}-category-${index}`}
                  name={categoryGroupName}
                  label={category}
                  checked={selectedCategory === category}
                  onChange={() => onCategoryChange(category)}
                />
              </div>
            ))}
          </div>
        </fieldset>
      </FilterSection>

      <FilterSection title="Gênero" subtitle="Refine por público-alvo">
        <fieldset>
          <legend className="sr-only">Gênero</legend>
          <div className="space-y-1.5">
            {genders.map((gender, index) => (
              <div key={gender}>
                <RadioOption
                  id={`${idPrefix}-gender-${index}`}
                  name={genderGroupName}
                  label={gender}
                  checked={selectedGender === gender}
                  onChange={() => onGenderChange(gender)}
                />
              </div>
            ))}
          </div>
        </fieldset>
      </FilterSection>

      {collections.length > 0 && (
        <FilterSection title="Coleção" subtitle="Campanhas e drops da marca">
          <fieldset>
            <legend className="sr-only">Coleção</legend>
            <div className="space-y-1.5">
              <RadioOption
                id={`${idPrefix}-collection-all`}
                name={collectionGroupName}
                label="Todas as coleções"
                checked={selectedCollection === 'Todos'}
                onChange={() => onCollectionChange('Todos')}
              />
              {collections.map((collection, index) => (
                <div key={collection}>
                  <RadioOption
                    id={`${idPrefix}-collection-${index}`}
                    name={collectionGroupName}
                    label={collection}
                    checked={selectedCollection === collection}
                    onChange={() => onCollectionChange(collection)}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </FilterSection>
      )}

      <FilterSection title="Faixa de preço" subtitle="Filtre por ticket médio">
        <fieldset>
          <legend className="sr-only">Faixa de preço</legend>
          <div className="space-y-1.5">
            {priceRangeOptions.map((option) => (
              <div key={option.value}>
                <RadioOption
                  id={`${idPrefix}-price-${option.value}`}
                  name={priceGroupName}
                  label={option.label}
                  checked={priceRange === option.value}
                  onChange={() => onPriceRangeChange(option.value)}
                />
              </div>
            ))}
          </div>
        </fieldset>
      </FilterSection>

      {availableSizes.length > 0 && (
        <FilterSection title="Tamanho" subtitle="Selecione a grade desejada">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSizeChange('Todos')}
              className={getSizeButtonClassName(selectedSize === 'Todos')}
              aria-pressed={selectedSize === 'Todos'}
            >
              Todos
            </button>
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSizeChange(size)}
                className={getSizeButtonClassName(selectedSize === size)}
                aria-pressed={selectedSize === size}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {availableColors.length > 0 && (
        <FilterSection title="Cor / Lavagem" subtitle="Ajuste o visual da peça">
          <fieldset>
            <legend className="sr-only">Cor ou lavagem</legend>
            <div className="space-y-1.5">
              <RadioOption
                id={`${idPrefix}-color-all`}
                name={colorGroupName}
                label="Todas as cores"
                checked={selectedColor === 'Todos'}
                onChange={() => onColorChange('Todos')}
              />
              {availableColors.map((color, index) => (
                <div key={color}>
                  <RadioOption
                    id={`${idPrefix}-color-${index}`}
                    name={colorGroupName}
                    label={color}
                    checked={selectedColor === color}
                    onChange={() => onColorChange(color)}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </FilterSection>
      )}

      <Button onClick={onClearFilters} variant="secondary" fullWidth className="justify-center">
        <RotateCcw className="h-4 w-4" />
        Limpar seleção
      </Button>
    </div>
  );
};
