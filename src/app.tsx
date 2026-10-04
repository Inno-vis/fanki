import { useEffect, useMemo, useState } from 'preact/hooks';
import { APP_ENV, BUILD_ID } from './config';
import { useOnline } from './pwa';
import { t } from './i18n';
import { getState, loadFromDb, useStore } from './store';
import { schedulePush } from './review';
import { syncNow } from './sync';
import { UpdateBanner } from './components/Banners';
import { HelpButton } from './components/Help';
import { Home } from './screens/Home';
import { Review } from './screens/Review';
import { interleave, planToday, todaysIntro, type Item } from './session';
import { dueDoneCount, nextLaterTodayMin, todayBar, todaysDone } from './today';
import { curriculumStatus, makePicker } from './curriculum';
import { Topics } from './screens/Topics';
import { Marked } from './screens/Marked';
import { ProgressScreen } from './screens/ProgressScreen';
import { Toast, showToast } from './components/Toast';
import { setDbBlockedHandler } from './db';
import { Menu } from './components/Menu';
import type { Card } from './types';
import { isListeningReview, voicesReady } from './tts';

type Screen = { name: 'home' } | { name: 'topics' } | { name: 'marked' } | { name: 'progress' } | { name: 'review'; items: Item[] };

export function App() {
  const online = useOnline();
  const s = useStore();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [hasVoice, setHasVoice] = useState(false);
  useEffect(() => {
    voicesReady().then((v) => setHasVoice(!!v));
  }, []);
  /** Today's run; with a Dutch voice, some word-recognition reviews become listening cards. */
  const todayItems = () =>
    interleave(plan).map((i) => ({
      ...i,
      listen: hasVoice && i.track === 'recog' && isListeningReview(i.card, i.progress?.reps ?? 0, s.settings.listen_share)
    }));

  // Load what's on the phone first (works offline), then refresh from the sheet when online.
  useEffect(() => {
    setDbBlockedHandler(() => showToast(t('db.blocked'), { ms: 15000 }));
    loadFromDb().then(() => navigator.onLine && syncNow());
  }, []);
  useEffect(() => {
    if (!online || !s.loaded) return;
    if (screen.name === 'home') void syncNow();
    else schedulePush(0); // during review: just send the queued reviews
  }, [online]);
  // Coming back to the app (it stays alive in the background on iOS): recompute today's work (no timers),
  // and refresh from the sheet if the last sync is old.
  const [focus, setFocus] = useState(0);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      setFocus((n) => n + 1);
      if (!navigator.onLine) return;
      const last = getState().lastSync;
      if (!last || Date.now() - Date.parse(last) > 2 * 60_000) void syncNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Recomputed when cards/progress change, when the screen changes and when the app regains focus.
  const plan = useMemo(() => {
    const now = new Date();
    const done = todaysDone(s.doneToday, now);
    const status = curriculumStatus(s.curriculum, s.cards, s.progress, s.settings.mature_stability_days, now);
    const picker = makePicker(s.curriculum, status, s.settings.curriculum_only);
    const topics = new Set(s.studyTags);
    const eligible = topics.size ? (c: Card) => c.tags.some((tg) => topics.has(tg)) : undefined;
    const p = planToday(s.cards, s.progress, s.settings, todaysIntro(s.intro, now), now, {
      pickNew: picker.pickNew,
      eligible,
      dueDone: dueDoneCount(done)
    });
    const keys = [...p.due, ...p.fresh].map((i) => `${i.card.id}|${i.track}`);
    return { ...p, bar: todayBar(done, keys), nextMin: nextLaterTodayMin(s.cards, s.progress, s.settings, now) };
  }, [s.cards, s.progress, s.settings, s.intro, s.curriculum, s.studyTags, s.doneToday, focus, screen.name]);

  if (screen.name === 'review') {
    return (
      <div class="app">
        <UpdateBanner />
        <Toast />
        <Review items={screen.items} onExit={() => setScreen({ name: 'home' })} />
      </div>
    );
  }

  return (
    <div class="app">
      <UpdateBanner />
      <Toast />
      <header class="topbar">
        <Menu go={(name) => setScreen(name === 'marked' ? { name: 'marked' } : { name: 'progress' })} />
        <div class="topbar-right">
          {!online && <span class="offline-badge">{t('status.offline')}</span>}
          <HelpButton screen={screen.name === 'home' ? 'home' : screen.name} />
        </div>
      </header>
      {screen.name === 'topics' ? (
        <Topics onDone={() => setScreen({ name: 'home' })} />
      ) : screen.name === 'marked' ? (
        <Marked onDone={() => setScreen({ name: 'home' })} />
      ) : screen.name === 'progress' ? (
        <ProgressScreen onDone={() => setScreen({ name: 'home' })} />
      ) : (
      <Home
        onTopics={() => setScreen({ name: 'topics' })}
        due={plan.due.length}
        newToday={plan.fresh.length}
        bar={plan.bar}
        nextMin={plan.nextMin}
        onStart={() => setScreen({ name: 'review', items: todayItems() })}
      />
      )}
      <footer class="footer muted">
        {APP_ENV} · {BUILD_ID}
      </footer>
    </div>
  );
}
