# Google Sheet reference

Two spreadsheets, created by `setup()` in their Apps Script projects:

| Env  | Spreadsheet | Apps Script project |
|------|-------------|---------------------|
| DEV  | "Dutch DEV"  | `.clasp.dev.json`  |
| PROD | "Dutch PROD" | `.clasp.prod.json` |

**The sheet is in Dutch.** Card types are `woord` | `zin` | `vraag`, tags_source is `handmatig` |
`automatisch`, part of speech is Dutch (`zelfstandig naamwoord`, `werkwoord`, `scheidbaar werkwoord`,
`bijvoeglijk naamwoord`, `bijwoord`, `uitdrukking`…), tag keys are Dutch (`huishouden`, `familie`…) and all
descriptions are Dutch. The API translates types/tags_source to fixed internal codes, so only these
spellings matter. The text columns (nl, fr, examples) are plain text, so "7:15" stays "7:15".

Row 1 is always the header row (frozen). The API reads columns **by header name**, so columns can be
reordered, but never rename a header. `setup()` is idempotent: re-running it repairs headers,
validation and the Dashboard, seeds only empty tabs, and seeds Cards only in DEV.

## Cards — the content (teacher edits this)

| column | values | notes |
|---|---|---|
| id | `c_xxxxxxxxxx` | Leave blank: the script fills it (on edit, and on the next sync). Never change an id once reviewed. |
| type | `woord` \| `zin` \| `vraag` | dropdown |
| nl | text | **woord**: the Dutch word. **zin**: wrap the target word in `{curly braces}` → it becomes the cloze blank. **vraag**: the answer (back of the card). |
| article | `de` \| `het` \| blank | Required for nouns — the app always shows it. |
| pos | free text | `zelfstandig naamwoord`, `werkwoord`, `scheidbaar werkwoord`, `bijvoeglijk naamwoord`, `uitdrukking`… (not shown to her) |
| fr | text | **woord/zin**: French translation. **vraag**: the prompt (front of the card, e.g. "7:15" or "Demande…"). |
| example_nl / example_fr | text | optional example shown after the answer |
| tags | `huishouden, school` | comma-separated keys from the Tags tab; may be empty |
| tags_source | `handmatig` \| `automatisch` \| blank | `handmatig` = the teacher chose; `/retag` never touches these. `automatisch` = set by `/retag`. |
| flags | `false-friend`, `separable` | comma-separated badges shown on the card |
| added | date | New cards are introduced in `added` order. Filled with today if blank. |
| active | checkbox | Untick to hide a card without deleting it (progress is kept). |

### Seed data

- DEV only: the 24 sample cards (words, cloze sentences, questions).
- DEV **and** PROD: the 40 clock cards (`vraag`, ids `L1-01`…`L3-15`, tags `klok-1/2/3`, added 2026-09-29):
  front = `fr`, back = `nl`, self-rated like every card.
- DEV **and** PROD: the 50 interface words (tag `app`, `tags_source` manual, `added` 2026-09-27 so they are
  introduced before everything else). `setup()` adds any that are missing and never duplicates.

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

`tag, label_nl, label_fr, description` — the tag vocabulary.

- `tag`: the key used in Cards.tags — lowercase, no spaces (`household`, `wiskunde`…). Never rename a key
  that cards use.
- `label_nl`: what the learner sees in the filter screen ("Kies een onderwerp").
- `label_fr`, `description`: for the teacher only.

Seed keys (= label_nl unless noted): huishouden, school, wiskunde, familie, reizen, eten, werk, gezondheid,
winkelen, tijd, app, klok-1 ("klok niveau 1"), klok-2 ("klok niveau 2"), klok-3 ("klok niveau 3").

## Inbox — proposed new cards

Same columns as Cards plus `status` (`voorgesteld` | `goedgekeurd`). `/addwords` writes rows here as
`voorgesteld`. Review them, set `status` to `goedgekeurd` (edit anything you like), then run `/promote`
to move them into Cards. Nothing is ever written to Cards by `/addwords`.

## Settings (key | value | description)

| key | default | meaning |
|---|---|---|
| new_per_day | 8 | New cards introduced per day |
| desired_retention | 0.9 | FSRS target recall probability (0.7–0.97) |
| compliments_enabled | TRUE | Show a compliment every 3rd correct answer |
| unlock_prod_stability_days | 3 | When a word's `recog` stability reaches this many days, the typing (`prod`) track starts |
| show_french_help | TRUE | Shows the "Hulp" button (French help) and the one-time rating overlay. Untick when she's ready. |
| mature_stability_days | 21 | A card counts as "gekend" (mature) for the curriculum at this FSRS stability |
| session_max_cards | 15 | Cards before "Sessie voltooid! Wil je doorgaan?" |
| session_max_minutes | 8 | Minutes before the same offer (whichever comes first) |
| session_extra_cards | 10 | Cards added by "Nog 10 kaarten, graag!" (fewer if fewer are left) |
| cooldown_minutes | 60 | Pause after a session before "Starten" works again (0 = no pause) |
| min_reviews_to_count | 3 | A session shorter than this does not start a pause |
| session_resume_minutes | 30 | After "Terug" (or leaving the app) she can continue the same session this long ("Doorgaan"); after that it expires WITHOUT a pause |
| max_learning_backlog | 3 | In a session, the next NEW card waits while this many cards are still in their short "again in minutes" steps |

