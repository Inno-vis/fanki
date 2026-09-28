import { useEffect, useMemo, useState } from 'preact/hooks';
import { APP_ENV, BUILD_ID } from './config';
import { useOnline } from './pwa';
import { t } from './i18n';
import { loadFromDb, useStore } from './store';
import { syncNow } from './sync';
import { UpdateBanner } from './components/Banners';
import { HelpButton } from './components/Help';
import { Home } from './screens/Home';
import { Review } from './screens/Review';
import { interleave, planToday, todaysIntro, type Item } from './session';
import { curriculumStatus, makePicker } from './curriculum';

type Screen = { name: 'home' } | { name: 'review'; items: Item[] };

export function App() {
  const online = useOnline();
  const s = useStore();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  // Load what's on the phone first (works offline), then refresh from the sheet when online.
  useEffect(() => {
    loadFromDb().then(() => navigator.onLine && syncNow());
  }, []);
  useEffect(() => {
    if (online && s.loaded && screen.name === 'home') void syncNow();
  }, [online]);

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
    return planToday(s.cards, s.progress, s.settings, todaysIntro(s.intro), now, { pickNew: picker.pickNew });
  }, [s.cards, s.progress, s.settings, s.intro, s.curriculum, tick, screen.name]);

  if (screen.name === 'review') {
    return (
      <div class="app">
        <UpdateBanner />
        <Review items={screen.items} onExit={() => setScreen({ name: 'home' })} />
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
          <HelpButton screen="home" />
        </div>
      </header>
      <Home due={plan.due.length} newToday={plan.fresh.length} onStart={() => setScreen({ name: 'review', items: interleave(plan) })} />
      <footer class="footer muted">
        {APP_ENV} · {BUILD_ID}
      </footer>
    </div>
  );
}
