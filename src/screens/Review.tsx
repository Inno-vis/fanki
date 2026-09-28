import { useMemo, useRef, useState } from 'preact/hooks';
import type { Grade } from 'ts-fsrs';
import { t } from '../i18n';
import { CardFace } from '../components/CardFace';
import { RatingBar } from '../components/RatingBar';
import { RatingHelp } from '../components/RatingHelp';
import { makeScheduler, previewOutcomes, type Outcome } from '../scheduler';
import { modeFor, REQUEUE_WITHIN_MS, type Item } from '../session';
import { rate } from '../review';
import { useStore } from '../store';

export function Review({ items, onExit }: { items: Item[]; onExit: () => void }) {
  const s = useStore();
  const [queue, setQueue] = useState<Item[]>(items);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const shownAt = useRef(Date.now());
  const sched = useMemo(() => makeScheduler(s.settings), [s.settings.desired_retention]);

  const item = queue[0];
  // Computed once per reveal: the intervals on the buttons are exactly what gets applied.
  const outcomes = useMemo<Record<Grade, Outcome> | null>(
    () => (item && revealed ? previewOutcomes(sched, item.card.id, item.track, s.progress.get(`${item.card.id}|${item.track}`), new Date()) : null),
    [item, revealed]
  );

  if (!item) {
    return (
      <main class="review review-done">
        <p class="done-big">{t('review.done')}</p>
        {done > 0 && <p class="center muted">{t('review.count', { n: done })}</p>}
        <button class="btn btn-primary btn-huge" onClick={onExit}>
          {t('review.back')}
        </button>
      </main>
    );
  }

  const onRate = async (g: Grade) => {
    if (!outcomes || busy) return;
    setBusy(true);
    const outcome = outcomes[g];
    await rate(item, outcome, shownAt.current);
    const rest = queue.slice(1);
    // Short (re)learning steps come back later in this same session.
    if (outcome.intervalMs <= REQUEUE_WITHIN_MS) {
      const again: Item = { ...item, isNew: false, progress: outcome.next };
      rest.splice(Math.min(3, rest.length), 0, again);
    }
    setQueue(rest);
    setDone(done + 1);
    setRevealed(false);
    setBusy(false);
    shownAt.current = Date.now();
  };

  return (
    <main class="review">
      <p class="review-progress muted">{t('review.left', { n: queue.length })}</p>
      <CardFace card={item.card} mode={modeFor(item.card, item.track)} revealed={revealed} />
      <div class="review-actions">
        {revealed && outcomes ? (
          <div class="rating-row">
            <RatingBar outcomes={outcomes} onRate={onRate} disabled={busy} />
            <RatingHelp />
          </div>
        ) : (
          <button class="btn btn-primary btn-huge" onClick={() => setRevealed(true)}>
            {t('review.show')}
          </button>
        )}
      </div>
    </main>
  );
}
