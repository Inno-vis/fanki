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
import type { Card } from './types';

type Screen = { name: 'home' } | { name: 'review'; cards: Card[] };

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

  // Stage 2: no scheduling yet — everything is "new"; today's set = first new_per_day cards by `added`.
  const newToday = useMemo(() => s.cards.slice(0, s.settings.new_per_day), [s.cards, s.settings.new_per_day]);

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
        <Home due={0} newToday={newToday.length} onStart={() => setScreen({ name: 'review', cards: newToday })} />
      ) : (
        <Review cards={screen.cards} onExit={() => setScreen({ name: 'home' })} />
      )}

      {screen.name === 'home' && (
        <footer class="footer muted">
          {APP_ENV} · {BUILD_ID}
        </footer>
      )}
    </div>
  );
}
