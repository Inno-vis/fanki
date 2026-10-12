import type { Settings } from './types';
import type { Progress } from './scheduler';
import { pickNextIndex, type Item } from './session';
import { inDueWindow } from './today';

type Rules = Pick<Settings, 'max_learning_backlog' | 'due_window_minutes' | 'lapse_queue_threshold' | 'lapse_requeue_min' | 'lapse_requeue_max' | 'lapse_max_retries'>;

/**
 * Lapse retry in a LONG run (only above `lapse_queue_threshold`): what the review screen knows about the rating.
 * `retries` counts the retries per card+track in this run (the caller keeps it for the whole run; afterRating adds 1
 * when it requeues a card). `random` is injectable for the tests.
 */
export type LapseContext = { grade: number; retries: Record<string, number>; random?: () => number };

const key = (i: Item) => `${i.card.id}|${i.track}`;

/**
 * The queue after rating `queue[0]` (pure apart from `lapse.retries`; used by the review screen and the tests):
 *  - LONG run: a card that was NOT new, rated ❌ Opnieuw (grade 1), while more than `lapse_queue_threshold` due
 *    cards remain in this run, comes back `lapse_requeue_min`..`lapse_requeue_max` cards later (random; after the
 *    last card when fewer remain — never next), at most `lapse_max_retries` times per card per run. It may come
 *    before its FSRS due time (an early review; FSRS itself is unchanged). After that it follows its due time.
 *  - otherwise the card goes back into this run ONLY if its next step is inside the due window (strictly less than
 *    due_window_minutes — the same rule as the round itself, `inDueWindow`), marked `learning`, 3 places later;
 *    "Goed" (10 min) and "Makkelijk" leave the run and come back via the later-today line;
 *  - the next card: `pickNextIndex` (not before its due time while others are ready; backlog rule for new cards).
 */
export function afterRating(queue: Item[], next: Progress, rules: Rules, now = Date.now(), lapse?: LapseContext): Item[] {
  const item = queue[0];
  const rest = queue.slice(1);
  const dueLeft = rest.filter((i) => !i.isNew).length;
  const k = key(item);
  const retry =
    !!lapse && lapse.grade === 1 && !item.isNew && rest.length > 0 && dueLeft > rules.lapse_queue_threshold &&
    (lapse.retries[k] ?? 0) < rules.lapse_max_retries;
  if (retry) {
    const lo = Math.max(1, Math.min(rules.lapse_requeue_min, rules.lapse_requeue_max));
    const hi = Math.max(lo, rules.lapse_requeue_max);
    const offset = lo + Math.floor((lapse!.random ?? Math.random)() * (hi - lo + 1));
    lapse!.retries[k] = (lapse!.retries[k] ?? 0) + 1;
    // offset 5 = 5 cards come first; fewer left → after the last card (never next: rest is not empty)
    rest.splice(Math.min(offset, rest.length), 0, { ...item, isNew: false, learning: false, retry: true, progress: next });
  } else if (inDueWindow(next.due, now, rules)) {
    rest.splice(Math.min(3, rest.length), 0, { ...item, isNew: false, learning: true, progress: next });
  }
  const n = pickNextIndex(rest, rules.max_learning_backlog, now);
  if (n > 0) rest.unshift(...rest.splice(n, 1));
  return rest;
}

/**
 * Cards whose due time has passed while the student reviews: appended to the END of the running queue (never before
 * the current card), each card+track once. `due` = today's due items (same rules as the round: topics, daily cap).
 */
export function appendDue(queue: Item[], due: Item[], now = Date.now()): Item[] {
  const inQueue = new Set(queue.map(key));
  const join = due.filter((i) => !inQueue.has(key(i)) && !!i.progress && Date.parse(i.progress.due) <= now);
  return join.length ? [...queue, ...join] : queue;
}
