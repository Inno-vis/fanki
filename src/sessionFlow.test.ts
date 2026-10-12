import { describe, expect, it } from 'vitest';
import { afterRating, appendDue } from './sessionFlow';
import { planToday, todaysIntro, type Item } from './session';
import { inRound, laterToday, leavesWindow, shortStep } from './today';
import { makeScheduler, previewOutcomes } from './scheduler';
import { progressKey, type Progress } from './scheduler';
import type { Card } from './types';

const T0 = Date.parse('2026-10-04T10:00:00');
const MIN = 60_000;
const rules = { max_learning_backlog: 3, due_window_minutes: 10, lapse_queue_threshold: 20, lapse_requeue_min: 5, lapse_requeue_max: 10, lapse_max_retries: 2 };
const settings = { ...rules, new_per_day: 0, unlock_prod_stability_days: 3, max_reviews_per_day: 100 };
const card = (id: string): Card =>
  ({ id, type: 'word', nl: id, article: '', pos: '', fr: id, example_nl: '', example_fr: '', tags: [], flags: [], answer: '', added: '2026-10-01', active: true }) as Card;
const newItem = (id: string): Item => ({ card: card(id), track: 'recog', isNew: true });
const prog = (id: string, dueAt: number): Progress => ({
  key: progressKey(id, 'recog'), card_id: id, track: 'recog', state: 'Learning', due: new Date(dueAt).toISOString(), stability: 1,
  difficulty: 5, reps: 1, lapses: 0, last_review: new Date(T0).toISOString(), learning_steps: 1, scheduled_days: 0
});
/** Rates the front card at `now` with its next step `stepMin` minutes away. */
const rate = (queue: Item[], stepMin: number, now = T0) => afterRating(queue, prog(queue[0].card.id, now + stepMin * MIN), rules, now);
const ids = (q: Item[]) => q.map((i) => i.card.id);

describe('requeue = the due window (one rule, strictly less than due_window_minutes)', () => {
  it('a 9-minute step comes back in this run, a 10-minute step ("Goed") leaves it', () => {
    const q = ['c1', 'c2', 'c3', 'c4', 'c5'].map(newItem);
    expect(ids(rate(q, 9))).toContain('c1');
    expect(ids(rate(q, 10))).not.toContain('c1');
    expect(ids(rate(q, 4 * 24 * 60))).not.toContain('c1'); // Makkelijk
  });

  it('"Goed": the bar counts it as done, home lists it as later, and it rejoins the round when its time comes', () => {
    const due = T0 + 10 * MIN;
    const p = { ...prog('g', due), state: 'Learning' as const };
    expect(leavesWindow(p, rules)).toBe(true); // done for the bar
    const progress = new Map([[p.key, p]]);
    const at = (t: number) => planToday([card('g')], progress, settings, todaysIntro(undefined, new Date(t)), new Date(t));
    expect(at(T0).due).toEqual([]);
    const later = laterToday([card('g')], progress, settings, new Date(T0));
    expect(later.groups).toEqual([]); // one card: no line (only from 5 cards)
    expect(later.nextAt).toBe(due); // but home wakes up when it is really due
    for (const ms of [1, 1000, MIN, 2 * MIN, 10 * MIN - 1]) expect(ids(at(T0 + ms).due), `${ms} ms after`).toEqual([]); // never early
    expect(ids(at(T0 + 10 * MIN).due)).toEqual(['g']); // after 10 real minutes → back in the round
  });
});

