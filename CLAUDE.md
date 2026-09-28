# Fanki — offline-first Dutch flashcards

An iPhone PWA (Safari, Home Screen) for **one French-speaking learner** studying Dutch, taught by
the repo owner. She is often offline. Content lives in a Google Sheet behind an Apps Script API.
The repo is **public** and hosted on GitHub Pages.

- DEV: https://inno-vis.github.io/fanki/dev/ (branch `main`, sheet "Dutch DEV")
- PROD: https://inno-vis.github.io/fanki/ (branch `release`, sheet "Dutch PROD")
- Release process: `docs/RELEASE.md`. Sheet schema: `docs/SHEET.md` (keep in sync with `apps-script/Schema.gs`).
  UI strings for review: `docs/UI-STRINGS.md`.

## Stack

- Vite + TypeScript + Preact, `idb` (IndexedDB), `ts-fsrs` (scheduling), `vite-plugin-pwa` (Workbox precache).
- Two builds from one codebase (`vite.config.ts`): `--mode prod` → `dist/` base `/fanki/`;
  `--mode dev` → `dist/dev/` base `/fanki/dev/`. Always build PROD first (it empties `dist/`).
  Separate manifest, scope, Workbox `cacheId`, IndexedDB namespace (`NS` in `src/config.ts`).
- `apps-script/`: one codebase for both Apps Script projects (`.clasp.dev.json`, `.clasp.prod.json`),
  deployment IDs in `deploy.config.json`.
- UI language: **Dutch (A1)** — short sentences, present tense, common words, no idioms. `<html lang="nl">`.
  Large touch targets, one-handed, dark mode, safe-area padding.

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

## UI text (Dutch interface, French only as opt-in help)

- **Every** learner-facing string lives in `src/i18n.ts` as `{ nl, fr }`. Components call `t(key)`;
  never hard-code UI text in a component. `fr` is hidden help text.
- French appears only (a) in the "Hulp" panel (`?` button on every screen, `HELP[screen].fr`) when she
  taps it, and (b) in the one-time rating-buttons overlay. Both are hidden when Settings
  `show_french_help` is FALSE.
- Interface vocabulary is course content: the 50 "app" words (`APP_SEED_CARDS` in `apps-script/Schema.gs`,
  tag `app`, added 2026-09-27) are seeded in DEV **and** PROD. `npm run ui-vocab` warns about UI words
  that are neither taught nor on its function-word allowlist (CI: warning only).
- `docs/UI-STRINGS.md` is generated: `npm run ui-strings` after editing `src/i18n.ts`.
- Relative times in Dutch (`timeAgo` in `src/format.ts`): "zojuist", "5 minuten geleden", "2 dagen geleden".
- The tag filter ("Kies een onderwerp") shows Tags.`label_nl`; the keys in Cards.tags are unchanged.

## Rating buttons

- Left to right, equal width, all four in one row on an iPhone SE, each ≥ 56 px tall:
  emoji (large) / Dutch label / interval (smallest). `RATINGS` + `INTERVAL_UNITS` in `src/i18n.ts`:
  ❌ Opnieuw (1) · 😅 Moeilijk (2) · ✅ Goed (3) · 😎 Makkelijk (4).
- Intervals from ts-fsrs, formatted by `formatInterval`: "10 min", "2 u", "3 d", "3 wk", "4 mnd", "1 jr".
- `aria-label` = "<Dutch label>, <interval>".
- **Every card is self-rated** (the core feature): she reads the front, taps "Antwoord tonen", then
  rates herself. There are no typed answers anywhere.
- One-time overlay (first review session) explains the four buttons in French
  ("Opnieuw = je ne savais pas", "Moeilijk = j'ai hésité", "Goed = bien", "Makkelijk = très facile");
  a small `?` reopens it. This is the only place the button labels are translated.

## Sheet values are Dutch

