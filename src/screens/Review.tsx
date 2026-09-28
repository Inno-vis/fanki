import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Grade } from 'ts-fsrs';
import { t } from '../i18n';
import { CardFace } from '../components/CardFace';
import { RatingBar } from '../components/RatingBar';
import { RatingHelp } from '../components/RatingHelp';
import { HelpButton } from '../components/Help';
import { makeScheduler, previewOutcomes, type Outcome } from '../scheduler';
import { modeFor, pickNextIndex, REQUEUE_WITHIN_MS, type Item } from '../session';
import { nextBreak } from '../breaks';
import { rate } from '../review';
import { setState, useStore } from '../store';
import { useOnline } from '../pwa';
import { endSession, extend, markOffered, nextStep, progressLabel, reviewed, startSession, type SessionState } from '../sessionRules';

type Phase = 'card' | 'offer' | 'done' | 'break';

export function Review({ items, onExit }: { items: Item[]; onExit: () => void }) {
  const s = useStore();
  const online = useOnline();
  const [queue, setQueue] = useState<Item[]>(items);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>(items.length ? 'card' : 'done');
  const [session, setSession] = useState<SessionState>(() => startSession(Date.now()));
  const [breakLine, setBreakLine] = useState<string | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const shownAt = useRef(Date.now());
  const sched = useMemo(() => makeScheduler(s.settings), [s.settings.desired_retention]);

  /** Ends the session; returns true when a pause starts (the session counted). */
  const finish = async (st: SessionState): Promise<boolean> => {
    const rec = await endSession(st, s.settings, Date.now());
    if (rec) setState({ lastSession: rec });
    return !!rec && s.settings.cooldown_minutes > 0;
  };

  /** One-time off-screen prompt when a pause starts (skipped if the Breaks tab is empty). */
  const showBreak = (): boolean => {
    const line = nextBreak(s.breaks);
    if (!line) return false;
    setBreakLine(line);
    setPhase('break');
    return true;
  };

  // Leaving the app mid-session (home button, force-quit) counts as the end of the session.
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && void finish(sessionRef.current);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const stop = async () => {
    if (phase === 'break' || phase === 'done') return onExit();
    const paused = await finish(sessionRef.current);
    if (!(paused && showBreak())) onExit();
  };

  const item = queue[0];
  // Computed once per reveal: the intervals on the buttons are exactly what gets applied.
  const outcomes = useMemo<Record<Grade, Outcome> | null>(
    () => (item && revealed ? previewOutcomes(sched, item.card.id, item.track, s.progress.get(`${item.card.id}|${item.track}`), new Date()) : null),
    [item, revealed]
  );

  const onRate = async (g: Grade) => {
    if (!outcomes || busy) return;
    setBusy(true);
    const outcome = outcomes[g];
    await rate(item, outcome, shownAt.current);
    const rest = queue.slice(1);
    // Short (re)learning steps come back later in this same session.
    if (outcome.intervalMs <= REQUEUE_WITHIN_MS) {
      rest.splice(Math.min(3, rest.length), 0, { ...item, isNew: false, learning: true, progress: outcome.next });
    }
    // New cards wait while too many cards are still in their short steps.
    const k = pickNextIndex(rest, s.settings.max_learning_backlog);
    if (k > 0) rest.unshift(...rest.splice(k, 1));
    const st = reviewed(session);
    const step = nextStep(st, s.settings, Date.now(), rest.length);
    setQueue(rest);
    setRevealed(false);
    setBusy(false);
    shownAt.current = Date.now();
    if (step === 'offer') {
      setSession(markOffered(st));
      setPhase('offer');
    } else if (step === 'end') {
      setSession(st);
      setPhase('done');
      if (await finish(st)) showBreak();
    } else {
      setSession(st);
    }
  };

  const more = () => {
    setSession(extend(session, s.settings, queue.length));
    setPhase('card');
    shownAt.current = Date.now();
  };

  const { done, target } = progressLabel(session, s.settings);
  const extended = session.extendedAt !== null;

  return (
    <>
      <header class="topbar">
        {extended ? (
          <button class="btn-stop" onClick={stop}>
            {t('session.stop')}
          </button>
        ) : (
          <button class="btn-back" onClick={stop}>
            ‹ {t('review.back')}
          </button>
        )}
        <div class="topbar-right">
          {!online && <span class="offline-badge">{t('status.offline')}</span>}
          <HelpButton screen={phase === 'break' ? 'break' : 'review'} />
        </div>
      </header>

      <div class="session-progress" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={done}>
        <div class="session-bar">
          <div class="session-fill" style={{ width: `${Math.min(100, (done / Math.max(1, target)) * 100)}%` }} />
        </div>
        <p class="review-progress muted">{t('review.progress', { done, target })}</p>
      </div>

      {phase === 'break' ? (
        <main class="review review-done">
          <p class="done-big">{t('break.title')}</p>
          <p class="break-line" lang="nl">
            {breakLine}
          </p>
          <button class="btn btn-primary btn-huge" onClick={onExit}>
            {t('break.ok')}
          </button>
        </main>
      ) : phase === 'done' || !item ? (
        <main class="review review-done">
          <p class="done-big">{t('review.done')}</p>
          {done > 0 && <p class="center muted">{t('review.count', { n: done })}</p>}
          <button class="btn btn-primary btn-huge" onClick={onExit}>
            {t('review.back')}
          </button>
        </main>
      ) : phase === 'offer' ? (
        <main class="review review-done">
          <p class="done-big">{t('session.offer')}</p>
          <div class="offer-actions">
            <button class="btn btn-primary btn-huge" onClick={more}>
              {t('session.more', { n: Math.min(s.settings.session_extra_cards, queue.length) })}
            </button>
            <button class="btn btn-secondary btn-huge" onClick={stop}>
              {t('session.stop')}
            </button>
          </div>
        </main>
      ) : (
        <main class="review">
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
      )}
    </>
  );
}
