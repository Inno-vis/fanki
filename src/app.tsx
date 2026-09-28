import { useEffect, useMemo, useState } from 'preact/hooks';
import { APP_ENV, BUILD_ID } from './config';
import { useOnline } from './pwa';
import { t, type HelpScreen } from './i18n';
import { loadFromDb, useStore } from './store';
import { syncNow } from './sync';
import { UpdateBanner } from './components/Banners';
import { HelpButton } from './components/Help';
import { Home } from './screens/Home';
import { Review } from './screens/Review';
import { interleave, planToday, todaysIntro, type Item } from './session';

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
  const plan = useMemo(
    () => planToday(s.cards, s.progress, s.settings, todaysIntro(s.intro), new Date()),
    [s.cards, s.progress, s.settings, s.intro, tick, screen.name]
  );

  const helpScreen: HelpScreen = screen.name === 'review' ? 'review' : 'home';

  return (
    <div class="app">
      <UpdateBanner />
      <header class="topbar">
        {screen.name === 'home' ? (
          <h1>
            Fanki {APP_ENV === 'DEV' && <span class="env-badge">DEV</span>}
          </h1>
        ) : (
          <button class="btn-back" onClick={() => setScreen({ name: 'home' })}>
            ‹ {t('review.back')}
          </button>
        )}
        <div class="topbar-right">
          {!online && <span class="offline-badge">{t('status.offline')}</span>}
          <HelpButton screen={helpScreen} />
        </div>
      </header>

      {screen.name === 'home' ? (
        <Home due={plan.due.length} newToday={plan.fresh.length} onStart={() => setScreen({ name: 'review', items: interleave(plan) })} />
      ) : (
        <Review items={screen.items} onExit={() => setScreen({ name: 'home' })} />
      )}

      {screen.name === 'home' && (
        <footer class="footer muted">
          {APP_ENV} · {BUILD_ID}
        </footer>
      )}
    </div>
  );
}
