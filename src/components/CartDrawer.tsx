import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatters';
import { buildWhatsAppCartHref, whatsappPrimaryButtonClass } from '../utils/whatsapp';
import { CatalogImage } from './CatalogImage';
import { WhatsAppLogo } from './icons/WhatsAppLogo';

export const CartDrawer: React.FC = () => {
  const {
    items,
    totalItems,
    uniqueItems,
    totalAmount,
    isDrawerOpen,
    closeCart,
    removeItem,
    updateQuantity,
    updateSize,
    updateColor,
    updateFit,
    clearCart
  } = useCart();

  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const averagePerUnit = totalItems > 0 ? totalAmount / totalItems : 0;

  const cartWhatsAppHref = useMemo(
    () =>
      buildWhatsAppCartHref({
        items: items.map((item) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          selectedFit: item.selectedFit,
          unitPrice: item.price,
          subtotal: item.subtotal
        })),
        totalAmount
      }),
    [items, totalAmount]
  );

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDrawerOpen || typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen || typeof window === 'undefined') {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCart();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isDrawerOpen, closeCart]);

  const pushFeedback = (message: string) => {
    setFeedback(message);

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 1600);
  };

  const handleRemoveItem = (lineId: string, itemName: string) => {
    removeItem(lineId);
    pushFeedback(`"${itemName}" removido da sacola.`);
  };

  const handleUpdateQuantity = (lineId: string, nextQuantity: number) => {
    const safeQuantity = Math.max(1, Math.min(99, nextQuantity));
    updateQuantity(lineId, safeQuantity);
    pushFeedback(`Quantidade atualizada para ${safeQuantity}.`);
  };

  const handleUpdateSize = (lineId: string, nextSize: string) => {
    updateSize(lineId, nextSize);
    pushFeedback(`Tamanho alterado para ${nextSize}.`);
  };

  const handleUpdateColor = (lineId: string, nextColor: string) => {
    updateColor(lineId, nextColor);
    pushFeedback(`Cor/lavagem alterada para ${nextColor}.`);
  };

  const handleUpdateFit = (lineId: string, nextFit: string) => {
    updateFit(lineId, nextFit);
    pushFeedback(`Modelagem alterada para ${nextFit}.`);
  };

  const handleClearCart = () => {
    if (items.length === 0) {
      return;
    }

    clearCart();
    pushFeedback('Sacola limpa com sucesso.');
  };

  const hasItems = items.length > 0;

  return (
    <AnimatePresence initial={false}>
      {isDrawerOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-gray-950/45 backdrop-blur-[1px]"
            onClick={closeCart}
            aria-label="Fechar sacola"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <div className="absolute inset-0 flex justify-end">
            <motion.aside
              initial={{ x: '102%', opacity: 0.98 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '102%', opacity: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-[0_24px_54px_-34px_rgba(15,23,42,0.65)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-drawer-title"
            >
              <header className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Pedido assistido</p>
                    <h2 id="cart-drawer-title" className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                      Sua sacola
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {uniqueItems} item(ns) distintos, {totalItems} unidade(s)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="premium-focus premium-interactive inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-gray-900"
                    aria-label="Fechar sacola"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </header>

              <div className="hide-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                <AnimatePresence initial={false}>
                  {feedback && (
                    <motion.div
                      key={feedback}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
                      role="status"
                      aria-live="polite"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {feedback}
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasItems ? (
                  items.map((item) => (
                    <motion.article
                      layout
                      key={item.lineId}
                      className="rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.5)]"
                    >
                      <div className="flex gap-3">
                        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          <CatalogImage
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            fallback={{ style: 'editorial', seed: `${item.productId}-cart`, label: item.name }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold text-gray-900">{item.name}</p>
                              <p className="mt-1 text-xs text-gray-500">SKU: {item.sku || 'sem código'}</p>
                              <p className="mt-1 text-xs font-semibold text-gray-700">Preço unitário: {formatPrice(item.price)}</p>
                              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">
                                  Tam: {item.selectedSize}
                                </span>
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">
                                  Cor: {item.selectedColor}
                                </span>
                                {item.selectedFit && (
                                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">
                                    Modelagem: {item.selectedFit}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.lineId, item.name)}
                              className="premium-focus premium-interactive inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-gray-900"
                              aria-label={`Remover ${item.name} da sacola`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {item.sizeOptions.length > 0 && (
                              <label className="text-xs text-gray-600">
                                <span className="mb-1 block uppercase tracking-[0.12em] text-gray-500">Tamanho</span>
                                <select
                                  value={item.selectedSize}
                                  onChange={(event) => handleUpdateSize(item.lineId, event.target.value)}
                                  className="field-control rounded-xl py-2 text-xs"
                                >
                                  {item.sizeOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}

                            {item.colorOptions.length > 0 && (
                              <label className="text-xs text-gray-600">
                                <span className="mb-1 block uppercase tracking-[0.12em] text-gray-500">Cor/Lavagem</span>
                                <select
                                  value={item.selectedColor}
                                  onChange={(event) => handleUpdateColor(item.lineId, event.target.value)}
                                  className="field-control rounded-xl py-2 text-xs"
                                >
                                  {item.colorOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}

                            {item.fitOptions.length > 1 && (
                              <label className="text-xs text-gray-600 sm:col-span-2">
                                <span className="mb-1 block uppercase tracking-[0.12em] text-gray-500">Modelagem</span>
                                <select
                                  value={item.selectedFit}
                                  onChange={(event) => handleUpdateFit(item.lineId, event.target.value)}
                                  className="field-control rounded-xl py-2 text-xs"
                                >
                                  {item.fitOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.lineId, item.quantity - 1)}
                                className="premium-interactive flex h-8 w-8 items-center justify-center rounded-l-full text-gray-600 hover:bg-gray-100"
                                aria-label={`Reduzir quantidade de ${item.name}`}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-8 px-1 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.lineId, item.quantity + 1)}
                                className="premium-interactive flex h-8 w-8 items-center justify-center rounded-r-full text-gray-600 hover:bg-gray-100"
                                aria-label={`Aumentar quantidade de ${item.name}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Subtotal</p>
                              <p className="text-sm font-semibold text-gray-900">{formatPrice(item.subtotal)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))
                ) : (
                  <div className="surface-card-strong mt-3 p-8 text-center">
                    <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(var(--theme-primary-rgb),0.2)] bg-[rgba(var(--theme-highlight-rgb),0.56)] text-[var(--theme-primary)]">
                      <ShoppingBag className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-xl font-semibold text-gray-900">Sua sacola está vazia</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      Adicione produtos para montar um pedido assistido e enviar tudo direto para o WhatsApp.
                    </p>
                    <Link
                      to="/produtos"
                      onClick={closeCart}
                      className="premium-focus premium-interactive mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-gray-900 bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:ring-gray-900"
                    >
                      Explorar coleção
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>

              <footer className="border-t border-gray-100 px-4 py-4 sm:px-6">
                <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500">Unidades</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">{totalItems}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500">Itens</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">{uniqueItems}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500">Ticket/un</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">{formatPrice(averagePerUnit)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>Total estimado</span>
                    <span className="text-lg font-bold text-gray-900">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Link
                    to="/produtos"
                    onClick={closeCart}
                    className="premium-focus premium-interactive inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Continuar comprando
                  </Link>
                  <Link
                    to="/sacola"
                    onClick={closeCart}
                    className="premium-focus premium-interactive inline-flex items-center justify-center rounded-full border border-[rgba(var(--theme-primary-rgb),0.25)] bg-[rgba(var(--theme-highlight-rgb),0.6)] px-4 py-2.5 text-sm font-semibold text-[var(--theme-primary)] hover:bg-[rgba(var(--theme-highlight-rgb),0.85)]"
                  >
                    Revisar sacola completa
                  </Link>
                </div>

                <a
                  href={cartWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${whatsappPrimaryButtonClass} w-full ${!hasItems ? 'pointer-events-none opacity-60' : ''}`}
                  aria-disabled={!hasItems}
                >
                  <WhatsAppLogo className="h-5 w-5" />
                  Finalizar no WhatsApp
                </a>

                <button
                  type="button"
                  onClick={handleClearCart}
                  disabled={!hasItems}
                  className="premium-focus premium-interactive mt-3 w-full rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Limpar sacola
                </button>

                <p className="mt-3 text-center text-xs text-gray-500">
                  Atendimento consultivo com resposta rápida. Sem checkout no site.
                </p>
              </footer>
            </motion.aside>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
