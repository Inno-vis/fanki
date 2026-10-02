import type { Settings } from './types';
import type { Progress } from './scheduler';
import { pickNextIndex, REQUEUE_WITHIN_MS, type Item } from './session';
import { nextStep, reviewed, type Next, type SessionState } from './sessionRules';

type Rules = Parameters<typeof nextStep>[1] & Pick<Settings, 'max_learning_backlog'>;

/**
 * The queue after rating `queue[0]` (pure; used by the review screen and the tests):
 *  - a short (re)learning step (≤ 20 min) puts the card back 3 places later, marked `learning`;
 *  - rating such a repeat does not count toward "X van Y kaarten";
 *  - when the cap (cards / minutes / extension) is reached but repeats are pending → step 'repeat' and the
 *    next card shown is the first repeat: the session ends or offers only once no repeats are left;
 *  - otherwise new cards wait behind short-step repeats (max_learning_backlog), as before.
 */
export function afterRating(
  queue: Item[],
  intervalMs: number,
  next: Progress,
  session: SessionState,
  rules: Rules,
  now: number
): { queue: Item[]; session: SessionState; step: Next } {
  const item = queue[0];
  const rest = queue.slice(1);
  if (intervalMs <= REQUEUE_WITHIN_MS) {
    rest.splice(Math.min(3, rest.length), 0, { ...item, isNew: false, learning: true, progress: next });
  }
  const st = reviewed(session, now, !!item.learning);
  const learningLeft = rest.filter((i) => i.learning).length;
  const step = nextStep(st, rules, now, rest.length, learningLeft);
  const k = step === 'repeat' ? rest.findIndex((i) => i.learning) : step === 'card' ? pickNextIndex(rest, rules.max_learning_backlog) : 0;
  if (k > 0) rest.unshift(...rest.splice(k, 1));
  return { queue: rest, session: st, step };
}
