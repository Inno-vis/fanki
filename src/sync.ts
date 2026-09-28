import { apiGet } from './api';
import { saveSnapshot } from './db';
import { setUiSettings } from './prefs';
import { getState, loadFromDb, setState } from './store';
import { DEFAULT_SETTINGS, type Card, type CardsResponse, type Settings } from './types';

const TYPES = new Set(['word', 'sentence', 'question']);

/** Defensive copy of a card from the API (the sheet is hand-edited). */
export function cleanCard(raw: Partial<Card>, order: number): (Card & { order: number }) | null {
  if (!raw || !raw.id || !raw.nl) return null;
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean) : []);
  return {
    id: String(raw.id),
    type: (TYPES.has(String(raw.type)) ? raw.type : 'word') as Card['type'],
    nl: String(raw.nl).trim(),
    article: raw.article === 'de' || raw.article === 'het' ? raw.article : '',
    pos: String(raw.pos ?? ''),
    fr: String(raw.fr ?? '').trim(),
    example_nl: String(raw.example_nl ?? ''),
    example_fr: String(raw.example_fr ?? ''),
    tags: list(raw.tags).map((t) => t.toLowerCase()),
    tags_source: String(raw.tags_source ?? ''),
    flags: list(raw.flags).map((f) => f.toLowerCase()),
    added: String(raw.added ?? ''),
    active: raw.active !== false,
    order
  };
}

export function cleanSettings(raw: Partial<Settings> | undefined): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  const num = (v: unknown, d: number, lo: number, hi: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
  };
  return {
    new_per_day: Math.round(num(s.new_per_day, 8, 0, 100)),
    desired_retention: num(s.desired_retention, 0.9, 0.7, 0.97),
    compliments_enabled: s.compliments_enabled !== false,
    unlock_prod_stability_days: num(s.unlock_prod_stability_days, 3, 0, 365),
    show_french_help: s.show_french_help !== false
  };
}

let running: Promise<boolean> | null = null;

/** Downloads cards + settings + tags + compliments. Returns true on success. Never throws. */
export function syncNow(): Promise<boolean> {
  if (running) return running;
  running = (async () => {
    if (!navigator.onLine) return false;
    setState({ sync: 'syncing' });
    try {
      const res = await apiGet<CardsResponse>('cards');
      const cards = res.cards.map(cleanCard).filter((c): c is Card & { order: number } => !!c && c.active);
      const settings = cleanSettings(res.settings);
      const lastSync = new Date().toISOString();
      await saveSnapshot(cards, {
        settings,
        tags: (res.tags ?? []).filter((t) => t && t.tag),
        compliments: (res.compliments ?? []).filter(Boolean),
        lastSync
      });
      setUiSettings({ show_french_help: settings.show_french_help, compliments_enabled: settings.compliments_enabled });
      await loadFromDb();
      setState({ sync: 'ok' });
      return true;
    } catch (e) {
      console.warn('sync failed', e);
      setState({ sync: 'error' });
      return false;
    } finally {
      running = null;
    }
  })();
  return running;
}

export function isSyncing(): boolean {
  return getState().sync === 'syncing';
}
