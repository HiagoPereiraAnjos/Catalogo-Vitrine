import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X } from 'lucide-react';

interface MobileFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const MobileFiltersDrawer = ({ isOpen, onClose, children }: MobileFiltersDrawerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-40 lg:hidden"
        >
          <motion.button
            type="button"
            className="fixed inset-0 bg-gray-950/35 backdrop-blur-[1px]"
            onClick={onClose}
            aria-label="Fechar filtros"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <div className="fixed inset-0 z-40 flex">
            <motion.div
              initial={{ x: '104%', opacity: 0.98 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '104%', opacity: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative ml-auto flex h-full w-full max-w-sm flex-col border-l border-gray-200 bg-white p-4 shadow-[0_22px_52px_-28px_rgba(15,23,42,0.5)] will-change-transform"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-filters-title"
            >
              <div className="mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center justify-between">
                  <h2 id="mobile-filters-title" className="text-lg font-semibold text-gray-900">
                    Filtros
                  </h2>
                  <button
                    type="button"
                    className="premium-focus premium-interactive flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-gray-900"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar menu</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Refine sua seleção e encontre as peças ideais mais rápido.</p>
              </div>

              <div className="hide-scrollbar flex-1 overflow-y-auto pr-1">{children}</div>

              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="premium-interactive premium-focus inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.7)] hover:-translate-y-px hover:bg-gray-800 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                >
                  <Check className="h-4 w-4" />
                  Ver peças filtradas
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
