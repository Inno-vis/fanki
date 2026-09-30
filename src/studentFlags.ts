// 🚩 Cards the learner marks during review ("Gemarkeerd"). LOCAL ONLY: stored in IndexedDB `flags`,
// never synced; the only way out is her own "Delen" (share sheet) or copy to clipboard.
// Not to be confused with Card.flags (false-friend / separable markers from the sheet).
import { db, type StudentFlag } from './db';
import { uuid } from './review';
import type { Card } from './types';
import { dutchText } from './display';

/** Flags the card now. Every tap is a new entry (a card can be flagged again later). */
export async function createFlag(card_id: string, note = '', now = new Date()): Promise<StudentFlag> {
  const ts = now.toISOString();
  const flag: StudentFlag = { id: uuid(), card_id, ts, note: note.trim(), resolved: false, updated_ts: ts };
  await (await db()).put('flags', flag);
  return flag;
}

async function update(id: string, patch: Partial<Pick<StudentFlag, 'note' | 'resolved'>>, now = new Date()): Promise<StudentFlag | null> {
  const d = await db();
  const tx = d.transaction('flags', 'readwrite');
  const cur = await tx.store.get(id);
  if (!cur) return null;
  const next: StudentFlag = { ...cur, ...patch, updated_ts: now.toISOString() };
  if (typeof next.note === 'string') next.note = next.note.trim();
  await tx.store.put(next);
  await tx.done;
  return next;
}

export function setFlagNote(id: string, note: string, now?: Date) {
  return update(id, { note }, now);
}

export function setFlagResolved(id: string, resolved: boolean, now?: Date) {
  return update(id, { resolved }, now);
}

/** All flags, newest first. */
export async function listFlags(): Promise<StudentFlag[]> {
  const all = await (await db()).getAll('flags');
  return all.sort((a, b) => b.ts.localeCompare(a.ts));
}

export function splitFlags(flags: StudentFlag[]): { open: StudentFlag[]; resolved: StudentFlag[] } {
  return { open: flags.filter((f) => !f.resolved), resolved: flags.filter((f) => f.resolved) };
}

function localDay(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** How the card is named in the list and the shared text: "het huis (la maison)". */
export function flagCardLabel(card: Card | undefined, card_id: string): string {
  if (!card) return card_id;
  const nl = dutchText(card);
  const back = card.type === 'oneway' ? card.answer : card.fr;
  return back ? `${nl} (${back})` : nl;
}

/** Plain text for "Delen": a title, then one line per open flag: date · word · note. */
export function exportText(flags: StudentFlag[], cards: Map<string, Card>, title: string): string {
  const lines = flags
    .filter((f) => !f.resolved)
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .map((f) => [localDay(f.ts), flagCardLabel(cards.get(f.card_id), f.card_id), f.note].filter(Boolean).join(' · '));
  return [title, ...lines].join('\n');
}
