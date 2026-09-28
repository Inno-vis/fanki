import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { NS } from './config';
import { DEFAULT_SETTINGS, type Card, type Settings, type Tag } from './types';

// One IndexedDB per environment (DEV and PROD share the github.io origin).
// Stores:
//   cards    — every active card from the sheet (replaced on each pull)
//   meta     — settings, tags, compliments, lastSync …
//   progress — FSRS state per card+track (stage 3)
//   queue    — review events waiting to be pushed (stage 3/4)

export type Meta = {
  settings: Settings;
  tags: Tag[];
  compliments: string[];
  lastSync: string; // ISO time of the last successful sync
};

interface FankiDB extends DBSchema {
  cards: { key: string; value: Card; indexes: { added: string } };
  meta: { key: string; value: { key: keyof Meta; value: unknown } };
  progress: { key: string; value: Record<string, unknown> & { key: string; card_id: string } ; indexes: { card_id: string } };
  queue: { key: string; value: Record<string, unknown> & { event_id: string; ts: string }; indexes: { ts: string } };
}

let dbPromise: Promise<IDBPDatabase<FankiDB>> | null = null;

export function db(name = NS): Promise<IDBPDatabase<FankiDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FankiDB>(name, 1, {
      upgrade(d) {
        d.createObjectStore('cards', { keyPath: 'id' }).createIndex('added', 'added');
        d.createObjectStore('meta', { keyPath: 'key' });
        d.createObjectStore('progress', { keyPath: 'key' }).createIndex('card_id', 'card_id');
        d.createObjectStore('queue', { keyPath: 'event_id' }).createIndex('ts', 'ts');
      }
    });
  }
  return dbPromise;
}

/** Test helper: forget the cached connection. */
export function _resetDb() {
  dbPromise = null;
}

export async function getMeta<K extends keyof Meta>(key: K): Promise<Meta[K] | undefined> {
  const row = await (await db()).get('meta', key);
  return row?.value as Meta[K] | undefined;
}

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await getMeta('settings')) ?? {}) };
}

export async function allCards(): Promise<Card[]> {
  return (await db()).getAllFromIndex('cards', 'added');
}

/** Replaces the card set and meta in ONE transaction, so a failed pull never leaves half the cards. */
export async function saveSnapshot(cards: Card[], meta: Partial<Meta>): Promise<void> {
  const d = await db();
  const tx = d.transaction(['cards', 'meta'], 'readwrite');
  const cardStore = tx.objectStore('cards');
  await cardStore.clear();
  for (const c of cards) await cardStore.put(c);
  const metaStore = tx.objectStore('meta');
  for (const [key, value] of Object.entries(meta)) await metaStore.put({ key: key as keyof Meta, value });
  await tx.done;
}
