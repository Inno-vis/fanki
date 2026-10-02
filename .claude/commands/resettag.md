---
description: Reset every card of one tag to "new" (progress only; review history stays in Log)
argument-hint: "<tag> [dev|prod]   e.g. klok-1"
---

Reset all cards with one tag back to "new". Request: `$ARGUMENTS` (tag key as in the Tags tab, e.g.
`klok-1`, `emoji`, `huishouden`; environment `dev` unless `prod` is given).

Use ONLY `node scripts/admin.mjs <env> …`; never read or print `.env.local` or tokens.

1. Dry run: `node scripts/admin.mjs <env> resetTag '{"tag":"<tag>"}'`. Show: number of cards with the tag, how
   many have progress to reset, and the list (word, direction, state, reviews). If 0, say so and stop.
2. For **prod**: say clearly this resets the LEARNER's real progress for these cards, run
   `npm run backup:prod` first and report its counts. STOP and wait for my explicit OK (also for dev).
3. After OK: `node scripts/admin.mjs <env> resetTag '{"tag":"<tag>","dryRun":false}'`.
4. Report what was reset. Explain: the phone applies it at its next sync (open the app with internet, or
   "Synchroniseren"); the cards then come back as new cards, within the daily new-card limit and the
   curriculum. Review history stays in Log (rows with mode "reset" mark the reset).
