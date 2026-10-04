import type { Settings } from './types';
import type { Progress } from './scheduler';
import { pickNextIndex, REQUEUE_WITHIN_MS, type Item } from './session';

/**
 * The queue after rating `queue[0]` (pure; used by the review screen and the tests):
 *  - a short (re)learning step (≤ 20 min) puts the card back 3 places later, marked `learning`, so it comes
 *    back in today's run;
 *  - new cards wait behind short-step repeats (max_learning_backlog).
 * There is no session cap: the run ends when the queue is empty or she taps "Terug".
 */
export function afterRating(queue: Item[], intervalMs: number, next: Progress, rules: Pick<Settings, 'max_learning_backlog'>): Item[] {
  const item = queue[0];
  const rest = queue.slice(1);
  if (intervalMs <= REQUEUE_WITHIN_MS) {
    rest.splice(Math.min(3, rest.length), 0, { ...item, isNew: false, learning: true, progress: next });
  }
  const k = pickNextIndex(rest, rules.max_learning_backlog);
  if (k > 0) rest.unshift(...rest.splice(k, 1));
  return rest;
}
