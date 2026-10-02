# To do

Most important first. Every PROD item follows the PROD safety checklist in docs/RELEASE.md.

1. Approve or reject the remaining cards on the teacher page (Kaarten → "Nog niet goedgekeurd"). With require_approval
   on (DEV + PROD since 2026-10-02) only goedgekeurd cards reach the app.
   DEV Inbox: 1011 Klim op words (2026-10-02) to review; then add their tags (kennismaken, hoe-gaat-het,
   dagelijkse-activiteiten, afspreken, boodschappen, familie, tijd, eten, winkelen, gezondheid) to the Curriculum.
   PROD: decide whether klok cards also get tag `tijd` (done on DEV + seeds).
2. Review the 13 DEV Inbox proposals (reject "kennen"); then add them to APP_SEED_CARDS for PROD.
3. Compliment toast: every 3rd correct answer, random Dutch line from Compliments, never twice in a row.
4. In-app backup: export progress and flags as a JSON file, and import it again.
5. Docs: remove "typed" wording for the FR→NL track; every card is self-rated.
6. PROD sheet: decide on the 8 unticked app words (scherm, woord, zin, vraag, …): keep off or reactivate.
7. CI: check the workflow after GitHub moves ubuntu-latest to Ubuntu 26 (from 2026-10-19).
8. Document how to rotate LEARNER/ADMIN tokens (Script Properties, .env.local, GitHub secrets).

Done (PROD 2026-10-02): emoji course, abbreviations before first use, menu, Voortgang, listening, 🚩 per card
without dates, Hulp "nieuw", teacher review page (instant actions, bulk approve, nakijken), curriculum app/emoji/
klok-1 always open. Earlier: Android pass, e2e for flags/enkel/emoji, Curriculum parity test.
