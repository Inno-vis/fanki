import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { _resetDb, allCards, allProgress, db, deleteCardLocally, getMeta, mergeServerProgress, pendingEvents, saveSnapshot } from './db';
import { exportBackup, importBackup } from './backup';
import { progressKey, type Progress } from './scheduler';
import type { Card } from './types';

const card = (id: string, tags = ['a']): Card =>
  ({ id, type: 'word', nl: id, article: '', pos: '', fr: id, example_nl: '', example_fr: '', tags, flags: [], answer: '', added: '2026-10-01', active: true }) as Card;
const prog = (id: string, track: 'recog' | 'prod' = 'recog'): Progress => ({
  key: progressKey(id, track), card_id: id, track, state: 'Review', due: '2026-10-20T10:00:00.000Z', stability: 5, difficulty: 5, reps: 3,
  lapses: 0, last_review: '2026-10-10T10:00:00.000Z', learning_steps: 0, scheduled_days: 5
});

beforeEach(() => {
  indexedDB = new IDBFactory();
  _resetDb();
});

describe('🗑️ deleting a card on this phone only', () => {
  it('removes the card and its progress (all tracks), remembers it, and keeps unsent answers', async () => {
    await saveSnapshot([card('x'), card('y')], {});
    const d = await db();
    await d.put('progress', prog('x'));
    await d.put('progress', prog('x', 'prod'));
    await d.put('progress', prog('y'));
    await d.put('queue', { event_id: 'e1', card_id: 'x', track: 'recog', ts: '2026-10-10T10:00:00.000Z', rating: 3, mode: 'nl_fr', duration_ms: 1, snapshot: {} as never });
    await deleteCardLocally('x', new Date('2026-10-12T10:00:00Z'));
    expect((await allCards()).map((c) => c.id)).toEqual(['y']);
    expect([...(await allProgress()).keys()]).toEqual(['y|recog']);
    expect(await getMeta('deletedCards')).toEqual({ x: '2026-10-12T10:00:00.000Z' });
    expect((await pendingEvents()).map((e) => e.event_id)).toEqual(['e1']); // her answer is still sent (Q2 B)
  });

  it('a sync never brings it back: not in the cards, and its server progress is skipped', async () => {
    await saveSnapshot([card('x'), card('y')], {});
    await deleteCardLocally('x');
    await saveSnapshot([card('x'), card('y')], {}); // the next card download still contains it
    expect((await allCards()).map((c) => c.id)).toEqual(['y']);
    await mergeServerProgress([prog('x'), prog('y')]);
    expect([...(await allProgress()).keys()]).toEqual(['y|recog']);
  });

  it('backup round-trip: restoring on a new phone restores the deletion too', async () => {
    await saveSnapshot([card('x'), card('y')], {});
    await (await db()).put('progress', prog('x'));
    await deleteCardLocally('x', new Date('2026-10-12T10:00:00Z'));
    const file = JSON.parse(JSON.stringify(await exportBackup()));
    expect(file.meta.deletedCards).toEqual({ x: '2026-10-12T10:00:00.000Z' });
    indexedDB = new IDBFactory(); // a new phone that still has the card and its progress
    _resetDb();
    await saveSnapshot([card('x'), card('y')], {});
    await (await db()).put('progress', prog('x'));
    await importBackup(file);
    expect((await allCards()).map((c) => c.id)).toEqual(['y']);
    expect([...(await allProgress()).keys()]).toEqual([]);
    expect(await getMeta('deletedCards')).toEqual({ x: '2026-10-12T10:00:00.000Z' });
  });

  it('nothing is deleted without the call (no deletion without confirmation lives in the component; see e2e)', async () => {
    await saveSnapshot([card('x')], {});
    expect((await allCards()).map((c) => c.id)).toEqual(['x']);
    expect(await getMeta('deletedCards')).toBeUndefined();
  });
});
