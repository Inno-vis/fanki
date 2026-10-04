# To do

Most important first. Every PROD item follows the PROD safety checklist in docs/RELEASE.md.

1. PROD release (needs the teacher's OK): cooldown + Breaks removed, bigger subject label (live on DEV since
   2026-10-04). Then `gas:deploy:prod` + `admin prod setup` (removes the cooldown_minutes row).
2. DEV Inbox: review the H1–H6 sentences, Signaalwoorden and 3 untagged words (gaan, alsjeblieft, "Hoe heet je?";
   tag them first, or they are never introduced). Then copy approved DEV cards to PROD (`importCards`).
4. In-app backup: export progress and flags as a JSON file, and import it again.
5. Docs: remove "typed" wording for the FR→NL track; every card is self-rated.
6. PROD sheet: decide on the 8 unticked app words (scherm, woord, zin, vraag, …): keep off or reactivate.
7. CI: check the workflow after GitHub moves ubuntu-latest to Ubuntu 26 (from 2026-10-19).
8. Document how to rotate LEARNER/ADMIN tokens (Script Properties, .env.local, GitHub secrets).

Done (PROD 2026-10-02): emoji course, abbreviations before first use, menu, Voortgang, listening, 🚩 per card
without dates, Hulp "nieuw", teacher review page (instant actions, bulk approve, nakijken), curriculum app/emoji/
klok-1 always open. Earlier: Android pass, e2e for flags/enkel/emoji, Curriculum parity test.
