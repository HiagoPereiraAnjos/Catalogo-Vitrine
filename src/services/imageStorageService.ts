const IMAGE_DB_NAME = 'catalog_media_db';
const IMAGE_STORE_NAME = 'catalog_images';
const IMAGE_DB_VERSION = 1;

export const LOCAL_IMAGE_REF_PREFIX = 'local-image://';

type ImageKind = 'blob' | 'url';

interface StoredImageRecord {
  id: string;
  kind: ImageKind;
  blob?: Blob;
  externalUrl?: string;
  fileName?: string;
  mimeType?: string;
  createdAt: number;
}

export interface StoredImageMeta {
  id: string;
  kind: ImageKind;
  fileName?: string;
  mimeType?: string;
  externalUrl?: string;
  createdAt: number;
}

type ProgressCallback = (completed: number, total: number) => void;

let databasePromise: Promise<IDBDatabase> | null = null;
const objectUrlCache = new Map<string, string>();

const isBrowserEnvironment = () => typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
const resetDatabaseConnection = () => {
  databasePromise = null;
};

const createImageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `img-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const openDatabase = () => {
  if (!isBrowserEnvironment()) {
    return Promise.reject(new Error('IndexedDB indisponível no ambiente atual.'));
  }

  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        database.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onclose = resetDatabaseConnection;
      database.onversionchange = () => {
        database.close();
        resetDatabaseConnection();
      };
      resolve(database);
    };

    request.onerror = () => {
      resetDatabaseConnection();
      reject(request.error || new Error('Falha ao abrir IndexedDB.'));
    };

    request.onblocked = () => {
      resetDatabaseConnection();
      reject(new Error('Abertura do IndexedDB bloqueada por outra aba/processo.'));
    };
  });

  return databasePromise;
};

const runWriteTransaction = async (operation: (store: IDBObjectStore) => void) => {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite');
    } catch (error) {
      resetDatabaseConnection();
      reject(error);
      return;
    }

    const store = transaction.objectStore(IMAGE_STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Erro ao gravar no IndexedDB.'));
    transaction.onabort = () => reject(transaction.error || new Error('Transação abortada no IndexedDB.'));

    operation(store);
  });
};

const runReadRequest = async <T>(requestFactory: (store: IDBObjectStore) => IDBRequest<T>) => {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = database.transaction(IMAGE_STORE_NAME, 'readonly');
    } catch (error) {
      resetDatabaseConnection();
      reject(error);
      return;
    }

    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = requestFactory(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Erro ao ler no IndexedDB.'));
  });
};

const runReadAll = async () => {
  const database = await openDatabase();

  return new Promise<StoredImageRecord[]>((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = database.transaction(IMAGE_STORE_NAME, 'readonly');
    } catch (error) {
      resetDatabaseConnection();
      reject(error);
      return;
    }

    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.getAll() as IDBRequest<StoredImageRecord[]>;

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Erro ao listar imagens no IndexedDB.'));
  });
};

const toLocalImageRef = (id: string) => `${LOCAL_IMAGE_REF_PREFIX}${id}`;

const parseImageIdFromRef = (ref: string) => {
  if (!ref.startsWith(LOCAL_IMAGE_REF_PREFIX)) {
    return null;
  }

  const id = ref.slice(LOCAL_IMAGE_REF_PREFIX.length).trim();
  return id || null;
};

const getRecordById = async (id: string) => {
  if (!id.trim()) {
    return null;
  }

  const record = await runReadRequest<StoredImageRecord | undefined>((store) => store.get(id));
  return record || null;
};

const findUrlRecord = async (url: string) => {
  const normalizedUrl = url.trim();
  if (!normalizedUrl) {
    return null;
  }

  const records = await runReadAll();
  return records.find((record) => record.kind === 'url' && record.externalUrl === normalizedUrl) || null;
};

const toMeta = (record: StoredImageRecord): StoredImageMeta => ({
  id: record.id,
  kind: record.kind,
  fileName: record.fileName,
  mimeType: record.mimeType,
  externalUrl: record.externalUrl,
  createdAt: record.createdAt
});

const resolveImageIdToSource = async (id: string) => {
  const record = await getRecordById(id);
  if (!record) {
    return null;
  }

  if (record.kind === 'url') {
    return record.externalUrl || null;
  }

  if (!record.blob) {
    return null;
  }

  const cachedUrl = objectUrlCache.get(id);
  if (cachedUrl) {
    return cachedUrl;
  }

  const objectUrl = URL.createObjectURL(record.blob);
  objectUrlCache.set(id, objectUrl);
  return objectUrl;
};

export const isLocalImageRef = (value?: string | null) =>
  typeof value === 'string' && value.trim().startsWith(LOCAL_IMAGE_REF_PREFIX);

export const ImageStorageService = {
  buildLocalRef(imageId: string) {
    return toLocalImageRef(imageId);
  },

  parseImageId(source: string) {
    return parseImageIdFromRef(source.trim()) || source.trim();
  },

  isLocalRef(value?: string | null) {
    return isLocalImageRef(value);
  },

  async saveImage(file: File) {
    const id = createImageId();

    const record: StoredImageRecord = {
      id,
      kind: 'blob',
      blob: file,
      fileName: file.name,
      mimeType: file.type,
      createdAt: Date.now()
    };

    await runWriteTransaction((store) => {
      store.put(record);
    });

    return id;
  },

  async saveImages(files: File[], onProgress?: ProgressCallback) {
    const ids: string[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const imageId = await this.saveImage(files[index]);
        ids.push(imageId);
        onProgress?.(index + 1, files.length);
      }
    } catch (error) {
      await Promise.all(ids.map((id) => this.deleteImage(id).catch(() => undefined)));
      throw error;
    }

    return ids;
  },

  async saveExternalImage(url: string) {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) {
      throw new Error('URL de imagem inválida para salvar.');
    }

    const existing = await findUrlRecord(normalizedUrl);
    if (existing) {
      return existing.id;
    }

    const id = createImageId();
    const record: StoredImageRecord = {
      id,
      kind: 'url',
      externalUrl: normalizedUrl,
      createdAt: Date.now()
    };

    await runWriteTransaction((store) => {
      store.put(record);
    });

    return id;
  },

  async getImage(id: string) {
    try {
      const record = await getRecordById(id);
      return record ? toMeta(record) : null;
    } catch (error) {
      console.error('Falha ao consultar imagem no IndexedDB', error);
      return null;
    }
  },

  async getAllImages() {
    try {
      const records = await runReadAll();
      return records.map(toMeta).sort((left, right) => right.createdAt - left.createdAt);
    } catch (error) {
      console.error('Falha ao listar imagens no IndexedDB', error);
      return [];
    }
  },

  async deleteImage(id: string) {
    const normalizedId = id.trim();
    if (!normalizedId) {
      return;
    }

    await runWriteTransaction((store) => {
      store.delete(normalizedId);
    });

    const cachedUrl = objectUrlCache.get(normalizedId);
    if (cachedUrl) {
      URL.revokeObjectURL(cachedUrl);
      objectUrlCache.delete(normalizedId);
    }
  },

  async resolveImageIdToObjectUrl(imageId: string) {
    try {
      return await resolveImageIdToSource(imageId.trim());
    } catch (error) {
      console.error('Falha ao resolver referência de imagem local', error);
      return null;
    }
  },

  async resolveRefToObjectUrl(ref: string) {
    const imageId = parseImageIdFromRef(ref);
    if (!imageId) {
      return ref;
    }

    try {
      return await resolveImageIdToSource(imageId);
    } catch (error) {
      console.error('Falha ao resolver ref local para preview', error);
      return null;
    }
  },

  revokeObjectUrlById(id: string) {
    const normalizedId = id.trim();
    const cachedUrl = objectUrlCache.get(normalizedId);
    if (!cachedUrl) {
      return;
    }

    URL.revokeObjectURL(cachedUrl);
    objectUrlCache.delete(normalizedId);
  },

  revokeObjectUrl(ref: string) {
    const imageId = parseImageIdFromRef(ref);
    if (!imageId) {
      return;
    }

    this.revokeObjectUrlById(imageId);
  },

  revokeAllObjectUrls() {
    objectUrlCache.forEach((objectUrl) => {
      URL.revokeObjectURL(objectUrl);
    });
    objectUrlCache.clear();
  },

  // Backward compatibility helpers
  async saveFile(file: File) {
    const id = await this.saveImage(file);
    return this.buildLocalRef(id);
  },

  async saveFiles(files: File[], onProgress?: ProgressCallback) {
    const ids = await this.saveImages(files, onProgress);
    return ids.map((id) => this.buildLocalRef(id));
  },

  async deleteByRef(ref: string) {
    const id = parseImageIdFromRef(ref);
    if (!id) {
      return;
    }
    await this.deleteImage(id);
  }
};
