# Google Sheet reference

Two spreadsheets, created by `setup()` in their Apps Script projects:

| Env  | Spreadsheet | Apps Script project |
|------|-------------|---------------------|
| DEV  | "Dutch DEV"  | `.clasp.dev.json`  |
| PROD | "Dutch PROD" | `.clasp.prod.json` |

**The sheet is in Dutch.** Card types are `dubbel` | `enkel` | `zin` | `vraag` (see below), part of speech is Dutch (`zelfstandig naamwoord`, `werkwoord`, `scheidbaar werkwoord`,
`bijvoeglijk naamwoord`, `bijwoord`, `uitdrukking`…), tag keys are Dutch (`huishouden`, `familie`…) and all
descriptions are Dutch. The API translates types to fixed internal codes, so only these
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
| flags | `false-friend`, `separable`, `abbreviation` | comma-separated content markers. `false-friend` shows the badge "valse vriend", `abbreviation` the badge "afkorting"; `separable` is for you only (not shown to her). |
| answer | text | **enkel only**: the back of the card, shown after "Antwoord tonen". Display text — never checked. |
| added | date | New cards are introduced in `added` order. Filled with today if blank. |
| active | checkbox | Untick to hide a card without deleting it (progress is kept). |
| controle | `goedgekeurd` \| `afgekeurd` \| blank | The teacher's approval. With Settings `require_approval` ☑ the app gets ONLY `goedgekeurd` cards (blank and `afgekeurd` stay hidden; her progress on them is kept and returns when approved). Set on the teacher page; approving an Inbox row sets `goedgekeurd`. All AI-made cards started blank on 2026-10-02 (`gecontroleerd` from the first version is read as `goedgekeurd`). |

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
- DEV **and** PROD: the 50 interface words (tag `app`, `added` 2026-09-27 so they are
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

`card_id, track, state, due, stability, difficulty, reps, lapses, last_review`

- One row per **(card_id, track)**.
- `track`: `recog` (recognise: NL → FR, listening) or `prod` (produce: FR → NL, cloze, questions; self-rated, nothing is typed).
  - word cards have both tracks; `prod` unlocks once `recog` stability ≥ `unlock_prod_stability_days`.
  - sentence and question cards only have `prod`.
- `state`: `New` | `Learning` | `Review` | `Relearning` (FSRS).
- Updated from each review's snapshot when the review is at least as new as `last_review`.
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

## Teacher pages (Start · Controleren · Curriculum)

Web pages in your browser, no tools needed. The bare link opens **Start**: three tiles — Controleren, Curriculum and
"De app delen met leerlingen" (the app link of this environment, Zet op beginscherm for iPhone/Android, offline, backup).
Every page has the same navigation bar; Controleren and Curriculum have an **ⓘ** button that folds open the
instructions for that page. All Dutch labels and instructions: `apps-script/TeacherStrings.html`; shared CSS
`TeacherStyle.html`, navigation `TeacherNav.html` (included with `include_()`).

- **DEV link:** https://script.google.com/macros/s/AKfycbzVIZa0_jQFiWZLehSn1ZPIrCTRn041Kto218MK-QMVklJclsyTATwae96EP77e__4d/exec
  (`?page=review` = Controleren, `?page=curriculum` = Curriculum)
- **PROD link:** https://script.google.com/macros/s/AKfycbypjhtKIajEpMxdfqjjmEh0dINaUVlysplSX4A76Q2E6dE8zZbsV476lplSwn8d5b2z/exec
  (both are saved in `deploy.config.json` → `teacherDeploymentId`; `npm run gas:deploy:<env>` keeps them).
- **Who can open it:** a Google login is required. The page runs **as the teacher who opens it**, so the teacher
  needs edit access to this spreadsheet (Share it with them), AND their address must be on the allowlist:
  `node scripts/admin.mjs <env> setTeachers '{"emails":"a@x.be, b@y.be"}'` (or `{"domain":"school.be"}` for a
  whole Workspace domain). The first time, Google asks the teacher to allow the script.
- The subject menu and the tag chips are alphabetical.
- **Controleren** (`?page=review`; no second title bar — the shared navigation is the header). **Inbox** (default):
  rows not yet in Cards, oldest first. **Kaarten**: search / filter by tag and by `controle` ("Nog niet goedgekeurd",
  "Goedgekeurd", "Afgekeurd", "Alle kaarten" = the default). Per card you can edit type, nl, lidwoord, pos, fr,
  answer (enkel), examples, tags (at least one: every card needs a subject) and flags.
- **Eén voor één** has five buttons: **Goedkeuren** (A; Inbox → Cards, added = today; Kaarten → `goedgekeurd`, also
  clears an old 🚩), **Afkeuren** (R; Kaarten only: the card goes back to the Inbox with your edits, same id, so her
  progress returns when you approve it again; in the Inbox it is already "afgekeurd", so the button is not shown),
  **‹ Vorige** (K), **Volgende ›** (J) and **Verwijderen** (deletes the Inbox row or the Cards row for good, after a
  confirm). There is no Opslaan: edits are saved by Goedkeuren, Afkeuren, Vorige and Volgende.
- **Lijst (5)**: per row Detail / Goedkeuren / Verwijderen (Inbox) or Afkeuren (Kaarten → Inbox), and
  **Keur alle 5 goed**. There is no 🚩 "nakijken" marking: a card that needs another look goes to the Inbox
  (the Cards.nakijken column and the Inbox status nakijken were removed on 2026-10-05, `admin <env> dropNakijken`).
- The public card API never serves these pages and the browser never gets a token.

### Curriculum editor (`?page=curriculum`)

The intended way to change the curriculum (the Curriculum tab can still be edited by hand). Server:
`apps-script/CurriculumEditor.gs` (`curriculumEditorLoad / Save / Restore`, each `requireTeacher_()`); page:
`CurriculumPage.html` + pure logic `CurriculumLogic.html`.

- The topics in order: number, label_nl + active cards, the rule as a sentence ("Altijd open", "Opent op 16 november
  2026", "Opent als 80% bekend is van: klok-1, app", "Dicht"), a preview line, and Omhoog / Omlaag / Verwijderen. Every subject (Tags row) is in the list; Dicht is how a
  subject is kept out for a while (a subject without a row, e.g. added in the Tags tab by hand, is written to the
  Curriculum as Dicht when the page loads — no Opslaan needed).
- **Verwijderen** (a subject): asks first with the numbers (cards that lose it, cards that then have no subject and go
  to the Inbox — and how many of those she already studied —, Inbox rows, topics that waited on it), then removes the
  tag from Cards and Inbox, its Curriculum row, the tag from other rows' van_tags, and the Tags row
  (`curriculumEditorDeleteTopic`, version-checked; only without unsaved changes). Dicht is the way to close a subject
  for a while.
- Tap a topic: first its **name** (Tags.`label_nl`, as the student sees it; Opslaan stores it; the tag code stays, so
  every card keeps its subject), then the rule picker (Altijd open / Op een datum / Als genoeg kaarten bekend zijn / Dicht (tijdelijk gesloten)).
  Only the fields of that rule show; switching rules never clears the hidden fields. van_tags can only be chosen from
  topics ABOVE; after a reorder or delete, van_tags that are no longer above are dropped and the page says which
  (never on a dicht row).
- Preview (server data): datum → "Opent over N dagen" / "Staat open"; bekend → today's score per van_tag
  ("klok-1: 62% van 80%") from the Progress tab, or "voortgang staat alleen op de telefoon" when Progress is empty;
  dicht → "Dicht: wordt niet aangeboden." It cannot see her latch.
- **Nieuw onderwerp** (bottom of the page): name (label_nl), optional French name; the code (tag key) is made from the
  name ("Op het werk" → `op-het-werk`). It becomes a Tags row and, at once, a Dicht row at the bottom of the
  Curriculum (`curriculumEditorNewTopic`; no Opslaan needed); it is in the tag chips of Controleren at once. The Tags tab is the list of subjects; new ones are made here.
- **Every card needs a subject:** Goedkeuren (Inbox and Kaarten) refuses a card without a tag, and saving a card in
  Kaarten without any tag is refused ("Terug naar Inbox" instead). Untagged cards were moved to the Inbox on 2026-10-05.
- Opslaan / Laad opnieuw / Ongedaan maken sit in a bar fixed at the bottom of the screen. "Tik op een
  onderwerp om het te wijzigen" and the "Bekend = …" line (values from Settings) are in the ⓘ panel.
- The navigation shows a red dot on **Controleren** (and on its Start tile, with the counts) when the Inbox has rows or
  Cards has cards that are not yet goedgekeurd/afgekeurd (`reviewTodo_`, counted when a page opens).
- **Opslaan**: `curriculumSavePlan_` (the shared `validateCurriculum_`); errors per topic in plain Dutch and NOTHING
  is written; warnings are shown but allow saving. Inside LockService the whole tab is written at once, after a
  version check (`curriculumVersion_`, a hash of the tab taken at load): if someone changed the tab meanwhile →
  "Het curriculum is intussen gewijzigd, laad opnieuw" and nothing is written. The previous table is kept in the
  hidden tab `Curriculum_backup` (1 version); **Ongedaan maken** puts it back once (undo of the last Opslaan; the
  backup is then emptied, so the button disappears until the next Opslaan).
- First visit: a closable hint with the four rules (remembered in that browser).
- Unit tests: `src/curriculumEditor.test.ts` (save plan, loops, unknown tags, above-only van_tags, missing
  percentage/date, duplicate order, version conflict, hidden values kept, reorder never touches a dicht row).

**Manual test list (after `npm run gas:deploy:<env>`):**
1. Bare teacher link → Start with three tiles; the share tile shows this environment's app link.
2. Navigation Start / Controleren / Curriculum works; ⓘ on Controleren and Curriculum folds the instructions open/closed;
   the red dot on Controleren shows while the Inbox or unchecked/🚩 cards wait.
3. Curriculum: open a topic, switch the rule to Dicht and back → the old values are back.
4. Move a bekend topic above its van_tag → the page says which van_tag was removed.
5. Make an error (bekend without van_tags) → Opslaan shows the error next to that topic; the tab is unchanged.
6. Fix it, Opslaan → "Opgeslagen…"; the tab and the Dashboard show the change; Curriculum_backup holds the old one.
7. Open the page in two tabs, save in one, then save in the other → "Het curriculum is intussen gewijzigd…".
8. Ongedaan maken → the table from before the last Opslaan is back; the button disappears.
9. Add a tag by hand in the Tags tab, reload the page → it is at the bottom as Dicht ("Toegevoegd als Dicht: …").
10. Nieuw onderwerp → it appears at the bottom as Dicht and in Controleren's tag chips.
11. Controleren: Goedkeuren a card without a tag → refused with "kies minstens één onderwerp (tag)". Eén voor één shows
    Goedkeuren / Afkeuren (Kaarten) / Vorige / Volgende / Verwijderen; an edit is kept after Volgende; Afkeuren puts a
    card in the Inbox.
13. Curriculum › Verwijderen on a test subject → the confirm shows the numbers; afterwards its cards without another
    subject are in the Inbox.
12. On a phone: everything fits, buttons are tappable, Opslaan stays visible while scrolling.

## Inbox — proposed new cards

Same columns as Cards plus `status` (`voorgesteld` | `goedgekeurd`). `/addwords` writes rows here as
`voorgesteld`. Review them, set `status` to `goedgekeurd` (edit anything you like), then run `/promote`
to move them into Cards. Nothing is ever written to Cards by `/addwords`.

## Settings (key | value | description)

| key | default | meaning |
|---|---|---|
| new_per_day | 10 | New cards introduced per local day. The app reads it only through `getNewPerDay()` (src/today.ts) |
| desired_retention | 0.9 | FSRS target recall probability (0.7–0.97) |
| unlock_prod_stability_days | 3 | When a word's `recog` stability reaches this many days, the FR → NL (`prod`) track starts |
| show_french_help | TRUE | Shows the "Hulp" button (French help) and the one-time rating overlay. Untick when she's ready. |
| known_stability_days | 7 | A card is "bekend" from this FSRS stability (main track: words recognising, others the only track). Curriculum rule `bekend` and Voortgang |
| known_min_reviews | 2 | … and only after at least this many reviews |
| require_approval | FALSE | ☑ = the app gets only Cards with `controle` = goedgekeurd. Turn on with `admin <env> enableApproval` (dry run first; `approveStudied` approves + 🚩 the cards she has studied, default on). On in DEV and PROD since 2026-10-02 |
| listen_share | 0.3 | Share of word-recognition reviews that start with only the sound (🔊 "Wat hoor je?"); 0 = off. Only on phones with a Dutch voice |
| max_learning_backlog | 3 | The next NEW card waits while this many cards are still in their short "again in minutes" steps |
| due_window_minutes | 10 | Round membership by the card's OWN step (from its rating to its due time): a step SHORTER than this keeps the card in the round (❌ Opnieuw 1 min, 😅 Moeilijk ~6 min on a new card); a step of 10 min or more (✅ Goed on a new card, ❌ Opnieuw on a review card) leaves the round until its due time has really passed. Not "distance from now", so a 10-minute Goed never comes back early. 10 since 2026-10-12 (was 5 under the old rule) |
| max_reviews_per_day | 100 | Silent cap on the due part of today's work; the rest stays due and rolls to tomorrow |
| lapse_queue_threshold | 20 | Long runs only: when MORE than this many due (non-new) cards remain in the run at the moment of rating, a card the student already knew and now rates ❌ Opnieuw is retried later in the same run (below) |
| lapse_requeue_min | 5 | … at least this many cards later (random between min and max; after the last card when fewer remain — never next) |
| lapse_requeue_max | 10 | … at most this many cards later |
| easy_first_interval_days | 14 | 😎 Makkelijk on the FIRST review of a NEW card (recognition track only): due after this many days ±15 % (12–16 d at 14). FSRS's own stability (8.3 d) is kept; only the due date and scheduled_days change, so the next review is simply a bit later for FSRS. The prod track and all later reviews keep FSRS's values. 0 = FSRS's own (about 6–10 d) |
| lapse_max_retries | 2 | … at most this many retries per card per run; after that the card follows its FSRS due time |

Removed 2026-10-04 (`admin <env> cleanSettings` deletes the rows, dry run first): `cooldown_minutes`,
`session_max_cards`, `session_max_minutes`, `session_extra_cards`, `session_resume_minutes`,
`min_reviews_to_count`, `compliments_enabled`; on 2026-10-05 `mature_stability_days` and `curriculum_only`
(replaced by `known_stability_days` / `known_min_reviews`; every topic now needs a Curriculum row). The Breaks and Compliments tabs are gone too
(`admin <env> deleteTabs`).

All settings are read by the phone on every sync — change them here, no redeploy.

**Deleted on the phone (never in this Sheet):** the student can delete a card on the review screen (🗑️, shown only
after "Antwoord tonen", then a confirmation). That only affects that phone: the card stays in Cards, her earlier answers stay in Log and Progress,
and other devices or students still see it. The phone keeps the list (`meta.deletedCards`, also in her JSON backup)
and never shows the card again, even after a sync. To bring it back on that phone, the student has to restore an
older backup or reinstall the app.

**Phone-only settings (never in this Sheet):** on her phone, menu › ⚙️ Instellingen, she can override three
things for herself. They are stored only on her device (IndexedDB `meta.userSettings`) and never sent to the
Sheet or any server; they leave the phone only in her own JSON backup.
- "Max. aantal nieuwe woorden per dag" (5 / 10 / 15 / 20; "Standaard (X)" = `new_per_day` from this tab when that
  value is not one of the four). Her choice wins over `new_per_day`.
- "Luisteroefeningen" aan/uit (default aan when the phone has a Dutch voice; without one it is off).
- "Antwoord voorlezen" aan/uit (default aan, needs a Dutch voice): when she taps "Antwoord tonen" and the answer is
  Dutch (fr→nl, vraag, zin, enkel), the phone reads it out once. Never the French back of nl→fr or a listening card.

## Curriculum — which topics bring new cards

`order, tag, regel, datum, percentage, van_tags` (row 1 = headers; the API reads them by name). In plain words for
the teacher: docs/teacher-manual.md.

Each topic has its OWN rule. The row above no longer opens the next one.

| column | meaning |
|---|---|
| order | 1, 2, 3 … Only decides which OPEN topic fills the daily new-card slots first. Never when a topic opens |
| tag | a key from the Tags tab (dropdown) |
| regel | `altijd` · `datum` · `bekend` · `dicht` (see below) |
| datum | only for `datum`: the topic opens at local midnight (the phone's time zone) on this day |
| percentage | only for `bekend`: whole number 1–100 |
| van_tags | only for `bekend`: comma-separated tag keys; each must stand HIGHER in the list (lower order), so loops are impossible |

**The four rules**
- `altijd`: open from the start.
- `datum`: open from midnight on `datum`.
- `bekend`: open when EVERY tag in `van_tags` has at least `percentage` % of its active cards bekend.
- `dicht`: closed now. The other columns are ignored but kept, so switching back restores them. Use it to park a
  topic with its settings. No effect on other rows (a row that waits on a dicht topic gets a warning).

**Bekend:** a card's main track (word: recognising; zin/vraag/enkel: the only track) has stability ≥
Settings `known_stability_days` (7) AND reps ≥ `known_min_reviews` (2). A tag's score = bekend / active cards with
that tag; a tag with no active cards scores 100 %.

**Latch:** the phone evaluates the rules at every sync/launch and on every screen. Once a topic is open it stays
open: the phone stores it with the date in IndexedDB `meta.curriculumOpened`, so a later lapse never re-locks it.
`dicht` overrides the latch and removes the tag; when the rule changes away from `dicht`, the topic is evaluated from
scratch. A tag whose row is deleted, or whose date is moved into the future, stays open only if it was already
latched. A row with an error (see below) is closed and opens nothing, but an existing latch stays (no new latch).
The latch lives only on the phone (also in her JSON backup); the Dashboard cannot see it.

**No row = never.** A tag without a row never opens; cards without any curriculum tag are never introduced. There
is no other state (`curriculum_only`, `active`, `unlock_threshold`, `min_reviews`, `max_wait_days` and the old
`open` column are gone since 2026-10-05).

**New cards:** a card is eligible when at least ONE of its tags is open. The day's quota (`getNewPerDay()`) is filled
from the open topics in `order` (cards by `added`); a card matching several open tags is introduced once. Cards she
already started keep coming back for review whatever their topic's state. "Kies een onderwerp" lists the topics
with a row that is not `dicht` (and that have cards); 🔒 = not open yet.

**Validation** (`validateCurriculum_` in apps-script/Curriculum.gs, the same rules as `validateCurriculum` in
src/curriculum.ts; plain Dutch messages, shown on the Dashboard): tag present, in Tags and only once; order a
whole number ≥ 1 and unique; `regel` one of the four; `datum` needs a valid date; `bekend` needs a percentage 1–100
and at least one van_tag that is in Tags, in the Curriculum and higher in the list. A `dicht` row skips the rule
checks. Warnings (no error): a topic with no active cards; a `bekend` row waiting on a `dicht` topic.

**Migration (2026-10-05, `admin <env> migrateCurriculum`, dry run first):** old row N+1 became `bekend`
round(100 × row N's `unlock_threshold`) van row N; threshold 0, `altijd open` and the first row became `altijd`;
old `dicht` became `dicht` (the old "dicht closes every automatic row below" no longer exists). Then the seed
app/klok-1 = altijd, klok-2 = bekend 80 van klok-1, klok-3 = bekend 80 van klok-2, and every topic with 0 active
cards = `dicht` (a `bekend` row that waited on one of them now waits on the nearest topic above it with cards). It also removed Progress.`first_review` and the old Settings rows.

## Studying now (phone only)

No sessions, no timers, no cooldown. What she can study NOW is one finite round (`src/today.ts`, `planToday` in
src/session.ts):

- **In the round:** every started card whose due time has PASSED, or whose own step (from its last rating to its due
  time) is SHORTER than `due_window_minutes` (`inRound`, src/today.ts: 9-min step in, 10-min step out — even 1 ms after
  the rating), oldest first, capped at `max_reviews_per_day` (counting today's finished due reviews; the overflow
  stays due and rolls to tomorrow, silently) + today's remaining new cards (`getNewPerDay()`, per local day).
- **Order:** due cards first, one new card after every 3 due cards, then the remaining new cards; a new card
  waits while `max_learning_backlog` cards are in short steps. Stopping is always allowed: every rating is saved.
- **After a rating:** the card comes back in the same run ONLY if its new step is short (strictly less than
  `due_window_minutes`: ❌ Opnieuw 1 min, 😅 Moeilijk ~6 min on a new card). ✅ Goed (10 min), 😎 Makkelijk and ❌ Opnieuw
  on a review card (10 min) leave the run: the bar counts the card as done and home lists it under "Volgende
  kaarten"; it rejoins only when its due time has actually passed (at the end of the running queue, or Starten on
  home, which wakes up exactly then). One rule decides the round, the comeback, "done" and the later-today line. A card that
  came back is not shown before its due time while other cards are ready (if nothing else is left, it is shown).
- **Lapse retry (long runs):** above `lapse_queue_threshold` remaining due cards, a NON-new card rated ❌ Opnieuw
  comes back `lapse_requeue_min`..`lapse_requeue_max` cards later in the same run (it may come before its 10-minute
  relearning step; FSRS, steps and intervals are unchanged, the retry is a normal review in the Log), at most
  `lapse_max_retries` times per card per run. At or below the threshold nothing changes. Moeilijk and new cards are
  never retried this way. A card that passes on the retry gets days, so it is not in the later-today line.
- **Joining during the run:** after each rating, cards whose due time has passed meanwhile (same rules as the round:
  topics, daily cap) are added at the END of the running queue — never before the current card. The Vandaag bar's
  count stays and its total grows (a running round takes arrivals).
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

## Rating buttons (phone only)

The four buttons always go up, strictly: ❌ Opnieuw < 😅 Moeilijk < ✅ Goed < 😎 Makkelijk, for the stored due time
AND the label under the button, for every card (new, learning, relearning, review). This is post-processing only
(`src/intervalGuard.ts`); FSRS parameters, steps and fuzz are untouched.

- **Due times:** from low to high, a button whose due time is equal to or earlier than the one below it moves to the
  next rung above that one: 1 min, 5 min, 10 min, 30 min, 1 u, 6 u, 1 d, 2 d, 3 d, whole days up to 100 d, then
  whole weeks, months and years. A push can cascade upwards; nothing ever moves down. Measured on 20,000 random cards
  per state (2026-10-12): new cards never needed it; learning cards had Goed = Makkelijk in 9 % (Makkelijk +1 d);
  relearning cards in up to half the cases (Goed +1–2 d, Makkelijk +1–3 d); review cards almost never (0.1 %).
- **Labels:** when two neighbouring due times differ but would look the same (review cards: 52 d and 71 d both
  "2 mnd"), the due dates stay and that pair gets finer labels (whole days up to ~100 d, then weeks; hours and
  minutes only when still needed).
- First review of a new card (recognition only): 😎 Makkelijk uses `easy_first_interval_days` ±15 % (see Settings),
  applied before the order guard, so the ladder still holds.
- The label and the stored due time come from the same final value: what the button shows is what gets scheduled.

## Dashboard (formulas, read-only)

Column A–B: te herhalen (all directions), goed onthouden (30 days), herhalingen deze week, actieve
kaarten, laatst gesynchroniseerd (= newest Log `ts`), and the 10 most-forgotten cards.

Columns D–I: **Curriculum** — one row per Curriculum tag: regel, status (open / opent op <datum> / wacht op <tags> /
dicht / fout), bekend / cards, the score of each van_tag against the percentage, and errors/warnings in plain Dutch.
Same logic as the phone (`curriculumStatus_` mirrors src/curriculum.ts) but without her latch. Refreshed after
reviews arrive (at most every 10 minutes) and by setup.
