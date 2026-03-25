import { buildWaMeLink } from '../config/whatsapp';
import { getBrandSettingsSnapshot, getContactSettingsSnapshot } from './siteBrand';

export type WhatsAppContext = 'home' | 'product' | 'contact' | 'floating';
export type WhatsAppIntent = 'hero' | 'curation' | 'size-help' | 'product-details' | 'contact-form' | 'general';

export interface WhatsAppMessageParams {
  context: WhatsAppContext;
  productName?: string;
  productCode?: string;
  productPrice?: string;
  routePath?: string;
  intent?: WhatsAppIntent;
}

const contextLabels: Record<WhatsAppContext, string> = {
  home: 'Home',
  product: 'Produto',
  contact: 'Contato',
  floating: 'Botao flutuante'
};

const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/produtos': 'Catalogo',
  '/sobre': 'Sobre',
  '/contato': 'Contato',
  '/admin': 'Admin'
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
      return `Ola! Vim pela Home da ${brandName} e quero conhecer os jeans da nova colecao com maior procura.`;
    case 'size-help':
      return `Ola! Quero ajuda para escolher tamanho e modelagem ideais no catalogo da ${brandName}.`;
    case 'curation':
      return `Ola! Quero uma curadoria rapida com pecas premium da ${brandName} para montar meu look.`;
    default:
      return `Ola! Vim pela Home da ${brandName} e quero atendimento comercial para escolher as melhores pecas.`;
  }
};

const buildProductMessage = ({ productName, productCode, productPrice }: WhatsAppMessageParams) => {
  const safeProductName = productName || 'peca do catalogo';
  const safeCode = productCode || 'sem-codigo';
  const safePrice = productPrice ? ` | Preco de referencia: ${productPrice}` : '';

  return `Ola! Tenho interesse em "${safeProductName}" | SKU/Codigo: ${safeCode}${safePrice}. Pode me confirmar disponibilidade, grade de tamanhos e prazo de envio?`;
};

const buildContactMessage = (brandName: string, intent: WhatsAppMessageParams['intent']) => {
  if (intent === 'contact-form') {
    return `Ola! Vim pela pagina de contato da ${brandName} e quero atendimento para duvidas comerciais e suporte de compra.`;
  }

  return `Ola! Vim pela pagina de contato da ${brandName} e quero falar com o time comercial agora.`;
};

const buildFloatingMessage = (brandName: string, routePath?: string) => {
  const routeLabel = routePath ? routeLabels[routePath] || routePath : 'Site';
  return `Ola! Estou navegando em ${routeLabel} no site da ${brandName} e quero atendimento rapido no WhatsApp para avancar na compra.`;
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
    case 'floating':
    default:
      content = buildFloatingMessage(brandName, params.routePath);
      break;
  }

  return `${content} [Origem: ${contextLabels[params.context]}]`;
};

const resolveWhatsAppBaseLink = () => {
  const contact = getContactSettingsSnapshot();
  const brand = getBrandSettingsSnapshot();
  const candidates = [contact.whatsappUrl, brand.whatsappUrl];

  for (const candidate of candidates) {
    const rawUrl = candidate.trim();
    if (!rawUrl) {
      continue;
    }

    const normalizedValue = rawUrl.includes('://') ? rawUrl : `https://${rawUrl}`;
    const cleanValue = normalizedValue.split('?')[0];

    try {
      const parsed = new URL(cleanValue);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
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

const whatsappButtonBaseClass =
  'premium-interactive premium-focus inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold hover:-translate-y-0.5 focus-visible:ring-offset-2';

export const whatsappPrimaryButtonClass = `${whatsappButtonBaseClass} border border-green-500/80 bg-green-600 px-6 py-3 text-white shadow-[0_14px_32px_-18px_rgba(22,163,74,0.7)] hover:bg-green-700 hover:shadow-[0_18px_38px_-18px_rgba(22,163,74,0.75)] focus-visible:ring-green-500`;

export const whatsappOutlineButtonClass = `${whatsappButtonBaseClass} border border-white/40 bg-white/[0.02] px-6 py-3 text-white hover:bg-white/10 focus-visible:ring-white`;

export const whatsappSoftButtonClass = `${whatsappButtonBaseClass} border border-green-200 bg-green-50 px-5 py-2.5 text-green-900 hover:bg-green-100 focus-visible:ring-green-500`;