describe('next card', () => {
  it('a requeued card is not shown before its due time while other cards are ready', () => {
    let q = ['c1', 'c2'].map(newItem);
    q = rate(q, 1); // c1 Again: due in 1 min, put after c2
    expect(ids(q)).toEqual(['c2', 'c1']);
    // c2 → Makkelijk at T0 + 10 s: only c1 is left, not due yet → shown anyway (the run never stalls).
    q = afterRating(q, prog('c2', T0 + 4 * 24 * 60 * MIN), rules, T0 + 10_000);
    expect(ids(q)).toEqual(['c1']);
  });

  it('skips a waiting card for a ready one even when it is first in line', () => {
    const waitingCard: Item = { card: card('w'), track: 'recog', isNew: false, learning: true, progress: prog('w', T0 + 5 * MIN) };
    const q = afterRating([newItem('x'), waitingCard, newItem('n1')], prog('x', T0 + 4 * 24 * 60 * MIN), rules, T0);
    expect(ids(q)).toEqual(['n1', 'w']);
  });

  it('new cards wait while max_learning_backlog cards are in short steps (when one of them is ready)', () => {
    let q = Array.from({ length: 6 }, (_, i) => newItem(`c${i + 1}`));
    q = rate(q, 1);
    q = rate(q, 1);
    q = rate(q, 1); // 3 cards in short steps
    const later = T0 + 2 * MIN; // they are due now
    q = afterRating(q, prog(q[0].card.id, later + 4 * 24 * 60 * MIN), rules, later);
    expect(q[0].learning).toBe(true);
  });

  it('runs until the queue is empty: there is no card or minute cap', () => {
    let q = Array.from({ length: 40 }, (_, i) => newItem(`c${i + 1}`));
    let n = 0;
    while (q.length && n < 100) {
      q = rate(q, 4 * 24 * 60);
      n++;
    }
    expect(n).toBe(40);
  });
});

describe('lapse retry in long runs (above lapse_queue_threshold)', () => {
  const reviewItem = (id: string): Item => ({ card: card(id), track: 'recog', isNew: false, progress: { ...prog(id, T0), state: 'Review' } });
  const run = (n: number) => Array.from({ length: n }, (_, i) => reviewItem(`r${i}`));
  const fail = (id: string) => ({ ...prog(id, T0 + 10 * MIN), state: 'Relearning' as const }); // ❌ Opnieuw on a review card: 10 min
  const opnieuw = (q: Item[], ctx: { retries: Record<string, number>; random?: () => number }, r = rules) =>
    afterRating(q, fail(q[0].card.id), r, T0, { grade: 1, ...ctx });

  it('at or below the threshold nothing changes: the failed card leaves the run (10 min ≥ window)', () => {
    const q = run(21); // 20 left after the current card = threshold, not above
    expect(ids(opnieuw(q, { retries: {} }))).not.toContain('r0');
  });

  it('above it, a failed review card comes back 5–10 cards later — never next', () => {
    for (const [random, at] of [[0, 5], [0.5, 8], [0.999, 10]] as const) {
      const out = opnieuw(run(30), { retries: {}, random: () => random });
      expect(out.findIndex((i) => i.card.id === 'r0'), `random ${random}`).toBe(at);
      expect(out[0].card.id).not.toBe('r0');
    }
  });

  it('fewer cards left than the offset: after the last card (still not next)', () => {
    const r = { ...rules, lapse_queue_threshold: 2 };
    const out = opnieuw(run(4), { retries: {}, random: () => 0 }, r); // 3 left, offset 5
    expect(ids(out)).toEqual(['r1', 'r2', 'r3', 'r0']);
  });

  it('at most lapse_max_retries requeues per card per run; after that it follows its FSRS due time', () => {
    const ctx = { retries: {} as Record<string, number>, random: () => 0 };
    let q = run(40);
    q = opnieuw(q, ctx); // retry 1
    q = [q[q.findIndex((i) => i.card.id === 'r0')], ...q.filter((i) => i.card.id !== 'r0')];
    q = opnieuw(q, ctx); // retry 2
    q = [q[q.findIndex((i) => i.card.id === 'r0')], ...q.filter((i) => i.card.id !== 'r0')];
    expect(ids(opnieuw(q, ctx))).not.toContain('r0'); // third failure: no retry
    expect(ctx.retries['r0|recog']).toBe(2);
  });

  it('Moeilijk and new cards are unchanged', () => {
    const hard = afterRating(run(30), { ...prog('r0', T0 + 6 * 24 * 60 * MIN), state: 'Review' }, rules, T0, { grade: 2, retries: {} });
    expect(ids(hard)).not.toContain('r0'); // Moeilijk on a review card: days → leaves
    const q = [newItem('n0'), ...run(30)];
    const out = afterRating(q, prog('n0', T0 + 1 * MIN), rules, T0, { grade: 1, retries: {} }); // new card, 1-min step
    expect(out.findIndex((i) => i.card.id === 'n0')).toBe(3); // the usual: 3 places later, waiting for its time
    expect(out.find((i) => i.card.id === 'n0')!.learning).toBe(true);
  });
});

