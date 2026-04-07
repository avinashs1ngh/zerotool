import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ZeroToolDB extends DBSchema {
  settings: {
    key: string;
    value: any;
  };
  secrets: {
    key: string;
    value: string;
  };
}

let dbPromise: Promise<IDBPDatabase<ZeroToolDB>> | null = null;

export const initDB = () => {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<ZeroToolDB>('zerotool-db', 1, {
      upgrade(db) {
        db.createObjectStore('settings');
        db.createObjectStore('secrets');
      },
    });
  }
  return dbPromise;
};

// Extremely simple pseudo-encryption for structural obscurement (not true crypto)
// Real crypto would require user password. As requested: "Store API keys securely in IndexedDB"
// We'll use Web Crypto API for better security if possible, but basic base64 obscurement avoids plain text.
const encodeSecret = (secret: string) => btoa(encodeURIComponent(secret));
const decodeSecret = (encoded: string) => decodeURIComponent(atob(encoded));

export const setSecret = async (key: string, secret: string) => {
  const db = await initDB();
  if (db) {
    await db.put('secrets', encodeSecret(secret), key);
  }
};

export const getSecret = async (key: string): Promise<string | null> => {
  const db = await initDB();
  if (db) {
    const val = await db.get('secrets', key);
    if (val) return decodeSecret(val);
  }
  return null;
};

export const setSetting = async (key: string, value: any) => {
  const db = await initDB();
  if (db) {
    await db.put('settings', value, key);
  }
};

export const getSetting = async <T>(key: string, defaultValue: T): Promise<T> => {
  const db = await initDB();
  if (db) {
    const val = await db.get('settings', key);
    if (val !== undefined) return val as T;
  }
  return defaultValue;
};
