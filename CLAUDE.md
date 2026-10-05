# SpeesRep — offline-first Dutch flashcards

Visible name **SpeesRep** (renamed from Fanki on 2026-10-04: `APP_NAME` in src/config.ts, manifest/title in
vite.config.ts, i18n strings, teacher page, User info). Technical names stay **fanki** on purpose — IndexedDB `NS`
(`fanki-prod`/`fanki-dev`, renaming would wipe her progress), URLs `/fanki/`, the repo, Workbox cacheId, backup
`ns` field.

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
  promoteInbox, rebuildProgress, setup, readTab, reseedDev (DEV only), purgeSmoke,
  setCurriculum, addCurriculum, curriculumStatus, migrateToDutch, userInfo, setTeachers, enableApproval, setCheck, removeTags, deleteRejected (DEV only), importCards, cardsToInbox, setSetting, cleanSettings, deleteTabs, flagCards, splitInbox, splitCards, replaceKlok, seedEmoji (dry run unless
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

## Teacher review UI (Apps Script HtmlService, "SpeesRep – controleren")

- `apps-script/Teacher.gs` + `Review.html` (vanilla JS, no build). Served by a SECOND web-app deployment of the
  same project: `scripts/gas-deploy.sh` pushes a temporary manifest variant (executeAs USER_ACCESSING, access
  ANYONE or `teacherAccess` from deploy.config.json, + userinfo.email scope), versions it, redeploys
  `teacherDeploymentId`, then pushes the repo manifest and redeploys the anonymous API (HEAD = repo).
- `doGet ?page=review` serves the page only when the visitor's email is in Script Properties TEACHER_EMAILS /
  TEACHER_DOMAIN (`admin <env> setTeachers`). The anonymous API deployment has no userinfo scope → never
  serves it. Page ↔ server via google.script.run (`review*` functions, each `requireTeacher_()`); no token.
- Inbox status `nakijken` (🚩 per row / F key): stays in the Inbox, skipped by "Keur alle 5 goed"
  (`reviewApproveMany`), filter "alleen 🚩 nakijken".
- Card approval: Cards.`controle` (`goedgekeurd|afgekeurd|blank` → `approved|rejected|''`, `CHECK_NL`/`checkCode_`)
  + Cards.`nakijken` (🚩 checkbox, never hides). With Settings.`require_approval` the API serves only approved
  cards (`cardServed_` in Util.gs; also the Dashboard curriculum). Teacher page: Goedkeuren/Afkeuren
  (`reviewSetCheck`), 🚩 (`reviewSetCardFlag`). Turn on per env with `admin <env> enableApproval` (dry run;
  approveStudied keeps her studied cards). All AI-made cards started blank (2026-10-02).

## Instellingen (phone only) and settings access

- Menu › ⚙️ Instellingen (`screens/SettingsScreen.tsx`): rows from `SETTING_ROWS` (src/userSettings.ts) — "Max.
  aantal nieuwe woorden per dag" (5/10/15/20, plus "Standaard (X)" when the Sheet value is not one of them) and
  "Luisteroefeningen" (disabled + "Geen Nederlandse stem op dit toestel." without a Dutch voice). Stored in
  IndexedDB `meta.userSettings` = {newPerDay, listeningEnabled} (null = default), saved instantly, NEVER sent to
  the Sheet or a server.
- ONE accessor, `src/settings.ts`: `useSettings()` (components) / `currentSettings()` (other code) merge the Sheet
  Settings, her userSettings and `hasVoice`. `new_per_day` there is already `getNewPerDay(sheet, user)`;
  `listening` = voice && her toggle; `listenMode()` (src/tts.ts) decides listening cards. Components never read
  `state.settings` / `state.userSettings` directly (`useSettingControls()` / `setUserSetting()` for the page).
- JSON backup (same page; `src/backup.ts`): export = progress, unsent reviews, 🚩 flags, intro, doneToday,
  dayCounts, studyTags, userSettings (no cards). Import MERGES (newer progress/flag wins, reviews added, today's
  records only from today) and refuses files of the other app (DEV/PROD). iPhone: share sheet; else a download.

## OpenMoji pictures (emoji cards)

- Emoji cards (`enkel`, front = one emoji) show the OpenMoji COLOUR picture instead of the phone's emoji
  (`openmojiFor` in the generated `src/openmoji.ts`, `<img>` in CardFace). `npm run openmoji` (scripts/openmoji.mjs)
  maps the EMOJI_SEED_CARDS emoji to hexcodes from `openmoji` (exact-pinned devDependency) and copies ONLY those SVGs,
  SVGO-optimised, to `public/openmoji/` (+ LICENSE.txt). Self-hosted only (never openmoji.org / CDNs); precached by
  the service worker (globPatterns include svg). Re-run it after adding emoji cards; unmatched emoji are listed.
- Credit (CC BY-SA 4.0) on Over SpeesRep (`about.images`, `about.license`). Cards whose picture changed get 🚩
  nakijken (`admin <env> flagCards`).

## Listening and Voortgang

- `src/tts.ts`: phone voices only (Web Speech API, offline with an installed voice). `pickDutchVoice` prefers
  nl-NL, then nl-BE, then any nl. 🔊 (`SpeakButton`) on the Dutch side of every card; without a Dutch voice it
  shows "Geen Nederlandse stem op deze telefoon." (Hulp explains how to install one on iPhone/Android).
- Listening cards: with a Dutch voice, about Settings.`listen_share` (0.3) of word-recognition reviews start
  with only the sound ("Wat hoor je?"), Log mode `listen` (`isListeningReview`, deterministic per card+reps).
- "Voortgang" (`screens/ProgressScreen.tsx`, `src/stats.ts`): geoefend / bekend / reviews this week / streak /
  7-day chart / due today-tomorrow-7 days. Per-day counts are stored on the phone (`meta.dayCounts`, written
  in the same transaction as each rating) — they start counting from that update.
- `src/curriculumParity.test.ts` loads the real Curriculum.gs and compares it with curriculum.ts.

## Android (additive; same service worker, caching and IndexedDB)

- Manifest icons: 192/512 `purpose: any` + 512 `maskable` (content inside the inner ~78 %; DEV badge inside
  the safe circle) — `scripts/make-icons.mjs`.
- `src/installPrompt.ts`: catches `beforeinstallprompt` (suppresses Chrome's banner); "⬇ App installeren"
  shows on home only after she rated ≥ 3 cards in one visit (`markEngaged`) and not when already installed.
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
- One-time overlay (first review) explains the four buttons in French
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

## Curriculum and today's work

- Curriculum tab + Settings decide which NEW cards are introduced (`src/curriculum.ts`, pure, recalculated
  on every render). `apps-script/Curriculum.gs` mirrors the status for the Dashboard only — keep in sync.
  Full algorithm: docs/SHEET.md › Curriculum. Per-row `open` (automatisch|altijd open|dicht → auto|always|
  closed) overrides the chain; Settings.curriculum_only (default TRUE) locks every non-curriculum topic.
- Studying now (no sessions, no timers, no cooldown): `planToday` (src/session.ts) + `src/today.ts`. The round = started
  cards due in LESS than `due_window_minutes` (strict), capped at `max_reviews_per_day` (overflow rolls over), + new
  cards from `getNewPerDay()` — the ONLY reader of `new_per_day`. `interleave`: due first, 1 new per 3 due. A rated
  card goes back into the run ONLY if its next step is inside the window (`afterRating`, src/sessionFlow.ts) —
  ONE rule, `inDueWindow` (src/today.ts), for the round, the requeue and "done", so they never disagree; "Goed"
  (10 min) and "Makkelijk" leave the run and return via the later-today line. `pickNextIndex`: a card in a short
  step is not shown before its due time while other cards are ready (if only such cards are left, the first due
  one is shown). Home: "Vandaag" bar = current round
  (`meta.round`, `nextRound`: finished → new round at 0, arrivals join a running round; written in
  `recordReview`'s transaction; `meta.doneToday` stays for the daily cap), "Klaar voor nu!", and the later-today
  line `laterToday` ("Volgende kaarten: 5 over ± 30 min" = when the 5th later card is due; < 5 → no line). Recomputed on screen change / focus plus ONE wake-up at
  `later.nextAt` — never a countdown. The review screen shows only the card.

## Study by topic, new-card pacing

- "Kies een onderwerp" (`src/screens/Topics.tsx`): multi-select of tags that have cards, alphabetical by label_nl (🔒 for
  locked curriculum tags). Stored in `meta.studyTags`; today's work then uses due + new cards with ANY selected
  tag. Empty = everything.
- A new card waits while ≥ `max_learning_backlog` cards are in short learning steps
  (`pickNextIndex` in src/session.ts).

## 🚩 Student flags ("Gemarkeerd") — local only

- `src/studentFlags.ts` + IndexedDB store `flags` (DB version 2): `{id, card_id, ts, note, resolved, updated_ts}`.
  Every tap is a new entry; resolving never deletes. Stable field names so a future sync could push them,
  but there is NO sync: they leave the phone only via her "Delen" (Web Share) or "Kopieer naar klembord".
- UI: 🚩 on every card in review (`FlagButton`: tap = flag + "Gemarkeerd" toast with "+ notitie";
  long-press = flag + note field; lit when the card has an open flag). "Gemarkeerd" screen (`screens/Marked.tsx`)
  shows ONE row per card (`groupFlags`: "3×", all notes; Opgelost resolves all its open flags); counts are cards.
- Menu: tap "SpeesRep" (`components/Menu.tsx`; red dot on the title = open 🚩 flags or unsent answers) → 📈 Voortgang,
  🚩 Gemarkeerd (count),
  ⚙️ Instellingen, ℹ️ Over SpeesRep (`screens/AboutScreen.tsx`: about, privacy, OpenMoji CC BY-SA 4.0 credit).
  Below them the sync status (`components/SyncBox.tsx`: last sync, cards, unsent answers, "Synchroniseren");
  home no longer shows it. Syncing stays automatic.
- A flag stores the card's name (`label`, at flag time and in `saveSnapshot` before cards are replaced), so
  "Gemarkeerd" still names a card that left the phone (e.g. not approved).
- Strings use the `mark.*` i18n keys. Never mix up with `Card.flags` / `flag.*` (sheet content markers:
  false-friend, separable).

## Domain rules

- Card types (internal codes): `word` (dubbel), `oneway` (enkel: nl → answer), `sentence` (target word in
  `{braces}` → cloze), `question` (fr = prompt/front, nl = answer/back).
- Two FSRS tracks: word cards have `recog` (NL→FR, listening) and `prod` (FR→typed NL);
  sentence/question cards only `prod`. `prod` unlocks when `recog` stability ≥ `unlock_prod_stability_days`.
- Scheduling (`src/scheduler.ts`, `src/session.ts`): ts-fsrs, fuzz on, retention from Settings. The four
  outcomes are computed once when the answer is revealed; the tapped one is applied, so the interval on
  the button is exactly what is scheduled. Steps inside the due window (< due_window_minutes) come back in the same run.
- New cards per day capped by Settings.`new_per_day`, ordered by `added` (then sheet order). A word's
  unlocked `prod` track has its own cap of the same size. Today's introductions are stored (`meta.intro`).
- Each rating = progress + outbox event + intro list in ONE IndexedDB transaction (`recordReview`).
  Pushed a few seconds later when online, and on every sync; removed only when the server confirms.
- Abbreviations (`ABBREV_SEED_CARDS`, enkel, flag `abbreviation` → badge "afkorting"): setup places each one in the
  category where it is first used, in the row directly above the first card that uses it (same `added`).
- Nouns always show de/het. Sheet flag `false-friend` shows the badge "valse vriend"; `separable` is NOT shown
  (`HIDDEN_FLAGS` in src/display.ts) — it stays in the sheet as teacher metadata.

## Offline and sync (never lose a review)

- The app shell is precached by the service worker; all active cards, settings, tags,
  curriculum and her Progress live in IndexedDB (`fanki-dev` / `fanki-prod`). `navigator.storage.persist()`.
- A rating writes progress + outbox event in one transaction. The outbox is pushed ~4 s later when online,
  immediately when the connection returns (also during review), and at every sync. Events leave the outbox
  only when the server lists them as accepted or duplicate; the server de-duplicates on `event_id`.
- Sync = push → pull cards/settings + Progress → merge (server wins only if newer AND no unsent local
  review) → push again. Runs at launch, when back online, when the app returns to the foreground (> 2 min
  since the last sync) and on "Synchroniseren" (in the menu).
- `useOnline()` is ONE shared flag (src/pwa.ts); don't add per-component online listeners.
- IndexedDB upgrades (bump the version in `db()`, add stores in `upgrade(d, oldVersion)` only): an open copy of the
  app closes its connection and reloads when a newer version needs to upgrade (`blocking`); if an old copy still
  blocks, a toast asks to close it (`blocked`). Copies from before 2026-10-02 don't let go — close them.
- Tests: `src/queue.test.ts` (idempotent push, lost replies, merge) and `e2e/offline.spec.ts` (Playwright:
  online load → offline reload → review → reconnect with a lost reply → exactly-once on the mock server).

## Deploy rules (standing instructions)

- **PROD deploy → keep her progress**: follow the "PROD safety checklist" in docs/RELEASE.md every time
  (`npm run backup:prod` before and after, additive changes only, dry runs, verify counts and the live app).
  Any change that would break PROD progress needs the teacher's explicit permission first.
- **DEV progress is expendable**: DEV cards may be moved/replaced/reset without asking.

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
  for OK, `setTags` (tags_source automatisch; handmatig rows are refused unless `manual:true`, the teacher's own
  choice, which keeps them handmatig).
- Word lists from files: parse, merge duplicates (tags combined), `appendInbox` (keeps tags_source; dedupes on
  type + nl + article). Source lists stay out of git (`.gitignore`, e.g. docs/klim-op-woordenlijst-frans.csv).
- `/addwords <theme, n, level>` — dedupe against Cards + Inbox, table, wait for OK, `appendInbox`
  (status voorgesteld). Never writes Cards.
- `/promote` — show `goedgekeurd` Inbox rows, wait for OK, `promoteInbox`.

Teacher review page: docs/SHEET.md › Teacher review page. Curriculum in plain words: docs/teacher-manual.md.