describe('cards that become due during the run join at the end (appendDue)', () => {
  const due = (id: string, at: number): Item => ({ card: card(id), track: 'recog', isNew: false, progress: prog(id, at) });

  it('a ≥ 10 min card does not appear early, and joins at the END when its time comes', () => {
    const q = ['a', 'b'].map(newItem);
    const g = due('g', T0 + 10 * MIN); // rated Goed at T0
    expect(ids(appendDue(q, [g], T0 + 5 * MIN))).toEqual(['a', 'b']); // not yet
    expect(ids(appendDue(q, [g], T0 + 10 * MIN))).toEqual(['a', 'b', 'g']); // its time: at the end, never before the current card
    expect(ids(appendDue([...q, g], [g], T0 + 11 * MIN))).toEqual(['a', 'b', 'g']); // once
  });
});

describe('round membership by the card\'s own step (window 10, real FSRS)', () => {
  const sched = makeScheduler({ desired_retention: 0.9 });
  const at = new Date(T0);
  const w = { due_window_minutes: 10 };

  it('new card: Moeilijk (~6 min) stays in the round, Goed (10 min) leaves it', () => {
    const o = previewOutcomes(sched, 'n', 'recog', undefined, at);
    expect(Math.round(o[2].intervalMs / MIN)).toBeLessThan(10);
    expect(shortStep(o[2].next, w)).toBe(true);
    expect(Math.round(o[3].intervalMs / MIN)).toBe(10);
    expect(shortStep(o[3].next, w)).toBe(false);
    expect(leavesWindow(o[3].next, w)).toBe(true);
  });

  it('review card: Opnieuw (10 min) leaves the round', () => {
    const p: Progress = { ...prog('r', T0), state: 'Review', stability: 12, reps: 6, learning_steps: 0, last_review: new Date(T0 - 12 * 24 * 60 * MIN).toISOString(), scheduled_days: 12 };
    const o = previewOutcomes(sched, 'r', 'recog', p, at);
    expect(Math.round(o[1].intervalMs / MIN)).toBe(10);
    expect(leavesWindow(o[1].next, w)).toBe(true);
  });

  it('a 10-min Goed is never in the round before 10 real minutes (1 ms, 1 s, 1 min after) and is at 10 min', () => {
    const g = previewOutcomes(sched, 'n', 'recog', undefined, at)[3].next;
    for (const ms of [0, 1, 1000, MIN, 9 * MIN + 59_999]) expect(inRound(g, T0 + ms, w), `${ms} ms`).toBe(false);
    expect(inRound(g, T0 + 10 * MIN, w)).toBe(true);
    const q = afterRating(['n', 'x'].map(newItem), g, { ...rules, due_window_minutes: 10 }, T0 + 1);
    expect(ids(q)).toEqual(['x']); // not requeued: it leaves the run
    expect(ids(appendDue(q, [{ card: card('n'), track: 'recog', isNew: false, progress: g }], T0 + MIN))).toEqual(['x']);
    expect(ids(appendDue(q, [{ card: card('n'), track: 'recog', isNew: false, progress: g }], T0 + 10 * MIN))).toEqual(['x', 'n']);
  });
});
