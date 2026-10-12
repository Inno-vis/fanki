import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Grade } from 'ts-fsrs';
import { t } from '../i18n';
import { CardFace } from '../components/CardFace';
import { RatingBar } from '../components/RatingBar';
import { RatingHelp } from '../components/RatingHelp';
import { HelpButton } from '../components/Help';
import { makeScheduler, previewOutcomes, type Outcome } from '../scheduler';
import { modeFor, pickNextIndex, type Item } from '../session';
import { afterRating, appendDue } from '../sessionFlow';
import { subjectFor } from '../display';
import { FlagButton } from '../components/FlagButton';
import { DeleteButton } from '../components/DeleteButton';
import { markEngaged } from '../installPrompt';
import { rate } from '../review';
import { useStore } from '../store';
import { useSettings } from '../settings';
import { useOnline } from '../pwa';

/** Ratings in one visit after which the Android install button may appear. */
const ENGAGED_AFTER = 3;

/**
 * Today's run: one card at a time, nothing else on screen (no counter, no timer). Every rating is saved at
 * once, so "Terug" (or closing the app) may stop at any moment; home shows what is left. When the queue is
 * empty she goes back home ("Klaar voor vandaag!" or what is left).
 */
/** `due` = today's due items as planned right now (cards that became due while she reviews join at the end). */
export function Review({ items, due = [], onExit }: { items: Item[]; due?: Item[]; onExit: () => void }) {
  const s = useStore();
  const settings = useSettings();
  const online = useOnline();
  // The first card follows the same rule as every next one (a card in a short step not before its time).
  const [queue, setQueue] = useState<Item[]>(() => {
    const q = [...items];
    const k = pickNextIndex(q, settings.max_learning_backlog);
    if (k > 0) q.unshift(...q.splice(k, 1));
    return q;
  });
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const rated = useRef(0);
  const retries = useRef<Record<string, number>>({}); // lapse retries per card+track in this run
  const shownAt = useRef(Date.now());
  const sched = useMemo(() => makeScheduler(settings), [settings.desired_retention]);

  const exit = () => {
    if (rated.current >= ENGAGED_AFTER) markEngaged(); // Android: the install button may appear from now on
    onExit();
  };
  useEffect(() => {
    if (!queue.length) exit();
  }, [queue.length]);
  // After each rating the plan is recomputed: cards whose due time has passed meanwhile join at the END.
  useEffect(() => {
    if (queue.length) setQueue((q) => appendDue(q, due));
  }, [due]);

  const item = queue[0];
  // Computed once per reveal: the intervals on the buttons are exactly what gets applied.
  const outcomes = useMemo<Record<Grade, Outcome> | null>(
    () =>
      item && revealed
        ? previewOutcomes(sched, item.card.id, item.track, s.progress.get(`${item.card.id}|${item.track}`), new Date(), {
            easyFirstDays: settings.easy_first_interval_days
          })
        : null,
    [item, revealed]
  );

  /** 🗑️ The card left this phone: drop all its tracks from the run and show the next card. */
  const removeCard = (cardId: string) => {
    setRevealed(false);
    shownAt.current = Date.now();
    setQueue((q) => {
      const rest = q.filter((i) => i.card.id !== cardId);
      const k = pickNextIndex(rest, settings.max_learning_backlog);
      if (k > 0) rest.unshift(...rest.splice(k, 1));
      return rest;
    });
  };

  const onRate = async (g: Grade) => {
    if (!outcomes || busy) return;
    setBusy(true);
    const outcome = outcomes[g];
    await rate(item, outcome, shownAt.current);
    rated.current++;
    setQueue(afterRating(queue, outcome.next, settings, Date.now(), { grade: g, retries: retries.current }));
    setRevealed(false);
    setBusy(false);
    shownAt.current = Date.now();
  };

  return (
    <>
      <header class="topbar">
        <button class="btn-back" onClick={exit}>
          ‹ {t('review.back')}
        </button>
        <div class="topbar-right">
          {!online && <span class="offline-badge">{t('status.offline')}</span>}
          <HelpButton screen="review" />
        </div>
      </header>

      {item && (
        <main class="review">
          {subjectFor(item.card, s.tags) && <p class="card-subject">{subjectFor(item.card, s.tags)}</p>}
          <div class="card-wrap">
            <CardFace card={item.card} mode={modeFor(item.card, item.track, item.listen)} revealed={revealed} readAnswer={settings.readAnswer} />
            <FlagButton key={item.card.id} cardId={item.card.id} />
            {revealed && <DeleteButton key={`d-${item.card.id}`} cardId={item.card.id} onDeleted={removeCard} />}
          </div>
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
      )}
    </>
  );
}
