import type { Card, Settings } from './types';
import { progressKey, tracksFor, type Progress } from './scheduler';
import { localDate } from './session';

// Today's work is ONE finite queue: due cards (due now or within due_window_minutes, capped at
// max_reviews_per_day) + today's remaining new-card quota. No sessions, no timers. The home screen shows a
// "Vandaag" bar: done_today / (done_today + remaining), counting unique (card, track) items.

/** The ONLY place that reads the daily new-card limit (a later settings page plugs in here). */
export function getNewPerDay(settings: Pick<Settings, 'new_per_day'>): number {
  return settings.new_per_day;
}

export function dueWindowMs(settings: Pick<Settings, 'due_window_minutes'>): number {
  return Math.max(0, settings.due_window_minutes) * 60_000;
}

/** Items finished today (they left the due window), keyed by `card|track`; 'new' = introduced today. */
export type DoneToday = { date: string; items: Record<string, 'due' | 'new'> };

/** Today's record; a record from another day counts as empty (resets at local midnight). */
export function todaysDone(done: DoneToday | undefined | null, now = new Date()): DoneToday {
  const date = localDate(now);
  return done && done.date === date ? done : { date, items: {} };
}

/** Due reviews finished today (for the silent max_reviews_per_day cap). */
export function dueDoneCount(done: DoneToday): number {
  return Object.values(done.items).filter((k) => k === 'due').length;
}

/** A rated item is done when its next due time is past the due window. */
export function leavesWindow(nextDue: string, now: Date, settings: Pick<Settings, 'due_window_minutes'>): boolean {
  return Date.parse(nextDue) > now.getTime() + dueWindowMs(settings);
}

/**
 * The "Vandaag" bar. Unique items only: an item finished today that is due again (a longer learning step)
 * counts as remaining, not twice. fill is always 0–1.
 */
export function todayBar(done: DoneToday, remainingKeys: string[]): { done: number; remaining: number; fill: number } {
  const remaining = new Set(remainingKeys);
  const finished = Object.keys(done.items).filter((k) => !remaining.has(k)).length;
  const total = finished + remaining.size;
  return { done: finished, remaining: remaining.size, fill: total ? finished / total : 0 };
}

/**
 * Minutes until the next card in a learning step becomes due later today (outside the due window),
 * or null when there is none today. Static: computed when home opens or the app regains focus.
 */
export function nextLaterTodayMin(
  cards: Card[],
  progress: Map<string, Progress>,
  settings: Pick<Settings, 'due_window_minutes' | 'unlock_prod_stability_days'>,
  now: Date
): number | null {
  const t = now.getTime();
  const from = t + dueWindowMs(settings);
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  let next: number | null = null;
  for (const card of cards) {
    for (const track of tracksFor(card, progress.get(progressKey(card.id, 'recog')), settings)) {
      const p = progress.get(progressKey(card.id, track));
      if (!p || (p.state !== 'Learning' && p.state !== 'Relearning')) continue;
      const at = Date.parse(p.due);
      if (at > from && at < end.getTime() && (next === null || at < next)) next = at;
    }
  }
  return next === null ? null : Math.max(1, Math.round((next - t) / 60_000));
}
