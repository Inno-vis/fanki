import type { Card, Settings } from './types';
import { progressKey, tracksFor, type Progress, type Track } from './scheduler';
import { dueWindowMs, getNewPerDay } from './today';

export type Mode = 'nl_fr' | 'fr_nl' | 'cloze' | 'question' | 'oneway' | 'listen';

/** learning = in a short (re)learning step (Learning/Relearning, or put back in today's run). */
export type Item = { card: Card; track: Track; progress?: Progress; isNew: boolean; learning?: boolean; listen?: boolean };

/** New cards introduced on one local day (so the daily cap survives closing the app). */
export type Intro = { date: string; main: string[]; prod: string[] };

export function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todaysIntro(intro: Intro | undefined, now = new Date()): Intro {
  const date = localDate(now);
  return intro && intro.date === date ? intro : { date, main: [], prod: [] };
}

export function modeFor(card: Card, track: Track, listen = false): Mode {
  if (listen && card.type === 'word' && track === 'recog') return 'listen';
  if (card.type === 'sentence') return 'cloze';
  if (card.type === 'question') return 'question';
  if (card.type === 'oneway') return 'oneway';
  return track === 'recog' ? 'nl_fr' : 'fr_nl';
}

export type Plan = { due: Item[]; fresh: Item[] };

/**
 * Today's work (one finite queue, no sessions).
 *  - due:   every (card, track) already started that is due now or within due_window_minutes, oldest first,
 *           capped at max_reviews_per_day minus the due reviews finished today (`dueDone`). The overflow
 *           simply stays due and rolls to tomorrow (silent).
 *  - fresh: new items up to today's remaining quota (getNewPerDay), in `added` order (cards must already be
 *           sorted by added). "main" = a card's first track (word→recog, sentence/question→prod). A word's
 *           prod track, once unlocked, is capped separately by the same number so it never crowds out
 *           brand-new words.
 * `eligible` narrows cards (tag filter). `pickNew` lets the curriculum reorder/choose new cards.
 */
export function planToday(
  cards: Card[],
  progress: Map<string, Progress>,
  settings: Pick<Settings, 'new_per_day' | 'unlock_prod_stability_days' | 'due_window_minutes' | 'max_reviews_per_day'>,
  intro: Intro,
  now: Date,
  opts: { eligible?: (c: Card) => boolean; pickNew?: (candidates: Card[], slots: number) => Card[]; dueDone?: number } = {}
): Plan {
  const due: Item[] = [];
  const newMain: Card[] = [];
  const newProd: Item[] = [];
  const until = now.getTime() + dueWindowMs(settings);

  for (const card of cards) {
    if (opts.eligible && !opts.eligible(card)) continue;
    const recog = progress.get(progressKey(card.id, 'recog'));
    const tracks = tracksFor(card, recog, settings);
    const started = tracks.some((tr) => isStarted(progress.get(progressKey(card.id, tr))));
    for (const track of tracks) {
      const p = progress.get(progressKey(card.id, track));
      if (isStarted(p)) {
        if (new Date(p!.due).getTime() <= until) {
          const learning = p!.state === 'Learning' || p!.state === 'Relearning';
          due.push({ card, track, progress: p, isNew: false, ...(learning ? { learning } : {}) });
        }
      } else if (track === tracks[0] && !started) {
        newMain.push(card);
      } else if (card.type === 'word' && track === 'prod') {
        newProd.push({ card, track, isNew: true });
      }
    }
  }

  due.sort((a, b) => a.progress!.due.localeCompare(b.progress!.due));
  due.splice(Math.max(0, settings.max_reviews_per_day - (opts.dueDone ?? 0)));
  const perDay = getNewPerDay(settings);
  const mainSlots = Math.max(0, perDay - intro.main.length);
  const prodSlots = Math.max(0, perDay - intro.prod.length);
  const picked = opts.pickNew ? opts.pickNew(newMain, mainSlots) : newMain.slice(0, mainSlots);
  const fresh: Item[] = [
    ...picked.slice(0, mainSlots).map((card) => ({ card, track: (card.type === 'word' ? 'recog' : 'prod') as Track, isNew: true })),
    ...newProd.slice(0, prodSlots)
  ];
  return { due, fresh };
}

function isStarted(p: Progress | undefined): boolean {
  return !!p && (p.state !== 'New' || p.reps > 0);
}

/** Today's order: due items first, with one new item after every 3 due items, then the remaining new. */
export function interleave(plan: Plan): Item[] {
  const out: Item[] = [];
  const fresh = [...plan.fresh];
  plan.due.forEach((item, i) => {
    out.push(item);
    if ((i + 1) % 3 === 0 && fresh.length) out.push(fresh.shift()!);
  });
  return out.concat(fresh);
}

/** A (re)learning step shorter than this comes back in today's run. */
export const REQUEUE_WITHIN_MS = 20 * 60_000;

/**
 * Which queue item to show next. A NEW card waits while `maxBacklog` or more cards are still in their
 * short learning steps (so new cards arrive once the earlier ones stick); the first non-new item is
 * shown instead. If only new cards are left, the first one is shown.
 */
export function pickNextIndex(queue: Item[], maxBacklog: number): number {
  const backlog = queue.filter((i) => i.learning).length;
  if (backlog < maxBacklog) return 0;
  const i = queue.findIndex((x) => !x.isNew);
  return i === -1 ? 0 : i;
}
