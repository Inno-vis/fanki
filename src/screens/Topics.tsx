import { useMemo } from 'preact/hooks';
import { t } from '../i18n';
import { setMeta } from '../db';
import { setState, useStore } from '../store';
import { curriculumStatus, isTopicLocked } from '../curriculum';

/** "Kies een onderwerp": choose one or more tags; the next sessions use only cards with any of them. */
export function Topics({ onDone }: { onDone: () => void }) {
  const s = useStore();
  const selected = new Set(s.studyTags);

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of s.cards) for (const tag of c.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    const status = curriculumStatus(s.curriculum, s.cards, s.progress, s.settings.mature_stability_days, new Date());
    return s.tags
      .filter((tg) => counts.has(tg.tag))
      .map((tg) => ({
        tag: tg.tag,
        label: tg.label_nl || tg.tag,
        count: counts.get(tg.tag)!,
        locked: isTopicLocked(tg.tag, s.curriculum, status, s.settings.curriculum_only)
      }));
  }, [s.cards, s.tags, s.curriculum, s.progress, s.settings.curriculum_only]);

  const save = async (next: string[]) => {
    setState({ studyTags: next });
    await setMeta('studyTags', next);
  };
  const toggle = (tag: string) => {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    void save([...next]);
  };

  return (
    <main class="topics">
      <h2 class="screen-title">{t('tags.title')}</h2>
      <button class={`chip chip-all${selected.size === 0 ? ' on' : ''}`} aria-pressed={selected.size === 0} onClick={() => void save([])}>
        {t('tags.all')}
      </button>
      <div class="chips">
        {rows.map((r) => (
          <button key={r.tag} class={`chip${selected.has(r.tag) ? ' on' : ''}`} aria-pressed={selected.has(r.tag)} onClick={() => toggle(r.tag)}>
            <span class="chip-label">{r.label}</span>
            <span class="chip-count">
              {r.locked ? `🔒 ${t('tags.locked')}` : t('home.cards', { n: r.count })}
            </span>
          </button>
        ))}
      </div>
      <button class="btn btn-primary btn-huge topics-done" onClick={onDone}>
        {t('tags.done')}
      </button>
    </main>
  );
}
