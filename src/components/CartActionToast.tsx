import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartActionToast: React.FC = () => {
  const { cartNotice, clearCartNotice, openCart } = useCart();

  const toneClassName =
    cartNotice?.tone === 'success'
      ? 'border-emerald-200'
      : cartNotice?.tone === 'warning'
        ? 'border-amber-200'
        : 'border-blue-200';

  const toneIconClassName =
    cartNotice?.tone === 'success'
      ? 'bg-emerald-50 text-emerald-700'
      : cartNotice?.tone === 'warning'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-blue-50 text-blue-700';

  const toneSubtitle =
    cartNotice?.tone === 'success'
      ? 'Pedido assistido salvo na sacola.'
      : cartNotice?.tone === 'warning'
        ? 'Revise as opções da peça para continuar.'
        : 'Sacola atualizada com sucesso.';

  useEffect(() => {
    if (!cartNotice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      clearCartNotice();
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cartNotice, clearCartNotice]);

  return (
    <AnimatePresence initial={false}>
      {cartNotice && (
        <motion.aside
          key={cartNotice.id}
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed left-1/2 top-20 z-[95] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border bg-white/98 p-3 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.6)] backdrop-blur ${toneClassName}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneIconClassName}`}>
              {cartNotice.tone === 'success' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : cartNotice.tone === 'warning' ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{cartNotice.message}</p>
              <p className="mt-0.5 text-xs text-gray-500">{toneSubtitle}</p>
              <button
                type="button"
                onClick={() => {
                  openCart();
                  clearCartNotice();
                }}
                className="premium-focus premium-interactive mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--theme-primary)] hover:text-[var(--theme-primary-strong)]"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Ver sacola
              </button>
            </div>
            <button
              type="button"
              onClick={clearCartNotice}
              className="premium-focus premium-interactive rounded-full border border-gray-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Fechar aviso da sacola"
            >
              Fechar
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