All settings are read by the phone on every sync — change them here, no redeploy.

## Curriculum — which new cards come first

`order, tag, unlock_threshold, min_reviews, max_wait_days, active`

| column | default | meaning |
|---|---|---|
| order | | 1, 2, 3… (lowest first) |
| tag | | a key from the Tags tab (dropdown) |
| unlock_threshold | 0.8 | share of this tag's cards that must be "gekend" before the next row opens |
| min_reviews | 2 | a card also needs at least this many reviews to count as "gekend" |
| max_wait_days | 21 | the next row opens anyway this many days after this tag's first card was first shown (blank = never) |
| active | ☑ | unticked rows are skipped: their cards are free to come, and they don't hold back the next row |

Seed: 1 app · 2 klok-1 · 3 klok-2 · 4 klok-3. The app row has `unlock_threshold` 0, so klok-1 is open
from the start (app keeps priority for new cards); klok-2 and klok-3 open one by one.

**Algorithm** (phone: `src/curriculum.ts`; the Dashboard mirrors it in `apps-script/Curriculum.gs`):

1. A card is **gekend** (mature) when the stability of its main direction (woord: recognising; zin/vraag:
   the only direction) is ≥ `mature_stability_days` AND its reps ≥ the row's `min_reviews`.
2. A tag's **score** = gekend cards / active cards with that tag (a tag without cards scores 1).
3. The first active row is open. Row N+1 opens when row N is open AND (score(N) ≥ unlock_threshold OR
   `max_wait_days` have passed since row N's first card was first shown). This is recalculated on every
   sync/launch; nothing is stored, so reordering or retuning the tab takes effect immediately.
4. **Eligible new cards**: a card without any curriculum tag is always eligible. A card WITH curriculum tags
   is eligible if AT LEAST ONE of them is open (inactive rows count as open).
5. **Filling today's `new_per_day` slots**: first the open curriculum tags by `order` (cards in `added`
   order), then the next open tag, then all other eligible cards by `added`. A card that matches several
   open tags is introduced once.
6. Cards she already started keep coming back for review even if their tag is (again) locked — the
   curriculum only decides what is *new*.

## Sessions and pause (phone only)

- "Starten" begins a session. A slim bar shows "9 van 15 kaarten".
- At `session_max_cards` reviews or `session_max_minutes` (checked after each card) she sees ONE offer:
  "Nog 10 kaarten, graag!" (adds `session_extra_cards`, or fewer if fewer are left) or "Stoppen".
  After accepting, "Stoppen" is in the header and the session ends when those cards are done.
- The session also ends when cards run out or on "Stoppen". "Terug" and leaving the app only PAUSE it:
  home shows "Doorgaan (4 van 15 kaarten)"; only reviewing time counts toward `session_max_minutes`.
  A paused session not continued within `session_resume_minutes` expires without starting a pause.
- If it had ≥ `min_reviews_to_count` reviews, its end time is saved on the phone (IndexedDB, survives
  restarts) and "Starten" becomes "Volgende sessie over 42 minuten" until `cooldown_minutes` have passed.

## Compliments

`text` — one Dutch line per row (seed: "Goed zo!", "Prima!", "Top!", "Heel goed!", "Mooi gedaan!",
"Je wordt steeds beter!", "Uitstekend!", "Fantastisch!", "Ga zo door!", "Geweldig!",
"Ik ben trots op je!", "Perfect!", "Sterk!"). Shown as a small toast every 3rd correct answer.

## Breaks — off-screen Dutch prompts

`text_nl` — one short Dutch task per row ("Zoek een rond voorwerp. Wat is het Nederlandse woord ervoor?").
When a pause starts (a session with ≥ `min_reviews_to_count` reviews and `cooldown_minutes` > 0), the phone
shows ONE screen: "Sessie voltooid!", one random line (never the previous one) and "OK". No answer, no
tracking, not shown again during the pause. Empty tab → no screen. Cached offline with the cards.
Seeded with 20 lines that vary shape/size, texture, colour, category and household context (no attribute in
more than ~20 %). Add more with `/addbreaks <n>` (appends only).

## Dashboard (formulas, read-only)

Column A–B: te herhalen (all directions), goed onthouden (30 days), herhalingen deze week, actieve
kaarten, laatst gesynchroniseerd (= newest Log `ts`), and the 10 most-forgotten cards.

Columns D–I: **Curriculum** — one row per active Curriculum tag: gekend / cards, score, open (ja/nee),
days until it opens automatically (blank if open, no cap, or the previous tag wasn't shown yet), first
shown. Refreshed after reviews arrive (at most every 10 minutes) and by setup.
