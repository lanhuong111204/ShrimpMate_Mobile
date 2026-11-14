import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

const STORAGE_FILE_NAME = 'shrimpmate_storage.json';
const memoryStore = new Map<string, string>();

let nativeStorageFile: File | null = null;
let isNativeHydrated = false;
let nativeHydratePromise: Promise<void> | null = null;
let nativeWriteQueue: Promise<void> = Promise.resolve();
let webLocalStorageWriteFailed = false;

function isWebLocalStorageAvailable(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && Boolean(window.localStorage);
}

function getNativeStorageFile(): File | null {
  if (Platform.OS === 'web') return null;
  if (nativeStorageFile) return nativeStorageFile;
  try {
    const documentDir = Paths.document;
    if (!documentDir?.uri) return null;
    nativeStorageFile = new File(documentDir, STORAGE_FILE_NAME);
    return nativeStorageFile;
  } catch {
    return null;
  }
}

async function ensureNativeHydrated(): Promise<void> {
  if (Platform.OS === 'web' || isNativeHydrated) return;
  if (nativeHydratePromise) return nativeHydratePromise;

  nativeHydratePromise = (async () => {
    try {
      const file = getNativeStorageFile();
      if (file && file.exists) {
        const raw = await file.text();
        if (raw && raw.trim().length > 0) {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            for (const [k, v] of Object.entries(parsed)) {
              if (typeof v === 'string' && !memoryStore.has(k)) {
                memoryStore.set(k, v);
              }
            }
          }
        }
      }
    } catch {
      // Fallback an toàn về memoryStore nếu FileSystem không khả dụng hoặc file bị hỏng
    } finally {
      isNativeHydrated = true;
      nativeHydratePromise = null;
    }
  })();

  return nativeHydratePromise;
}

async function persistNativeStore(): Promise<void> {
  if (Platform.OS === 'web') return;

  const task = nativeWriteQueue
    .catch(() => undefined)
    .then(async () => {
      try {
        const file = getNativeStorageFile();
        if (!file) return;
        if (!file.exists) {
          file.create({ intermediates: true, overwrite: true });
        }
        const snapshot: Record<string, string> = {};
        memoryStore.forEach((value, key) => {
          snapshot[key] = value;
        });
        await file.write(JSON.stringify(snapshot));
      } catch {
        // Giữ nguyên dữ liệu trong memoryStore nếu ghi file thất bại
      }
    });

  nativeWriteQueue = task;
  await task;
}

/**
 * Universal safe storage helper that works across native & web
 */
export const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (isWebLocalStorageAvailable()) {
          const webValue = window.localStorage.getItem(key);
          if (webValue !== null) {
            memoryStore.set(key, webValue);
            return webValue;
          }
          return webLocalStorageWriteFailed ? (memoryStore.get(key) ?? null) : null;
        }
        return memoryStore.get(key) ?? null;
      }

      await ensureNativeHydrated();
      return memoryStore.get(key) ?? null;
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        memoryStore.set(key, value);
        if (isWebLocalStorageAvailable()) {
          try {
            window.localStorage.setItem(key, value);
            webLocalStorageWriteFailed = false;
          } catch {
            webLocalStorageWriteFailed = true;
          }
        }
        return;
      }

      await ensureNativeHydrated();
      memoryStore.set(key, value);
      await persistNativeStore();
    } catch {
      memoryStore.set(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        memoryStore.delete(key);
        if (isWebLocalStorageAvailable()) {
          window.localStorage.removeItem(key);
        }
        return;
      }

      await ensureNativeHydrated();
      memoryStore.delete(key);
      await persistNativeStore();
    } catch {
      memoryStore.delete(key);
    }
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJSON<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  },
};
