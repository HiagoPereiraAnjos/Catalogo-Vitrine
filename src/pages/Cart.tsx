import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { CatalogImage } from '../components/CatalogImage';
import { Container } from '../components/Container';
import { EmptyState } from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import { usePageSeo } from '../hooks/usePageSeo';
import { formatPrice } from '../utils/formatters';
import { buildWhatsAppCartHref, whatsappPrimaryButtonClass } from '../utils/whatsapp';
import { WhatsAppLogo } from '../components/icons/WhatsAppLogo';

export default function Cart() {
  const navigate = useNavigate();
  const { items, totalItems, uniqueItems, totalAmount, updateQuantity, updateSize, updateColor, updateFit, removeItem, clearCart } = useCart();
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const averagePerUnit = totalItems > 0 ? totalAmount / totalItems : 0;

  usePageSeo({
    title: 'Sacola de orçamento',
    description: 'Revise os produtos selecionados e finalize seu pedido assistido via WhatsApp.',
    type: 'website'
  });

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

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

  if (items.length === 0) {
    return (
      <Container as="article" className="section-shell-tight">
        <EmptyState
          icon={ShoppingBag}
          title="Sua sacola está vazia"
          description="Selecione produtos para montar seu pedido assistido e enviar ao time comercial pelo WhatsApp."
          actionLabel="Voltar para o catálogo"
          onAction={() => navigate('/produtos')}
        />
      </Container>
    );
  }

  return (
    <Container as="article" className="section-shell-tight pb-28 md:pb-16">
      <section className="mb-8 border-b border-gray-200 pb-6">
        <p className="section-eyebrow mb-2">Revisão do pedido assistido</p>
        <h1 className="section-title text-4xl">Sacola de orçamento</h1>
        <p className="mt-3 max-w-2xl text-sm text-gray-600">
          Confira os itens selecionados, ajuste variações e quantidades e finalize no WhatsApp com tudo pré-preenchido.
        </p>
      </section>

      <AnimatePresence initial={false}>
        {feedback && (
          <motion.div
            key={feedback}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="h-4 w-4" />
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-3" aria-label="Itens da sacola">
          {items.map((item) => (
            <motion.article
              layout
              key={item.lineId}
              className="surface-card p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <CatalogImage
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    fallback={{ style: 'editorial', seed: `${item.productId}-cart-page`, label: item.name }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-base font-semibold text-gray-900">{item.name}</p>
                      <p className="mt-1 text-xs text-gray-500">SKU: {item.sku || 'sem código'}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">Tam: {item.selectedSize}</span>
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

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">Preço unitário</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(item.price)}</p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">Quantidade</p>
                      <div className="mt-1 inline-flex items-center rounded-full border border-gray-200 bg-white">
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
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">Subtotal</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        <aside className="xl:sticky xl:top-24 xl:h-fit" aria-label="Resumo da sacola">
          <div className="surface-card-strong p-5">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Resumo</h2>
            <div className="mt-4 space-y-2 border-b border-gray-100 pb-4 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Total de unidades</span>
                <span className="font-semibold text-gray-900">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Itens distintos</span>
                <span className="font-semibold text-gray-900">{uniqueItems}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Total estimado</span>
              <span className="text-2xl font-bold text-gray-900">{formatPrice(totalAmount)}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500">Unidades</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">{totalItems}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500">Itens</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">{uniqueItems}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500">Ticket/un</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">{formatPrice(averagePerUnit)}</p>
              </div>
            </div>

            <a
              href={cartWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${whatsappPrimaryButtonClass} mt-5 w-full`}
            >
              <WhatsAppLogo className="h-5 w-5" />
              Finalizar no WhatsApp
            </a>

            <div className="mt-3 grid grid-cols-1 gap-2">
              <Link
                to="/produtos"
                className="premium-focus premium-interactive inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Continuar comprando
              </Link>
              <button
                type="button"
                onClick={handleClearCart}
                className="premium-focus premium-interactive inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Limpar sacola
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              Sem checkout e sem pagamento no site. O pedido é finalizado com atendimento humano no WhatsApp.
            </p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-gray-200 bg-white/98 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_34px_-28px_rgba(15,23,42,0.45)] backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-[1240px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">Total da sacola</p>
            <p className="text-base font-bold text-gray-900">{formatPrice(totalAmount)}</p>
            <p className="text-xs text-gray-500">{totalItems} unidade(s)</p>
          </div>
          <a
            href={cartWhatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${whatsappPrimaryButtonClass} shrink-0 px-5 py-2.5`}
          >
            <WhatsAppLogo className="h-5 w-5" />
            Finalizar
          </a>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/produtos"
          className="premium-focus premium-interactive inline-flex items-center gap-2 text-sm font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary-strong)]"
        >
          Voltar ao catálogo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Container>
  );
}
