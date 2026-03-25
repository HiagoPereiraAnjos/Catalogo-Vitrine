import { StorageService } from './storageService';

const CUSTOM_CATEGORIES_STORAGE_KEY = 'catalog_custom_categories';
const ALL_CATEGORIES_LABEL = 'Todos';

export const normalizeCategoryName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());

export const isSameCategory = (left: string, right: string) =>
  normalizeCategoryName(left).localeCompare(normalizeCategoryName(right), 'pt-BR', {
    sensitivity: 'base'
  }) === 0;

const sortCategories = (categories: string[]) =>
  [...categories].sort((left, right) =>
    left.localeCompare(right, 'pt-BR', {
      sensitivity: 'base'
    })
  );

const toCategoryKey = (category: string) => normalizeCategoryName(category).toLocaleLowerCase('pt-BR');

const uniqueCategoriesInOrder = (categories: string[]) => {
  const uniqueCategories = new Map<string, string>();

  categories.forEach((category) => {
    const normalizedCategory = normalizeCategoryName(category);

    if (!normalizedCategory || isSameCategory(normalizedCategory, ALL_CATEGORIES_LABEL)) {
      return;
    }

    const key = toCategoryKey(normalizedCategory);
    if (!uniqueCategories.has(key)) {
      uniqueCategories.set(key, normalizedCategory);
    }
  });

  return Array.from(uniqueCategories.values());
};

const sanitizeCategories = (categories: string[]) => {
  return sortCategories(uniqueCategoriesInOrder(categories));
};

export const CategoriesService = {
  getCustomCategories: () => {
    const storedCategories = StorageService.get<string[] | null>(CUSTOM_CATEGORIES_STORAGE_KEY, null);
    const sanitizedCategories = sanitizeCategories(Array.isArray(storedCategories) ? storedCategories : []);

    if (!Array.isArray(storedCategories) || sanitizedCategories.length !== storedCategories.length) {
      StorageService.set(CUSTOM_CATEGORIES_STORAGE_KEY, sanitizedCategories);
    }

    return sanitizedCategories;
  },

  saveCustomCategories: (categories: string[]) => {
    const sanitizedCategories = sanitizeCategories(categories);
    StorageService.set(CUSTOM_CATEGORIES_STORAGE_KEY, sanitizedCategories);
    return sanitizedCategories;
  },

  buildCategoryOptions: (baseCategories: string[], customCategories: string[], productCategories: string[] = []) => {
    const hasAllLabel = [...baseCategories, ...customCategories, ...productCategories].some((category) =>
      isSameCategory(category, ALL_CATEGORIES_LABEL)
    );

    const orderedBaseCategories = uniqueCategoriesInOrder(baseCategories);
    const baseKeys = new Set(orderedBaseCategories.map((category) => toCategoryKey(category)));
    const extraCategories = sortCategories(
      uniqueCategoriesInOrder([...customCategories, ...productCategories]).filter(
        (category) => !baseKeys.has(toCategoryKey(category))
      )
    );

    const mergedCategories = [...orderedBaseCategories, ...extraCategories];

    if (!hasAllLabel) {
      return mergedCategories;
    }

    return [ALL_CATEGORIES_LABEL, ...mergedCategories];
  }
};
