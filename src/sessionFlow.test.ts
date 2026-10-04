import { describe, expect, it } from 'vitest';
import { afterRating } from './sessionFlow';
import { progressKey, type Progress } from './scheduler';
import type { Item } from './session';
import type { Card } from './types';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const rules = { max_learning_backlog: 3 };
const card = (id: string): Card =>
  ({ id, type: 'word', nl: id, article: '', pos: '', fr: id, example_nl: '', example_fr: '', tags: [], tags_source: '', flags: [], answer: '', added: '2026-10-01', active: true }) as Card;
const newItem = (id: string): Item => ({ card: card(id), track: 'recog', isNew: true });
const prog = (id: string): Progress => ({
  key: progressKey(id, 'recog'), card_id: id, track: 'recog', state: 'Learning', due: '', stability: 1, difficulty: 5,
  reps: 1, lapses: 0, last_review: '', learning_steps: 1, scheduled_days: 0
});
const rate = (queue: Item[], interval: number) => afterRating(queue, interval, prog(queue[0].card.id), rules);

describe("today's run (one finite queue, no sessions)", () => {
  it('a short learning step comes back later in the same run; a long one leaves the queue', () => {
    let q = ['c1', 'c2', 'c3', 'c4', 'c5'].map(newItem);
    q = rate(q, 10 * MIN); // c1 Again → back 3 places later
    expect(q.map((i) => i.card.id)).toEqual(['c2', 'c3', 'c4', 'c1', 'c5']);
    expect(q[3].learning).toBe(true);
    q = rate(q, 4 * DAY); // c2 → gone
    expect(q.map((i) => i.card.id)).toEqual(['c3', 'c4', 'c1', 'c5']);
  });

  it('runs until the queue is empty: there is no card or minute cap', () => {
    let q = Array.from({ length: 40 }, (_, i) => newItem(`c${i + 1}`));
    let n = 0;
    while (q.length && n < 100) { q = rate(q, 4 * DAY); n++; }
    expect(n).toBe(40);
  });

  it('new cards wait while max_learning_backlog repeats are pending', () => {
    let q = Array.from({ length: 10 }, (_, i) => newItem(`c${i + 1}`));
    q = rate(q, 10 * MIN);
    q = rate(q, 10 * MIN);
    q = rate(q, 10 * MIN); // 3 pending repeats
    expect(q[0].learning).toBe(true);
  });
});
