export type PlaceholderStyle = 'editorial' | 'lookbook' | 'institutional' | 'neutral';

type PlaceholderCategory =
  | 'calcas'
  | 'jaquetas'
  | 'bermudas'
  | 'saias'
  | 'camisas'
  | 'macacoes'
  | 'catalogo';

type PlaceholderGender = 'masculino' | 'feminino' | 'unissex';

interface PlaceholderImageOptions {
  category?: string;
  gender?: string;
  style?: PlaceholderStyle;
  seed?: string | number;
  label?: string;
  subtitle?: string;
}

interface PlaceholderGalleryOptions extends PlaceholderImageOptions {
  count?: number;
}

const LOCAL_PLACEHOLDER_POOL = {
  jeans: [
    '/mock/jeans/jeans-01.svg',
    '/mock/jeans/jeans-02.svg',
    '/mock/jeans/jeans-03.svg',
    '/mock/jeans/jeans-04.svg'
  ],
  jaquetas: [
    '/mock/jaquetas/jaqueta-01.svg',
    '/mock/jaquetas/jaqueta-02.svg',
    '/mock/jaquetas/jaqueta-03.svg',
    '/mock/jaquetas/jaqueta-04.svg'
  ],
  bermudas: [
    '/mock/bermudas/bermuda-01.svg',
    '/mock/bermudas/bermuda-02.svg',
    '/mock/bermudas/bermuda-03.svg',
    '/mock/bermudas/bermuda-04.svg'
  ],
  editorial: [
    '/mock/editorial/editorial-01.svg',
    '/mock/editorial/editorial-02.svg',
    '/mock/editorial/editorial-03.svg',
    '/mock/editorial/editorial-04.svg'
  ]
} as const;

const categoryAliases: Record<PlaceholderCategory, string[]> = {
  calcas: ['calcas', 'calca', 'jeans', 'pants', 'denim pants'],
  jaquetas: ['jaquetas', 'jaqueta', 'jacket', 'outerwear'],
  bermudas: ['bermudas', 'bermuda', 'shorts', 'short'],
  saias: ['saias', 'saia', 'skirt'],
  camisas: ['camisas', 'camisa', 'shirt'],
  macacoes: ['macacoes', 'macacao', 'jumpsuit'],
  catalogo: ['catalogo', 'catalog', 'default']
};

const genderAliases: Record<PlaceholderGender, string[]> = {
  masculino: ['masculino', 'male', 'men'],
  feminino: ['feminino', 'female', 'women'],
  unissex: ['unissex', 'unisex', 'all']
};

const sanitizeTextKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const hashCode = (value: string) =>
  value.split('').reduce((accumulator, char) => ((accumulator << 5) - accumulator + char.charCodeAt(0)) | 0, 0);

const getCategoryKey = (value: string | undefined): PlaceholderCategory => {
  const normalized = sanitizeTextKey(value || '');

  for (const [category, aliases] of Object.entries(categoryAliases) as Array<[PlaceholderCategory, string[]]>) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return category;
    }
  }

  return 'catalogo';
};

const getGenderKey = (value: string | undefined): PlaceholderGender => {
  const normalized = sanitizeTextKey(value || '');

  for (const [gender, aliases] of Object.entries(genderAliases) as Array<[PlaceholderGender, string[]]>) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return gender;
    }
  }

  return 'unissex';
};

const encodeSvgAsDataUri = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const pickFromPool = (pool: readonly string[], seed: string, offset = 0) => {
  if (pool.length === 0) {
    return '';
  }

  const index = (Math.abs(hashCode(seed)) + offset) % pool.length;
  return pool[index];
};

const resolvePool = (categoryKey: PlaceholderCategory, style: PlaceholderStyle): string[] => {
  if (style === 'lookbook' || style === 'institutional' || style === 'neutral') {
    return [...LOCAL_PLACEHOLDER_POOL.editorial];
  }

  if (categoryKey === 'jaquetas') {
    return [...LOCAL_PLACEHOLDER_POOL.jaquetas];
  }

  if (categoryKey === 'bermudas') {
    return [...LOCAL_PLACEHOLDER_POOL.bermudas];
  }

  return [...LOCAL_PLACEHOLDER_POOL.jeans];
};

