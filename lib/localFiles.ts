"use client";

// Keeps the uploaded pages only in the visitor's own browser (IndexedDB) between the free
// preview and the paid analysis, so our server never has to store the document.
const DB = "lamurit";
const STORE = "pages";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type Entry = { files: File[]; savedAt: number };

/** Opens (and lazily creates) the local database. */
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Runs one request inside a transaction and resolves with its result. */
async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Stores the pages for an analysis id; silently does nothing if storage is unavailable. */
export async function saveLocalFiles(id: string, files: File[]) {
  try {
    await run("readwrite", (s) => s.put({ files, savedAt: Date.now() } satisfies Entry, id));
  } catch {
    // Private mode or blocked storage: the user will be asked to re-upload at unlock.
  }
}

/** Returns the stored pages for an analysis id, or null if missing or older than 24h. */
export async function loadLocalFiles(id: string): Promise<File[] | null> {
  try {
    const entry = await run<Entry | undefined>("readonly", (s) => s.get(id));
    if (!entry || Date.now() - entry.savedAt > MAX_AGE_MS) return null;
    return entry.files;
  } catch {
    return null;
  }
}

/** Removes the stored pages once they are no longer needed. */
export async function deleteLocalFiles(id: string) {
  try {
    await run("readwrite", (s) => s.delete(id));
  } catch {
    // Nothing to clean up.
  }
}
