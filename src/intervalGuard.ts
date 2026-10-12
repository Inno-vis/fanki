import type { Grade } from 'ts-fsrs';
import { formatInterval } from './format';
import { INTERVAL_UNITS } from './i18n';
import type { Outcome } from './scheduler';

// Rating buttons: Opnieuw < Moeilijk < Goed < Makkelijk, STRICTLY, for the stored due times and for the labels.
// Post-processing only: FSRS parameters, steps and fuzz are untouched. (docs/SHEET.md › Rating buttons)

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** The ladder a button is pushed up on: 1 min … 3 d, whole days to 100 d, then weeks, months, years. */
export const LADDER_MS: number[] = (() => {
  const l = [1 * MIN, 5 * MIN, 10 * MIN, 30 * MIN, 1 * HOUR, 6 * HOUR, 1 * DAY, 2 * DAY, 3 * DAY];
  for (let d = 4; d <= 100; d++) l.push(d * DAY);
  for (let w = 15; w <= 25; w++) l.push(w * 7 * DAY);
  for (let m = 6; m <= 11; m++) l.push(Math.round(m * 30.44) * DAY);
  for (let y = 1; y <= 100; y++) l.push(Math.round(y * 365.25) * DAY);
  return l;
})();

/** The first rung strictly above `ms`. */
export function nextRung(ms: number): number {
  return LADDER_MS.find((r) => r > ms) ?? ms + 365 * DAY;
}

/**
 * Due times strictly increasing from Opnieuw to Makkelijk: a button whose due time is equal to or earlier than the
 * one below it moves to the next rung above that one (lowest first, so a push can cascade; never moves down).
 * Mutates and returns `out`.
 */
export function enforceOrder(out: Record<Grade, Outcome>, now: Date): Record<Grade, Outcome> {
  for (const g of [2, 3, 4] as Grade[]) {
    const below = out[(g - 1) as Grade];
    const o = out[g];
    if (Date.parse(o.next.due) > Date.parse(below.next.due)) continue;
    const ms = nextRung(below.intervalMs);
    o.intervalMs = ms;
    o.next = { ...o.next, due: new Date(now.getTime() + ms).toISOString() };
    if (o.next.state === 'Review') o.next.scheduled_days = Math.max(1, Math.round(ms / DAY));
  }
  return out;
}

/** Labels at increasing precision; level 0 = the normal button label. */
function label(ms: number, level: number): string {
  if (level === 0) return formatInterval(ms);
  const u = INTERVAL_UNITS;
  const days = ms / DAY;
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR), m = Math.round((ms % HOUR) / MIN);
    if (level === 1 || h === 0) return h ? `${h} ${u.hour}${m ? ` ${m} ${u.minute}` : ''}` : `${Math.max(1, Math.round(ms / MIN))} ${u.minute}`;
    return `${h} ${u.hour} ${m} ${u.minute}`;
  }
  if (level === 1) return days <= 100 ? `${Math.round(days)} ${u.day}` : `${Math.round(days / 7)} ${u.week}`;
  if (level === 2) return `${Math.round(days)} ${u.day}`;
  const d = Math.floor(days), h = Math.round((ms - d * DAY) / HOUR);
  if (level === 3) return `${d} ${u.day} ${h} ${u.hour}`;
  const hh = Math.floor((ms - d * DAY) / HOUR), mm = Math.round((ms - d * DAY - hh * HOUR) / MIN);
  return `${d} ${u.day} ${hh} ${u.hour} ${mm} ${u.minute}`;
}

/**
 * The four button labels, all different: a pair that would look the same gets finer labels (days up to ~100 d,
 * then weeks; hours and minutes only when still needed). Due times are NOT changed here.
 */
export function ratingLabels(out: Record<Grade, Outcome>): Record<Grade, string> {
  const grades = [1, 2, 3, 4] as Grade[];
  const level: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const text = () => Object.fromEntries(grades.map((g) => [g, label(out[g].intervalMs, level[g])])) as Record<Grade, string>;
  for (let round = 0; round < 12; round++) {
    const l = text();
    let changed = false;
    for (let i = 1; i < 4; i++) {
      const a = grades[i - 1], b = grades[i];
      if (l[a] === l[b] && out[a].intervalMs !== out[b].intervalMs) {
        const lv = Math.min(4, Math.max(level[a], level[b]) + 1);
        if (lv !== level[a] || lv !== level[b]) changed = true;
        level[a] = level[b] = lv;
      }
    }
    if (!changed) break;
  }
  return text();
}