const buildInlineFallbackSvg = (options: { label: string; subtitle: string }) => {
  const { label, subtitle } = options;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500" fill="none">
  <defs>
    <linearGradient id="fallback-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5f5f4" />
      <stop offset="100%" stop-color="#ececea" />
    </linearGradient>
  </defs>
  <rect width="1200" height="1500" fill="url(#fallback-bg)"/>
  <rect x="86" y="106" width="1028" height="1288" rx="38" stroke="#4b5563" stroke-opacity="0.16" stroke-width="2"/>
  <rect x="124" y="148" width="952" height="1208" rx="30" stroke="#4b5563" stroke-opacity="0.12" stroke-width="1.5"/>
  <path d="M450 520 L610 520 L652 620 L610 980 L450 980 L408 620 Z" fill="none" stroke="#374151" stroke-opacity="0.62" stroke-width="10"/>
  <circle cx="530" cy="700" r="9" fill="#374151" fill-opacity="0.36"/>
  <text x="140" y="1252" fill="#1f2937" fill-opacity="0.9" font-size="54" font-family="Manrope, Arial, sans-serif" font-weight="600">${escapeXml(
    label
  )}</text>
  <text x="140" y="1304" fill="#4b5563" fill-opacity="0.68" font-size="28" font-family="Manrope, Arial, sans-serif" font-weight="500" letter-spacing="0.05em">${escapeXml(
    subtitle
  )}</text>
  <text x="140" y="1348" fill="#6b7280" fill-opacity="0.62" font-size="18" font-family="Manrope, Arial, sans-serif" letter-spacing="0.18em">CATALOG PLACEHOLDER</text>
</svg>
  `.trim();
};

export const buildInlineFallbackPlaceholder = ({ label, subtitle }: { label: string; subtitle: string }) =>
  encodeSvgAsDataUri(buildInlineFallbackSvg({ label, subtitle }));

export const buildPlaceholderImage = ({
  category,
  gender,
  style = 'editorial',
  seed = 'default',
  label,
  subtitle
}: PlaceholderImageOptions = {}) => {
  const categoryKey = getCategoryKey(category);
  const genderKey = getGenderKey(gender);
  const pool = resolvePool(categoryKey, style);
  const seedKey = `${style}-${categoryKey}-${genderKey}-${String(seed)}`;
  const localImage = pickFromPool(pool, seedKey);

  if (localImage) {
    return localImage;
  }

  return buildInlineFallbackPlaceholder({
    label: label?.trim() || 'Imagem indisponivel',
    subtitle: subtitle?.trim() || 'Placeholder local'
  });
};

export const buildProductPlaceholderGallery = ({
  category,
  gender,
  style = 'editorial',
  seed = 'default',
  count = 3
}: PlaceholderGalleryOptions = {}) => {
  const categoryKey = getCategoryKey(category);
  const genderKey = getGenderKey(gender);
  const pool = resolvePool(categoryKey, style);
  const safeCount = Math.max(1, count);

  if (pool.length === 0) {
    return Array.from({ length: safeCount }, (_, index) =>
      buildInlineFallbackPlaceholder({
        label: 'Imagem indisponivel',
        subtitle: `Placeholder local ${index + 1}`
      })
    );
  }

  const seedKey = `${style}-${categoryKey}-${genderKey}-${String(seed)}`;
  return Array.from({ length: safeCount }, (_, index) => pickFromPool(pool, seedKey, index));
};

export const buildInstitutionalPlaceholder = (seed: string | number, label?: string) => {
  const image = pickFromPool(LOCAL_PLACEHOLDER_POOL.editorial, `institutional-${String(seed)}`);

  if (image) {
    return image;
  }

  return buildInlineFallbackPlaceholder({
    label: label?.trim() || 'Denim Premium',
    subtitle: 'Institucional'
  });
};

export const buildEditorialFallbackImage = (options: {
  category?: string;
  gender?: string;
  seed?: string | number;
  label?: string;
} = {}) =>
  buildInlineFallbackPlaceholder({
    label: options.label?.trim() || 'Imagem indisponivel',
    subtitle: 'Preview temporario'
  });

export const PLACEHOLDER_LIBRARY = {
  categories: {
    calcaJeans: buildProductPlaceholderGallery({ category: 'calcas', gender: 'unissex', style: 'editorial', seed: 'calca', count: 4 }),
    jaquetaJeans: buildProductPlaceholderGallery({ category: 'jaquetas', gender: 'unissex', style: 'editorial', seed: 'jaqueta', count: 4 }),
    bermudaJeans: buildProductPlaceholderGallery({ category: 'bermudas', gender: 'unissex', style: 'editorial', seed: 'bermuda', count: 4 }),
    saiaJeans: buildProductPlaceholderGallery({ category: 'saias', gender: 'feminino', style: 'editorial', seed: 'saia', count: 4 })
  },
  audience: {
    masculino: buildProductPlaceholderGallery({ category: 'catalogo', gender: 'masculino', style: 'lookbook', seed: 'masculino', count: 3 }),
    feminino: buildProductPlaceholderGallery({ category: 'catalogo', gender: 'feminino', style: 'lookbook', seed: 'feminino', count: 3 }),
    unissex: buildProductPlaceholderGallery({ category: 'catalogo', gender: 'unissex', style: 'lookbook', seed: 'unissex', count: 3 })
  },
  lookbook: buildProductPlaceholderGallery({ style: 'lookbook', category: 'catalogo', seed: 'lookbook', count: 4 }),
  institutional: [
    buildInstitutionalPlaceholder('institucional-1', 'Atelier Denim'),
    buildInstitutionalPlaceholder('institucional-2', 'Estudio de Colecao'),
    buildInstitutionalPlaceholder('institucional-3', 'Curadoria de Marca')
  ],
  editorialMode: buildProductPlaceholderGallery({ style: 'neutral', category: 'catalogo', seed: 'editorial-mode', count: 4 }),
  localMockPool: LOCAL_PLACEHOLDER_POOL
};
