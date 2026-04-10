import React, { useState } from 'react';
import { Search, Settings, Menu, ShoppingBag, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { CatalogImage } from './CatalogImage';

const navItems = [
  { to: '/', label: 'Início' },
  { to: '/produtos', label: 'Coleção' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/contato', label: 'Contato' }
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, openCart } = useCart();
  const { settings } = useSiteSettings();
  const brand = settings.brand;
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/produtos?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/produtos');
    }

    setIsMobileMenuOpen(false);
  };

  const handleOpenCart = () => {
    openCart();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl" style={{ borderColor: 'var(--brand-border)' }}>
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Link
            to="/"
            className="premium-focus premium-interactive flex shrink-0 items-center gap-2 rounded-sm focus-visible:ring-gray-900"
            aria-label={`Página inicial ${brand.name}`}
          >
            {brand.logoImage ? (
              <span className="relative h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-white">
                <CatalogImage
                  src={brand.logoImage}
                  alt={`Logo ${brand.name}`}
                  className="h-full w-full object-cover"
                  fallback={{ style: 'institutional', seed: 'brand-logo', label: brand.shortName || brand.name }}
                />
              </span>
            ) : null}
            <div className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-[0.22em] theme-text-primary">{brand.name}</span>
              <p className="hidden text-[11px] uppercase tracking-[0.14em] text-gray-500 lg:block">{brand.tagline}</p>
            </div>
          </Link>

          <nav className="hidden items-center space-x-2 md:flex" aria-label="Navegação principal">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `premium-focus premium-interactive rounded-full px-3.5 py-1.5 text-sm font-medium focus-visible:ring-gray-900 ${
                    isActive ? 'nav-pill-active' : 'nav-pill-idle'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden max-w-sm flex-1 md:block lg:max-w-md">
            <form onSubmit={handleSearch} className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400 transition-colors duration-200 group-focus-within:text-gray-700" />
              </div>
              <input
                type="text"
                className="field-control rounded-full py-2.5 pl-9"
                placeholder="Buscar por modelagem, lavagem ou SKU..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Buscar produtos"
              />
            </form>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {!isAdminRoute && (
              <button
                type="button"
                onClick={handleOpenCart}
                className="premium-focus premium-interactive relative inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-gray-500 hover:border-[var(--brand-border)] hover:bg-gray-100 hover:text-[var(--theme-primary)] focus-visible:ring-gray-900"
                aria-label={totalItems > 0 ? `Abrir sacola com ${totalItems} item(ns)` : 'Abrir sacola'}
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="hidden text-sm font-semibold lg:inline">Sacola</span>
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--theme-primary)] px-1.5 text-[10px] font-semibold text-white">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
            )}
            <Link
              to="/admin"
              className="premium-focus premium-interactive rounded-full border border-transparent p-2 text-gray-500 hover:border-[var(--brand-border)] hover:bg-gray-100 hover:text-[var(--theme-primary)] focus-visible:ring-gray-900"
              aria-label="Área administrativa"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>

          <div className="flex items-center space-x-2 md:hidden">
            {!isAdminRoute && (
              <button
                type="button"
                onClick={handleOpenCart}
                className="premium-focus premium-interactive relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-[var(--theme-primary)] focus-visible:ring-gray-900"
                aria-label={totalItems > 0 ? `Abrir sacola com ${totalItems} item(ns)` : 'Abrir sacola'}
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--theme-primary)] px-1.5 text-[10px] font-semibold text-white">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
            )}
            <Link
              to="/admin"
              className="premium-focus premium-interactive rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-[var(--theme-primary)] focus-visible:ring-gray-900"
              aria-label="Painel de administração"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="premium-focus premium-interactive rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-[var(--theme-primary)] focus-visible:ring-gray-900"
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur md:hidden"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            <div className="space-y-4 px-4 py-4">
              <form onSubmit={handleSearch} className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400 transition-colors duration-200 group-focus-within:text-gray-700" />
                </div>
                <input
                  type="text"
                  className="field-control rounded-full py-2.5 pl-9"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Buscar produtos"
                />
              </form>

              <nav className="flex flex-col space-y-2 pb-4" aria-label="Menu móvel">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `premium-interactive rounded-xl px-2.5 py-3 text-base font-medium ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-900 hover:bg-[rgba(var(--theme-primary-rgb),0.08)] hover:text-[var(--theme-primary)]'
                      }`
                    }
                    style={({ isActive }) => (isActive ? { backgroundColor: 'var(--theme-primary)' } : undefined)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {!isAdminRoute && (
                <button
                  type="button"
                  onClick={handleOpenCart}
                  className="premium-focus premium-interactive flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-900"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Sacola
                  {totalItems > 0 && (
                    <span className="rounded-full bg-[var(--theme-primary)] px-2 py-0.5 text-xs font-semibold text-white">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
