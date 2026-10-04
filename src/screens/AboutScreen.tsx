import { t } from '../i18n';

const OPENMOJI = 'https://openmoji.org/';
const CC_BY_SA = 'https://creativecommons.org/licenses/by-sa/4.0/';

/** "Over SpeesRep": what the app is, privacy, and the image credits (OpenMoji, CC BY-SA 4.0). */
export function AboutScreen({ onDone }: { onDone: () => void }) {
  const link = (href: string, text: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  );
  // "… gemaakt door OpenMoji, …": the name links to the project.
  const [before, after] = t('about.images').split('OpenMoji');
  return (
    <main class="topics about">
      <h2 class="screen-title">{t('about.title')}</h2>
      <p>{t('about.intro')}</p>
      <p>{t('about.privacy')}</p>
      <h3 class="setting-head">{t('about.imagesTitle')}</h3>
      <p>
        {before}
        {link(OPENMOJI, 'OpenMoji')}
        {after}
      </p>
      <p>{link(CC_BY_SA, t('about.license'))}</p>
      <p class="muted" lang="en">
        {t('about.imagesEn')}
      </p>
      <button class="btn btn-primary btn-huge topics-done" onClick={onDone}>
        {t('tags.done')}
      </button>
    </main>
  );
}
