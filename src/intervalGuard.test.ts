import { describe, expect, it } from 'vitest';
import type { Grade } from 'ts-fsrs';
import { fromFsrsCard, makeScheduler, previewOutcomes, toFsrsCard, type Outcome, type Progress } from './scheduler';
import { enforceOrder, LADDER_MS, nextRung, ratingLabels } from './intervalGuard';
import { formatInterval } from './format';

const at = new Date('2026-10-12T10:00:00Z');
const sched = makeScheduler({ desired_retention: 0.9 }); // fuzz on
const G = [1, 2, 3, 4] as Grade[];
const MIN = 60_000, DAY = 86_400_000;

function rng(seed: number) {
  return () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
}
function randomCard(kind: string, r: () => number): Progress | undefined {
  if (kind === 'New') return undefined;
  const stab = kind === 'Review' ? 0.3 + r() * 200 : 0.1 + r() * 5;
  const elapsedMin = kind === 'Review' ? stab * 1440 * (0.3 + r() * 1.5) : r() * 30;
  return {
    key: 'c|recog', card_id: 'c', track: 'recog', state: kind as Progress['state'], due: at.toISOString(), stability: stab,
    difficulty: 1 + r() * 9, reps: 1 + Math.floor(r() * 10), lapses: kind === 'Relearning' ? 1 : 0,
    last_review: new Date(at.getTime() - elapsedMin * MIN).toISOString(), learning_steps: Math.floor(r() * 2),
    scheduled_days: kind === 'Review' ? Math.max(1, Math.round(stab)) : 0
  };
}
/** FSRS's own outcomes (before the guard). */
function rawOutcomes(p: Progress | undefined): Record<Grade, Outcome> {
  const pre = sched.repeat(toFsrsCard(p, at), at);
  const out = {} as Record<Grade, Outcome>;
  for (const g of G) {
    const next = fromFsrsCard('c', 'recog', pre[g].card);
    out[g] = { rating: g, next, intervalMs: Date.parse(next.due) - at.getTime() };
  }
  return out;
}

describe('rating buttons: Opnieuw < Moeilijk < Goed < Makkelijk, strictly', () => {
  for (const kind of ['New', 'Learning', 'Relearning', 'Review']) {
    it(`${kind}: 20,000 random cards (fuzz on) — due times strictly increasing, labels all different, label from the stored due, never earlier than FSRS`, () => {
      const r = rng(kind.length * 7919);
      for (let i = 0; i < 20_000; i++) {
        const p = randomCard(kind, r);
        const raw = rawOutcomes(p);
        const out = enforceOrder(structuredClone(raw), at);
        const due = G.map((g) => Date.parse(out[g].next.due));
        for (let k = 1; k < 4; k++) expect(due[k], `${kind} #${i}`).toBeGreaterThan(due[k - 1]);
        for (const g of G) {
          expect(out[g].intervalMs).toBe(Date.parse(out[g].next.due) - at.getTime()); // the label's value IS the stored due
          expect(out[g].intervalMs).toBeGreaterThanOrEqual(raw[g].intervalMs); // a push never moves a button earlier
        }
        const labels = ratingLabels(out);
        expect(new Set(Object.values(labels)).size, `${kind} #${i}: ${JSON.stringify(labels)}`).toBe(4);
      }
    });
  }

  it('previewOutcomes applies the guard (what the button shows is what gets stored)', () => {
    const r = rng(42);
    for (let i = 0; i < 2000; i++) {
      const out = previewOutcomes(sched, 'c', 'recog', randomCard(['Learning', 'Relearning'][i % 2], r), at);
      const due = G.map((g) => Date.parse(out[g].next.due));
      expect(due[1] > due[0] && due[2] > due[1] && due[3] > due[2]).toBe(true);
    }
  });

  it('the cascade: Opnieuw = Moeilijk = Goed = Makkelijk climbs the ladder rung by rung', () => {
    const same = (ms: number) => ({ rating: 1 as Grade, next: { state: 'Learning', due: new Date(at.getTime() + ms).toISOString() } as Progress, intervalMs: ms });
    const out = enforceOrder({ 1: same(10 * MIN), 2: same(10 * MIN), 3: same(10 * MIN), 4: same(10 * MIN) }, at);
    expect(G.map((g) => out[g].intervalMs)).toEqual([10 * MIN, 30 * MIN, 60 * MIN, 6 * 60 * MIN]);
    expect(Object.values(ratingLabels(out))).toEqual(['10 min', '30 min', '1 u', '6 u']);
  });

  it('a later button that is already later is never touched; equal review days move to the next rung', () => {
    const o = (ms: number, state = 'Review') => ({ rating: 1 as Grade, next: { state, due: new Date(at.getTime() + ms).toISOString(), scheduled_days: Math.round(ms / DAY) } as Progress, intervalMs: ms });
    const out = enforceOrder({ 1: o(10 * MIN, 'Relearning'), 2: o(2 * DAY), 3: o(2 * DAY), 4: o(50 * DAY) }, at);
    expect([out[3].intervalMs, out[4].intervalMs]).toEqual([3 * DAY, 50 * DAY]);
    expect(out[3].next.scheduled_days).toBe(3);
    expect(nextRung(100 * DAY)).toBe(15 * 7 * DAY); // after 100 d: whole weeks
    expect(LADDER_MS.slice(0, 9).map((ms) => formatInterval(ms))).toEqual(['1 min', '5 min', '10 min', '30 min', '1 u', '6 u', '1 d', '2 d', '3 d']);
  });

  it('review cards whose dates differ but look the same get finer labels — the due dates stay', () => {
    const o = (days: number) => ({ rating: 1 as Grade, next: { state: 'Review', due: new Date(at.getTime() + days * DAY).toISOString() } as Progress, intervalMs: days * DAY });
    const out = { 1: o(0.007), 2: o(30), 3: o(52), 4: o(71) };
    const before = structuredClone(out);
    expect([formatInterval(out[3].intervalMs), formatInterval(out[4].intervalMs)]).toEqual(['2 mnd', '2 mnd']);
    const labels = ratingLabels(enforceOrder(out, at));
    expect([labels[3], labels[4]]).toEqual(['52 d', '71 d']);
    expect(out[3].intervalMs).toBe(before[3].intervalMs);
    expect(out[4].intervalMs).toBe(before[4].intervalMs);
  });
});
