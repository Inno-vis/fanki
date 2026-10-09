import { describe, expect, it } from 'vitest';
import { HELP, RATINGS, UI, helpLabel } from './i18n';

// Readable Hulp pages: one idea per line, short lines, labels that exist in the UI.
describe('Hulp pages (structured help)', () => {
  const pages = Object.entries(HELP);

  it('every screen has at least one section; sections have 1–7 items', () => {
    for (const [screen, page] of pages) {
      expect(page.sections.length, screen).toBeGreaterThan(0);
      for (const s of page.sections) {
        expect(s.items.length, `${screen} › ${s.title}`).toBeGreaterThan(0);
        expect(s.items.length, `${screen} › ${s.title}`).toBeLessThanOrEqual(7);
        expect(s.title.length, `${screen} › ${s.title}`).toBeLessThanOrEqual(40);
      }
    }
  });

  it('every French line is at most 110 characters; list items have a label or an icon', () => {
    for (const [screen, page] of pages) {
      for (const s of page.sections) {
        for (const it of s.items) {
          expect(it.fr.length, `${screen}: ${it.fr}`).toBeLessThanOrEqual(110);
          if (s.kind !== 'steps') expect(Boolean(it.ui || it.nl || it.icon), `${screen}: ${it.fr}`).toBe(true);
        }
      }
      if (page.tip) expect(page.tip.length, `${screen} tip`).toBeLessThanOrEqual(110);
    }
  });

  it('every ui reference exists in UI', () => {
    for (const page of Object.values(HELP)) {
      for (const s of page.sections) for (const it of s.items) if (it.ui) expect(UI[it.ui], it.ui).toBeDefined();
    }
    expect(helpLabel({ ui: 'home.start', fr: 'x' })).toBe('Starten');
  });

  it('the review page has the four rating buttons (from RATINGS)', () => {
    const labels = HELP.review.sections.flatMap((s) => s.items.map(helpLabel));
    for (const r of RATINGS) expect(labels).toContain(r.nl);
  });
});
