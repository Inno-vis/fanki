#!/usr/bin/env node
// Regenerates docs/UI-STRINGS.md from src/i18n.ts so the teacher can review every string.
// Usage: npm run ui-strings            (write)   ·   npm run ui-strings -- --check   (fail if stale)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { UI, HELP, RATINGS, INTERVAL_UNITS } = await import(join(root, 'src/i18n.ts'));
const esc = (s) => String(s).replaceAll('|', '\\|');

let md = `# UI strings

Generated from \`src/i18n.ts\` by \`npm run ui-strings\` — edit the source, not this file.
She sees **nl**. **fr** is hidden help: shown only in the "Hulp" panel and the one-time rating overlay
(both hidden when Settings \`show_french_help\` is FALSE).

## Interface strings

| key | nl (shown) | fr (help) |
|---|---|---|
`;
for (const [k, v] of Object.entries(UI)) md += `| \`${k}\` | ${esc(v.nl)} | ${esc(v.fr)} |\n`;

md += `\n## Rating buttons (left to right)\n\n| emoji | nl (shown) | fr meaning (overlay) | FSRS rating |\n|---|---|---|---|\n`;
for (const r of RATINGS) md += `| ${r.emoji} | ${r.nl} | ${esc(r.fr)} | ${r.rating} |\n`;

md += `\n## Interval units\n\n| unit | shown |\n|---|---|\n`;
for (const [k, v] of Object.entries(INTERVAL_UNITS)) md += `| ${k} | ${v} |\n`;

md += `\n## Hulp panel (per screen)\n\nStructured help (\`HelpPage\` in src/i18n.ts): one idea per row; the Dutch label is shown as a chip.\n`;
const label = (it) => (it.ui ? UI[it.ui].nl.replace(/\{(\w+)\}/g, (m, k) => (it.vars && k in it.vars ? it.vars[k] : m)) : it.nl ?? '');
for (const [k, page] of Object.entries(HELP)) {
  md += `\n### ${k}\n\n${esc(page.nl)}\n\n| section | label (nl) | fr |\n|---|---|---|\n`;
  for (const sec of page.sections) {
    const title = sec.title + (sec.collapsed ? ' (ingeklapt)' : '') + (sec.kind === 'steps' ? ' (stappen)' : '');
    for (const it of sec.items) md += `| ${esc(title)} | ${esc([it.icon, label(it)].filter(Boolean).join(' '))} | ${esc(it.fr)} |\n`;
  }
  if (page.tip) md += `| 💡 tip |  | ${esc(page.tip)} |\n`;
}

const out = join(root, 'docs/UI-STRINGS.md');
if (process.argv.includes('--check')) {
  const cur = (() => {
    try {
      return readFileSync(out, 'utf8');
    } catch {
      return '';
    }
  })();
  if (cur !== md) {
    console.error('docs/UI-STRINGS.md is out of date — run: npm run ui-strings');
    process.exit(1);
  }
  console.log('docs/UI-STRINGS.md is up to date');
} else {
  writeFileSync(out, md);
  console.log(`wrote docs/UI-STRINGS.md (${Object.keys(UI).length} strings)`);
}
