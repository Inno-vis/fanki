# Google Sheet reference

Two spreadsheets, created by `setup()` in their Apps Script projects:

| Env  | Spreadsheet | Apps Script project |
|------|-------------|---------------------|
| DEV  | "Dutch DEV"  | `.clasp.dev.json`  |
| PROD | "Dutch PROD" | `.clasp.prod.json` |

**The sheet is in Dutch.** Card types are `dubbel` | `enkel` | `zin` | `vraag` (see below), tags_source is `handmatig` |
`automatisch`, part of speech is Dutch (`zelfstandig naamwoord`, `werkwoord`, `scheidbaar werkwoord`,
`bijvoeglijk naamwoord`, `bijwoord`, `uitdrukking`…), tag keys are Dutch (`huishouden`, `familie`…) and all
descriptions are Dutch. The API translates types/tags_source to fixed internal codes, so only these
spellings matter. The text columns (nl, fr, examples) are plain text, so "7:15" stays "7:15".

Row 1 is always the header row (frozen). Setup sets readable column widths and wraps long text on every
tab (`apps-script/Layout.gs`), so you don't need to resize — the Log tab is protected (the app writes it), so
Google asks for confirmation if you resize or edit there; that is expected and safe to accept for widths. The API reads columns **by header name**, so columns can be
reordered, but never rename a header. `setup()` is idempotent: re-running it repairs headers,
validation and the Dashboard, seeds only empty tabs, and seeds Cards only in DEV.

## Not in the sheet: 🚩 "Gemarkeerd" (student flags)

During review the learner can tap 🚩 on any card (long-press or "+ notitie" adds a short note). These are
stored **only on her phone** (shown without dates) (IndexedDB store `flags`: id, card_id, ts, note, resolved, updated_ts) and are
never synced to this sheet. She sees them on the "Gemarkeerd" screen (🚩 badge on the home screen), can mark
them "Opgelost", and sends them to you herself with "Delen" (share sheet) or "Kopieer naar klembord".
This has nothing to do with the Cards `flags` column (false-friend / separable), which is content you set.

## User info — start guide for the learner

First tab. 12 short steps (install from the link, first sync, the four buttons, sessions, pause, offline,
topics, Hulp, updates, "don't clear Safari data") in Dutch (A1) and French; the PROD sheet has the PROD link,
the DEV sheet the DEV link. Filled by setup when empty; `node scripts/admin.mjs <env> userInfo` rewrites it
from `apps-script/UserInfo.gs` (your own edits in the tab are then replaced).

## Cards — the content (teacher edits this)

| column | values | notes |
|---|---|---|
| id | `c_xxxxxxxxxx` | Leave blank: the script fills it (on edit, and on the next sync). Never change an id once reviewed. |
| type | `dubbel` \| `enkel` \| `zin` \| `vraag` | dropdown — see **Card types** below |
| nl | text | **dubbel**: the Dutch word. **enkel**: the prompt (front). **zin**: wrap the target word in `{curly braces}` → it becomes the cloze blank. **vraag**: the answer (back of the card). |
| article | `de` \| `het` \| blank | Required for nouns — the app always shows it. |
| pos | free text | `zelfstandig naamwoord`, `werkwoord`, `scheidbaar werkwoord`, `bijvoeglijk naamwoord`, `uitdrukking`… (not shown to her) |
| fr | text | **dubbel/zin**: French translation. **vraag**: the prompt (front, e.g. "Demande…"). **enkel**: optional small French hint under the prompt. |
| example_nl / example_fr | text | optional example shown after the answer |
| tags | `huishouden, school` | comma-separated keys from the Tags tab; may be empty |
| tags_source | `handmatig` \| `automatisch` \| blank | `handmatig` = the teacher chose; `/retag` never touches these. `automatisch` = set by `/retag`. |
| flags | `false-friend`, `separable`, `abbreviation` | comma-separated content markers. `false-friend` shows the badge "valse vriend", `abbreviation` the badge "afkorting"; `separable` is for you only (not shown to her). |
| answer | text | **enkel only**: the back of the card, shown after "Antwoord tonen". Display text — never checked. |
| added | date | New cards are introduced in `added` order. Filled with today if blank. |
| active | checkbox | Untick to hide a card without deleting it (progress is kept). |
| controle | `goedgekeurd` \| `afgekeurd` \| blank | The teacher's approval. With Settings `require_approval` ☑ the app gets ONLY `goedgekeurd` cards (blank and `afgekeurd` stay hidden; her progress on them is kept and returns when approved). Set on the teacher page; approving an Inbox row sets `goedgekeurd`. All AI-made cards started blank on 2026-10-02 (`gecontroleerd` from the first version is read as `goedgekeurd`). |
| nakijken | checkbox | 🚩 = look at this card again. Does not hide the card. Cleared by Goedkeuren / Afkeuren. |

