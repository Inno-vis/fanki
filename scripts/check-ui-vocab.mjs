#!/usr/bin/env node
// Warns about Dutch UI words that are not taught: every word in the `nl` UI strings should be in the
// "app" seed vocabulary (apps-script/Schema.gs → APP_SEED_CARDS) or on the function-word allowlist.
// Always exits 0 — this is advice, not a gate. In GitHub Actions it emits ::warning annotations.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { UI, RATINGS } = await import(join(root, 'src/i18n.ts'));

const ALLOW = new Set(
  `de het een ik je jij jou u hij zij ze we wij is ben bent zijn was en of maar niet wel ook nog nu
   hier daar er dit dat deze die op in aan met van voor naar uit om te tot bij als dan wat wie waar hoe
   mijn jouw jullie ons onze heb hebt heeft kan kun kunt wil moet ja nee al zo heel veel meer tik
   alle ok min u d wk mnd jr fanki dev`.split(/\s+/).filter(Boolean)
);

// Taught words from the app seed list (multi-word entries like "nog eens" count per word).
const schema = readFileSync(join(root, 'apps-script/Schema.gs'), 'utf8');
const block = schema.slice(schema.indexOf('var APP_SEED_CARDS'));
const taught = new Set();
for (const m of block.matchAll(/'word\|([^|]+)\|/g)) for (const w of m[1].toLowerCase().split(/\s+/)) taught.add(w);
// Separable verbs also teach the bare verb: aanzetten → zetten, opslaan → slaan.
for (const w of [...taught]) {
  const m = w.match(/^(aan|uit|op|af|mee|terug|in|door)(\w{4,}en)$/);
  if (m) taught.add(m[2]);
}

function known(word) {
  if (ALLOW.has(word) || taught.has(word)) return true;
  for (const base of taught) {
    // plural / adjective / diminutive endings: kaart→kaarten, nieuw→nieuwe, woord→woorden
    if ([base + 'e', base + 'en', base + 's', base + 'n', base + 'je', base + 'tje'].includes(word)) return true;
    // plural with a long vowel that loses its double letter: minuut → minuten, week → weken
    // plural with a doubled final consonant: knop → knoppen
    if (/[aeiou][^aeiou]$/.test(base) && word === base + base.slice(-1) + 'en') return true;
    const open = base.replace(/(aa|ee|oo|uu)([^aeiou])$/, (_, v, c) => v[0] + c);
    if (open !== base && word === open + 'en') return true;
    // verb forms from an infinitive: controleren → controleer/controleert/gecontroleerd
    if (base.endsWith('en') && base.length > 5) {
      const stem = base.slice(0, -2);
      const long = stem.replace(/([^aeiou])([aeiou])([^aeiou])$/, '$1$2$2$3');
      const short = stem.replace(/([^aeiou])\1$/, '$1'); // zetten → zet
      const devoiced = long.replace(/z$/, 's').replace(/v$/, 'f'); // kiezen → kies, geven → geef
      for (const s of [stem, long, short, devoiced]) {
        if (word === s || word === s + 't' || word === 'ge' + s + 'd' || word === 'ge' + s + 't') return true;
        // verbs with an unstressed prefix have no ge-: herhalen → herhaald, betalen → betaald
        if (/^(be|her|ver|ont|er)/.test(base) && (word === s + 'd' || word === s + 't')) return true;
      }
    }
  }
  return false;
}

const strings = [
  ...Object.entries(UI).map(([k, v]) => [k, v.nl]),
  ...RATINGS.map((r) => [`rating.${r.key}`, r.nl])
];
const unknown = new Map();
for (const [key, text] of strings) {
  const words = text.replace(/\{\w+\}/g, ' ').toLowerCase().match(/[a-zà-ÿ]+/g) || [];
  for (const w of words) if (!known(w)) unknown.set(w, [...(unknown.get(w) || []), key]);
}

if (!unknown.size) {
  console.log(`UI vocabulary: all words in ${strings.length} strings are taught or allowlisted.`);
} else {
  const gh = process.env.GITHUB_ACTIONS === 'true';
  console.log(`UI vocabulary: ${unknown.size} word(s) not in the "app" seed list or allowlist:`);
  for (const [w, keys] of [...unknown].sort()) {
    const msg = `"${w}" (in ${[...new Set(keys)].join(', ')})`;
    console.log(gh ? `::warning file=src/i18n.ts::UI word not taught: ${msg}` : `  - ${msg}`);
  }
  console.log('Add them to APP_SEED_CARDS, the allowlist, or rephrase. (warning only)');
}
