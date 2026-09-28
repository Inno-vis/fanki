import type { Card } from './types';
import { UI, t, type UIKey } from './i18n';

export function isNoun(card: Card): boolean {
  return card.article !== '' || /^noun/i.test(card.pos);
}

/** Dutch text as shown: nouns always with de/het; cloze braces removed. */
export function dutchText(card: Card): string {
  const text = card.nl.replace(/[{}]/g, '');
  return card.type === 'word' && card.article ? `${card.article} ${text}` : text;
}

/** Dutch badge label for a flag from the sheet (unknown flags are shown as written). */
export function flagLabel(flag: string): string {
  const key = `flag.${flag}` as UIKey;
  return key in UI ? t(key) : flag;
}

/** Cloze parts of a sentence card: "Ik {woon} hier." → before "Ik ", answer "woon", after " hier." */
export function clozeParts(nl: string): { before: string; answer: string; after: string } {
  const m = nl.match(/^(.*?)\{([^}]*)\}(.*)$/s);
  return m ? { before: m[1], answer: m[2], after: m[3] } : { before: nl, answer: '', after: '' };
}
