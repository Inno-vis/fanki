import { describe, expect, it } from 'vitest';
import { afterRating } from './sessionFlow';
import { extend, progressLabel, startSession, type SessionState } from './sessionRules';
import { progressKey, type Progress } from './scheduler';
import type { Item } from './session';
import type { Card } from './types';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const T0 = Date.parse('2026-10-02T10:00:00Z');
const rules = {
  session_max_cards: 15, session_max_minutes: 8, session_extra_cards: 10, cooldown_minutes: 60,
  min_reviews_to_count: 3, session_resume_minutes: 30, max_learning_backlog: 3
};
const card = (id: string): Card =>
  ({ id, type: 'word', nl: id, article: '', pos: '', fr: id, example_nl: '', example_fr: '', tags: [], tags_source: '', flags: [], answer: '', added: '2026-10-01', active: true }) as Card;
const newItem = (id: string): Item => ({ card: card(id), track: 'recog', isNew: true });
const prog = (id: string): Progress => ({
  key: progressKey(id, 'recog'), card_id: id, track: 'recog', state: 'Learning', due: '', stability: 1, difficulty: 5,
  reps: 1, lapses: 0, last_review: '', learning_steps: 1, scheduled_days: 0
});

/** Rates the card at the front; `interval` decides whether it comes back in this session. */
function rate(state: { queue: Item[]; session: SessionState }, interval: number, minute: number) {
  const id = state.queue[0].card.id;
  return afterRating(state.queue, interval, prog(id), state.session, rules, T0 + minute * 1000);
}

describe('short learning steps inside a session', () => {
  it('card 3 rated Again (10 min) is still shown after card 15, before the session may offer/end', () => {
    let state = { queue: Array.from({ length: 30 }, (_, i) => newItem(`c${i + 1}`)), session: startSession(T0) };
    const shown: string[] = [];
    let step = 'card';
    // Rate as she goes: c3 → Again (10 min) every time it shows until the cap; everything else → Easy (days).
    for (let n = 0; n < 40 && step !== 'offer' && step !== 'end'; n++) {
      const id = state.queue[0].card.id;
      shown.push(id);
      const again = id === 'c3' && state.session.reviewed < 15;
      const r = rate(state, again ? 10 * MIN : 4 * DAY, n * 10);
      state = { queue: r.queue, session: r.session };
      step = r.step;
      if (state.session.reviewed === 15 && step === 'repeat') {
        // The cap is reached but c3 is pending: it must come next, and the count stays "15 van 15".
        expect(state.queue[0].card.id).toBe('c3');
        expect(progressLabel(state.session, rules)).toEqual({ done: 15, target: 15 });
      }
    }
    expect(step).toBe('offer');
    expect(shown.filter((x) => x === 'c3').length).toBeGreaterThan(1);
    expect(shown[shown.length - 1]).toBe('c3'); // the last card before the offer is the pending repeat
    expect(state.session.reviewed).toBe(15); // repeats never counted toward the 15
    expect(shown.filter((x) => x !== 'c3').length).toBe(14); // 14 other distinct cards + c3 = 15
  });

  it('also for a 15-minute step and after the "Nog 10 kaarten" extension', () => {
    let state = { queue: Array.from({ length: 40 }, (_, i) => newItem(`c${i + 1}`)), session: startSession(T0) };
    for (let n = 0; n < 15; n++) state = rate(state, 4 * DAY, n);
    state = { ...state, session: extend(state.session, rules, state.queue.length) };
    // Extension: 10 more; the 9th of them gets a 15-min step.
    let last = 'card';
    for (let n = 0; n < 10; n++) {
      const r = rate(state, n === 8 ? 15 * MIN : 4 * DAY, 100 + n);
      state = r;
      last = r.step;
    }
    expect(last).toBe('repeat'); // 25 distinct reached, but the 15-min repeat is pending
    const r = rate(state, 4 * DAY, 200);
    expect(r.step).toBe('end');
    expect(r.session.reviewed).toBe(25);
  });

  it('the time cap does not end a session with a pending repeat either', () => {
    let state = { queue: Array.from({ length: 10 }, (_, i) => newItem(`c${i + 1}`)), session: startSession(T0) };
    state = rate(state, 10 * MIN, 0); // c1 Again
    const late = afterRating(state.queue, 4 * DAY, prog('c2'), state.session, rules, T0 + 9 * MIN); // 9 min: over 8
    expect(late.step).toBe('repeat');
    expect(late.queue[0].card.id).toBe('c1');
  });

  it('still works with max_learning_backlog: new cards wait while 3 repeats are pending', () => {
    let state = { queue: Array.from({ length: 10 }, (_, i) => newItem(`c${i + 1}`)), session: startSession(T0) };
    state = rate(state, 10 * MIN, 0); // c1
    state = rate(state, 10 * MIN, 1); // c2
    const r = rate(state, 10 * MIN, 2); // c3 → 3 pending repeats
    expect(r.step).toBe('card');
    expect(r.queue[0].learning).toBe(true); // a repeat comes before the next new card
  });

  it('min_reviews_to_count counts every rating, repeats included', () => {
    let state = { queue: [newItem('c1'), newItem('c2')], session: startSession(T0) };
    state = rate(state, 10 * MIN, 0);
    state = rate(state, 10 * MIN, 1);
    state = rate(state, 4 * DAY, 2);
    expect(state.session.reviewed).toBe(2);
    expect(state.session.ratings).toBe(3);
  });
});
