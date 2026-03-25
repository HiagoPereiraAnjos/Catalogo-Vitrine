import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidthClassName?: string;
  bodyClassName?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  maxWidthClassName = 'sm:max-w-4xl',
  bodyClassName = 'p-6',
  showCloseButton = true,
  children
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-start justify-center px-4 py-8 text-center sm:px-6 lg:px-8">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-gray-950/55 backdrop-blur-[2px]"
              aria-label="Fechar modal"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.99 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={`relative inline-block w-full overflow-hidden rounded-3xl border border-gray-200/80 bg-white text-left align-middle shadow-[0_35px_80px_-45px_rgba(15,23,42,0.75)] will-change-transform ${maxWidthClassName}`}
            >
              <div className="border-b border-gray-100/80 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl leading-6 font-semibold tracking-tight text-gray-900" id="modal-title">
                      {title}
                    </h3>
                    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="premium-focus premium-interactive rounded-full border border-transparent bg-gray-50 p-1.5 text-gray-400 hover:border-gray-200 hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-gray-900"
                      type="button"
                      aria-label="Fechar modal"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <div className={bodyClassName}>{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
