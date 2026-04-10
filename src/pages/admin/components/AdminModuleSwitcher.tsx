import { Image as ImageIcon, Layers3, Package, Palette, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminModuleKey } from '../types';

interface AdminModuleSwitcherProps {
  activeModule: AdminModuleKey;
  onChange: (module: AdminModuleKey) => void;
}

interface ModuleCard {
  key: AdminModuleKey;
  title: string;
  description: string;
  icon: LucideIcon;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    key: 'products',
    title: 'Produtos',
    description: 'Cadastro, edição e status de catálogo.',
    icon: Package
  },
  {
    key: 'collections',
    title: 'Coleções',
    description: 'Duplicação, agrupamentos e lançamentos.',
    icon: Layers3
  },
  {
    key: 'media',
    title: 'Mídia',
    description: 'Gestão de capa, galeria e ordenação.',
    icon: ImageIcon
  },
  {
    key: 'site',
    title: 'Personalização',
    description: 'Marca, Home, Sobre e Contato.',
    icon: SlidersHorizontal
  },
  {
    key: 'seo',
    title: 'SEO',
    description: 'Metadados e compartilhamento social.',
    icon: Search
  },
  {
    key: 'appearance',
    title: 'Aparência',
    description: 'Tema visual, cores e contraste.',
    icon: Palette
  },
  {
    key: 'orders',
    title: 'Sacola/Pedidos',
    description: 'Módulo preparado para evolução futura.',
    icon: ShoppingBag
  }
];

export const AdminModuleSwitcher = ({ activeModule, onChange }: AdminModuleSwitcherProps) => (
  <section className="premium-reveal rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.6)] md:p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Módulos administrativos</p>
    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {MODULE_CARDS.map((module) => {
        const isActive = module.key === activeModule;
        const Icon = module.icon;

        return (
          <button
            key={module.key}
            type="button"
            onClick={() => onChange(module.key)}
            aria-pressed={isActive}
            className={`premium-focus premium-interactive rounded-xl border px-4 py-3 text-left transition ${
              isActive
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <Icon className="h-4 w-4" />
              {module.title}
            </span>
            <span className={`mt-1 block text-xs ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
              {module.description}
            </span>
          </button>
        );
      })}
    </div>
  </section>
);
