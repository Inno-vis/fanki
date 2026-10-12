import { describe, expect, it } from 'vitest';
import type { Grade } from 'ts-fsrs';
import { makeScheduler, previewOutcomes, type Progress } from './scheduler';
import { ratingLabels } from './intervalGuard';

const sched = makeScheduler({ desired_retention: 0.9 });
const at = new Date('2026-10-12T10:00:00Z');
const DAY = 86_400_000;
const G = [1, 2, 3, 4] as Grade[];
const opts = (random: number) => ({ easyFirstDays: 14, random: () => random });

describe('😎 Makkelijk on the first review of a new card (recog): easy_first_interval_days ±15 %', () => {
  it('gives 14 d ±15 % (11.9–16.1 d), keeps FSRS\'s own stability, sets scheduled_days', () => {
    const own = previewOutcomes(sched, 'n', 'recog', undefined, at)[4].next;
    for (const [r, days] of [[0, 11.9], [0.5, 14], [0.999, 16.1]] as const) {
      const o = previewOutcomes(sched, 'n', 'recog', undefined, at, opts(r))[4];
      expect(o.intervalMs / DAY).toBeCloseTo(days, 1);
      expect(o.next.stability).toBe(own.stability); // FSRS's memory estimate untouched (8.3 d)
      expect(o.next.scheduled_days).toBe(Math.round(o.intervalMs / DAY));
      expect(Date.parse(o.next.due) - at.getTime()).toBe(o.intervalMs); // the label's value is the stored due
    }
    expect(ratingLabels(previewOutcomes(sched, 'n', 'recog', undefined, at, opts(0.5)))[4]).toBe('2 wk');
  });

  it('❌ Opnieuw, 😅 Moeilijk and ✅ Goed are unchanged; the ladder still holds', () => {
    const own = previewOutcomes(sched, 'n', 'recog', undefined, at);
    const o = previewOutcomes(sched, 'n', 'recog', undefined, at, opts(0));
    for (const g of [1, 2, 3] as Grade[]) expect(o[g].intervalMs).toBe(own[g].intervalMs);
    const due = G.map((g) => Date.parse(o[g].next.due));
    expect(due[0] < due[1] && due[1] < due[2] && due[2] < due[3]).toBe(true);
    expect(new Set(Object.values(ratingLabels(o))).size).toBe(4);
  });

  it('the prod track keeps FSRS\'s own values on its first review', () => {
    const own = previewOutcomes(sched, 'n', 'prod', undefined, at)[4];
    const o = previewOutcomes(sched, 'n', 'prod', undefined, at, opts(0.999))[4];
    expect(o.intervalMs / DAY).toBeLessThan(11); // FSRS: about 6–10 d
    expect(o.next.stability).toBe(own.next.stability);
  });

  it('the second review is unchanged (only the first review of a new card)', () => {
    const first = previewOutcomes(sched, 'n', 'recog', undefined, at, opts(0.5))[4].next;
    const later = new Date(Date.parse(first.due));
    const prev: Progress = { ...first, key: 'n|recog', card_id: 'n', track: 'recog' };
    const own = previewOutcomes(sched, 'n', 'recog', prev, later);
    const o = previewOutcomes(sched, 'n', 'recog', prev, later, opts(0));
    for (const g of G) expect(o[g].next.state).toBe(own[g].next.state);
    expect(o[4].next.stability).toBe(own[4].next.stability); // FSRS decides; no override after the first review
  });

  it('easy_first_interval_days = 0 means FSRS\'s own Makkelijk', () => {
    const o = previewOutcomes(sched, 'n', 'recog', undefined, at, { easyFirstDays: 0 })[4];
    expect(o.intervalMs / DAY).toBeLessThan(11);
  });
});
