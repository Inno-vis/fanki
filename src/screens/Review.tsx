import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Grade } from 'ts-fsrs';
import { t } from '../i18n';
import { CardFace } from '../components/CardFace';
import { RatingBar } from '../components/RatingBar';
import { RatingHelp } from '../components/RatingHelp';
import { HelpButton } from '../components/Help';
import { makeScheduler, previewOutcomes, type Outcome } from '../scheduler';
import { modeFor, type Item } from '../session';
import { afterRating } from '../sessionFlow';
import { subjectFor } from '../display';
import { FlagButton } from '../components/FlagButton';
import { markEngaged } from '../installPrompt';
import { rate } from '../review';
import { setState, useStore } from '../store';
import { useOnline } from '../pwa';
import {
  endSession, extend, markOffered, pauseSession, progressLabel, resumeSession, saveOpenSession, startSession, type SessionState
} from '../sessionRules';

type Phase = 'card' | 'offer' | 'done';

export function Review({ items, resume, onExit }: { items: Item[]; resume?: SessionState | null; onExit: () => void }) {
  const s = useStore();
  const online = useOnline();
  const [queue, setQueue] = useState<Item[]>(items);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  // A resumed session that was paused on the offer screen shows the offer again.
  const [phase, setPhase] = useState<Phase>(() =>
    !items.length ? 'done' : resume && resume.offered && resume.extendedAt === null ? 'offer' : 'card'
  );
  const [session, setSessionState] = useState<SessionState>(() => (resume ? resumeSession(resume, Date.now()) : startSession(Date.now())));
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const ended = useRef(false);
  /** Every change is saved, so "Doorgaan" works even after the app was closed. */
  const setSession = (st: SessionState) => {
    setSessionState(st);
    sessionRef.current = st;
    if (!ended.current) void saveOpenSession(st.reviewed > 0 ? st : null);
  };
  const shownAt = useRef(Date.now());
  const sched = useMemo(() => makeScheduler(s.settings), [s.settings.desired_retention]);

  /** Ends the session (no cooldown: she may start again right away). */
  const finish = async (st: SessionState): Promise<void> => {
    ended.current = true;
    const counted = await endSession(st, s.settings);
    setState({ openSession: null });
    if (counted) markEngaged(); // Android: the install button may appear from now on
  };

  /** "Terug" / leaving the app: pause, keep it for "Doorgaan". */
  const pause = async () => {
    if (ended.current) return;
    const st = pauseSession(sessionRef.current, Date.now());
    sessionRef.current = st;
    const open = st.reviewed > 0 ? st : null;
    await saveOpenSession(open);
    setState({ openSession: open });
  };

  // Leaving the app (home button, app switcher) pauses; coming back resumes. Away time doesn't count.
  useEffect(() => {
    const onVis = () => {
      if (ended.current) return;
      if (document.visibilityState === 'hidden') void pause();
      else setSession(resumeSession(sessionRef.current, Date.now()));
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  /** "‹ Terug": back to home, session stays open. */
  const back = async () => {
    if (phase === 'done') return onExit();
    await pause();
    onExit();
  };

  /** "Stoppen": the session is over → back to home. */
  const stop = async () => {
    if (phase !== 'done') await finish(sessionRef.current);
    onExit();
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
    const r = afterRating(queue, outcome.intervalMs, outcome.next, session, s.settings, Date.now());
    const rest = r.queue;
    const st = r.session;
    const step = r.step;
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
      await finish(st);
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
          <button class="btn-back" onClick={back}>
            ‹ {t('review.back')}
          </button>
        )}
        <div class="topbar-right">
          {!online && <span class="offline-badge">{t('status.offline')}</span>}
          <HelpButton screen="review" />
        </div>
      </header>

      <div class="session-progress" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={done}>
        <div class="session-bar">
          <div class="session-fill" style={{ width: `${Math.min(100, (done / Math.max(1, target)) * 100)}%` }} />
        </div>
        <p class="review-progress muted">{t('review.progress', { done, target })}</p>
      </div>

      {phase === 'done' || !item ? (
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
          {subjectFor(item.card, s.tags) && <p class="card-subject">{subjectFor(item.card, s.tags)}</p>}
          <div class="card-wrap">
            <CardFace card={item.card} mode={modeFor(item.card, item.track, item.listen)} revealed={revealed} />
            <FlagButton key={item.card.id} cardId={item.card.id} />
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
