import { describe, expect, it } from 'vitest';
import { isHelpUpdated, pageFingerprint } from './helpSeen';
import type { HelpPage } from './i18n';

const v1: HelpPage = { nl: 'Hier.', sections: [{ title: 'Cet écran', items: [{ nl: 'Starten', fr: 'commencer' }] }], tip: 'astuce' };
const v2: HelpPage = { ...v1, sections: [{ title: 'Cet écran', items: [{ nl: 'Starten', fr: 'commencer maintenant' }] }] };

describe('Hulp "nieuw" marker', () => {
  it('a page she never opened is not flagged', () => {
    expect(isHelpUpdated(null, pageFingerprint(v1))).toBe(false);
  });

  it('the fingerprint stays the same for identical content and changes when an item changes', () => {
    expect(pageFingerprint(structuredClone(v1))).toBe(pageFingerprint(v1));
    expect(isHelpUpdated(pageFingerprint(v1), pageFingerprint(v1))).toBe(false);
    expect(isHelpUpdated(pageFingerprint(v1), pageFingerprint(v2))).toBe(true);
    expect(pageFingerprint({ ...v1, tip: 'autre' })).not.toBe(pageFingerprint(v1));
  });
});
