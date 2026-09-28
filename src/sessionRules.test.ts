import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { _resetDb } from './db';
import {
  cooldownUntil, endSession, extend, loadLastSession, markOffered, minutesLeft, nextStep, progressLabel, reviewed, startSession
} from './sessionRules';

const rules = { session_max_cards: 15, session_max_minutes: 8, session_extra_cards: 10, cooldown_minutes: 60, min_reviews_to_count: 3 };
const T0 = Date.parse('2026-09-29T10:00:00Z');
const MIN = 60_000;

function review(n: number, s = startSession(T0)) {
  for (let i = 0; i < n; i++) s = reviewed(s);
  return s;
}

describe('session cap and the single offer', () => {
  it('keeps going below both caps', () => {
    expect(nextStep(review(14), rules, T0 + 5 * MIN, 30)).toBe('card');
  });

  it('offers at session_max_cards', () => {
    expect(nextStep(review(15), rules, T0 + 2 * MIN, 30)).toBe('offer');
  });

  it('offers at session_max_minutes even with few cards', () => {
    expect(nextStep(review(4), rules, T0 + 8 * MIN, 30)).toBe('offer');
  });

  it('never offers twice: after an unanswered/declined offer the session ends', () => {
    const s = markOffered(review(15));
    expect(nextStep(s, rules, T0, 30)).toBe('end');
  });

  it('"Nog 10 kaarten, graag!" allows exactly 10 more, with no second offer', () => {
    let s = extend(review(15), rules, 30);
    for (let i = 0; i < 9; i++) {
      s = reviewed(s);
      expect(nextStep(s, rules, T0 + 60 * MIN, 30)).toBe('card'); // time cap no longer applies
    }
    s = reviewed(s);
    expect(nextStep(s, rules, T0 + 60 * MIN, 30)).toBe('end');
    expect(progressLabel(s, rules)).toEqual({ done: 25, target: 25 });
  });

  it('the extension is limited by the cards that are left', () => {
    const s = extend(review(15), rules, 4);
    expect(progressLabel(s, rules)).toEqual({ done: 15, target: 19 });
  });

  it('ends when cards run out, capped or not', () => {
    expect(nextStep(review(3), rules, T0, 0)).toBe('end');
  });

  it('progress label shows X van session_max_cards before the offer', () => {
    expect(progressLabel(review(9), rules)).toEqual({ done: 9, target: 15 });
  });
});

describe('cooldown', () => {
  beforeEach(() => {
    indexedDB = new IDBFactory();
    _resetDb();
  });

  it('computes minutes left and survives an app restart (re-read from IndexedDB)', async () => {
    const end = T0 + 10 * MIN;
    await endSession(review(15), rules, end);
    _resetDb(); // simulate force-quit + reopen: new connection, nothing in memory
    const until = cooldownUntil(await loadLastSession(), rules);
    expect(until).toBe(end + 60 * MIN);
    expect(minutesLeft(until, end + 18 * MIN)).toBe(42);
    expect(minutesLeft(until, end + 59.5 * MIN)).toBe(1);
    expect(minutesLeft(until, end + 60 * MIN)).toBe(0);
  });

  it('a trivial session (< min_reviews_to_count) sets no cooldown and keeps the previous one', async () => {
    expect(await endSession(review(2), rules, T0)).toBeNull();
    expect(await loadLastSession()).toBeUndefined();
    expect(cooldownUntil(undefined, rules)).toBeNull();
    expect(cooldownUntil({ start: '', end: new Date(T0).toISOString(), reviews: 2 }, rules)).toBeNull();
  });

  it('cooldown_minutes = 0 disables the cooldown', () => {
    expect(cooldownUntil({ start: '', end: new Date(T0).toISOString(), reviews: 20 }, { ...rules, cooldown_minutes: 0 })).toBeNull();
  });
});
