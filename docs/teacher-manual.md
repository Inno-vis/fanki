# Teacher manual: how the curriculum works

The curriculum decides which **new** cards she gets. It never stops old cards: cards she has started always come
back for review.

## The Curriculum tab

- Each row is one topic (a tag).
- The rows have an order: 1, 2, 3 …
- New cards come from the open topics, in that order.
- Within a topic, the oldest cards (column `added`) come first.
- She gets at most `new_per_day` new cards per day (Settings tab). She can choose her own number on her phone
  (Instellingen).

## When does a topic open?

- The first row is always open.
- The next row opens when enough cards of this row are "bekend".
- `unlock_threshold` says how many: 0.8 = 80 % of the cards.
- 0 means: the next row opens right away.
- `max_wait_days` is a safety net. After that many days, the next row opens anyway. The days start when she sees
  the first card of this row.

## When is a card "bekend"?

- She remembers it for a long time: at least `mature_stability_days` (Settings, 21 days).
- And she has reviewed it at least `min_reviews` times (2).
- This takes weeks. So most topics open with `max_wait_days` or with `altijd open`.

## The column `open`

You can always overrule the rules:

- `automatisch`: the rules above decide.
- `altijd open`: the topic is open now.
- `dicht`: the topic is closed now. The automatic rows below it stay closed too.

## The column `active`

- Unticked: the row is skipped.
- Its cards can still come. It does not hold back the next row.
- It does NOT close the topic. Use `dicht` for that.

## Topics without a row

- With `curriculum_only` = TRUE (Settings), these topics are closed.
- Cards without a tag are closed too.
- To open such a topic: add a row, for example with `altijd open`.

## Approval

- She only gets cards with `controle` = goedgekeurd.
- A card in the Inbox is not in Cards yet. She never sees it.

## Changes take effect at once

- Nothing is stored. The phone calculates it again at every sync.
- So you can change the order or the numbers at any time.

## Where to check

- Dashboard tab, columns D–I: per topic, the cards that are bekend, the score, and open yes/no.

## She chooses a topic herself

- On her phone: "Kies een onderwerp".
- Closed topics show 🔒.
- She then gets due cards and new cards from the topics she chose only.
