import type { Card, CurriculumRow } from './types';
import { progressKey, type Progress, type Track } from './scheduler';

// Curriculum — which new cards may be introduced, and in what order. Configured entirely by the
// Curriculum tab + Settings (no redeploy). apps-script/Curriculum.gs mirrors curriculumStatus() for the
// Dashboard only; keep both in sync with docs/SHEET.md › Curriculum.

const DAY_MS = 86_400_000;

export type TagStatus = {
  order: number;
  tag: string;
  cards: number; // active cards with this tag
  mature: number;
  score: number; // mature / cards (1 when the tag has no cards)
  unlocked: boolean; // new cards with this tag may be introduced
  passes: boolean; // this row lets the next row unlock
  firstShown: string | null; // earliest first_review among its cards
  daysLeft: number | null; // days until THIS row unlocks via the previous row's max_wait_days
};

/** The track that represents "knowing" a card: recog for words, prod for sentences/questions. */
export function primaryTrack(card: Card): Track {
  return card.type === 'word' ? 'recog' : 'prod';
}

export function isMature(p: Progress | undefined, matureDays: number, minReviews: number): boolean {
  return !!p && p.stability >= matureDays && p.reps >= minReviews;
}

/**
 * Walks the active rows in order:
 *  - the first active row is unlocked;
 *  - row N+1 is unlocked when row N is unlocked AND (score(N) >= unlock_threshold OR max_wait_days have
 *    passed since row N's first card was first shown);
 *  - inactive rows are skipped entirely (their tags count as unlocked; they gate nothing).
 */
export function curriculumStatus(
  rows: CurriculumRow[],
  cards: Card[],
  progress: Map<string, Progress>,
  matureDays: number,
  now: Date
): TagStatus[] {
  const out: TagStatus[] = [];
  let prevOpen: boolean = true;
  let countdown: number | null = null;
  for (const row of rows.filter((r) => r.active).sort((a, b) => a.order - b.order)) {
    const tagged = cards.filter((c) => c.tags.includes(row.tag));
    let mature = 0;
    let firstShown: string | null = null;
    for (const c of tagged) {
      const p = progress.get(progressKey(c.id, primaryTrack(c)));
      if (!p) continue;
      if (isMature(p, matureDays, row.min_reviews)) mature++;
      const f = p.first_review || p.last_review;
      if (f && (!firstShown || f < firstShown)) firstShown = f;
    }
    const score = tagged.length ? mature / tagged.length : 1;
    // The `open` column overrides the chain: altijd open / dicht.
    const unlocked: boolean = row.open === 'always' ? true : row.open === 'closed' ? false : prevOpen;
    const waitOver =
      row.max_wait_days !== null && firstShown !== null && now.getTime() - Date.parse(firstShown) >= row.max_wait_days * DAY_MS;
    const passes = score >= row.unlock_threshold || waitOver;
    const daysLeft = unlocked || row.open === 'closed' ? null : countdown;
    out.push({ order: row.order, tag: row.tag, cards: tagged.length, mature, score, unlocked, passes, firstShown, daysLeft });
    countdown =
      unlocked && !passes && row.max_wait_days !== null && firstShown !== null
        ? Math.max(0, Math.ceil(row.max_wait_days - (now.getTime() - Date.parse(firstShown)) / DAY_MS))
        : null;
    prevOpen = unlocked && passes;
  }
  return out;
}

export type Picker = {
  /** May this card be introduced as new? */
  eligible: (card: Card) => boolean;
  /** Chooses up to `slots` new cards from candidates (already in `added` order). */
  pickNew: (candidates: Card[], slots: number) => Card[];
};

/**
 * - curriculumOnly (Settings.curriculum_only, default): a card is eligible only if AT LEAST ONE of its
 *   tags is an open Curriculum topic (inactive rows count as open). Other topics and untagged cards stay
 *   locked.
 * - Otherwise: cards without any curriculum tag are always eligible; a card WITH curriculum tags is
 *   eligible if at least one of them is open.
 * - Slots are filled from the highest-priority unlocked tag first (order ascending), then the next
 *   unlocked tag, then everything else that is eligible, in `added` order. A card is picked at most once.
 */
export function makePicker(rows: CurriculumRow[], status: TagStatus[], curriculumOnly = false): Picker {
  const curriculumTags = new Set(rows.map((r) => r.tag));
  const unlocked = openTags(rows, status);
  const eligible = (card: Card) => {
    if (curriculumOnly) return card.tags.some((t) => unlocked.has(t));
    const ct = card.tags.filter((t) => curriculumTags.has(t));
    return ct.length === 0 || ct.some((t) => unlocked.has(t));
  };
  const pickNew = (candidates: Card[], slots: number) => {
    const picked: Card[] = [];
    const seen = new Set<string>();
    const take = (c: Card) => {
      if (picked.length < slots && !seen.has(c.id) && eligible(c)) {
        seen.add(c.id);
        picked.push(c);
      }
    };
    for (const s of status.filter((x) => x.unlocked)) {
      for (const c of candidates) if (c.tags.includes(s.tag)) take(c);
    }
    for (const c of candidates) take(c);
    return picked;
  };
  return { eligible, pickNew };
}

/** Tags whose new cards may come: open curriculum rows + inactive rows. */
export function openTags(rows: CurriculumRow[], status: TagStatus[]): Set<string> {
  return new Set([...rows.filter((r) => !r.active).map((r) => r.tag), ...status.filter((s) => s.unlocked).map((s) => s.tag)]);
}

/** Is this topic locked for new cards? (for the topic screen) */
export function isTopicLocked(tag: string, rows: CurriculumRow[], status: TagStatus[], curriculumOnly: boolean): boolean {
  const open = openTags(rows, status);
  if (open.has(tag)) return false;
  return curriculumOnly || rows.some((r) => r.tag === tag);
}
