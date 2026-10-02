import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { curriculumStatus } from './curriculum';
import { progressKey, type Progress } from './scheduler';
import type { Card, CurriculumRow } from './types';

// The Dashboard's curriculum block (apps-script/Curriculum.gs) must give the same unlock results as the
// app (src/curriculum.ts). Load the real Apps Script code and compare on many random situations.

const gs = ['Util.gs', 'Curriculum.gs'].map((f) => readFileSync(join(__dirname, '..', 'apps-script', f), 'utf8')).join('\n');
// eslint-disable-next-line no-new-func
const server = new Function(`${gs}; return { curriculumStatus_: curriculumStatus_ };`)() as {
  curriculumStatus_: (rows: unknown[], cards: unknown[], byKey: Record<string, unknown>, matureDays: number, now: Date) => {
    tag: string; cards: number; mature: number; score: number; unlocked: boolean; passes: boolean; daysLeft: number | '';
  }[];
};

const DAY = 86_400_000;
const now = new Date('2026-10-20T12:00:00Z');

function rng(seed: number) {
  return () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
}

function scenario(seed: number) {
  const r = rng(seed);
  const tags = ['a', 'b', 'c', 'd'];
  const rows: CurriculumRow[] = tags.map((tag, i) => ({
    order: i + 1,
    tag,
    unlock_threshold: [0, 0.5, 0.8, 1][Math.floor(r() * 4)],
    min_reviews: Math.floor(r() * 4),
    max_wait_days: r() < 0.3 ? null : Math.floor(r() * 30),
    active: r() > 0.15,
    open: (['auto', 'auto', 'auto', 'always', 'closed'] as const)[Math.floor(r() * 5)]
  }));
  const cards: Card[] = [];
  const progress = new Map<string, Progress>();
  for (let i = 0; i < 25; i++) {
    const id = `c${i}`;
    const type = r() < 0.6 ? 'word' : 'oneway';
    const cardTags = tags.filter(() => r() < 0.35);
    cards.push({ id, type, tags: cardTags } as Card);
    if (r() < 0.7) {
      const track = type === 'word' ? 'recog' : 'prod';
      const first = new Date(now.getTime() - Math.floor(r() * 40) * DAY).toISOString();
      const reps = Math.floor(r() * 6);
      progress.set(progressKey(id, track), {
        key: progressKey(id, track), card_id: id, track, state: reps ? 'Review' : 'New', due: first,
        stability: Math.floor(r() * 50), difficulty: 5, reps, lapses: 0, last_review: first, learning_steps: 0,
        scheduled_days: 1, first_review: r() < 0.8 ? first : undefined
      });
    }
  }
  return { rows, cards, progress };
}

describe('Dashboard curriculum (Curriculum.gs) = app curriculum (curriculum.ts)', () => {
  it('same unlocked / passes / score / mature / days left on 300 random situations', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { rows, cards, progress } = scenario(seed);
      const app = curriculumStatus(rows, cards, progress, 21, now);
      const byKey: Record<string, unknown> = {};
      progress.forEach((p, k) => (byKey[k] = p));
      const dash = server.curriculumStatus_(rows, cards, byKey, 21, now);
      expect(dash.map((d) => d.tag), `seed ${seed}`).toEqual(app.map((a) => a.tag));
      dash.forEach((d, i) => {
        const a = app[i];
        expect({ unlocked: d.unlocked, passes: d.passes, mature: d.mature, cards: d.cards, score: d.score, daysLeft: d.daysLeft === '' ? null : d.daysLeft }, `seed ${seed} ${d.tag}`)
          .toEqual({ unlocked: a.unlocked, passes: a.passes, mature: a.mature, cards: a.cards, score: a.score, daysLeft: a.daysLeft });
      });
    }
  });
});
