import { useState } from 'preact/hooks';
import { isIosSafari, isStandalone, useNeedRefresh } from '../pwa';
import { NS } from '../config';

export function UpdateBanner() {
  const [need, reload] = useNeedRefresh();
  if (!need) return null;
  return (
    <div class="banner banner-update" role="status">
      <span>Nouvelle version disponible</span>
      <button class="btn btn-small" onClick={reload}>
        Mettre à jour
      </button>
    </div>
  );
}

const HINT_KEY = `${NS}:install-hint-dismissed`;

export function InstallHint() {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HINT_KEY) === '1';
    } catch {
      return false;
    }
  });
  if (hidden || isStandalone() || !isIosSafari()) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* private mode */
    }
    setHidden(true);
  };
  return (
    <div class="banner banner-install" role="note">
      <p>
        Pour l'utiliser hors connexion : touche <ShareIcon /> <strong>Partager</strong>, puis{' '}
        <strong>« Sur l'écran d'accueil »</strong>.
      </p>
      <button class="btn-link" onClick={dismiss} aria-label="Fermer">
        ✕
      </button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg class="inline-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 3v12M7 8l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  );
}
