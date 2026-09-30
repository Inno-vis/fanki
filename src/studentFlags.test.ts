import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { _resetDb } from './db';
import { createFlag, exportText, flagCardLabel, listFlags, setFlagNote, setFlagResolved, splitFlags } from './studentFlags';
import type { Card } from './types';

const card = (id: string, over: Partial<Card> = {}): Card => ({
  id, type: 'word', nl: 'huis', article: 'het', pos: '', fr: 'la maison', example_nl: '', example_fr: '', tags: [],
  tags_source: '', flags: [], answer: '', added: '2026-09-30', active: true, ...over
});
const at = (h: number) => new Date(Date.UTC(2026, 8, 30, h));

beforeEach(() => {
  indexedDB = new IDBFactory();
  _resetDb();
});

describe('student flags (🚩, local only)', () => {
  it('creates a flag instantly with no note, unresolved', async () => {
    const f = await createFlag('c_1', '', at(10));
    expect(f).toMatchObject({ card_id: 'c_1', note: '', resolved: false, ts: at(10).toISOString(), updated_ts: at(10).toISOString() });
    expect(f.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('flagging the same card again keeps both entries', async () => {
    await createFlag('c_1', '', at(10));
    await createFlag('c_1', 'weer vergeten', at(12));
    const all = await listFlags();
    expect(all.map((f) => f.card_id)).toEqual(['c_1', 'c_1']);
    expect(all[0].note).toBe('weer vergeten'); // newest first
  });

  it('adds a note to the same entry and trims it', async () => {
    const f = await createFlag('c_1', '', at(10));
    const g = await setFlagNote(f.id, "  waarom niet 'het'?  ", at(11));
    expect(g).toMatchObject({ id: f.id, note: "waarom niet 'het'?", updated_ts: at(11).toISOString(), ts: at(10).toISOString() });
    expect((await listFlags()).length).toBe(1);
  });

  it('resolve / unresolve never deletes; split into open and resolved', async () => {
    const a = await createFlag('c_1', '', at(10));
    await createFlag('c_2', '', at(11));
    await setFlagResolved(a.id, true, at(12));
    let { open, resolved } = splitFlags(await listFlags());
    expect(open.map((f) => f.card_id)).toEqual(['c_2']);
    expect(resolved.map((f) => f.card_id)).toEqual(['c_1']);
    await setFlagResolved(a.id, false, at(13));
    ({ open, resolved } = splitFlags(await listFlags()));
    expect(open.length).toBe(2);
    expect(resolved.length).toBe(0);
  });

  it('survives an app restart', async () => {
    await createFlag('c_1', 'x', at(10));
    _resetDb();
    expect((await listFlags())[0].note).toBe('x');
  });
});

describe('export text for "Delen"', () => {
  const cards = new Map([
    ['c_1', card('c_1')],
    ['K2-06', card('K2-06', { type: 'oneway', nl: '9:40u + 20 min = ...', article: '', fr: '', answer: '10:00u' })]
  ]);

  it('title, then one line per OPEN flag, newest first: date · word · note', () => {
    const flags = [
      { id: '1', card_id: 'c_1', ts: at(9).toISOString(), note: "waarom niet 'de'?", resolved: false, updated_ts: '' },
      { id: '2', card_id: 'K2-06', ts: at(11).toISOString(), note: '', resolved: false, updated_ts: '' },
      { id: '3', card_id: 'c_1', ts: at(12).toISOString(), note: 'al opgelost', resolved: true, updated_ts: '' }
    ];
    expect(exportText(flags, cards, 'Fanki')).toBe(
      ['Fanki', '2026-09-30 · 9:40u + 20 min = ... (10:00u)', "2026-09-30 · het huis (la maison) · waarom niet 'de'?"].join('\n')
    );
  });

  it('a card that no longer exists is named by its id', () => {
    expect(flagCardLabel(undefined, 'c_gone')).toBe('c_gone');
  });
});
