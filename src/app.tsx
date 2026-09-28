import { useEffect, useState } from 'preact/hooks';
import { APP_ENV, BUILD_ID } from './config';
import { ping } from './api';
import { useOnline } from './pwa';
import { t } from './i18n';
import { InstallHint, UpdateBanner } from './components/Banners';
import { HelpButton } from './components/Help';

type ServerState = 'checking' | 'ok' | 'error';

export function App() {
  const online = useOnline();
  const [server, setServer] = useState<ServerState>('checking');

  useEffect(() => {
    if (!online) return;
    setServer('checking');
    ping()
      .then(() => setServer('ok'))
      .catch(() => setServer('error'));
  }, [online]);

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

      <main class="home">
        <InstallHint />

        <section class="stats">
          <div class="stat">
            <span class="stat-value">—</span>
            <span class="stat-label">{t('home.due')}</span>
          </div>
          <div class="stat">
            <span class="stat-value">—</span>
            <span class="stat-label">{t('home.newToday')}</span>
          </div>
        </section>

        <button class="btn btn-primary btn-huge" disabled>
          {t('home.start')}
        </button>
        <p class="muted center">{t('home.comingSoon')}</p>

        <p class="sync-line">
          {!online ? t('status.offline') : server === 'checking' ? t('server.checking') : server === 'ok' ? t('server.ok') : t('server.error')}
        </p>
      </main>

      <footer class="footer muted">
        {APP_ENV} · {BUILD_ID}
      </footer>
    </div>
  );
}
