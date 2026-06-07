/**
 * offlineDB — IndexedDB wrapper for offline-first features.
 *
 * Stores:
 *  • shortened URLs created while offline
 *  • pastes queued for upload
 *  • cached paste content
 *
 * When the user comes back online, the background sync hook
 * flushes the pending queues via the API.
 */
import { openDB } from 'idb';

const DB_NAME = 'nexus-offline';
const DB_VERSION = 1;

function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Pending URL creations
      if (!db.objectStoreNames.contains('pending-urls')) {
        const s = db.createObjectStore('pending-urls', { keyPath: 'id', autoIncrement: true });
        s.createIndex('createdAt', 'createdAt');
      }
      // Pending paste creations
      if (!db.objectStoreNames.contains('pending-pastes')) {
        const s = db.createObjectStore('pending-pastes', { keyPath: 'id', autoIncrement: true });
        s.createIndex('createdAt', 'createdAt');
      }
      // Cached pastes (read offline)
      if (!db.objectStoreNames.contains('cached-pastes')) {
        const s = db.createObjectStore('cached-pastes', { keyPath: 'shortCode' });
        s.createIndex('cachedAt', 'cachedAt');
      }
    },
  });
}

export const offlineDB = {
  // ── Pending URLs ─────────────────────────────────────────────────────────────
  async queueUrl(payload) {
    const db = await getDb();
    return db.add('pending-urls', { ...payload, createdAt: new Date() });
  },
  async getPendingUrls() {
    const db = await getDb();
    return db.getAllFromIndex('pending-urls', 'createdAt');
  },
  async clearPendingUrl(id) {
    const db = await getDb();
    return db.delete('pending-urls', id);
  },

  // ── Pending Pastes ───────────────────────────────────────────────────────────
  async queuePaste(payload) {
    const db = await getDb();
    return db.add('pending-pastes', { ...payload, createdAt: new Date() });
  },
  async getPendingPastes() {
    const db = await getDb();
    return db.getAllFromIndex('pending-pastes', 'createdAt');
  },
  async clearPendingPaste(id) {
    const db = await getDb();
    return db.delete('pending-pastes', id);
  },

  // ── Cached Pastes ────────────────────────────────────────────────────────────
  async cachePaste(paste) {
    const db = await getDb();
    return db.put('cached-pastes', { ...paste, cachedAt: new Date() });
  },
  async getCachedPaste(shortCode) {
    const db = await getDb();
    return db.get('cached-pastes', shortCode);
  },
  async clearOldCache(maxAgeMs = 24 * 60 * 60 * 1000) {
    const db = await getDb();
    const cutoff = new Date(Date.now() - maxAgeMs);
    const all = await db.getAllFromIndex('cached-pastes', 'cachedAt');
    const tx = db.transaction('cached-pastes', 'readwrite');
    await Promise.all(
      all.filter((p) => p.cachedAt < cutoff).map((p) => tx.store.delete(p.shortCode)),
    );
    await tx.done;
  },
};