### Seed data

- DEV only: the 24 sample cards (words, cloze sentences, questions).
- The clock course (ids `K1-01`…`K3-08`, tags `klok-1/2/3`, added 2026-09-30): 8 `dubbel` words + 21 `enkel`
  cards, plus the app word *minuut* tagged `klok-3`. Replaced the earlier `L1-`…`L3-` set via
  `node scripts/admin.mjs <env> replaceKlok '{"dryRun":false}'` (dry run by default).
- DEV only (for now): the emoji course — 58 `enkel` cards (ids `E-01`…`E-58`, front = emoji, back = the Dutch word
  with de/het), tag `emoji`, Curriculum order 3, added 2026-10-02. Added with `node scripts/admin.mjs dev seedEmoji
  '{"dryRun":false}'` (dry run by default; refuses PROD unless `allowProd`), not by setup.
- DEV **and** PROD (setup): 8 abbreviation cards (`enkel`, ids `A-01`…`A-08`, badge "afkorting" = flag
  `abbreviation`, back = full word(s) + French). Each sits in the category where it is first used, directly before
  the first card that uses it: `min` in klok-1 just above "5 min + 5 min" (K1-07), `u` in klok-1 just above
  "Het is 3:00u" (K1-05). `d`, `wk`, `mnd`, `jr` (rating buttons) and `ev`, `mv` (not used yet) go first in `app`
  (added 2026-09-26). New abbreviations: add a line to ABBREV_SEED_CARDS with the card it must precede.
- DEV **and** PROD: the 50 interface words (tag `app`, `tags_source` manual, `added` 2026-09-27 so they are
  introduced before everything else). `setup()` adds any that are missing and never duplicates.

Emoji cards: the app shows the self-hosted OpenMoji picture for the emoji in `nl` (`npm run openmoji` after
adding new emoji cards); the sheet keeps the emoji character.

### Card types

| type (sheet) | API code | front | back | directions |
|---|---|---|---|---|
| `dubbel` | word | nl (with de/het) | fr | both: NL → FR, and FR → NL once recognition is steady |
| `enkel` | oneway | nl (the prompt) | answer | one |
| `zin` | sentence | nl with `{blank}` + fr | the missing word | one |
| `vraag` | question | fr (prompt) | nl | one |

Every card is self-rated (reveal, then ❌ 😅 ✅ 😎). Old values `woord` (= dubbel) and `calc` (= enkel) are
still read.

### Writing `enkel` clock cards (keep future cards consistent)

- `nl` uses explicit Dutch units only: durations "X min", clock times "HH:MMu" ("11:55u + 15 min = ...",
  "Het is 4:30u. Hoe laat is het?").
- **Answer formatting rule.** When a DURATION answer is exactly 15, 30, 45, 60 or 90 minutes, write both forms:
  "15 min of een kwartier", "30 min of een half uur", "45 min of drie kwartier", "60 min of een uur",
  "90 min of anderhalf uur". Any other duration: plain minutes ("20 min"). A clock-TIME answer ("12:10u")
  never gets the second form. Exception: when the prompt itself already names that unit
  ("Een kwartier = ... min" → "15 min").

