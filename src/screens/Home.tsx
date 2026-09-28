import { t } from '../i18n';
import { timeAgo } from '../format';
import { useStore } from '../store';
import { syncNow } from '../sync';
import { useOnline } from '../pwa';
import { InstallHint } from '../components/Banners';

export function Home({ due, newToday, onStart }: { due: number; newToday: number; onStart: () => void }) {
  const s = useStore();
  const online = useOnline();
  const empty = s.loaded && s.cards.length === 0;
  const canStart = due + newToday > 0;

  return (
    <main class="home">
      <InstallHint />

      {empty ? (
        <p class="empty">{online ? t('home.empty') : t('home.emptyOffline')}</p>
      ) : (
        <>
          <section class="stats">
            <div class="stat">
              <span class="stat-value">{s.loaded ? due : '—'}</span>
              <span class="stat-label">{t('home.due')}</span>
            </div>
            <div class="stat">
              <span class="stat-value">{s.loaded ? newToday : '—'}</span>
              <span class="stat-label">{t('home.newToday')}</span>
            </div>
          </section>
          {s.loaded && !canStart && <p class="center done-line">{t('home.allDone')}</p>}
          <button class="btn btn-primary btn-huge" disabled={!canStart} onClick={onStart}>
            {t('home.start')}
          </button>
        </>
      )}

      <div class="sync-box">
        <p class="sync-line">
          {s.sync === 'syncing'
            ? t('sync.running')
            : s.sync === 'error'
              ? t('sync.error')
              : s.lastSync
                ? t('sync.last', { ago: timeAgo(new Date(s.lastSync)) })
                : t('sync.never')}
          {s.cards.length > 0 && <span class="muted"> · {t('home.cards', { n: s.cards.length })}</span>}
        </p>
        <button class="btn btn-secondary" disabled={!online || s.sync === 'syncing'} onClick={() => void syncNow()}>
          {t('sync.button')}
        </button>
      </div>
    </main>
  );
}
