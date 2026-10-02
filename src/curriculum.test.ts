import { describe, expect, it } from 'vitest';
import { curriculumStatus, isTopicLocked, makePicker } from './curriculum';
import { progressKey, type Progress } from './scheduler';
import { planToday, todaysIntro } from './session';
import type { Card, CurriculumRow } from './types';

const now = new Date('2026-10-20T12:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
const card = (id: string, tags: string[], type: Card['type'] = 'question', added = '2026-09-29'): Card =>
  ({ id, type, nl: id, article: '', pos: '', fr: id, example_nl: '', example_fr: '', tags, tags_source: '', flags: [], answer: '', added, active: true }) as Card;
const row = (order: number, tag: string, over: Partial<CurriculumRow> = {}): CurriculumRow => ({
  order, tag, unlock_threshold: 0.8, min_reviews: 2, max_wait_days: 21, active: true, open: 'auto', ...over
});
const prog = (id: string, stability: number, reps: number, first = daysAgo(3), track: 'recog' | 'prod' = 'prod'): [string, Progress] => [
  progressKey(id, track),
  { key: progressKey(id, track), card_id: id, track, state: 'Review', due: daysAgo(-10), stability, difficulty: 5, reps, lapses: 0,
    last_review: daysAgo(1), learning_steps: 0, scheduled_days: 10, first_review: first }
];
const rows = [row(1, 'a'), row(2, 'b'), row(3, 'c')];

describe('score', () => {
  it('mature = stability >= mature_stability_days AND reps >= min_reviews; score = mature / cards', () => {
    const cards = [card('a1', ['a']), card('a2', ['a']), card('a3', ['a']), card('a4', ['a'])];
    const progress = new Map([prog('a1', 30, 3), prog('a2', 21, 2), prog('a3', 40, 1), prog('a4', 5, 9)]);
    const [a] = curriculumStatus(rows, cards, progress, 21, now);
    expect(a.mature).toBe(2); // a3 has too few reviews, a4 too little stability
    expect(a.score).toBe(0.5);
  });

  it('words count by their recognition track', () => {
    const cards = [card('w', ['a'], 'word')];
    const [a] = curriculumStatus(rows, cards, new Map([prog('w', 30, 3, daysAgo(3), 'recog')]), 21, now);
    expect(a.score).toBe(1);
  });
});

describe('unlocking', () => {
  const cards = ['a1', 'a2', 'a3', 'a4', 'a5'].map((id) => card(id, ['a'])).concat([card('b1', ['b']), card('c1', ['c'])]);

  it('first row open, later rows locked until the previous one passes', () => {
    const s = curriculumStatus(rows, cards, new Map([prog('a1', 30, 3)]), 21, now);
    expect(s.map((x) => x.unlocked)).toEqual([true, false, false]);
  });

  it('score >= threshold unlocks the next row', () => {
    const progress = new Map(['a1', 'a2', 'a3', 'a4'].map((id) => prog(id, 30, 3)));
    const s = curriculumStatus(rows, cards, progress, 21, now); // 4/5 = 0.8
    expect(s.map((x) => x.unlocked)).toEqual([true, true, false]);
  });

  it('max_wait_days since the first shown card unlocks the next row (fallback)', () => {
    const early = curriculumStatus(rows, cards, new Map([prog('a1', 1, 1, daysAgo(20))]), 21, now);
    expect(early[1].unlocked).toBe(false);
    expect(early[1].daysLeft).toBe(1);
    const late = curriculumStatus(rows, cards, new Map([prog('a1', 1, 1, daysAgo(21))]), 21, now);
    expect(late[1].unlocked).toBe(true);
    expect(late[1].daysLeft).toBeNull();
  });

  it('no countdown before any card of the tag was shown, and none without a cap', () => {
    expect(curriculumStatus(rows, cards, new Map(), 21, now)[1].daysLeft).toBeNull();
    const noCap = [row(1, 'a', { max_wait_days: null }), row(2, 'b')];
    const s = curriculumStatus(noCap, cards, new Map([prog('a1', 1, 1, daysAgo(400))]), 21, now);
    expect(s[1].unlocked).toBe(false);
    expect(s[1].daysLeft).toBeNull();
  });

  it('a locked row cannot pass even if its own cards are mature', () => {
    const progress = new Map([prog('b1', 30, 3)]);
    const s = curriculumStatus(rows, cards, progress, 21, now);
    expect(s.map((x) => x.unlocked)).toEqual([true, false, false]);
  });

  it('inactive rows are skipped and do not gate the next row', () => {
    const r = [row(1, 'a', { active: false }), row(2, 'b'), row(3, 'c')];
    const s = curriculumStatus(r, cards, new Map(), 21, now);
    expect(s.map((x) => `${x.tag}:${x.unlocked}`)).toEqual(['b:true', 'c:false']);
  });
});

describe('picking new cards', () => {
  it('a multi-tag card is eligible if ANY of its curriculum tags is unlocked', () => {
    const cards = [card('ab', ['a', 'b']), card('bc', ['b', 'c']), card('x', ['huishouden'])];
    const status = curriculumStatus(rows, cards, new Map(), 21, now); // only a open
    const { eligible } = makePicker(rows, status);
    expect(eligible(cards[0])).toBe(true);
    expect(eligible(cards[1])).toBe(false);
    expect(eligible(cards[2])).toBe(true); // no curriculum tag
  });

  it('fills slots from the highest-priority unlocked tag, then the next, then the general pool', () => {
    const cards = [
      card('g1', [], 'word', '2026-09-01'), // general, oldest
      card('b1', ['b'], 'question', '2026-09-02'),
      card('a1', ['a'], 'question', '2026-09-03'),
      card('a2', ['a'], 'question', '2026-09-04'),
      card('g2', ['huishouden'], 'word', '2026-09-05')
    ];
    const progress = new Map([prog('seen', 30, 3)]);
    const aMature = [row(1, 'a', { unlock_threshold: 0 }), row(2, 'b'), row(3, 'c')]; // a passes → b open
    const status = curriculumStatus(aMature, cards, progress, 21, now);
    const { pickNew } = makePicker(aMature, status);
    expect(pickNew(cards, 3).map((c) => c.id)).toEqual(['a1', 'a2', 'b1']);
    expect(pickNew(cards, 5).map((c) => c.id)).toEqual(['a1', 'a2', 'b1', 'g1', 'g2']);
  });

  it('a card eligible through two unlocked tags is introduced only once', () => {
    const cards = [card('ab', ['a', 'b']), card('a1', ['a']), card('b1', ['b'])];
    const r = [row(1, 'a', { unlock_threshold: 0 }), row(2, 'b')];
    const status = curriculumStatus(r, cards, new Map(), 21, now);
    const picked = makePicker(r, status).pickNew(cards, 10).map((c) => c.id);
    expect(picked).toEqual(['ab', 'a1', 'b1']);
    expect(new Set(picked).size).toBe(picked.length);
  });

  it('plugs into the daily plan: due cards of a locked tag keep coming, new ones do not', () => {
    const cards = [card('b1', ['b']), card('b2', ['b']), card('a1', ['a'])];
    const progress = new Map([prog('b1', 1, 1)]);
    progress.get(progressKey('b1', 'prod'))!.due = daysAgo(1);
    const status = curriculumStatus(rows, cards, progress, 21, now);
    const picker = makePicker(rows, status);
    const plan = planToday(cards, progress, { new_per_day: 5, unlock_prod_stability_days: 3 }, todaysIntro(undefined, now), now, { pickNew: picker.pickNew });
    expect(plan.due.map((i) => i.card.id)).toEqual(['b1']);
    expect(plan.fresh.map((i) => i.card.id)).toEqual(['a1']);
  });
});

describe('open column and curriculum_only', () => {
  const cards = [card('a1', ['a']), card('b1', ['b']), card('c1', ['c']), card('h1', ['huishouden']), card('u1', [])];

  it('"altijd open" opens a row regardless of the chain; "dicht" closes it', () => {
    const r = [row(1, 'a'), row(2, 'b', { open: 'closed' }), row(3, 'c', { open: 'always' })];
    const s = curriculumStatus(r, cards, new Map(), 21, now);
    expect(s.map((x) => `${x.tag}:${x.unlocked}`)).toEqual(['a:true', 'b:false', 'c:true']);
  });

  it('"dicht" on an early row keeps every following automatic row locked', () => {
    const r = [row(1, 'a', { open: 'closed' }), row(2, 'b', { unlock_threshold: 0 }), row(3, 'c')];
    const s = curriculumStatus(r, cards, new Map(), 21, now);
    expect(s.map((x) => x.unlocked)).toEqual([false, false, false]);
    expect(s[1].daysLeft).toBeNull();
  });

  it('curriculum_only: other topics and untagged cards stay locked', () => {
    const r = [row(1, 'a', { unlock_threshold: 0 }), row(2, 'b')];
    const s = curriculumStatus(r, cards, new Map(), 21, now);
    const only = makePicker(r, s, true);
    expect(cards.filter(only.eligible).map((c) => c.id)).toEqual(['a1', 'b1']);
    const free = makePicker(r, s, false);
    expect(cards.filter(free.eligible).map((c) => c.id)).toEqual(['a1', 'b1', 'c1', 'h1', 'u1']);
    expect(isTopicLocked('huishouden', r, s, true)).toBe(true);
    expect(isTopicLocked('huishouden', r, s, false)).toBe(false);
    expect(isTopicLocked('b', r, s, true)).toBe(false);
  });
});

describe('cards reset with /resettag', () => {
  it('a reset card (state New, reps 0) is not "shown" and not mature', () => {
    const cards = [card('a1', ['a'])];
    const reset = new Map([prog('a1', 0, 0, daysAgo(400))]);
    reset.get(progressKey('a1', 'prod'))!.state = 'New';
    const [a] = curriculumStatus([row(1, 'a'), row(2, 'b')], cards, reset, 21, now);
    expect(a.firstShown).toBeNull();
    expect(a.mature).toBe(0);
  });
});
