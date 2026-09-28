# Fanki — offline-first Dutch flashcards

An iPhone PWA (Safari, Home Screen) for **one French-speaking learner** studying Dutch, taught by
the repo owner. She is often offline. Content lives in a Google Sheet behind an Apps Script API.
The repo is **public** and hosted on GitHub Pages.

- DEV: https://inno-vis.github.io/fanki/dev/ (branch `main`, sheet "Dutch DEV")
- PROD: https://inno-vis.github.io/fanki/ (branch `release`, sheet "Dutch PROD")
- Release process: `docs/RELEASE.md`. Sheet schema: `docs/SHEET.md` (keep in sync with `apps-script/Schema.gs`).

## Stack

- Vite + TypeScript + Preact, `idb` (IndexedDB), `ts-fsrs` (scheduling), `vite-plugin-pwa` (Workbox precache).
- Two builds from one codebase (`vite.config.ts`): `--mode prod` → `dist/` base `/fanki/`;
  `--mode dev` → `dist/dev/` base `/fanki/dev/`. Always build PROD first (it empties `dist/`).
  Separate manifest, scope, Workbox `cacheId`, IndexedDB namespace (`NS` in `src/config.ts`).
- `apps-script/`: one codebase for both Apps Script projects (`.clasp.dev.json`, `.clasp.prod.json`),
  deployment IDs in `deploy.config.json`.
- UI language: **French**. Large touch targets, one-handed, dark mode, safe-area padding.

## Secrets — never commit, never print

- `.env.local` (git-ignored): `LEARNER_TOKEN_{DEV,PROD}`, `ADMIN_TOKEN_{DEV,PROD}`, `API_URL_{DEV,PROD}`.
- `LEARNER_TOKEN` ends up in the public site by design: it can only read cards/state and append reviews.
- `ADMIN_TOKEN` must **never** appear in the site, the repo, or chat output. Use `node scripts/admin.mjs`
  (reads it from `.env.local`, never prints it). Don't `cat .env.local` or echo tokens.
- `apps-script/Secrets.gs` is committed **blank**. Real values only go to Apps Script via
  `scripts/push-secrets.sh <env>` (temporary copy outside the repo) → run `setup()` → `npm run gas:push:<env>`.
- Hooks in `.githooks/` (enabled by `npm install` → `core.hooksPath`) run `scripts/check-secrets.sh`
  before every commit and push; CI runs it on source (not `dist/`). Never bypass with `--no-verify`.
- CI gets `API_URL_*` and `LEARNER_TOKEN_*` from GitHub Actions secrets.

## API (Apps Script web app, executeAs USER_DEPLOYING, access ANYONE_ANONYMOUS)

- HTTP is always 200. Body is `{ok:true,...}` or `{ok:false,error,message}`.
- `GET ?action=ping` · `?action=cards&token=` · `?action=state&token=`
- `POST` with a `text/plain` JSON body and **no custom headers** (avoids CORS preflight):
  `{action:"reviews", token, events:[{event_id, card_id, track, ts, rating, mode, duration_ms, snapshot}]}`
  → `{accepted, duplicate, rejected}`. Idempotent on `event_id`.
- Admin-only (ADMIN_TOKEN): `listCards, listUntagged, tags, setTags, appendInbox, listInbox,
  promoteInbox, rebuildProgress, setup, readTab, reseedDev (DEV only), purgeSmoke`.
- All writes are inside `LockService`. All actions are idempotent, so clients **retry** on
  `no_action` (POST body lost on Google's redirect), `busy`, or non-JSON responses.
- Deploy with `npm run gas:deploy:<env>` — keeps the same deployment ID so the /exec URL never changes.
- Verify with `npm run smoke:<env>`.

## Domain rules

- Card types: `word`, `sentence` (target word in `{braces}` → cloze), `question` (fr = prompt, nl = answer).
- Two FSRS tracks: word cards have `recog` (NL→FR, listening) and `prod` (FR→typed NL);
  sentence/question cards only `prod`. `prod` unlocks when `recog` stability ≥ `unlock_prod_stability_days`.
- New cards per day capped by Settings.`new_per_day`, ordered by `added`.
- Nouns always show de/het; show flags (false-friend, separable).
- Typed answers: tolerant of case and missing accents, show a diff, "J'avais raison" override.
- Compliments: every 3rd correct answer per session, never the same twice in a row, respects
  `prefers-reduced-motion` and Settings.`compliments_enabled`.

## Commands

```bash
npm run dev              # local dev server (DEV API)
npm test                 # vitest
npm run e2e              # playwright
npm run build            # prod + dev into dist/
npm run gas:deploy:dev   # push + redeploy Apps Script (same URL)
npm run smoke:dev        # curl smoke test of the deployed API
npm run admin -- dev listUntagged
```

Slash commands in `.claude/commands/`: `/retag`, `/addwords`, `/promote` (all go through `scripts/admin.mjs`).
