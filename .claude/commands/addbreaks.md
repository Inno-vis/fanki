---
description: Generate n new Dutch off-screen Breaks prompts (varied), append after approval
argument-hint: "<n> [dev|prod]   e.g. 10"
---

Add new lines to the **Breaks** tab (short Dutch prompts shown once when a pause starts; she does them
away from the screen — no answer is submitted). Request: `$ARGUMENTS` (number of lines; `dev` unless
`prod` is given).

Use ONLY `node scripts/admin.mjs <env> …`; never read or print `.env.local` or tokens.

1. Read the current list: `node scripts/admin.mjs <env> readTab '{"tab":"Breaks"}'`.
2. Classify every existing line on these axes and count them:
   - shape/size: rond, vierkant, groot, klein, lang, kort
   - texture/material: zacht, hard, koud, metaal, hout
   - colour: any colour (not only zwart)
   - category: speelgoed, scherm/tv, eten/drinken, kleding, keuken, iets wat je nu vasthoudt
   - household context: spullen van een kind, wat je nu toevallig ziet
3. Write n NEW lines that rotate across the axes, favouring the least-used attributes, so that after
   adding them no single attribute or category is in more than ~20 % of the whole list.
   Style: A1–A2 Dutch, 1–2 short sentences, present tense, imperative + question like
   "Zoek iets hards. Hoe zeg je dat in het Nederlands?". Tiny production tasks (name, count, describe in one
   word) — no French, no answers, nothing that needs going outside or buying anything. No duplicates or
   near-duplicates of existing lines.
4. Show: the new lines (numbered, with their axes) and the distribution before/after. STOP and wait for
   my OK.
5. After OK: `{"lines":[…]}` → scratch file → `node scripts/admin.mjs <env> appendBreaks @<file>`
   (appends; never overwrites). Report appended/skipped.
