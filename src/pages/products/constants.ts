export const sortOptions = [
  { value: 'newest', label: 'Lançamentos' },
  { value: 'lowest-price', label: 'Menor preço' },
  { value: 'highest-price', label: 'Maior preço' },
  { value: 'name-asc', label: 'Nome A-Z' }
];

export const priceRangeOptions = [
  { value: 'Todos', label: 'Todos os preços' },
  { value: 'ate-150', label: 'Até R$ 150' },
  { value: '150-250', label: 'R$ 150 - R$ 250' },
  { value: 'acima-250', label: 'Acima de R$ 250' }
];

const priceRangeLabels: Record<string, string> = {
  'ate-150': 'Até R$ 150',
  '150-250': 'R$ 150 - R$ 250',
  'acima-250': 'Acima de R$ 250'
};

export const getPriceRangeLabel = (priceRange: string) => priceRangeLabels[priceRange] || null;

