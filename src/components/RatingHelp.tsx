import { useState } from 'preact/hooks';
import { NS } from '../config';
import { RATINGS, t } from '../i18n';
import { useSettings } from '../settings';
import { Sheet } from './Sheet';

const SEEN_KEY = `${NS}:rating-help-seen`;

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * One-time overlay (first review session) explaining the four buttons in French, plus a small "?"
 * that reopens it. This is the only place the button labels are translated. Hidden when
 * Settings.show_french_help is FALSE.
 */
export function RatingHelp() {
  const show = useSettings().show_french_help;
  const [open, setOpen] = useState(() => !seen());
  if (!show) return null;
  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode */
    }
    setOpen(false);
  };
  return (
    <>
      <button class="rating-help-btn" onClick={() => setOpen(true)} aria-label={t('rating.helpReopen')}>
        ?
      </button>
      {open && (
        <Sheet
          title={t('rating.helpTitle')}
          onClose={close}
          footer={
            <button class="btn btn-primary btn-block" onClick={close}>
              {t('rating.helpOk')}
            </button>
          }
        >
          <dl class="help-list">
            {RATINGS.map((r) => (
              <div class="help-row" key={r.key}>
                <dt>
                  <span class="help-row-icon" aria-hidden="true">
                    {r.emoji}
                  </span>
                  <span class={`help-chip help-chip-${r.key}`} lang="nl">
                    {r.nl}
                  </span>
                </dt>
                <dd lang="fr">{r.fr}</dd>
              </div>
            ))}
          </dl>
        </Sheet>
      )}
    </>
  );
}
