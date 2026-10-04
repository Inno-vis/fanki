import { t } from '../i18n';
import { timeAgo } from '../format';
import { useStore } from '../store';
import { syncNow } from '../sync';
import { useOnline } from '../pwa';
import { InstallHint } from '../components/Banners';
import { useEffect, useState } from 'preact/hooks';
import { progressLabel, resumable } from '../sessionRules';
import { useInstallPrompt } from '../installPrompt';
import { isStandalone } from '../pwa';

export function Home({ due, newToday, onStart, onTopics }: { due: number; newToday: number; onStart: () => void; onTopics: () => void }) {
  const s = useStore();
  const online = useOnline();
  const empty = s.loaded && s.cards.length === 0;
  const canStart = due + newToday > 0;
  // Re-render every 15 s, so a paused session that expired no longer offers "Doorgaan".
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  const install = useInstallPrompt(isStandalone());
  const open = resumable(s.openSession, s.settings, now);

  return (
    <main class="home">
      <InstallHint />
      {install.show && (
        <button class="btn btn-secondary install-btn" onClick={() => void install.install()}>
          ⬇ {t('install.android')}
        </button>
      )}

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
          <button class="btn btn-secondary topic-btn" onClick={onTopics}>
            {s.studyTags.length === 0
              ? t('home.topicAll')
              : t('home.topic', {
                  list: s.studyTags.map((tg) => s.tags.find((x) => x.tag === tg)?.label_nl || tg).join(', ')
                })}
          </button>
          <button class="btn btn-primary btn-huge" disabled={!canStart} onClick={onStart}>
            {open && canStart ? t('home.resume', progressLabel(open, s.settings)) : t('home.start')}
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
        {s.pending > 0 && <p class="sync-line">{t('sync.pending', { n: s.pending })}</p>}
        <button class="btn btn-secondary" disabled={!online || s.sync === 'syncing'} onClick={() => void syncNow()}>
          {t('sync.button')}
        </button>
      </div>
    </main>
  );
}
