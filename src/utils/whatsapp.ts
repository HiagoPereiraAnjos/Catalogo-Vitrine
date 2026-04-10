import { buildWaMeLink } from '../config/whatsapp';
import { getBrandSettingsSnapshot, getContactSettingsSnapshot } from './siteBrand';

export type WhatsAppContext = 'home' | 'product' | 'contact' | 'floating' | 'cart';
export type WhatsAppIntent =
  | 'hero'
  | 'curation'
  | 'size-help'
  | 'product-details'
  | 'contact-form'
  | 'general'
  | 'cart-review';

export interface WhatsAppMessageParams {
  context: WhatsAppContext;
  productName?: string;
  productCode?: string;
  productPrice?: string;
  routePath?: string;
  intent?: WhatsAppIntent;
}

export interface WhatsAppCartItemSummary {
  name: string;
  sku?: string;
  selectedSize: string;
  selectedColor: string;
  selectedFit?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface CartWhatsAppPayload {
  items: WhatsAppCartItemSummary[];
  totalAmount?: number;
}

export interface CartWhatsAppStoreSettings {
  brandName?: string;
  whatsappUrl?: string;
}

const contextLabels: Record<WhatsAppContext, string> = {
  home: 'Home',
  product: 'Produto',
  contact: 'Contato',
  floating: 'Botão flutuante',
  cart: 'Sacola'
};

const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/produtos': 'Catálogo',
  '/sobre': 'Sobre',
  '/contato': 'Contato',
  '/admin': 'Admin'
};

const formatCurrencyBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);

const normalizeText = (value: string | undefined, fallback: string) => {
  const sanitized = (value || '').trim();
  return sanitized || fallback;
};

const toSafePositiveNumber = (value: number | undefined, fallback = 0) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return value;
};

const MIN_WHATSAPP_PHONE_LENGTH = 10;

const extractDigits = (value: string) => value.replace(/\D/g, '');

const isValidWhatsAppPhone = (digits: string) => digits.length >= MIN_WHATSAPP_PHONE_LENGTH;

const buildWaMeBaseFromPhone = (digits: string) => `https://wa.me/${digits}`;

const extractWhatsAppPhoneFromUrl = (url: URL) => {
  const host = url.hostname.toLowerCase();
  const queryPhone = extractDigits(url.searchParams.get('phone') || '');
  if (isValidWhatsAppPhone(queryPhone)) {
    return queryPhone;
  }

  const pathPhone = extractDigits(url.pathname);

  if (host.endsWith('wa.me') && isValidWhatsAppPhone(pathPhone)) {
    return pathPhone;
  }

  if (host.includes('whatsapp') && isValidWhatsAppPhone(pathPhone)) {
    return pathPhone;
  }

  return '';
};

export const resolveWhatsAppContextFromPath = (path: string): WhatsAppContext => {
  if (path.startsWith('/produto/')) {
    return 'product';
  }

  if (path === '/contato') {
    return 'contact';
  }

  if (path === '/') {
    return 'home';
  }

  return 'floating';
};

const buildHomeMessage = (brandName: string, intent: WhatsAppMessageParams['intent']) => {
  switch (intent) {
    case 'hero':
      return `Olá! Vim pela Home da ${brandName} e quero conhecer os jeans da nova coleção com maior procura.`;
    case 'size-help':
      return `Olá! Quero ajuda para escolher tamanho e modelagem ideais no catálogo da ${brandName}.`;
    case 'curation':
      return `Olá! Quero uma curadoria rápida com peças premium da ${brandName} para montar meu look.`;
    default:
      return `Olá! Vim pela Home da ${brandName} e quero atendimento comercial para escolher as melhores peças.`;
  }
};

const buildProductMessage = ({ productName, productCode, productPrice }: WhatsAppMessageParams) => {
  const safeProductName = productName || 'peça do catálogo';
  const safeCode = productCode || 'sem-código';
  const safePrice = productPrice ? ` | Preço de referência: ${productPrice}` : '';

  return `Olá! Tenho interesse em "${safeProductName}" | SKU/Código: ${safeCode}${safePrice}. Pode me confirmar disponibilidade, grade de tamanhos e prazo de envio?`;
};

const buildContactMessage = (brandName: string, intent: WhatsAppMessageParams['intent']) => {
  if (intent === 'contact-form') {
    return `Olá! Vim pela página de contato da ${brandName} e quero atendimento para dúvidas comerciais e suporte de compra.`;
  }

  return `Olá! Vim pela página de contato da ${brandName} e quero falar com o time comercial agora.`;
};

const buildFloatingMessage = (brandName: string, routePath?: string) => {
  const routeLabel = routePath ? routeLabels[routePath] || routePath : 'Site';
  return `Olá! Estou navegando em ${routeLabel} no site da ${brandName} e quero atendimento rápido no WhatsApp para avançar na compra.`;
};

