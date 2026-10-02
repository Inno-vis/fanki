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
  promoteInbox, rebuildProgress, setup, readTab, reseedDev (DEV only), purgeSmoke, appendBreaks,
  setCurriculum, curriculumStatus, migrateToDutch, userInfo, replaceKlok, seedEmoji (both dry run unless
  dryRun:false; seedEmoji is DEV only)`. Open items: docs/todo.md.
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

## Android (additive; same service worker, caching and IndexedDB)

- Manifest icons: 192/512 `purpose: any` + 512 `maskable` (content inside the inner ~78 %; DEV badge inside
  the safe circle) — `scripts/make-icons.mjs`.
- `src/installPrompt.ts`: catches `beforeinstallprompt` (suppresses Chrome's banner); "⬇ App installeren"
  shows on home only after a first counted session (`markEngaged`) and not when already installed.
  iOS keeps the Share → "Zet op beginscherm" hint.
- Device test pass incl. one physical Android phone: docs/RELEASE.md.

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

Types `dubbel|enkel|zin|vraag` (old `woord`/`calc` still read), tags_source `handmatig|automatisch`, Dutch tag
keys, pos and descriptions. The API maps them to internal codes (`typeCode_`/`sourceCode_` in
`apps-script/Util.gs`); the client only sees `word|oneway|sentence|question` and `manual|auto`. Text columns
(incl. `answer`) are plain text, so times stay text.

- `enkel` (oneway): front `nl`, back `answer`, one direction, self-rated; `answer` is display text only.
  Clock-card answer rules (durations 15/30/45/60/90 min in both forms; two-digit clock times get
  " of <spoken> 's <dagdeel>", one-digit hours don't; midnight is "00:MMu"): docs/SHEET.md › Writing enkel.
- Subject label above the card = `subject_nl` of the first tag that has one (`subjectFor`, src/display.ts).

## Curriculum and sessions

- Curriculum tab + Settings decide which NEW cards are introduced (`src/curriculum.ts`, pure, recalculated
  on every render). `apps-script/Curriculum.gs` mirrors the status for the Dashboard only — keep in sync.
  Full algorithm: docs/SHEET.md › Curriculum. Per-row `open` (automatisch|altijd open|dicht → auto|always|
  closed) overrides the chain; Settings.curriculum_only (default TRUE) locks every non-curriculum topic.
- Sessions: `src/sessionRules.ts` (pure). One offer at session_max_cards / minutes of reviewing time
  ("Nog 10 kaarten, graag!" / "Stoppen"), then session_extra_cards more. "Terug" or leaving the app only
  pauses (`meta.openSession`, "Doorgaan", expires after session_resume_minutes without a pause). The session
  ENDS on Stoppen / extension done / no cards left; with ≥ min_reviews_to_count reviews it stores
  `meta.lastSession` and home blocks "Starten" until end + cooldown_minutes.
- Short-step repeats (a card rated into a ≤ 20 min step) never count toward "X van Y" and the session never
  offers/ends while one is pending — they are shown first, past the card/minute cap and the extension
  (`afterRating` in src/sessionFlow.ts, `nextStep` → 'repeat'). After a pause, Learning/Relearning cards due
  within 20 min rejoin the session (`planToday` learnAheadMs). max_learning_backlog still holds new cards back.

## Study by topic, new-card pacing, breaks

- "Kies een onderwerp" (`src/screens/Topics.tsx`): multi-select of tags that have cards (label_nl; 🔒 for
  locked curriculum tags). Stored in `meta.studyTags`; sessions then use due + new cards with ANY selected
  tag. Empty = everything.
- Within a session a new card waits while ≥ `max_learning_backlog` cards are in short in-session steps
  (`pickNextIndex` in src/session.ts).
- When a pause starts, one Breaks line is shown once ("Sessie voltooid!" + line + OK), `src/breaks.ts`.

## 🚩 Student flags ("Gemarkeerd") — local only

- `src/studentFlags.ts` + IndexedDB store `flags` (DB version 2): `{id, card_id, ts, note, resolved, updated_ts}`.
  Every tap is a new entry; resolving never deletes. Stable field names so a future sync could push them,
  but there is NO sync: they leave the phone only via her "Delen" (Web Share) or "Kopieer naar klembord".
- UI: 🚩 on every card in review (`FlagButton`: tap = flag + "Gemarkeerd" toast with "+ notitie";
  long-press = flag + note field), "Gemarkeerd" screen (`screens/Marked.tsx`) via the 🚩 badge on home.
- Strings use the `mark.*` i18n keys. Never mix up with `Card.flags` / `flag.*` (sheet content markers:
  false-friend, separable).

## Domain rules

- Card types (internal codes): `word` (dubbel), `oneway` (enkel: nl → answer), `sentence` (target word in
  `{braces}` → cloze), `question` (fr = prompt/front, nl = answer/back).
- Two FSRS tracks: word cards have `recog` (NL→FR, listening) and `prod` (FR→typed NL);
  sentence/question cards only `prod`. `prod` unlocks when `recog` stability ≥ `unlock_prod_stability_days`.
- Scheduling (`src/scheduler.ts`, `src/session.ts`): ts-fsrs, fuzz on, retention from Settings. The four
  outcomes are computed once when the answer is revealed; the tapped one is applied, so the interval on
  the button is exactly what is scheduled. Steps under 20 min come back in the same session.
- New cards per day capped by Settings.`new_per_day`, ordered by `added` (then sheet order). A word's
  unlocked `prod` track has its own cap of the same size. Today's introductions are stored (`meta.intro`).
- Each rating = progress + outbox event + intro list in ONE IndexedDB transaction (`recordReview`).
  Pushed a few seconds later when online, and on every sync; removed only when the server confirms.
- Nouns always show de/het. Sheet flag `false-friend` shows the badge "valse vriend"; `separable` is NOT shown
  (`HIDDEN_FLAGS` in src/display.ts) — it stays in the sheet as teacher metadata.
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

## Deploy rules (standing instructions)

- **DEV deploy → cooldown reset**: `src/devReset.ts` clears `meta.lastSession` the first time a DEV build with a
  new BUILD_ID starts. PROD never resets.
- **PROD deploy → keep her progress**: follow the "PROD safety checklist" in docs/RELEASE.md every time
  (`npm run backup:prod` before and after, additive changes only, dry runs, verify counts and the live app).

## Commands

```bash
npm run dev              # local dev server (DEV API)
npm test                 # vitest
npm run e2e              # builds e2e-dist (mock API) + Playwright offline test
npm run build            # prod + dev into dist/
npm run gas:deploy:dev   # push + redeploy Apps Script (same URL)
npm run smoke:dev        # curl smoke test of the deployed API
npm run backup:prod      # Log/Progress/Cards → backups/ (git-ignored) before & after any PROD change
npm run admin -- dev listUntagged
npm run ui-strings       # regenerate docs/UI-STRINGS.md
npm run ui-vocab         # UI words not yet taught (warning)
```

Slash commands in `.claude/commands/` (all go through `scripts/admin.mjs`, default env dev):
- `/retag` — propose 0–3 existing tags per untagged card (new tag only if ≥ 3 cards use it), table, wait
  for OK, `setTags` (tags_source automatisch; handmatig rows are refused by the API).
- `/addwords <theme, n, level>` — dedupe against Cards + Inbox, table, wait for OK, `appendInbox`
  (status voorgesteld). Never writes Cards.
- `/promote` — show `goedgekeurd` Inbox rows, wait for OK, `promoteInbox`.
- `/addbreaks <n>` — new varied Breaks lines (axes + ≤ ~20 % rule), wait for OK, `appendBreaks`.
