import { useEffect, useState } from 'preact/hooks';
import { allCards, getMeta, getSettings } from './db';
import { DEFAULT_SETTINGS, type Card, type Settings, type Tag } from './types';

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
};

let state: State = {
  loaded: false,
  cards: [],
  settings: DEFAULT_SETTINGS,
  tags: [],
  compliments: [],
  lastSync: null,
  sync: 'idle'
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
  const [cards, settings, tags, compliments, lastSync] = await Promise.all([
    allCards(),
    getSettings(),
    getMeta('tags'),
    getMeta('compliments'),
    getMeta('lastSync')
  ]);
  setState({
    loaded: true,
    cards: cards.sort(byAdded),
    settings,
    tags: tags ?? [],
    compliments: compliments ?? [],
    lastSync: lastSync ?? null
  });
}
