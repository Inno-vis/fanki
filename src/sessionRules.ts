import type { Settings } from './types';
import { getMeta, setMeta, type SessionRecord } from './db';

// Short sessions with one "continue?" offer and a cooldown between sessions.
//   - A session starts on "Starten". When session_max_cards reviews OR session_max_minutes are reached,
//     she is offered ONE extension ("Nog 10 kaarten, graag!" = session_extra_cards) or "Stoppen".
//   - After the extension the session ends when those extra cards are done (or cards run out, or Stoppen).
//   - A session with >= min_reviews_to_count reviews stores its end time (IndexedDB meta.lastSession);
//     the home screen then blocks "Starten" until end + cooldown_minutes.

type Rules = Pick<Settings, 'session_max_cards' | 'session_max_minutes' | 'session_extra_cards' | 'cooldown_minutes' | 'min_reviews_to_count'>;

export type SessionState = {
  start: number; // ms
  reviewed: number;
  offered: boolean; // the one offer was shown
  extendedAt: number | null; // `reviewed` when she chose to continue
  extraTarget: number | null; // cards in the extension (min(extra, remaining at that moment))
};

export function startSession(now: number): SessionState {
  return { start: now, reviewed: 0, offered: false, extendedAt: null, extraTarget: null };
}

export type Next = 'card' | 'offer' | 'end';

/** What happens after a rating (or when time runs out between cards). `remaining` = cards left in the queue. */
export function nextStep(s: SessionState, rules: Rules, now: number, remaining: number): Next {
  if (remaining <= 0) return 'end';
  if (s.extendedAt !== null) return s.reviewed - s.extendedAt >= (s.extraTarget ?? 0) ? 'end' : 'card';
  if (s.offered) return 'end'; // offer shown and not accepted → session is over
  const capHit = s.reviewed >= rules.session_max_cards || now - s.start >= rules.session_max_minutes * 60_000;
  return capHit ? 'offer' : 'card';
}

export function markOffered(s: SessionState): SessionState {
  return { ...s, offered: true };
}

export function extend(s: SessionState, rules: Rules, remaining: number): SessionState {
  return { ...s, offered: true, extendedAt: s.reviewed, extraTarget: Math.min(rules.session_extra_cards, remaining) };
}

export function reviewed(s: SessionState): SessionState {
  return { ...s, reviewed: s.reviewed + 1 };
}

/** "X van Y kaarten": Y = session_max_cards until she extends, then the extended total. */
export function progressLabel(s: SessionState, rules: Rules): { done: number; target: number } {
  const target = s.extendedAt !== null ? s.extendedAt + (s.extraTarget ?? 0) : rules.session_max_cards;
  return { done: s.reviewed, target: Math.max(target, s.reviewed) };
}

/** Records the session end if it counted. Safe to call more than once (later calls overwrite). */
export async function endSession(s: SessionState, rules: Rules, now: number): Promise<SessionRecord | null> {
  if (s.reviewed < rules.min_reviews_to_count) return null;
  const rec: SessionRecord = { start: new Date(s.start).toISOString(), end: new Date(now).toISOString(), reviews: s.reviewed };
  await setMeta('lastSession', rec);
  return rec;
}

/** When the cooldown ends (ms), or null when there is none. */
export function cooldownUntil(last: SessionRecord | undefined | null, rules: Rules): number | null {
  if (!last || last.reviews < rules.min_reviews_to_count || rules.cooldown_minutes <= 0) return null;
  return Date.parse(last.end) + rules.cooldown_minutes * 60_000;
}

/** Whole minutes left (rounded up), 0 when she may start. */
export function minutesLeft(until: number | null, now: number): number {
  return until === null || now >= until ? 0 : Math.ceil((until - now) / 60_000);
}

export function loadLastSession(): Promise<SessionRecord | undefined> {
  return getMeta('lastSession');
}
