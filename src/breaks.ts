import { NS } from './config';

const LAST_KEY = `${NS}:last-break`;

/** Random line, never the same as the previous one (when there is a choice). */
export function pickBreak(lines: string[], last: string | null, rnd: () => number = Math.random): string | null {
  if (!lines.length) return null;
  const pool = lines.length > 1 ? lines.filter((l) => l !== last) : lines;
  return pool[Math.floor(rnd() * pool.length)] ?? pool[0];
}

/** Picks and remembers the line for this pause. */
export function nextBreak(lines: string[]): string | null {
  let last: string | null = null;
  try {
    last = localStorage.getItem(LAST_KEY);
  } catch {
    /* private mode */
  }
  const line = pickBreak(lines, last);
  try {
    if (line) localStorage.setItem(LAST_KEY, line);
  } catch {
    /* private mode */
  }
  return line;
}
