# Google Sheet reference

Two spreadsheets, created by `setup()` in their Apps Script projects:

| Env  | Spreadsheet | Apps Script project |
|------|-------------|---------------------|
| DEV  | "Dutch DEV"  | `.clasp.dev.json`  |
| PROD | "Dutch PROD" | `.clasp.prod.json` |

Row 1 is always the header row (frozen). The API reads columns **by header name**, so columns can be
reordered, but never rename a header. `setup()` is idempotent: re-running it repairs headers,
validation and the Dashboard, seeds only empty tabs, and seeds Cards only in DEV.

## Cards — the content (teacher edits this)

| column | values | notes |
|---|---|---|
| id | `c_xxxxxxxxxx` | Leave blank: the script fills it (on edit, and on the next sync). Never change an id once reviewed. |
| type | `word` \| `sentence` \| `question` | dropdown |
| nl | text | **word**: the Dutch word. **sentence**: wrap the target word in `{curly braces}` → it becomes the cloze blank. **question**: the expected Dutch answer. |
| article | `de` \| `het` \| blank | Required for nouns — the app always shows it. |
| pos | free text | `noun`, `verb`, `verb (separable)`, `adj`, `phrase`… |
| fr | text | **word/sentence**: French translation. **question**: the French prompt ("Demande…"). |
| example_nl / example_fr | text | optional example shown after the answer |
| tags | `household, school` | comma-separated, from the Tags tab; may be empty |
| tags_source | `manual` \| `auto` \| blank | `manual` = the teacher chose; `/retag` never touches these. `auto` = set by `/retag`. |
| flags | `false-friend`, `separable` | comma-separated badges shown on the card |
| added | date | New cards are introduced in `added` order. Filled with today if blank. |
| active | checkbox | Untick to hide a card without deleting it (progress is kept). |

### Seed data

- DEV only: the 24 sample cards (words, cloze sentences, questions).
- DEV **and** PROD: the 50 interface words (tag `app`, `tags_source` manual, `added` 2026-09-27 so they are
  introduced before everything else). `setup()` adds any that are missing and never duplicates.

## Progress — scheduling state (written by the API; rebuildable from Log)

`card_id, track, state, due, stability, difficulty, reps, lapses, last_review`

- One row per **(card_id, track)**.
- `track`: `recog` (recognise: NL → FR, listening) or `prod` (produce: FR → typed NL, cloze, questions).
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

`tag, label_nl, label_fr, description` — the tag vocabulary.

- `tag`: the key used in Cards.tags — lowercase, no spaces (`household`, `wiskunde`…). Never rename a key
  that cards use.
- `label_nl`: what the learner sees in the filter screen ("Kies een onderwerp").
- `label_fr`, `description`: for the teacher only.

Seed: household=huishouden, school=school, wiskunde=wiskunde, family=familie, travel=reizen, food=eten,
work=werk, health=gezondheid, shopping=winkelen, time=tijd, app=app.

## Inbox — proposed new cards

Same columns as Cards plus `status` (`proposed` | `approved`). `/addwords` writes rows here as
`proposed`. Review them, set `status` to `approved` (edit anything you like), then run `/promote`
to move approved rows into Cards. Nothing is ever written to Cards by `/addwords`.

## Settings (key | value | description)

| key | default | meaning |
|---|---|---|
| new_per_day | 8 | New cards introduced per day |
| desired_retention | 0.9 | FSRS target recall probability (0.7–0.97) |
| compliments_enabled | TRUE | Show a compliment every 3rd correct answer |
| unlock_prod_stability_days | 3 | When a word's `recog` stability reaches this many days, the typing (`prod`) track starts |
| show_french_help | TRUE | Shows the "Hulp" button (French help) and the one-time rating overlay. Untick when she's ready. |

## Compliments

`text` — one Dutch line per row (seed: "Goed zo!", "Prima!", "Top!", "Heel goed!", "Mooi gedaan!",
"Je wordt steeds beter!", "Uitstekend!", "Fantastisch!", "Ga zo door!", "Geweldig!",
"Ik ben trots op je!", "Perfect!", "Sterk!"). Shown as a small toast every 3rd correct answer.

## Dashboard (formulas, read-only)

Cards due (all tracks), success rate over 30 days, reviews this week, active cards,
last sync (= newest Log `ts`), and the 10 most-lapsed cards.