Types `woord|zin|vraag`, tags_source `handmatig|automatisch`, Dutch tag keys, pos and descriptions. The API
maps them to internal codes (`typeCode_`/`sourceCode_` in `apps-script/Util.gs`); the client only sees
`word|sentence|question` and `manual|auto`. Text columns are formatted as plain text (times stay text).

## Curriculum and sessions

- Curriculum tab + Settings decide which NEW cards are introduced (`src/curriculum.ts`, pure, recalculated
  on every render). `apps-script/Curriculum.gs` mirrors the status for the Dashboard only — keep in sync.
  Full algorithm: docs/SHEET.md › Curriculum.
- Sessions: `src/sessionRules.ts` (pure). One offer at session_max_cards/minutes ("Nog 10 kaarten,
  graag!" / "Stoppen"), then session_extra_cards more. A session with ≥ min_reviews_to_count reviews stores
  `meta.lastSession`; home blocks "Starten" until end + cooldown_minutes.

## Domain rules

- Card types (internal codes): `word`, `sentence` (target word in `{braces}` → cloze), `question`
  (fr = prompt/front, nl = answer/back).
- Two FSRS tracks: word cards have `recog` (NL→FR, listening) and `prod` (FR→typed NL);
  sentence/question cards only `prod`. `prod` unlocks when `recog` stability ≥ `unlock_prod_stability_days`.
- Scheduling (`src/scheduler.ts`, `src/session.ts`): ts-fsrs, fuzz on, retention from Settings. The four
  outcomes are computed once when the answer is revealed; the tapped one is applied, so the interval on
  the button is exactly what is scheduled. Steps under 20 min come back in the same session.
- New cards per day capped by Settings.`new_per_day`, ordered by `added` (then sheet order). A word's
  unlocked `prod` track has its own cap of the same size. Today's introductions are stored (`meta.intro`).
- Each rating = progress + outbox event + intro list in ONE IndexedDB transaction (`recordReview`).
  Pushed a few seconds later when online, and on every sync; removed only when the server confirms.
- Nouns always show de/het; show flags (false-friend, separable).
- Compliments (Dutch lines from the Compliments tab): every 3rd correct answer per session, counter never
  resets on a mistake, never the same twice in a row, ~1.5 s non-blocking toast, respects
  `prefers-reduced-motion` and Settings.`compliments_enabled`.

## Offline and sync (never lose a review)

- The app shell is precached by the service worker; all active cards, settings, tags, compliments,
  curriculum and her Progress live in IndexedDB (`fanki-dev` / `fanki-prod`). `navigator.storage.persist()`.
- A rating writes progress + outbox event in one transaction. The outbox is pushed ~4 s later when online,
  immediately when the connection returns (also mid-session), and at every sync. Events leave the outbox
  only when the server lists them as accepted or duplicate; the server de-duplicates on `event_id`.
- Sync = push → pull cards/settings + Progress → merge (server wins only if newer AND no unsent local
  review) → push again. Runs at launch, when back online, when the app returns to the foreground (> 2 min
  since the last sync) and on "Synchroniseren".
- `useOnline()` is ONE shared flag (src/pwa.ts); don't add per-component online listeners.
- Tests: `src/queue.test.ts` (idempotent push, lost replies, merge) and `e2e/offline.spec.ts` (Playwright:
  online load → offline reload → review → reconnect with a lost reply → exactly-once on the mock server).

## Commands

```bash
npm run dev              # local dev server (DEV API)
npm test                 # vitest
npm run e2e              # builds e2e-dist (mock API) + Playwright offline test
npm run build            # prod + dev into dist/
npm run gas:deploy:dev   # push + redeploy Apps Script (same URL)
npm run smoke:dev        # curl smoke test of the deployed API
npm run admin -- dev listUntagged
npm run ui-strings       # regenerate docs/UI-STRINGS.md
npm run ui-vocab         # UI words not yet taught (warning)
```

Slash commands in `.claude/commands/`: `/retag`, `/addwords`, `/promote` (all go through `scripts/admin.mjs`).
