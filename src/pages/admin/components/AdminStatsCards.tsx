import { Layers3, Package, Sparkles, Star } from 'lucide-react';

interface AdminStatsCardsProps {
  totalProducts: number;
  featuredCount: number;
  newCount: number;
  categoriesCount: number;
}

export const AdminStatsCards = ({ totalProducts, featuredCount, newCount, categoriesCount }: AdminStatsCardsProps) => {
  const cards = [
    {
      label: 'Total de produtos',
      value: totalProducts,
      icon: Package,
      tone: 'text-gray-400'
    },
    {
      label: 'Em destaque',
      value: featuredCount,
      icon: Star,
      tone: 'text-amber-500'
    },
    {
      label: 'Novidades',
      value: newCount,
      icon: Sparkles,
      tone: 'text-emerald-500'
    },
    {
      label: 'Categorias ativas',
      value: categoriesCount,
      icon: Layers3,
      tone: 'text-blue-500'
    }
  ];

  return (
    <section className="premium-reveal grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="surface-card surface-card-hover p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-gray-500">{card.label}</p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-3xl font-semibold tracking-tight text-gray-900">{card.value}</p>
            <card.icon className={`h-5 w-5 ${card.tone}`} />
          </div>
        </article>
      ))}
    </section>
  );
};
