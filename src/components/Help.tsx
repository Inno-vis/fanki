import { useState } from 'preact/hooks';
import { HELP, t, type HelpScreen } from '../i18n';
import { useShowFrenchHelp } from '../prefs';

/** "Hulp" button + panel with the French instructions for one screen. Hidden when show_french_help is off. */
export function HelpButton({ screen }: { screen: HelpScreen }) {
  const show = useShowFrenchHelp();
  const [open, setOpen] = useState(false);
  if (!show) return null;
  return (
    <>
      <button class="help-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span class="help-icon" aria-hidden="true">
          ?
        </span>
        {t('help.button')}
      </button>
      {open && (
        <div class="sheet-backdrop" onClick={() => setOpen(false)}>
          <div class="sheet" role="dialog" aria-modal="true" aria-label={t('help.title')} onClick={(e) => e.stopPropagation()}>
            <h2>{t('help.title')}</h2>
            <p lang="fr">{HELP[screen].fr}</p>
            <button class="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              {t('help.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
