/**
 * IndexedDB storage utility for large custom sprite frame sequences and custom assets.
 * Handles storage of dozens of full-resolution PNG frames without hitting localStorage 5MB quota limits.
 */

const DB_NAME = 'tira_y_afloja_assets_db';
const DB_VERSION = 1;
const STORE_SPRITES = 'sprite_frames';
const STORE_CONFIG = 'general_assets';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SPRITES)) {
        db.createObjectStore(STORE_SPRITES);
      }
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSpriteFramesToDB(character: 'chica' | 'chico', frames: string[]): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SPRITES, 'readwrite');
      const store = tx.objectStore(STORE_SPRITES);
      const req = store.put(frames, `frames_${character}`);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SpriteDB] Failed to save sprite frames to IndexedDB:', err);
    return false;
  }
}

export async function getSpriteFramesFromDB(character: 'chica' | 'chico'): Promise<string[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SPRITES, 'readonly');
      const store = tx.objectStore(STORE_SPRITES);
      const req = store.get(`frames_${character}`);
      req.onsuccess = () => {
        const val = req.result;
        if (Array.isArray(val) && val.length > 0) {
          resolve(val);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SpriteDB] Failed to read sprite frames from IndexedDB:', err);
    return null;
  }
}

export async function clearSpriteFramesFromDB(character: 'chica' | 'chico'): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SPRITES, 'readwrite');
      const store = tx.objectStore(STORE_SPRITES);
      const req = store.delete(`frames_${character}`);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SpriteDB] Failed to clear sprite frames:', err);
    return false;
  }
}
