import { NS } from './config';
import type { HelpPage } from './i18n';

// "Hulp is new": remember a fingerprint of each screen's help text when she opens it. When a new version
// changes that text, the Hulp button shows "nieuw" until she opens it again. Screens she never opened are
// not flagged (everything would look new on a first install).

export function fingerprint(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/** Fingerprint of a structured help page: its sections and tip (the Dutch one-liner does not count). */
export function pageFingerprint(page: HelpPage): string {
  return fingerprint(JSON.stringify(page.sections) + (page.tip ?? ''));
}

/** Updated = she has seen an earlier version of this help (fingerprint) and it changed since. */
export function isHelpUpdated(seen: string | null, print: string): boolean {
  return seen !== null && seen !== print;
}

const key = (screen: string) => `${NS}:help-seen:${screen}`;

export function helpSeen(screen: string): string | null {
  try {
    return localStorage.getItem(key(screen));
  } catch {
    return null;
  }
}

export function markHelpSeen(screen: string, print: string) {
  try {
    localStorage.setItem(key(screen), print);
  } catch {
    /* private mode */
  }
}
