import { useEffect, useState } from 'preact/hooks';
import { APP_ENV, BUILD_ID } from './config';
import { ping } from './api';
import { useOnline } from './pwa';
import { InstallHint, UpdateBanner } from './components/Banners';

type ServerState = { kind: 'checking' } | { kind: 'ok'; env: string } | { kind: 'error'; msg: string };

export function App() {
  const online = useOnline();
  const [server, setServer] = useState<ServerState>({ kind: 'checking' });

  useEffect(() => {
    if (!online) return;
    setServer({ kind: 'checking' });
    ping()
      .then((r) => setServer({ kind: 'ok', env: r.env }))
      .catch((e) => setServer({ kind: 'error', msg: String(e.message || e) }));
  }, [online]);

  return (
    <div class="app">
      <UpdateBanner />
      <header class="topbar">
        <h1>
          Fanki {APP_ENV === 'DEV' && <span class="env-badge">DEV</span>}
        </h1>
        {!online && <span class="offline-badge">Hors connexion</span>}
      </header>

      <main class="home">
        <InstallHint />

        <section class="stats" aria-label="Aujourd'hui">
          <div class="stat">
            <span class="stat-value">—</span>
            <span class="stat-label">à revoir</span>
          </div>
          <div class="stat">
            <span class="stat-value">—</span>
            <span class="stat-label">nouvelles aujourd'hui</span>
          </div>
        </section>

        <button class="btn btn-primary btn-huge" disabled>
          Commencer
        </button>
        <p class="muted center">Les cartes arrivent à l'étape 2.</p>

        <p class="sync-line">
          {!online
            ? 'Serveur : hors connexion'
            : server.kind === 'checking'
              ? 'Serveur : vérification…'
              : server.kind === 'ok'
                ? `Serveur : connecté (${server.env})`
                : `Serveur : erreur — ${server.msg}`}
        </p>
      </main>

      <footer class="footer muted">
        {APP_ENV} · {BUILD_ID}
      </footer>
    </div>
  );
}
