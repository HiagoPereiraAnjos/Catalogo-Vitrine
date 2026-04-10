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
    heroEyebrow: 'Nova coleção de jeans premium',
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
    addressLine2: 'São Paulo, SP - 01310-100'
  },
  home: {
    heroEyebrow: '',
    heroTag: '',
    heroTitle: 'Denim premium para uma marca com presença real',
    heroSubtitle: 'Curadoria de jeans com leitura comercial clara e visual refinado.',
    primaryCtaLabel: 'Ver coleção completa',
    primaryCtaHref: '/produtos',
    secondaryCtaLabel: 'Falar no WhatsApp',
    secondaryCtaHref: '/contato',
    heroDesktopImage: '',
    heroMobileImage: '',
    showCategories: true,
    showFeaturedProducts: true,
    showCollections: true,
    showInstitutional: true,
    showBenefits: true,
    showFinalCta: true,
    sectionOrder: ['categories', 'featured', 'collections', 'institutional', 'benefits', 'finalCta'],
    categoriesTitle: 'Categorias em destaque',
    categoriesSubtitle: 'Explore as linhas com curadoria visual para cada perfil e momento comercial.',
    featuredTitle: 'Peças em destaque',
    featuredSubtitle: 'Seleção com maior procura e melhor conversão no atendimento.',
    collectionsTitle: 'Coleções em evidência',
    collectionsSubtitle:
      'Organização por coleção para facilitar campanhas, drops sazonais e planejamento de vitrine.',
    institutionalEyebrow: 'Assinatura de marca',
    institutionalTitle: 'Estilo comercial com acabamento premium',
    institutionalBodyPrimary:
      'A Denim combina design limpo, qualidade técnica e narrativa visual para construir uma marca memorável em jeanswear.',
    institutionalBodySecondary:
      'Da seleção de tecido ao atendimento final, nossa operação foi pensada para gerar confiança e percepção de valor.',
    benefitsTitle: 'Por que escolher nossa curadoria',
    benefitsSubtitle: 'Benefícios que reforçam a percepção premium da marca.',
    benefitsItems: [
      'Padrão premium com revisão de qualidade em cada lote.',
      'Entrega eficiente para todo o Brasil.',
      'Suporte consultivo para orientar tamanho, modelagem e combinação de peças.'
    ],
    finalCtaEyebrow: 'Conversão assistida',
    finalCtaTitle: 'Quer ajuda para fechar o look ideal?',
    finalCtaSubtitle:
      'Fale com um consultor da marca e receba orientação de tamanho, modelagem e combinação de peças.',
    finalCtaLabel: 'Receber atendimento imediato',
    finalCtaHref: '',
    featuredProductIds: []
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
    heroImage: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=2000&auto=format&fit=crop',
    mainImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1400&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop'
    ],
    storyTitle: 'Nossa história',
    storyText:
      'A marca nasceu para unir design autoral, conforto real e acabamento premium em jeanswear.\nCom o tempo, evoluímos para uma coleção própria com linguagem moderna e comercial.\nHoje, o catálogo combina peças essenciais e novidades para uma vitrine consistente.',
    institutionalMainText:
      'Entregar peças premium com linguagem contemporânea, mantendo performance comercial no uso diário.',
    missionTitle: 'Missão',
    missionText:
      'Criar coleções jeans com identidade clara, alta qualidade e leitura comercial para fortalecer marcas no varejo.',
    valuesTitle: 'Valores',
    values: ['Qualidade real', 'Design com propósito', 'Consistência visual', 'Atendimento consultivo'],
    positioningTitle: 'Posicionamento',
    positioningText:
      'Moda jeans com linguagem moderna, elegante e comercial, pronta para coleções consistentes.',
    positioningPhrases: [
      'Curadoria premium com caimento real.',
      'Estilo atemporal com acabamento sofisticado.',
      'Marca autoral com foco em conversão.'
    ],
    differentialsTitle: 'Diferenciais',
    differentials: [
      'Modelagem pensada para uso real',
      'Lavagens com assinatura visual',
      'Curadoria premium para conversão'
    ]
  },
  contact: {
    title: 'Fale com o time comercial',
    subtitle: 'Atendimento rápido para dúvidas de produto, tamanho e pedidos.',
    supportText:
      'Estamos prontos para apoiar sua decisão com orientação de tamanho, combinação de peças e sugestões comerciais.',
    ctaTitle: 'Precisa de ajuda para escolher?',
    ctaDescription: 'Nosso atendimento responde rápido e indica as melhores peças para seu perfil.',
    primaryCtaLabel: 'Falar com especialista agora',
    whatsappDisplay: WHATSAPP_CONFIG.displayNumber,
    whatsappUrl: getWhatsAppBaseLink(),
    secondaryPhone: '(11) 3333-4444',
    email: 'contato@denimpremium.com',
    instagramHandle: '@denimpremium',
    instagramUrl: 'https://instagram.com/denimpremium',
    facebookLabel: 'Denim Premium',
    facebookUrl: '',
    addressLine1: 'Av. Paulista, 1000',
    addressLine2: 'São Paulo, SP - 01310-100',
    businessHours: 'Segunda a sexta, das 9h às 18h',
    showAddress: true,
    showSocialLinks: true
  },
  seo: {
    defaultTitle: 'Denim Premium',
    institutionalTitle: 'Denim Premium',
    defaultDescription:
      'Catálogo digital de jeans premium com curadoria comercial, estilo autoral e atendimento rápido.',
    defaultOgImage: '/mock/editorial/editorial-01.svg',
    primaryKeywords: 'jeans premium, catálogo digital, moda jeans, denim',
    home: {
      title: 'Home',
      description:
        'Conheça a coleção de jeans premium com peças em destaque, narrativa de marca e contato direto.'
    },
    products: {
      title: 'Produtos',
      description:
        'Explore calças, jaquetas, bermudas e peças selecionadas para uma vitrine de moda premium.'
    },
    productDetails: {
      title: 'Produto',
      description:
        'Detalhes completos da peça: imagens, modelagem, preço e contato rápido para atendimento.'
    },
    about: {
      title: 'Sobre',
      description: 'História, posicionamento e proposta de valor da marca denim.'
    },
    contact: {
      title: 'Contato',
      description:
        'Canal direto com WhatsApp, e-mail e redes sociais para atendimento comercial.'
    }
  },
  appearance: {
    themeMode: 'light',
    primaryColor: '#1e3a8a',
    highlightColor: '#dbeafe',
    supportColor: '#475569',
    accentColor: '#1e3a8a',
    accentSoftColor: '#dbeafe',
    backgroundColor: '#f6f5f3',
    surfaceColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: '2xl',
    buttonStyle: 'solid',
    fontPreset: 'signature'
  }
};