export const buildCartWhatsAppMessage = (cart: CartWhatsAppPayload, storeSettings?: CartWhatsAppStoreSettings) => {
  const brand = getBrandSettingsSnapshot();
  const brandName = normalizeText(storeSettings?.brandName, normalizeText(brand.name, 'a loja'));

  const items = Array.isArray(cart.items) ? cart.items : [];

  if (items.length === 0) {
    return [
      `Olá! Gostaria de finalizar meu atendimento com a ${brandName}.`,
      '',
      'Minha sacola está vazia no momento, mas quero ajuda para montar o pedido.',
      '',
      'Aguardo atendimento para concluir a compra. Obrigado!'
    ].join('\n');
  }

  const normalizedItems = items.map((item) => {
    const quantity = Math.max(1, Math.floor(toSafePositiveNumber(item.quantity, 1)));
    const unitPrice = toSafePositiveNumber(item.unitPrice, 0);
    const subtotal = toSafePositiveNumber(item.subtotal, Number((unitPrice * quantity).toFixed(2)));

    return {
      name: normalizeText(item.name, 'Produto sem nome'),
      sku: normalizeText(item.sku, 'sem-código'),
      selectedSize: normalizeText(item.selectedSize, 'Não informado'),
      selectedColor: normalizeText(item.selectedColor, 'Não informado'),
      selectedFit: normalizeText(item.selectedFit, ''),
      quantity,
      unitPrice,
      subtotal
    };
  });

  const computedTotal = Number(normalizedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const providedTotal = toSafePositiveNumber(cart.totalAmount, computedTotal);
  const resolvedTotal = Math.abs(providedTotal - computedTotal) <= 0.01 ? providedTotal : computedTotal;

  const lines: string[] = ['Olá! Gostaria de finalizar meu atendimento com os itens abaixo:', ''];

  normalizedItems.forEach((item, index) => {
    lines.push(`${index + 1}. Produto: ${item.name}`);
    lines.push(`Código: ${item.sku}`);
    lines.push(`Tamanho: ${item.selectedSize}`);
    lines.push(`Cor/Lavagem: ${item.selectedColor}`);
    if (item.selectedFit) {
      lines.push(`Modelagem: ${item.selectedFit}`);
    }
    lines.push(`Quantidade: ${item.quantity}`);
    lines.push(`Valor unitário: ${formatCurrencyBRL(item.unitPrice)}`);
    lines.push(`Subtotal: ${formatCurrencyBRL(item.subtotal)}`);
    lines.push('');
  });

  lines.push(`Total do pedido: ${formatCurrencyBRL(resolvedTotal)}`);
  lines.push('');
  lines.push('Aguardo atendimento para concluir a compra. Obrigado!');

  return lines.join('\n');
};

export const buildWhatsAppMessage = (params: WhatsAppMessageParams) => {
  const brand = getBrandSettingsSnapshot();
  const brandName = brand.name || 'a marca';
  let content = '';

  switch (params.context) {
    case 'home':
      content = buildHomeMessage(brandName, params.intent);
      break;
    case 'product':
      content = buildProductMessage(params);
      break;
    case 'contact':
      content = buildContactMessage(brandName, params.intent);
      break;
    case 'cart':
      content = buildFloatingMessage(brandName, params.routePath);
      break;
    case 'floating':
    default:
      content = buildFloatingMessage(brandName, params.routePath);
      break;
  }

  return `${content} [Origem: ${contextLabels[params.context]}]`;
};

const resolveWhatsAppBaseLink = (preferredWhatsAppUrl?: string) => {
  const contact = getContactSettingsSnapshot();
  const brand = getBrandSettingsSnapshot();
  const candidates = [preferredWhatsAppUrl || '', contact.whatsappUrl, brand.whatsappUrl];

  for (const candidate of candidates) {
    const rawUrl = candidate.trim();
    if (!rawUrl) {
      continue;
    }

    const directPhone = extractDigits(rawUrl);
    const looksLikeDirectPhone = !rawUrl.includes('://') && !rawUrl.includes('/');
    if (looksLikeDirectPhone && isValidWhatsAppPhone(directPhone)) {
      return buildWaMeBaseFromPhone(directPhone);
    }

    const normalizedValue = rawUrl.includes('://') ? rawUrl : `https://${rawUrl}`;

    try {
      const parsed = new URL(normalizedValue);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        continue;
      }

      const phoneFromUrl = extractWhatsAppPhoneFromUrl(parsed);
      if (isValidWhatsAppPhone(phoneFromUrl)) {
        return buildWaMeBaseFromPhone(phoneFromUrl);
      }

      const host = parsed.hostname.toLowerCase();
      if (host.endsWith('wa.me') || host.includes('whatsapp')) {
        continue;
      }

      return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
    } catch {
      continue;
    }
  }

  return undefined;
};

export const buildWhatsAppHref = (params: WhatsAppMessageParams) => {
  const message = buildWhatsAppMessage(params);
  return buildWaMeLink(message, resolveWhatsAppBaseLink());
};

export const buildWhatsAppCartHref = (cart: CartWhatsAppPayload, storeSettings?: CartWhatsAppStoreSettings) => {
  const message = buildCartWhatsAppMessage(cart, storeSettings);
  return buildWaMeLink(message, resolveWhatsAppBaseLink(storeSettings?.whatsappUrl));
};

const whatsappButtonBaseClass =
  'premium-interactive premium-focus inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold hover:-translate-y-0.5 focus-visible:ring-offset-2';

export const whatsappPrimaryButtonClass = `${whatsappButtonBaseClass} border border-green-500/80 bg-green-600 px-6 py-3 text-white shadow-[0_14px_32px_-18px_rgba(22,163,74,0.7)] hover:bg-green-700 hover:shadow-[0_18px_38px_-18px_rgba(22,163,74,0.75)] focus-visible:ring-green-500`;

export const whatsappOutlineButtonClass = `${whatsappButtonBaseClass} border border-white/40 bg-white/[0.02] px-6 py-3 text-white hover:bg-white/10 focus-visible:ring-white`;

export const whatsappSoftButtonClass = `${whatsappButtonBaseClass} border border-green-200 bg-green-50 px-5 py-2.5 text-green-900 hover:bg-green-100 focus-visible:ring-green-500`;
