import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { cleanCard, cleanSettings } from './sync';
import { _resetDb, allCards, getSettings, saveSnapshot } from './db';
import { byAdded } from './store';
import { dutchText } from './display';
import type { Card } from './types';

const raw = (over: Partial<Card> = {}): Partial<Card> => ({
  id: 'c_1', type: 'word', nl: 'huis', article: 'het', pos: 'noun', fr: 'la maison',
  example_nl: '', example_fr: '', tags: ['household'], tags_source: 'manual', flags: [], added: '2026-09-28', active: true,
  ...over
});

describe('cleanCard', () => {
  it('keeps a valid card and records sheet order', () => {
    expect(cleanCard(raw(), 3)).toMatchObject({ id: 'c_1', article: 'het', order: 3 });
  });
  it('drops cards without id or Dutch text', () => {
    expect(cleanCard(raw({ id: '' }), 0)).toBeNull();
    expect(cleanCard(raw({ nl: '' }), 0)).toBeNull();
  });
  it('normalises bad values from the hand-edited sheet', () => {
    const c = cleanCard(raw({ type: 'banana' as never, article: 'le' as never, flags: [' False-Friend '] }), 0)!;
    expect(c.type).toBe('word');
    expect(c.article).toBe('');
    expect(c.flags).toEqual(['false-friend']);
  });
});

describe('cleanSettings', () => {
  it('fills defaults and clamps out-of-range values', () => {
    expect(cleanSettings({ new_per_day: 500, desired_retention: 2 } as never)).toMatchObject({
      new_per_day: 100, desired_retention: 0.97, compliments_enabled: true, show_french_help: true
    });
    expect(cleanSettings(undefined).new_per_day).toBe(8);
    expect(cleanSettings({ show_french_help: false }).show_french_help).toBe(false);
  });
});

describe('ordering and display', () => {
  it('orders by added, then sheet order', () => {
    const a = { ...(raw({ id: 'a', added: '2026-09-28' }) as Card), order: 0 };
    const b = { ...(raw({ id: 'b', added: '2026-09-27' }) as Card), order: 5 };
    const c = { ...(raw({ id: 'c', added: '2026-09-27' }) as Card), order: 1 };
    expect([a, b, c].sort(byAdded).map((x) => x.id)).toEqual(['c', 'b', 'a']);
  });
  it('shows nouns with their article and strips cloze braces', () => {
    expect(dutchText(raw() as Card)).toBe('het huis');
    expect(dutchText(raw({ type: 'sentence', article: '', nl: 'Ik {woon} hier.' }) as Card)).toBe('Ik woon hier.');
  });
});

describe('saveSnapshot', () => {
  beforeEach(() => {
    indexedDB = new IDBFactory();
    _resetDb();
  });

  it('replaces the whole card set and stores settings', async () => {
    await saveSnapshot([cleanCard(raw({ id: 'x' }), 0)!, cleanCard(raw({ id: 'y' }), 1)!], { settings: cleanSettings({ new_per_day: 5 }) });
    await saveSnapshot([cleanCard(raw({ id: 'y' }), 0)!], {});
    expect((await allCards()).map((c) => c.id)).toEqual(['y']);
    expect((await getSettings()).new_per_day).toBe(5);
  });
});
