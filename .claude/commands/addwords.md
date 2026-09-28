---
description: Generate a themed list of new cards into the Inbox (status proposed) — never writes to Cards
argument-hint: "<theme>, <count> words, <level>  [dev|prod]   e.g. wiskunde, 25 words, A2"
---

Propose new Dutch cards for the learner (French speaker) and put them in the **Inbox** tab, status
`proposed`. Request: `$ARGUMENTS`. Environment: `dev` unless the request says `prod`.

Rules:
- Use ONLY `node scripts/admin.mjs <env> <action> [json|@file]`. Never read or print `.env.local` or tokens.
- This command writes NOTHING to Cards. The teacher reviews the Inbox, sets status to `goedgekeurd`, then runs
  /promote.

Steps:
1. Fetch what exists: `node scripts/admin.mjs <env> listCards` and `node scripts/admin.mjs <env> listInbox`
   and `node scripts/admin.mjs <env> tags`. Skip any word whose nl (case-insensitive, without de/het)
   already exists in Cards or Inbox, and near-duplicates (plural/diminutive of an existing word).
2. Generate the requested number of cards at the requested CEFR level (default A2), useful for daily life
   in Belgium/the Netherlands:
   - `type`: `word` (default), `sentence` (target word in `{braces}`), or `question` (fr = prompt, nl =
     answer) — only if the request asks for sentences/questions.
   - `nl`; `article` `de`/`het` for EVERY noun (never blank for a noun; plural-only nouns get `de`).
   - `pos` in Dutch: zelfstandig naamwoord, werkwoord, scheidbaar werkwoord, bijvoeglijk naamwoord, bijwoord,
     uitdrukking, voorzetsel, telwoord.
   - `fr`: natural French translation; `example_nl`: short A1–A2 sentence; `example_fr`: its translation.
   - `tags`: existing Dutch tag keys that fit (the theme's tag if it exists). Never `app` or `klok-*`.
   - `flags`: `false-friend` when the Dutch word looks like a French word with another meaning (e.g.
     "gang"); `separable` for separable verbs (e.g. "optellen").
3. Show a table: `# | nl (with article) | pos | fr | example_nl | tags | flags`, plus the list of skipped
   duplicates. STOP and wait for my OK (I may remove or change rows).
4. After OK: write `{"rows":[{type,nl,article,pos,fr,example_nl,example_fr,tags:[…],flags:[…]}]}` to a
   scratch file and run `node scripts/admin.mjs <env> appendInbox @<file>`. The API gives each row an id,
   status `voorgesteld`, converts to Dutch sheet values, and skips rows already in Cards or Inbox.
5. Report appended/skipped and remind me: set status to `goedgekeurd` in the Inbox, then run /promote.
