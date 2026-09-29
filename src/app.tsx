import { useEffect, useMemo, useState } from 'preact/hooks';
import { APP_ENV, BUILD_ID } from './config';
import { useOnline } from './pwa';
import { t } from './i18n';
import { getState, loadFromDb, useStore } from './store';
import { schedulePush } from './review';
import { syncNow } from './sync';
import { UpdateBanner } from './components/Banners';
import { HelpButton } from './components/Help';
import { Home } from './screens/Home';
import { Review } from './screens/Review';
import { interleave, planToday, todaysIntro, type Item } from './session';
import { curriculumStatus, makePicker } from './curriculum';
import { Topics } from './screens/Topics';
import type { Card } from './types';
import { resumable, type SessionState } from './sessionRules';

type Screen = { name: 'home' } | { name: 'topics' } | { name: 'review'; items: Item[]; resume: SessionState | null };

export function App() {
  const online = useOnline();
  const s = useStore();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  // Load what's on the phone first (works offline), then refresh from the sheet when online.
  useEffect(() => {
    loadFromDb().then(() => navigator.onLine && syncNow());
  }, []);
  useEffect(() => {
    if (!online || !s.loaded) return;
    if (screen.name === 'home') void syncNow();
    else schedulePush(0); // mid-session: just send the queued reviews
  }, [online]);
  // Coming back to the app (it stays alive in the background on iOS): refresh if the last sync is old.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      const last = getState().lastSync;
      if (!last || Date.now() - Date.parse(last) > 2 * 60_000) void syncNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Recomputed whenever cards/progress change and every minute (learning steps become due).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const plan = useMemo(() => {
    const now = new Date();
    const status = curriculumStatus(s.curriculum, s.cards, s.progress, s.settings.mature_stability_days, now);
    const picker = makePicker(s.curriculum, status);
    const topics = new Set(s.studyTags);
    const eligible = topics.size ? (c: Card) => c.tags.some((tg) => topics.has(tg)) : undefined;
    return planToday(s.cards, s.progress, s.settings, todaysIntro(s.intro), now, { pickNew: picker.pickNew, eligible });
  }, [s.cards, s.progress, s.settings, s.intro, s.curriculum, s.studyTags, tick, screen.name]);

  if (screen.name === 'review') {
    return (
      <div class="app">
        <UpdateBanner />
        <Review items={screen.items} resume={screen.resume} onExit={() => setScreen({ name: 'home' })} />
      </div>
    );
  }

  return (
    <div class="app">
      <UpdateBanner />
      <header class="topbar">
        <h1>
          Fanki {APP_ENV === 'DEV' && <span class="env-badge">DEV</span>}
        </h1>
        <div class="topbar-right">
          {!online && <span class="offline-badge">{t('status.offline')}</span>}
          <HelpButton screen={screen.name === 'topics' ? 'topics' : 'home'} />
        </div>
      </header>
      {screen.name === 'topics' ? (
        <Topics onDone={() => setScreen({ name: 'home' })} />
      ) : (
      <Home onTopics={() => setScreen({ name: 'topics' })} due={plan.due.length} newToday={plan.fresh.length} onStart={() => setScreen({ name: 'review', items: interleave(plan), resume: resumable(s.openSession, s.settings, Date.now()) })} />
      )}
      <footer class="footer muted">
        {APP_ENV} · {BUILD_ID}
      </footer>
    </div>
  );
}
