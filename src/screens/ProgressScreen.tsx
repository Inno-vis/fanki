import { useMemo } from 'preact/hooks';
import { t } from '../i18n';
import { useStore } from '../store';
import { overview } from '../stats';

const DAY_NAMES = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

/** "Voortgang": what she has learned, this week's reviews, streak, what is coming. */
export function ProgressScreen({ onDone }: { onDone: () => void }) {
  const s = useStore();
  const o = useMemo(
    () => overview(s.cards, s.progress, s.dayCounts, s.settings.mature_stability_days, new Date()),
    [s.cards, s.progress, s.dayCounts, s.settings.mature_stability_days]
  );
  const max = Math.max(1, ...o.last7.map((d) => d.n));
  const tile = (value: number | string, label: string) => (
    <div class="stat">
      <span class="stat-value">{value}</span>
      <span class="stat-label">{label}</span>
    </div>
  );
  return (
    <main class="topics">
      <h2 class="screen-title">{t('progress.title')}</h2>
      <section class="stats">
        {tile(o.learned, t('progress.learned', { n: o.total }))}
        {tile(o.known, t('progress.known'))}
        {tile(o.week, t('progress.week'))}
        {tile(o.streak, t('progress.streak'))}
      </section>
      <div class="week-chart" role="img" aria-label={t('progress.chart')}>
        {o.last7.map((d) => (
          <div class="week-col" key={d.date}>
            <span class="week-n">{d.n || ''}</span>
            <div class="week-bar" style={{ height: `${Math.round((d.n / max) * 100)}%` }} />
            <span class="week-day">{DAY_NAMES[new Date(d.date + 'T12:00:00').getDay()]}</span>
          </div>
        ))}
      </div>
      <section class="stats stats-3">
        {tile(o.dueToday, t('progress.dueToday'))}
        {tile(o.dueTomorrow, t('progress.dueTomorrow'))}
        {tile(o.due7, t('progress.due7'))}
      </section>
      <button class="btn btn-primary btn-huge topics-done" onClick={onDone}>
        {t('tags.done')}
      </button>
    </main>
  );
}
