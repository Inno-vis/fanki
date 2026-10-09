import { useState } from 'preact/hooks';
import { HELP, helpLabel, t, type HelpItem, type HelpPage, type HelpScreen, type HelpSection } from '../i18n';
import { useSettings } from '../settings';
import { helpSeen, isHelpUpdated, markHelpSeen, pageFingerprint } from '../helpSeen';
import { Sheet } from './Sheet';

/** "Hulp" button + sheet with the structured French help for one screen. Hidden when show_french_help is off. */
export function HelpButton({ screen }: { screen: HelpScreen }) {
  const show = useSettings().show_french_help;
  const [open, setOpen] = useState(false);
  const [, rerender] = useState(0);
  if (!show) return null;
  const page = HELP[screen];
  const print = pageFingerprint(page);
  const updated = isHelpUpdated(helpSeen(screen), print);
  const openHelp = () => {
    markHelpSeen(screen, print);
    setOpen(true);
    rerender((n) => n + 1);
  };
  return (
    <>
      <button class={`help-btn${updated ? ' updated' : ''}`} onClick={openHelp} aria-haspopup="dialog">
        <span class="help-icon" aria-hidden="true">
          ?
        </span>
        {t('help.button')}
        {updated && <span class="help-new">{t('help.updated')}</span>}
      </button>
      {open && (
        <Sheet
          title={t('help.title')}
          onClose={() => setOpen(false)}
          footer={
            <button class="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              {t('help.close')}
            </button>
          }
        >
          <HelpContent page={page} screen={screen} />
        </Sheet>
      )}
    </>
  );
}

export function HelpContent({ page, screen }: { page: HelpPage; screen: string }) {
  return (
    <>
      <p class="help-lead" lang="nl">
        {page.nl}
      </p>
      {page.sections.map((s, i) => (
        <HelpBlock key={i} section={s} id={`help-${screen}-${i}`} />
      ))}
      {page.tip && (
        <p class="help-tip" lang="fr">
          <span aria-hidden="true">💡 </span>
          {page.tip}
        </p>
      )}
    </>
  );
}

function Chip({ item }: { item: HelpItem }) {
  const label = helpLabel(item);
  if (!label) return null;
  return (
    <span class={`help-chip${item.rating ? ` help-chip-${item.rating}` : ''}`} lang="nl">
      {label}
    </span>
  );
}

function HelpBlock({ section, id }: { section: HelpSection; id: string }) {
  const body =
    section.kind === 'steps' ? (
      <ol class="help-steps">
        {section.items.map((it, i) => (
          <li key={i}>
            <Chip item={it} />
            {helpLabel(it) && ' '}
            <span lang="fr">{it.fr}</span>
          </li>
        ))}
      </ol>
    ) : section.kind === 'chips' ? (
      <dl class="help-chips">
        {section.items.map((it, i) => (
          <div class="help-chip-pair" key={i}>
            <dt>
              <Chip item={it} />
            </dt>
            <dd lang="fr">{it.fr}</dd>
          </div>
        ))}
      </dl>
    ) : (
      // the icon column only exists when a row in this section has an icon
      <dl class={`help-list${section.items.some((it) => it.icon) ? '' : ' no-icons'}`}>
        {section.items.map((it, i) => (
          <div class="help-row" key={i}>
            <dt>
              {section.items.some((x) => x.icon) && (
                <span class="help-row-icon" aria-hidden="true">
                  {it.icon ?? ''}
                </span>
              )}
              <Chip item={it} />
            </dt>
            <dd lang="fr">{it.fr}</dd>
          </div>
        ))}
      </dl>
    );
  if (section.collapsed) {
    return (
      <details class="help-more">
        <summary lang="fr">{section.title}</summary>
        {body}
      </details>
    );
  }
  return (
    <section class="help-section" aria-labelledby={id}>
      <h3 id={id} lang="fr">
        {section.title}
      </h3>
      {body}
    </section>
  );
}
