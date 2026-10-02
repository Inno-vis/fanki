import { useEffect, useState } from 'preact/hooks';
import { allCards, allProgress, getMeta, getSettings, pendingCount, type SessionRecord } from './db';
import { DEFAULT_SETTINGS, type Card, type CurriculumRow, type Settings, type Tag } from './types';
import type { Progress } from './scheduler';
import type { SessionState } from './sessionRules';
import { todaysIntro, type Intro } from './session';

// App-wide state loaded from IndexedDB. Components subscribe with useStore().
export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error';

export type State = {
  loaded: boolean;
  cards: Card[];
  settings: Settings;
  tags: Tag[];
  compliments: string[];
  lastSync: string | null;
  sync: SyncStatus;
  progress: Map<string, Progress>;
  intro: Intro;
  pending: number; // reviews not yet sent
  curriculum: CurriculumRow[];
  lastSession: SessionRecord | null;
  breaks: string[];
  studyTags: string[];
  openSession: SessionState | null;
  dayCounts: Record<string, number>; // reviews per local day (Voortgang)
  flagsOpen: number; // cards with an open 🚩 (a card marked 3× counts once)
  flagsTotal: number; // cards ever marked
  flaggedCards: string[]; // ids of cards with an open 🚩 (lit 🚩 in review)
};

let state: State = {
  loaded: false,
  cards: [],
  settings: DEFAULT_SETTINGS,
  tags: [],
  compliments: [],
  lastSync: null,
  sync: 'idle',
  progress: new Map(),
  intro: todaysIntro(undefined),
  pending: 0,
  curriculum: [],
  lastSession: null,
  breaks: [],
  studyTags: [],
  openSession: null,
  dayCounts: {},
  flagsOpen: 0,
  flagsTotal: 0,
  flaggedCards: []
};
const listeners = new Set<(s: State) => void>();

export function getState(): State {
  return state;
}

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function useStore(): State {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    return () => void listeners.delete(setS);
  }, []);
  return s;
}

/** Sort key for introducing new cards: `added`, then sheet order. */
export function byAdded(a: Card & { order?: number }, b: Card & { order?: number }): number {
  return a.added.localeCompare(b.added) || (a.order ?? 0) - (b.order ?? 0);
}

export async function loadFromDb(): Promise<void> {
  const [cards, settings, tags, compliments, lastSync, progress, intro, pending, curriculum, lastSession, breaks, studyTags, openSession, dayCounts] = await Promise.all([
    allCards(),
    getSettings(),
    getMeta('tags'),
    getMeta('compliments'),
    getMeta('lastSync'),
    allProgress(),
    getMeta('intro'),
    pendingCount(),
    getMeta('curriculum'),
    getMeta('lastSession'),
    getMeta('breaks'),
    getMeta('studyTags'),
    getMeta('openSession'),
    getMeta('dayCounts')
  ]);
  setState({
    loaded: true,
    cards: cards.sort(byAdded),
    settings,
    tags: tags ?? [],
    compliments: compliments ?? [],
    lastSync: lastSync ?? null,
    progress,
    intro: todaysIntro(intro),
    pending,
    curriculum: curriculum ?? [],
    lastSession: lastSession ?? null,
    breaks: breaks ?? [],
    studyTags: studyTags ?? [],
    openSession: openSession ?? null,
    dayCounts: dayCounts ?? {}
  });
  await refreshFlagCount();
}

/** Recounts the 🚩 student flags (home badge). */
export async function refreshFlagCount(): Promise<void> {
  const { listFlags, openFlagCards } = await import('./studentFlags');
  const all = await listFlags();
  const open = openFlagCards(all);
  setState({ flagsTotal: new Set(all.map((f) => f.card_id)).size, flagsOpen: open.size, flaggedCards: [...open] });
}
