import { getWhatsAppBaseLink, WHATSAPP_CONFIG } from '../config/whatsapp';
import { SiteSettings } from '../types/siteSettings';

export const defaultSiteSettings: SiteSettings = {
  version: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
  brand: {
    name: 'Denim Premium',
    shortName: 'Denim',
    tagline: 'Jeans premium com identidade autoral',
    signature: 'Modelagem precisa, lavagem inteligente e atitude urbana.',
    heroEyebrow: 'Nova colecao de jeans premium',
    logoImage: '',
    faviconImage: '',
    institutionalImage: '',
    siteUrl: 'https://denimpremium.com',
    whatsappDisplay: WHATSAPP_CONFIG.displayNumber,
    whatsappUrl: getWhatsAppBaseLink(),
    contactEmail: 'contato@denimpremium.com',
    instagramHandle: '@denimpremium',
    instagramUrl: 'https://instagram.com/denimpremium',
    addressLine1: 'Av. Paulista, 1000',
    addressLine2: 'Sao Paulo, SP - 01310-100'
  },
  home: {
    heroTitle: 'Denim premium para uma marca com presenca real',
    heroSubtitle: 'Curadoria de jeans com leitura comercial clara e visual refinado.',
    primaryCtaLabel: 'Ver colecao completa',
    primaryCtaHref: '/produtos',
    secondaryCtaLabel: 'Falar no WhatsApp',
    secondaryCtaHref: '/contato',
    featuredTitle: 'Pecas em destaque',
    featuredSubtitle: 'Selecao com maior procura e melhor conversao no atendimento.'
  },
  sections: {
    showHero: true,
    showCollections: true,
    showHighlights: true,
    showEditorial: true,
    showInstitutional: true,
    showContactCta: true
  },
  about: {
    title: 'Sobre a marca',
    subtitle: 'Qualidade, estilo e autenticidade em cada detalhe.',
    storyTitle: 'Nossa historia',
    storyText:
      'A marca nasceu para unir design autoral, conforto real e acabamento premium em jeanswear.',
    positioningTitle: 'Posicionamento',
    positioningText:
      'Moda jeans com linguagem moderna, elegante e comercial, pronta para colecoes consistentes.',
    differentialsTitle: 'Diferenciais',
    differentials: [
      'Modelagem pensada para uso real',
      'Lavagens com assinatura visual',
      'Curadoria premium para conversao'
    ]
  },
  contact: {
    title: 'Fale com o time comercial',
    subtitle: 'Atendimento rapido para duvidas de produto, tamanho e pedidos.',
    ctaTitle: 'Precisa de ajuda para escolher?',
    ctaDescription: 'Nosso atendimento responde rapido e indica as melhores pecas para seu perfil.',
    whatsappCtaLabel: 'Chamar no WhatsApp',
    showAddress: true,
    showSocialLinks: true
  },
  seo: {
    defaultTitle: 'Denim Premium',
    defaultDescription:
      'Catalogo digital de jeans premium com curadoria comercial, estilo autoral e atendimento rapido.',
    defaultOgImage: '/mock/editorial/editorial-01.svg',
    home: {
      title: 'Home',
      description:
        'Conheca a colecao de jeans premium com pecas em destaque, narrativa de marca e contato direto.'
    },
    products: {
      title: 'Produtos',
      description:
        'Explore calcas, jaquetas, bermudas e pecas selecionadas para uma vitrine de moda premium.'
    },
    productDetails: {
      title: 'Produto',
      description:
        'Detalhes completos da peca: imagens, modelagem, preco e contato rapido para atendimento.'
    },
    about: {
      title: 'Sobre',
      description: 'Historia, posicionamento e proposta de valor da marca denim.'
    },
    contact: {
      title: 'Contato',
      description:
        'Canal direto com WhatsApp, email e redes sociais para atendimento comercial.'
    }
  },
  appearance: {
    themeMode: 'light',
    accentColor: '#1e3a8a',
    accentSoftColor: '#dbeafe',
    backgroundColor: '#f6f5f3',
    surfaceColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: '2xl'
  }
};