- **Dagdeel rule (clock times).** A clock-time answer is written `HH:MMu`.
  - Hour with ONE digit (1–9, e.g. "9:07u") → unchanged, no dagdeel.
  - Hour with TWO digits (10–23, or `00` for midnight — always "00:MMu", never "0:MMu") → append
    " of <spoken form> 's <dagdeel>": "15:15u of kwart over drie 's middags", "00:45u of kwart voor één 's nachts",
    "10:00u of tien uur 's ochtends".
  - In sums the prompt time uses the same number of hour digits as the answer: "09:40u + 20 min = ..." →
    "10:00u of tien uur 's ochtends" (not "9:40u").
  - Reading cards ("Het is 11:23u. Hoe laat is het?") follow the digit count of the time in the PROMPT; their
    answer is already spoken, so it only gets " 's <dagdeel>" ("zeven voor half twaalf 's ochtends").
  - Dagdeel: 06:00–11:59 's ochtends · 12:00–17:59 's middags · 18:00–23:59 's avonds · 00:00–05:59 's nachts.
  - Spoken form: on or past the hour name the current hour ("tien uur", "tien over twaalf", "kwart over
    drie"); before the next hour name the next one ("kwart voor één", "zeven voor half twaalf"). Number
    words, not digits; 0 and 12 are "twaalf".
  - Durations ("X min", "15 min of een kwartier") are not affected.

### Subject label

Above each card the app shows `subject_nl` of the FIRST tag on the card that has one (Tags tab), e.g.
"De tijd". No label when none of its tags has a subject.

## Progress — scheduling state (written by the API; rebuildable from Log)

`card_id, track, state, due, stability, difficulty, reps, lapses, last_review, first_review`

- One row per **(card_id, track)**.
- `track`: `recog` (recognise: NL → FR, listening) or `prod` (produce: FR → typed NL, cloze, questions).
  - word cards have both tracks; `prod` unlocks once `recog` stability ≥ `unlock_prod_stability_days`.
  - sentence and question cards only have `prod`.
- `state`: `New` | `Learning` | `Review` | `Relearning` (FSRS).
- Updated from each review's snapshot when the review is at least as new as `last_review`.
- `first_review`: the first time she saw that card+track (set by the API; backfilled from Log by setup).
  The curriculum uses it as "first shown".
- To rebuild exactly: `npm run admin -- dev rebuildProgress` (latest Log snapshot per card+track).

## Log — review events (append-only, written by the API)

`event_id, card_id, track, ts, rating, mode, duration_ms, snapshot`

- `event_id`: uuid made on the phone. The API **ignores an event_id it already has**, so a sync
  that is retried or interrupted never creates duplicates.
- `rating`: 1 = Again (❌ Opnieuw), 2 = Hard (😅 Moeilijk), 3 = Good (✅ Goed), 4 = Easy (😎 Makkelijk).
- `mode`: `nl_fr`, `fr_nl`, `cloze`, `question`, `listen`.
- `snapshot`: JSON `{state, due, stability, difficulty, reps, lapses, learning_steps, scheduled_days}`
  after the review.
- Don't edit or sort this tab (it has a warning-only protection).

## Tags

`tag, label_nl, label_fr, description, subject_nl` — the tag vocabulary.

- `tag`: the key used in Cards.tags — lowercase, no spaces (`household`, `wiskunde`…). Never rename a key
  that cards use.
- `label_nl`: what the learner sees in the filter screen ("Kies een onderwerp").
- `label_fr`, `description`: for the teacher only.
- `subject_nl`: short subject shown above the card during review (e.g. klok-1/2/3 = "De tijd"). Blank = none.

Seed keys (= label_nl unless noted): huishouden, school, wiskunde, familie, reizen, eten, werk, gezondheid,
winkelen, tijd, app, klok-1 ("klok niveau 1"), klok-2 ("klok niveau 2"), klok-3 ("klok niveau 3").

## Teacher review page ("SpeesRep – controleren")

A web page in your browser, no tools needed: review the Inbox and edit Cards.

- **DEV link:** https://script.google.com/macros/s/AKfycbzVIZa0_jQFiWZLehSn1ZPIrCTRn041Kto218MK-QMVklJclsyTATwae96EP77e__4d/exec?page=review
- **PROD link:** https://script.google.com/macros/s/AKfycbypjhtKIajEpMxdfqjjmEh0dINaUVlysplSX4A76Q2E6dE8zZbsV476lplSwn8d5b2z/exec?page=review
  (both are saved in `deploy.config.json` → `teacherDeploymentId`; `npm run gas:deploy:<env>` keeps them).
- **Who can open it:** a Google login is required. The page runs **as the teacher who opens it**, so the teacher
  needs edit access to this spreadsheet (Share it with them), AND their address must be on the allowlist:
  `node scripts/admin.mjs <env> setTeachers '{"emails":"a@x.be, b@y.be"}'` (or `{"domain":"school.be"}` for a
  whole Workspace domain). The first time, Google asks the teacher to allow the script.
- **Inbox** (default): rows with status `voorgesteld`, oldest first. Per row you can edit type, nl, lidwoord, pos,
  fr, answer (enkel), examples, tags (from the Tags tab) and flags.
  - **Goedkeuren** (A): checks the required fields, then moves the row into Cards (added = today, active).
  - **Afwijzen** (R): deletes the Inbox row. **Opslaan** (S): saves, stays `voorgesteld`.
- **Kaarten**: search / filter by tag and by `controle`: "Nog niet goedgekeurd" (default), "🚩 Nakijken",
  "Goedgekeurd", "Afgekeurd", "Alle kaarten" (counts in the menu). **Goedkeuren** (A) saves any edits, checks the
  required fields and sets `goedgekeurd`; **Afkeuren** (R) sets `afgekeurd` (hidden, nothing deleted, undo by
  approving); **🚩 Nakijken** (F) toggles `nakijken`. In Lijst (5) every row has Goedkeuren / Afkeuren and
  **Keur alle 5 goed** approves the visible rows except the 🚩 ones. A line under the filters says whether
  `require_approval` is on. **Opslaan** writes back to Cards;
  **Terug naar Inbox** moves a card back (it disappears from the app until approved again; same id, so her
  progress returns).
- **Eén voor één** (full form, keys A/R/S, F 🚩 nakijken, J next, K previous, ⌘/Ctrl+Enter save & next) or
  **Lijst (5)** to scan quickly: "Detail" opens a row, ⚐/🚩 marks it "nakijken", and **Keur alle 5 goed** (between
  "‹ Vorige 5" and "Volgende 5 ›") approves the visible rows except the 🚩 ones. The page opens on Inbox in Lijst (5). One filter bar for Inbox and Kaarten: tag (with counts, applies at once) and search (nl/fr/answer); Inbox adds "alleen 🚩 nakijken", Kaarten the controle filter and paging. Switching Inbox/Kaarten resets the tag and search. The header shows "12 van 47" and the session's approved/rejected.
- The public card API never serves this page and the browser never gets a token.

## Inbox — proposed new cards

Same columns as Cards plus `status` (`voorgesteld` | `nakijken` | `goedgekeurd`; `nakijken` = marked with 🚩 on the
review page to check later — it stays in the Inbox and is skipped by "Keur alle 5 goed"). `/addwords` writes rows here as
`voorgesteld`. Review them, set `status` to `goedgekeurd` (edit anything you like), then run `/promote`
to move them into Cards. Nothing is ever written to Cards by `/addwords`.

## Settings (key | value | description)

| key | default | meaning |
|---|---|---|
| new_per_day | 10 | New cards introduced per local day. The app reads it only through `getNewPerDay()` (src/today.ts) |
| desired_retention | 0.9 | FSRS target recall probability (0.7–0.97) |
| unlock_prod_stability_days | 3 | When a word's `recog` stability reaches this many days, the typing (`prod`) track starts |
| show_french_help | TRUE | Shows the "Hulp" button (French help) and the one-time rating overlay. Untick when she's ready. |
| mature_stability_days | 21 | A card counts as "bekend" (mature) for the curriculum at this FSRS stability |
| require_approval | FALSE | ☑ = the app gets only Cards with `controle` = goedgekeurd. Turn on with `admin <env> enableApproval` (dry run first; `approveStudied` approves + 🚩 the cards she has studied, default on). On in DEV and PROD since 2026-10-02 |
| curriculum_only | TRUE | New cards only from open Curriculum topics; other topics and untagged cards stay locked (reviews of started cards continue) |
| listen_share | 0.3 | Share of word-recognition reviews that start with only the sound (🔊 "Wat hoor je?"); 0 = off. Only on phones with a Dutch voice |
| max_learning_backlog | 3 | The next NEW card waits while this many cards are still in their short "again in minutes" steps |
| due_window_minutes | 5 | Cards due in LESS than this many minutes count as due now (the round), and only such short steps come back in the same run. Keep it below the "Goed" step of a new card (10 min). Set to 5 on 2026-10-04 |
| max_reviews_per_day | 100 | Silent cap on the due part of today's work; the rest stays due and rolls to tomorrow |

Removed 2026-10-04 (`admin <env> cleanSettings` deletes the rows, dry run first): `cooldown_minutes`,
`session_max_cards`, `session_max_minutes`, `session_extra_cards`, `session_resume_minutes`,
`min_reviews_to_count`, `compliments_enabled`. The Breaks and Compliments tabs are gone too
(`admin <env> deleteTabs`).

All settings are read by the phone on every sync — change them here, no redeploy.

**Phone-only settings (never in this Sheet):** on her phone, menu › ⚙️ Instellingen, she can override three
things for herself. They are stored only on her device (IndexedDB `meta.userSettings`) and never sent to the
Sheet or any server; they leave the phone only in her own JSON backup.
- "Max. aantal nieuwe woorden per dag" (5 / 10 / 15 / 20; "Standaard (X)" = `new_per_day` from this tab when that
  value is not one of the four). Her choice wins over `new_per_day`.
- "Luisteroefeningen" aan/uit (default aan when the phone has a Dutch voice; without one it is off).
- "Antwoord voorlezen" aan/uit (default aan, needs a Dutch voice): when she taps "Antwoord tonen" and the answer is
  Dutch (fr→nl, vraag, zin, enkel), the phone reads it out once. Never the French back of nl→fr or a listening card.

## Curriculum — which new cards come first

`order, tag, unlock_threshold, min_reviews, max_wait_days, active, open`

| column | default | meaning |
|---|---|---|
| order | | 1, 2, 3… (lowest first) |
| tag | | a key from the Tags tab (dropdown) |
| unlock_threshold | 0.8 | share of this tag's cards that must be "bekend" before the next row opens |
| min_reviews | 2 | a card also needs at least this many reviews to count as "bekend" |
| max_wait_days | 21 | the next row opens anyway this many days after this tag's first card was first shown (blank = never) |
| active | ☑ | unticked rows are skipped: their cards are FREE to come, and they don't hold back the next row (this does NOT lock a topic) |
| open | automatisch | `automatisch` = the rules below · `altijd open` = open now, whatever the rules say · `dicht` = locked (and every automatic row after it stays locked) |

**Lock / unlock a topic yourself:** set its `open` to `dicht` or `altijd open`; back to `automatisch` to let
the rules decide again. With Settings `curriculum_only` = TRUE (default), topics that have NO row here
(huishouden, reizen…) and cards without a tag are locked too — add a row (e.g. `altijd open`) to open one.

**Current setup (DEV and PROD, 2026-10-02):** 1 app · 2 emoji · 3 klok-1 — all three `altijd open` with
`unlock_threshold` 0 · 4 klok-2 · 5 klok-3 (automatisch, 0.8, 21 days). Because klok-1's threshold is 0, klok-2 is
open too; klok-3 opens when 80 % of klok-2 is bekend or 21 days after her first klok-2 card. Topics without a row
(huishouden, reizen…) stay locked (`curriculum_only`). New cards come from app first, then emoji, klok-1, klok-2.

**How the columns work together:** `unlock_threshold` of a row decides when the NEXT row opens (share of this
row's cards that must be bekend; 0 = next opens right away; `max_wait_days` = open anyway that many days after her
first card of this row). `open` decides the row ITSELF: automatisch (follow the row above), altijd open (open now),
dicht (closed now, and every automatisch row below it too).

**Algorithm** (phone: `src/curriculum.ts`; the Dashboard mirrors it in `apps-script/Curriculum.gs`):

1. A card is **bekend** (mature) when the stability of its main direction (woord: recognising; zin/vraag:
   the only direction) is ≥ `mature_stability_days` AND its reps ≥ the row's `min_reviews`.
2. A tag's **score** = bekend cards / active cards with that tag (a tag without cards scores 1).
3. The first active row is open. Row N+1 opens when row N is open AND (score(N) ≥ unlock_threshold OR
   `max_wait_days` have passed since row N's first card was first shown). This is recalculated on every
   sync/launch; nothing is stored, so reordering or retuning the tab takes effect immediately.
4. **Eligible new cards**: a card is eligible if AT LEAST ONE of its tags is an open Curriculum topic
   (inactive rows count as open). With `curriculum_only` = FALSE, cards without any curriculum tag are
   also eligible. The `open` column overrides step 3 per row.
5. **Filling today's `new_per_day` slots**: first the open curriculum tags by `order` (cards in `added`
   order), then the next open tag, then all other eligible cards by `added`. A card that matches several
   open tags is introduced once.
6. Cards she already started keep coming back for review even if their tag is (again) locked — the
   curriculum only decides what is *new*.

## Studying now (phone only)

No sessions, no timers, no cooldown. What she can study NOW is one finite round (`src/today.ts`, `planToday` in
src/session.ts):

- **In the round:** every started card due now or in LESS than `due_window_minutes` (strict: 9 min in, exactly 10
  min out), oldest first, capped at `max_reviews_per_day` (counting today's finished due reviews; the overflow
  stays due and rolls to tomorrow, silently) + today's remaining new cards (`getNewPerDay()`, per local day).
- **Order:** due cards first, one new card after every 3 due cards, then the remaining new cards; a new card
  waits while `max_learning_backlog` cards are in short steps. Stopping is always allowed: every rating is saved.
- **After a rating:** the card comes back in the same run ONLY if its next step is inside the due window
  (strictly less than `due_window_minutes`: ❌ Opnieuw 1 min, 😅 Moeilijk ~6 min). ✅ Goed (10 min) and 😎 Makkelijk
  leave the run: the bar counts the card as done and home lists it under "Volgende kaarten"; it joins the round
  again when its time is inside the window. One rule decides the round, the comeback and "done". A card that
  came back is not shown before its due time while other cards are ready (if nothing else is left, it is shown).
- **"Vandaag" bar = the current round** (`meta.round` on the phone): done in this round / (done + remaining),
  unique cards, with "Nog N kaarten". A card is done when its next due time is outside the window. When nothing
  is left the round is finished ("Klaar voor nu!"); the next time cards are there, a NEW round starts at 0. A
  card that arrives while a round is still going joins it (the total grows, the count stays). A new day starts a
  new round.
- **Later today:** "Volgende kaarten: 5 over ± 30 min" = when the 5th card due later today (at or after the
  window, before midnight) is due — coming back for one card is pointless. Fewer than 5 later today → no line.
  Rounded to 5 min below an hour, whole hours from 60 min. Shown whether or not Starten is there; cards due
  tomorrow never count. Static text (home opens / the app comes back), never a countdown; home wakes up ONCE when
  the first later card joins the round, so Starten comes back.
- The review screen shows only the card.

## Dashboard (formulas, read-only)

Column A–B: te herhalen (all directions), goed onthouden (30 days), herhalingen deze week, actieve
kaarten, laatst gesynchroniseerd (= newest Log `ts`), and the 10 most-forgotten cards.

Columns D–I: **Curriculum** — one row per active Curriculum tag: bekend / cards, score, open (ja/nee),
days until it opens automatically (blank if open, no cap, or the previous tag wasn't shown yet), first
shown. Refreshed after reviews arrive (at most every 10 minutes) and by setup.
