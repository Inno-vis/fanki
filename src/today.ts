import type { Card, Settings } from './types';
import { progressKey, tracksFor, type Progress } from './scheduler';
import { localDate } from './session';
import type { UserSettings } from './userSettings';

// Today's work is ONE finite queue: due cards (due now or within due_window_minutes, capped at
// max_reviews_per_day) + today's remaining new-card quota. No sessions, no timers. The home screen shows a
// "Vandaag" bar: done_today / (done_today + remaining), counting unique (card, track) items.

/**
 * The ONLY place that decides the daily new-card limit: her own choice (Instellingen, phone only) if set, else
 * the Sheet's Settings.new_per_day. The settings accessor (src/settings.ts) applies it, so code that gets the
 * merged settings (e.g. planToday) receives the effective value.
 */
export function getNewPerDay(settings: Pick<Settings, 'new_per_day'>, user?: Pick<UserSettings, 'newPerDay'> | null): number {
  return user?.newPerDay ?? settings.new_per_day;
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

type Step = Pick<Progress, 'due' | 'last_review'>;

/**
 * The card's own step: from its last rating to its due time. A step SHORTER than due_window_minutes keeps the card in
 * the round; 10 min or more ("Goed" on a new card, "Opnieuw" on a review card) does not. Unknown last rating → no
 * short step.
 */
export function shortStep(p: Step, settings: Pick<Settings, 'due_window_minutes'>): boolean {
  const last = Date.parse(p.last_review || '');
  if (!Number.isFinite(last)) return false;
  return Date.parse(p.due) - last < dueWindowMs(settings);
}

/**
 * THE round rule, used everywhere (round membership in planToday, requeue in afterRating, "done" in leavesWindow,
 * the later-today line), so they can never disagree: a started card is in the round when its due time has PASSED,
 * or when it is in a short step (shorter than due_window_minutes). Membership does not depend on how far away the
 * due time is from "now", so a 10-minute "Goed" never comes back early — not even 1 ms after the rating.
 */
export function inRound(p: Step, now: number, settings: Pick<Settings, 'due_window_minutes'>): boolean {
  return Date.parse(p.due) <= now || shortStep(p, settings);
}

/** A rated item is done (for the bar) when its new step is not short (it leaves the round until it is due). */
export function leavesWindow(next: Step, settings: Pick<Settings, 'due_window_minutes'>): boolean {
  return !shortStep(next, settings);
}

/**
 * The current round: items finished since the round started. A round ends when nothing is left (home shows
 * "Klaar voor nu!"); the next time cards are there, a NEW round starts at 0. A card that arrives while a round is
 * still going joins it (the total grows, the count is kept). Same shape as DoneToday + `finished`.
 */
export type Round = DoneToday & { finished: boolean };

/** Today's round; a round from another day counts as a fresh one. */
export function todaysRound(r: Round | undefined | null, now = new Date()): Round {
  const date = localDate(now);
  return r && r.date === date ? r : { date, items: {}, finished: false };
}

/**
 * The round after looking at what is left now (pure): nothing left → finished; cards again after a finished
 * round → a new round at 0; otherwise unchanged (same object, so callers can see nothing changed).
 */
export function nextRound(r: Round, remaining: number): Round {
  if (remaining === 0) return r.finished ? r : { ...r, finished: true };
  return r.finished ? { date: r.date, items: {}, finished: false } : r;
}

/**
 * The "Vandaag" bar of the CURRENT ROUND. Unique items only: an item finished in this round that is due again
 * counts as remaining, not twice. fill is always 0–1.
 */
export function todayBar(done: DoneToday, remainingKeys: string[]): { done: number; remaining: number; fill: number } {
  const remaining = new Set(remainingKeys);
  const finished = Object.keys(done.items).filter((k) => !remaining.has(k)).length;
  const total = finished + remaining.size;
  return { done: finished, remaining: remaining.size, fill: total ? finished / total : 0 };
}

/** One group of the later-today line: n cards in about `min` minutes or `hour` hours. */
export type LaterGroup = { n: number; min?: number; hour?: number };

/** "± 15 min" below an hour (nearest 5 min), "± 2 uur" from 60 min. */
export function roundLater(minutes: number): { min?: number; hour?: number } {
  const m5 = Math.round(minutes / 5) * 5;
  return m5 >= 60 ? { hour: Math.max(1, Math.round(minutes / 60)) } : { min: Math.max(5, m5) };
}

/** Coming back for one card is pointless: the later-today line names when this many cards are ready. */
export const LATER_BATCH = 5;

/**
 * Cards due later today: started (card, track) items due at or after the due window and before local
 * midnight. The line shows ONE group: when the LATER_BATCH-th (5th) of them is due ("5 over ± 30 min"); with
 * fewer than 5 later today there is no line. `nextAt` = when the first of them enters the due window (joins the
 * round) — home wakes up once at that moment, so Starten comes back. Cards due on later days never count.
 */
export function laterToday(
  cards: Card[],
  progress: Map<string, Progress>,
  settings: Pick<Settings, 'due_window_minutes' | 'unlock_prod_stability_days'>,
  now: Date,
  eligible?: (c: Card) => boolean
): { groups: LaterGroup[]; nextAt: number | null } {
  const t = now.getTime();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const dues: number[] = [];
  for (const card of cards) {
    if (eligible && !eligible(card)) continue;
    for (const track of tracksFor(card, progress.get(progressKey(card.id, 'recog')), settings)) {
      const p = progress.get(progressKey(card.id, track));
      if (!p || (p.state === 'New' && p.reps === 0)) continue;
      const at = Date.parse(p.due);
      // later today = not in the round yet (no short step, not due yet), due before midnight
      if (!inRound(p, t, settings) && at < end.getTime()) dues.push(at);
    }
  }
  dues.sort((a, b) => a - b);
  const groups: LaterGroup[] = dues.length >= LATER_BATCH ? [{ n: LATER_BATCH, ...roundLater((dues[LATER_BATCH - 1] - t) / 60_000) }] : [];
  return { groups, nextAt: dues.length ? dues[0] : null }; // wake up when the first one is really due
}
