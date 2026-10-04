import type { Settings } from './types';
import { getMeta, setMeta } from './db';

// Short sessions with one "continue?" offer. There is no cooldown: she may start again right away.
//   - A session starts on "Starten". When session_max_cards reviews OR session_max_minutes of REVIEWING
//     time are reached, she is offered ONE extension ("Nog 10 kaarten, graag!" = session_extra_cards)
//     or "Stoppen".
//   - "Terug" or leaving the app only PAUSES the session (saved in IndexedDB meta.openSession). Home then
//     offers "Doorgaan". A paused session not resumed within session_resume_minutes is dropped without a
//     pause.
//   - The session ENDS on Stoppen, when the extension is done, or when cards run out. It "counts" with
//     >= min_reviews_to_count ratings (then the Android install button may appear).

type Rules = Pick<
  Settings,
  'session_max_cards' | 'session_max_minutes' | 'session_extra_cards' | 'min_reviews_to_count' | 'session_resume_minutes'
>;

export type SessionState = {
  start: number; // ms
  reviewed: number; // distinct cards rated in this session ("X van Y"); repeats of short steps don't count
  ratings?: number; // every rating incl. repeats (for min_reviews_to_count); missing in older saved sessions
  offered: boolean; // the one offer was shown
  extendedAt: number | null; // `reviewed` when she chose to continue
  extraTarget: number | null; // cards in the extension (min(extra, remaining at that moment))
  activeMs: number; // reviewing time before the current stretch
  resumedAt: number | null; // start of the current stretch on the review screen (null = paused)
  lastActivity: number; // ms of the last rating / pause / resume
};

export function startSession(now: number): SessionState {
  return { start: now, reviewed: 0, ratings: 0, offered: false, extendedAt: null, extraTarget: null, activeMs: 0, resumedAt: now, lastActivity: now };
}

/** Reviewing time so far (time spent away from the review screen does not count). */
export function elapsedMs(s: SessionState, now: number): number {
  return s.activeMs + (s.resumedAt !== null ? Math.max(0, now - s.resumedAt) : 0);
}

export function pauseSession(s: SessionState, now: number): SessionState {
  return { ...s, activeMs: elapsedMs(s, now), resumedAt: null, lastActivity: now };
}

export function resumeSession(s: SessionState, now: number): SessionState {
  return { ...s, resumedAt: now, lastActivity: now };
}

/** A paused session she can continue: has reviews and was active within session_resume_minutes. */
export function resumable(s: SessionState | null | undefined, rules: Rules, now: number): SessionState | null {
  if (!s || s.reviewed === 0) return null;
  return now - s.lastActivity <= rules.session_resume_minutes * 60_000 ? s : null;
}

export async function saveOpenSession(s: SessionState | null): Promise<void> {
  await setMeta('openSession', s);
}

export function loadOpenSession(): Promise<SessionState | null | undefined> {
  return getMeta('openSession');
}

/** 'repeat' = the cap is reached but short-step repeats are still pending: show only those first. */
export type Next = 'card' | 'repeat' | 'offer' | 'end';

/**
 * What happens after a rating. `remaining` = cards left in the queue; `learningLeft` = how many of them are
 * repeats of a short (re)learning step started in this session. The session never offers or ends while
 * such repeats are pending — they are finished first, whatever the card count or time.
 */
export function nextStep(s: SessionState, rules: Rules, now: number, remaining: number, learningLeft = 0): Next {
  if (remaining <= 0) return 'end';
  const extended = s.extendedAt !== null;
  const capReached = extended
    ? s.reviewed - s.extendedAt! >= (s.extraTarget ?? 0)
    : s.offered || s.reviewed >= rules.session_max_cards || elapsedMs(s, now) >= rules.session_max_minutes * 60_000;
  if (!capReached) return 'card';
  if (learningLeft > 0) return 'repeat';
  return extended || s.offered ? 'end' : 'offer';
}

export function markOffered(s: SessionState): SessionState {
  return { ...s, offered: true };
}

export function extend(s: SessionState, rules: Rules, remaining: number): SessionState {
  return { ...s, offered: true, extendedAt: s.reviewed, extraTarget: Math.min(rules.session_extra_cards, remaining) };
}

/** One rating. A repeat of a short step (`repeat`) does not count toward "X van Y". */
export function reviewed(s: SessionState, now = Date.now(), repeat = false): SessionState {
  const ratings = (s.ratings ?? s.reviewed) + 1;
  return { ...s, reviewed: repeat ? s.reviewed : s.reviewed + 1, ratings, lastActivity: now };
}

/** "X van Y kaarten": Y = session_max_cards until she extends, then the extended total. */
export function progressLabel(s: SessionState, rules: Rules): { done: number; target: number } {
  const target = s.extendedAt !== null ? s.extendedAt + (s.extraTarget ?? 0) : rules.session_max_cards;
  return { done: s.reviewed, target: Math.max(target, s.reviewed) };
}

/** Ends the session: clears the open session. True when it counted (>= min_reviews_to_count ratings). */
export async function endSession(s: SessionState, rules: Rules): Promise<boolean> {
  await saveOpenSession(null);
  return (s.ratings ?? s.reviewed) >= rules.min_reviews_to_count;
}
