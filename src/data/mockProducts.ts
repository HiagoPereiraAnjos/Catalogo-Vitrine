import { Product, StockStatus } from '../types';
import { slugify } from '../utils/product';
import { buildProductPlaceholderGallery } from './placeholders';

const baseMockProducts: Array<
  Omit<
    Product,
    | 'createdAt'
    | 'isFeatured'
    | 'isNew'
    | 'slug'
    | 'label'
    | 'collection'
    | 'season'
    | 'fit'
    | 'material'
    | 'composition'
    | 'highlights'
    | 'careInstructions'
    | 'stockStatus'
  >
> = [
  {
    id: '1',
    name: 'Calça Jeans Skinny',
    description: 'Modelagem ajustada ao corpo, com elastano para maior conforto no dia a dia.',
    price: 159.9,
    category: 'Calças',
    gender: 'Masculino',
    featuredImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop',
    sku: 'CJ-SK-M-001',
    sizes: ['38', '40', '42', '44', '46'],
    colors: ['Azul Escuro', 'Azul Claro', 'Preto'],
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: '2',
    name: 'Jaqueta Jeans Clássica',
    description: 'A peça curinga que não pode faltar no seu guarda-roupa. Lavagem tradicional.',
    price: 249.9,
    category: 'Jaquetas',
    gender: 'Unissex',
    featuredImage: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=800&auto=format&fit=crop',
    sku: 'JJ-CL-U-002',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Azul Tradicional', 'Preto'],
    images: [
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: '3',
    name: 'Shorts Jeans Destroyed',
    description: 'Estilo despojado com detalhes rasgados e barra desfiada. Perfeito para o verão.',
    price: 119.9,
    category: 'Shorts',
    gender: 'Feminino',
    featuredImage: 'https://images.unsplash.com/photo-1591369822096-bbcdd8dd5820?q=80&w=800&auto=format&fit=crop',
    sku: 'SJ-DS-F-003',
    sizes: ['34', '36', '38', '40', '42'],
    colors: ['Azul Claro', 'Branco'],
    images: [
      'https://images.unsplash.com/photo-1591369822096-bbcdd8dd5820?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: '4',
    name: 'Camisa Jeans Manga Longa',
    description: 'Camisa 100% algodão com lavagem estonada e botões de pressão.',
    price: 189.9,
    category: 'Camisas',
    gender: 'Masculino',
    featuredImage: 'https://images.unsplash.com/photo-1604644401890-0bd678c83788?q=80&w=800&auto=format&fit=crop',
    sku: 'CM-ML-M-004',
    sizes: ['P', 'M', 'G', 'GG', 'XG'],
    colors: ['Azul Estonado'],
    images: [
      'https://images.unsplash.com/photo-1604644401890-0bd678c83788?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: '5',
    name: 'Calça Jeans Mom',
    description: 'Cintura alta e modelagem mais soltinha, inspirada nos anos 90.',
    price: 179.9,
    category: 'Calças',
    gender: 'Feminino',
    featuredImage: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
    sku: 'CJ-MO-F-005',
    sizes: ['36', '38', '40', '42', '44'],
    colors: ['Azul Médio', 'Preto'],
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: '6',
    name: 'Jaqueta Jeans Oversized',
    description: 'Modelagem ampla e moderna, ideal para compor looks em camadas.',
    price: 279.9,
    category: 'Jaquetas',
    gender: 'Unissex',
    featuredImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=800&auto=format&fit=crop',
    sku: 'JJ-OV-U-006',
    sizes: ['P', 'M', 'G'],
    colors: ['Azul Claro', 'Azul Escuro'],
    images: [
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: '7',
    name: 'Calça Jeans Reta',
    description: 'O corte clássico e atemporal que combina com qualquer ocasião.',
    price: 169.9,
    category: 'Calças',
    gender: 'Masculino',
    featuredImage: 'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?q=80&w=800&auto=format&fit=crop',
    sku: 'CJ-RT-M-007',
    sizes: ['38', '40', '42', '44', '46', '48'],
    colors: ['Azul Tradicional', 'Preto'],
    images: [
      'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: '8',
    name: 'Bermuda Jeans Masculina',
    description: 'Conforto e durabilidade para os dias mais quentes. Lavagem escura.',
    price: 139.9,
    category: 'Shorts',
    gender: 'Masculino',
    featuredImage: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop',
    sku: 'BJ-MS-M-008',
    sizes: ['38', '40', '42', '44', '46'],
    colors: ['Azul Escuro'],
    images: [
      'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: '9',
    name: 'Saia Jeans Midi',
    description: 'Saia jeans comprimento midi com fenda frontal e lavagem média.',
    price: 159.9,
    category: 'Saias',
    gender: 'Feminino',
    featuredImage: 'https://images.unsplash.com/photo-1583496661160-c588c443c982?q=80&w=800&auto=format&fit=crop',
    sku: 'SJ-MD-F-009',
    sizes: ['36', '38', '40', '42'],
    colors: ['Azul Médio'],
    images: ['https://images.unsplash.com/photo-1583496661160-c588c443c982?q=80&w=800&auto=format&fit=crop']
  },
  {
    id: '10',
    name: 'Macacão Jeans Utilitário',
    description: 'Macacão longo em jeans leve com bolsos utilitários e cinto do próprio tecido.',
    price: 289.9,
    category: 'Macacões',
    gender: 'Feminino',
    featuredImage: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=800&auto=format&fit=crop',
    sku: 'MJ-UT-F-010',
    sizes: ['P', 'M', 'G'],
    colors: ['Azul Claro', 'Preto'],
    images: ['https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=800&auto=format&fit=crop']
  },
  {
    id: '11',
    name: 'Jaqueta Jeans com Pelúcia',
    description: 'Jaqueta jeans forrada com pelúcia sintética na gola e no corpo. Ideal para o inverno.',
    price: 329.9,
    category: 'Jaquetas',
    gender: 'Masculino',
    featuredImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=800&auto=format&fit=crop',
    sku: 'JJ-PL-M-011',
    sizes: ['M', 'G', 'GG'],
    colors: ['Azul Escuro com Pelúcia Branca'],
    images: ['https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=800&auto=format&fit=crop']
  },
  {
    id: '12',
    name: 'Shorts Jeans Godê',
    description: 'Shorts jeans modelagem godê, mais soltinho nas pernas, lavagem clara.',
    price: 129.9,
    category: 'Shorts',
    gender: 'Feminino',
    featuredImage: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=800&auto=format&fit=crop',
    sku: 'SJ-GD-F-012',
    sizes: ['34', '36', '38', '40'],
    colors: ['Azul Claro'],
    images: ['https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=800&auto=format&fit=crop']
  },
  {
    id: '13',
    name: 'Calça Jeans Wide Leg',
    description: 'Calça jeans wide leg, pernas amplas desde o quadril, lavagem escura.',
    price: 199.9,
    category: 'Calças',
    gender: 'Feminino',
    featuredImage: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
    sku: 'CJ-WL-F-013',
    sizes: ['36', '38', '40', '42', '44'],
    colors: ['Azul Escuro', 'Azul Médio'],
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop']
  },
  {
    id: '14',
    name: 'Camisa Jeans Manga Curta',
    description: 'Camisa jeans masculina de manga curta, tecido leve e respirável.',
    price: 149.9,
    category: 'Camisas',
    gender: 'Masculino',
    featuredImage: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=800&auto=format&fit=crop',
    sku: 'CM-MC-M-014',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: ['Azul Claro'],
    images: ['https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=800&auto=format&fit=crop']
  },
  {
    id: '15',
    name: 'Calça Jeans Skinny Feminina',
    description: 'Calça jeans skinny com elastano, lavagem escura e cintura média. Perfeita para o dia a dia.',
    price: 159.9,
    category: 'Calças',
    gender: 'Feminino',
    featuredImage: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
    sku: 'CJ-SK-F-015',
    sizes: ['36', '38', '40', '42', '44', '46'],
    colors: ['Azul Escuro', 'Preto'],
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop']
  },
  {
    id: '16',
    name: 'Bermuda Jeans Cargo',
    description: 'Bermuda jeans com bolsos cargo laterais e comprimento na altura do joelho.',
    price: 149.9,
    category: 'Shorts',
    gender: 'Masculino',
    featuredImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=800&auto=format&fit=crop',
    sku: 'BJ-CG-M-016',
    sizes: ['38', '40', '42', '44', '46'],
    colors: ['Azul Médio', 'Preto'],
    images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=800&auto=format&fit=crop']
  }
];

const featuredProductIds = new Set(['1', '2', '5', '6']);
const newProductIds = new Set(['13', '14', '15', '16']);
const mostWantedProductIds = new Set(['2', '6', '7']);
const lowStockIds = new Set(['6', '11', '13']);
const outOfStockIds = new Set(['10']);
const baseCreatedAt = new Date('2025-01-01T10:00:00.000Z').getTime();

const categoryProfiles: Record<
  string,
  {
    collection: string;
    fit: string;
    material: string;
    composition: string;
    careInstructions: string[];
  }
> = {
  Calças: {
    collection: 'Linha Denim Signature',
    fit: 'Modelagem slim com conforto',
    material: 'Denim premium com toque macio',
    composition: '98% algodão, 2% elastano',
    careInstructions: ['Lavar do avesso', 'Secar à sombra', 'Passar em temperatura baixa']
  },
  Jaquetas: {
    collection: 'Linha Outerwear Denim',
    fit: 'Regular contemporânea',
    material: 'Denim encorpado de alta durabilidade',
    composition: '100% algodão',
    careInstructions: ['Lavar em ciclo suave', 'Não usar secadora', 'Guardar em cabide']
  },
  Shorts: {
    collection: 'Linha Summer Denim',
    fit: 'Relaxed com caimento moderno',
    material: 'Denim flexível com acabamento suave',
    composition: '99% algodão, 1% elastano',
    careInstructions: ['Lavar em água fria', 'Não alvejar', 'Secagem natural']
  },
  Camisas: {
    collection: 'Linha Essential Shirts',
    fit: 'Regular leve',
    material: 'Denim leve respirável',
    composition: '100% algodão',
    careInstructions: ['Lavar com cores similares', 'Passar em baixa temperatura', 'Não alvejar']
  },
  Saias: {
    collection: 'Linha Feminina Contemporânea',
    fit: 'A-line equilibrada',
    material: 'Denim médio com estrutura confortável',
    composition: '98% algodão, 2% elastano',
    careInstructions: ['Lavar do avesso', 'Secagem natural', 'Evitar produtos abrasivos']
  },
  Macacões: {
    collection: 'Linha Studio Utility',
    fit: 'Straight utilitário',
    material: 'Denim técnico com caimento firme',
    composition: '99% algodão, 1% elastano',
    careInstructions: ['Lavar em ciclo delicado', 'Não torcer', 'Secar em superfície plana']
  }
};

const seasonByProductId: Record<string, string> = {
  '1': 'Outono/Inverno 2026',
  '2': 'Outono/Inverno 2026',
  '3': 'Verão 2026',
  '4': 'Primavera/Verão 2026',
  '5': 'Outono/Inverno 2026',
  '6': 'Outono/Inverno 2026',
  '7': 'Core Collection',
  '8': 'Verão 2026',
  '9': 'Primavera/Verão 2026',
  '10': 'Outono/Inverno 2026',
  '11': 'Outono/Inverno 2026',
  '12': 'Verão 2026',
  '13': 'Drop Denim Lab',
  '14': 'Drop Denim Lab',
  '15': 'Drop Denim Lab',
  '16': 'Drop Denim Lab'
};

const buildStockStatus = (id: string): StockStatus => {
  if (outOfStockIds.has(id)) {
    return 'out_of_stock';
  }

  if (lowStockIds.has(id)) {
    return 'low_stock';
  }

  return 'in_stock';
};

const buildHighlights = (product: (typeof baseMockProducts)[number], fit: string) => [
  `Caimento ${fit.toLowerCase()} para uso diário.`,
  `SKU ${product.sku} com leitura comercial clara.`,
  `${product.category} em ${product.colors?.[0]?.toLowerCase() || 'lavagem premium'}.`
];

export const mockProducts: Product[] = baseMockProducts.map((product, index) => {
  const isNew = newProductIds.has(product.id);
  const isFeatured = featuredProductIds.has(product.id);
  const isMostWanted = mostWantedProductIds.has(product.id);
  const categoryProfile = categoryProfiles[product.category] || categoryProfiles['Calças'];
  const placeholderGallery = buildProductPlaceholderGallery({
    category: product.category,
    gender: product.gender,
    style: 'editorial',
    seed: product.sku || product.id,
    label: categoryProfile.collection,
    count: 3
  });

  return {
    ...product,
    featuredImage: placeholderGallery[0],
    images: placeholderGallery,
    slug: `${slugify(product.name)}-${product.id}`,
    createdAt: new Date(baseCreatedAt + index * 86400000).toISOString(),
    collection: categoryProfile.collection,
    season: seasonByProductId[product.id] || 'Coleção atual',
    fit: categoryProfile.fit,
    material: categoryProfile.material,
    composition: categoryProfile.composition,
    highlights: buildHighlights(product, categoryProfile.fit),
    careInstructions: categoryProfile.careInstructions,
    stockStatus: buildStockStatus(product.id),
    isFeatured,
    isNew,
    label: isNew ? 'Nova coleção' : isMostWanted ? 'Mais procurado' : isFeatured ? 'Destaque' : undefined
  };
});
