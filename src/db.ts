import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { NS } from './config';
import { DEFAULT_SETTINGS, type Card, type CurriculumRow, type Settings, type Tag } from './types';
import type { Progress, Snapshot, Track } from './scheduler';
import type { Intro, Mode } from './session';

/** One review, as stored in the outbox and sent to the API (Log row). */
export type ReviewEvent = {
  event_id: string;
  card_id: string;
  track: Track;
  ts: string; // ISO
  rating: 1 | 2 | 3 | 4;
  mode: Mode;
  duration_ms: number;
  snapshot: Snapshot;
};

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
  intro: Intro; // new cards introduced today
  curriculum: CurriculumRow[];
  breaks: string[]; // Dutch off-screen prompts shown when a pause starts
  lastSession: SessionRecord; // for the cooldown
  studyTags: string[]; // tag filter ("Kies een onderwerp"); [] = everything
};

/** The last session that counted (>= min_reviews_to_count reviews). */
export type SessionRecord = { start: string; end: string; reviews: number };

interface FankiDB extends DBSchema {
  cards: { key: string; value: Card; indexes: { added: string } };
  meta: { key: string; value: { key: keyof Meta; value: unknown } };
  progress: { key: string; value: Progress; indexes: { card_id: string } };
  queue: { key: string; value: ReviewEvent; indexes: { ts: string } };
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

export async function setMeta<K extends keyof Meta>(key: K, value: Meta[K]): Promise<void> {
  await (await db()).put('meta', { key, value });
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

export async function allProgress(): Promise<Map<string, Progress>> {
  const rows = await (await db()).getAll('progress');
  return new Map(rows.map((p) => [p.key, p]));
}

/**
 * Saves one review: new progress + outbox event + today's intro list, in ONE transaction.
 * Either all three are stored or none, so a crash can never lose a review or double-count it.
 */
export async function recordReview(progress: Progress, event: ReviewEvent, intro: Intro): Promise<void> {
  const d = await db();
  const tx = d.transaction(['progress', 'queue', 'meta'], 'readwrite');
  await tx.objectStore('progress').put(progress);
  await tx.objectStore('queue').put(event);
  await tx.objectStore('meta').put({ key: 'intro', value: intro });
  await tx.done;
}

export async function pendingEvents(): Promise<ReviewEvent[]> {
  return (await db()).getAllFromIndex('queue', 'ts');
}

export async function pendingCount(): Promise<number> {
  return (await db()).count('queue');
}

/** Removes events the server confirmed (accepted or already had). */
export async function deleteEvents(ids: string[]): Promise<void> {
  const tx = (await db()).transaction('queue', 'readwrite');
  for (const id of ids) await tx.store.delete(id);
  await tx.done;
}

/**
 * Merges Progress from the server. The server row wins only if it is newer than ours AND we have no
 * unsent review for that card+track (our own pending review is always the latest truth).
 */
export async function mergeServerProgress(rows: Progress[]): Promise<number> {
  const d = await db();
  const tx = d.transaction(['progress', 'queue'], 'readwrite');
  const pending = new Set((await tx.objectStore('queue').getAll()).map((e) => `${e.card_id}|${e.track}`));
  let changed = 0;
  for (const row of rows) {
    if (pending.has(row.key)) continue;
    const local = await tx.objectStore('progress').get(row.key);
    if (!local || (row.last_review || '') > (local.last_review || '')) {
      await tx.objectStore('progress').put(row);
      changed++;
    }
  }
  await tx.done;
  return changed;
}
