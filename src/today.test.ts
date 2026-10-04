import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { _resetDb, getMeta, recordReview } from './db';
import { dueDoneCount, getNewPerDay, leavesWindow, nextLaterTodayMin, todayBar, todaysDone, type DoneToday } from './today';
import { planToday, todaysIntro } from './session';
import { progressKey, type Progress } from './scheduler';
import type { Card } from './types';

const now = new Date('2026-10-04T10:00:00');
const at = (min: number) => new Date(now.getTime() + min * 60_000).toISOString();
const settings = { new_per_day: 2, unlock_prod_stability_days: 3, due_window_minutes: 10, max_reviews_per_day: 100 };
const card = (id: string): Card =>
  ({ id, type: 'word', nl: id, article: '', pos: '', fr: id, example_nl: '', example_fr: '', tags: [], tags_source: '', flags: [], answer: '', added: '2026-10-01', active: true }) as Card;
const prog = (id: string, due: string, state: Progress['state'] = 'Review'): Progress => ({
  key: progressKey(id, 'recog'), card_id: id, track: 'recog', state, due, stability: 1, difficulty: 5, reps: 2, lapses: 0,
  last_review: at(-1440), learning_steps: 0, scheduled_days: 1
});

describe('daily quota', () => {
  it('getNewPerDay is the one source of the daily new-card limit', () => {
    expect(getNewPerDay({ new_per_day: 10 })).toBe(10);
  });
});

describe('the "Vandaag" bar', () => {
  it('counts unique items and never exceeds 100 %', () => {
    const done: DoneToday = { date: '2026-10-04', items: { 'a|recog': 'due', 'b|recog': 'new', 'c|recog': 'due' } };
    // c is due again (a longer learning step): it counts once, as remaining.
    const bar = todayBar(done, ['c|recog', 'd|recog', 'd|recog']);
    expect(bar).toEqual({ done: 2, remaining: 2, fill: 0.5 });
    expect(todayBar(done, []).fill).toBe(1);
    expect(todayBar(todaysDone(undefined, now), []).fill).toBe(0);
  });

  it('an item is done once it leaves the due window', () => {
    expect(leavesWindow(at(8), now, settings)).toBe(false);
    expect(leavesWindow(at(11), now, settings)).toBe(true);
  });

  it('resets at local midnight', () => {
    const done: DoneToday = { date: '2026-10-04', items: { 'a|recog': 'due' } };
    expect(todaysDone(done, now).items).toEqual({ 'a|recog': 'due' });
    expect(todaysDone(done, new Date('2026-10-05T00:01:00')).items).toEqual({});
    expect(dueDoneCount(done)).toBe(1);
  });
});

describe('resume after stopping (done_today is stored with the rating)', () => {
  beforeEach(() => {
    indexedDB = new IDBFactory();
    _resetDb();
  });

  it('reopening the app the same day gives the same bar', async () => {
    const done: DoneToday = { date: '2026-10-04', items: { 'a|recog': 'due' } };
    const p = prog('a', at(3 * 1440));
    await recordReview(p, { event_id: 'e1', card_id: 'a', track: 'recog', ts: now.toISOString(), rating: 3, mode: 'nl_fr', duration_ms: 1, snapshot: {} as never },
      todaysIntro(undefined, now), done);
    _resetDb(); // app closed and reopened
    const stored = await getMeta('doneToday');
    expect(todayBar(todaysDone(stored, now), ['b|recog'])).toEqual({ done: 1, remaining: 1, fill: 0.5 });
  });
});

describe('"Klaar voor nu!" and the next card later today', () => {
  it('only when nothing is due and the new quota is used up', () => {
    const cards = [card('a'), card('n1'), card('n2')];
    const progress = new Map([[progressKey('a', 'recog'), prog('a', at(-5))]]);
    const work = (intro = todaysIntro(undefined, now)) => {
      const p = planToday(cards, progress, settings, intro, now);
      return p.due.length + p.fresh.length;
    };
    expect(work()).toBe(3); // due + quota left → Starten
    const quotaUsed = { ...todaysIntro(undefined, now), main: ['x', 'y'] };
    expect(work(quotaUsed)).toBe(1); // still a due card → not done
    progress.set(progressKey('a', 'recog'), prog('a', at(3 * 1440)));
    expect(work(quotaUsed)).toBe(0); // nothing due, quota used → "Klaar voor nu!"
  });

  it('names the next learning-step card due later today (outside the window), else nothing', () => {
    const cards = [card('l1'), card('l2'), card('r1')];
    const progress = new Map([
      [progressKey('l1', 'recog'), prog('l1', at(25), 'Learning')],
      [progressKey('l2', 'recog'), prog('l2', at(5), 'Learning')], // inside the window: part of today's run
      [progressKey('r1', 'recog'), prog('r1', at(15))] // a Review card, not a learning step
    ]);
    expect(nextLaterTodayMin(cards, progress, settings, now)).toBe(25);
    expect(nextLaterTodayMin([card('r1')], progress, settings, now)).toBeNull();
  });
});
