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
    heroEyebrow: '',
    heroTag: '',
    heroTitle: 'Denim premium para uma marca com presenca real',
    heroSubtitle: 'Curadoria de jeans com leitura comercial clara e visual refinado.',
    primaryCtaLabel: 'Ver colecao completa',
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
    featuredTitle: 'Pecas em destaque',
    featuredSubtitle: 'Selecao com maior procura e melhor conversao no atendimento.',
    collectionsTitle: 'Colecoes em evidencia',
    collectionsSubtitle:
      'Organizacao por colecao para facilitar campanhas, drops sazonais e planejamento de vitrine.',
    institutionalEyebrow: 'Assinatura de marca',
    institutionalTitle: 'Estilo comercial com acabamento premium',
    institutionalBodyPrimary:
      'A Denim combina design limpo, qualidade tecnica e narrativa visual para construir uma marca memoravel em jeanswear.',
    institutionalBodySecondary:
      'Da selecao de tecido ao atendimento final, nossa operacao foi pensada para gerar confianca e percepcao de valor.',
    benefitsTitle: 'Por que escolher nossa curadoria',
    benefitsSubtitle: 'Beneficios que reforcam a percepcao premium da marca.',
    benefitsItems: [
      'Padrao premium com revisao de qualidade em cada lote.',
      'Entrega eficiente para todo o Brasil.',
      'Suporte consultivo para orientar tamanho, modelagem e combinacao de pecas.'
    ],
    finalCtaEyebrow: 'Conversao assistida',
    finalCtaTitle: 'Quer ajuda para fechar o look ideal?',
    finalCtaSubtitle:
      'Fale com um consultor da marca e receba orientacao de tamanho, modelagem e combinacao de pecas.',
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
    storyTitle: 'Nossa historia',
    storyText:
      'A marca nasceu para unir design autoral, conforto real e acabamento premium em jeanswear.\nCom o tempo, evoluimos para uma colecao propria com linguagem moderna e comercial.\nHoje, o catalogo combina pecas essenciais e novidades para uma vitrine consistente.',
    institutionalMainText:
      'Entregar pecas premium com linguagem contemporanea, mantendo performance comercial no uso diario.',
    missionTitle: 'Missao',
    missionText:
      'Criar colecoes jeans com identidade clara, alta qualidade e leitura comercial para fortalecer marcas no varejo.',
    valuesTitle: 'Valores',
    values: ['Qualidade real', 'Design com proposito', 'Consistencia visual', 'Atendimento consultivo'],
    positioningTitle: 'Posicionamento',
    positioningText:
      'Moda jeans com linguagem moderna, elegante e comercial, pronta para colecoes consistentes.',
    positioningPhrases: [
      'Curadoria premium com caimento real.',
      'Estilo atemporal com acabamento sofisticado.',
      'Marca autoral com foco em conversao.'
    ],
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
    supportText:
      'Estamos prontos para apoiar sua decisao com orientacao de tamanho, combinacao de pecas e sugestoes comerciais.',
    ctaTitle: 'Precisa de ajuda para escolher?',
    ctaDescription: 'Nosso atendimento responde rapido e indica as melhores pecas para seu perfil.',
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
    addressLine2: 'Sao Paulo, SP - 01310-100',
    businessHours: 'Segunda a sexta, das 9h as 18h',
    showAddress: true,
    showSocialLinks: true
  },
  seo: {
    defaultTitle: 'Denim Premium',
    institutionalTitle: 'Denim Premium',
    defaultDescription:
      'Catalogo digital de jeans premium com curadoria comercial, estilo autoral e atendimento rapido.',
    defaultOgImage: '/mock/editorial/editorial-01.svg',
    primaryKeywords: 'jeans premium, catalogo digital, moda jeans, denim',
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
