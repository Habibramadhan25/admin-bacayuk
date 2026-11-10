const DB_NAME = 'bacayuk_library_db';
const STORE_NAME = 'book_files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const timer = setTimeout(() => {
      reject(new Error('IndexedDB open connection timed out'));
    }, 4000);

    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => {
      clearTimeout(timer);
      resolve(req.result);
    };
    req.onerror = () => {
      clearTimeout(timer);
      reject(req.error);
    };
    req.onblocked = () => {
      clearTimeout(timer);
      console.warn('IndexedDB open blocked by another tab');
      reject(new Error('IndexedDB blocked'));
    };
  });
}

export interface StoredBookFile {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  blob?: Blob;
}

export async function saveBookFile(bookId: string, fileData: StoredBookFile): Promise<void> {
  try {
    const savePromise = (async () => {
      const db = await openDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(fileData, bookId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    })();

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('IndexedDB save timed out')), 4000);
    });

    await Promise.race([savePromise, timeoutPromise]);
  } catch (err) {
    console.warn('Failed to save book file to IndexedDB:', err);
  }
}

export async function getBookFile(bookId: string): Promise<StoredBookFile | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(bookId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get book file from IndexedDB:', err);
    return null;
  }
}

export async function deleteBookFile(bookId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(bookId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete book file from IndexedDB:', err);
  }
}
