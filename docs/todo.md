# To do

Most important first. Every PROD item follows the PROD safety checklist in docs/RELEASE.md.

1. Review page: check you see "versie ff332fb" in the header; if not, report what you see.
2. Review the 13 Inbox proposals on DEV (reject "kennen"; try 🚩 and "Keur alle 5 goed").
3. Test the emoji course on DEV, then release everything to PROD after your go.
4. Compliment toast: every 3rd correct answer, random Dutch line from Compliments, never twice in a row.
5. In-app backup: export progress and flags as a JSON file, and import it again.
6. After approval: add the new UI words to APP_SEED_CARDS so PROD gets them and the vocab check passes.
7. Docs: remove "typed" wording for the FR→NL track; every card is self-rated.
8. PROD sheet: decide on the 8 unticked app words (scherm, woord, zin, vraag, …): keep off or reactivate.
9. CI: check the workflow after GitHub moves ubuntu-latest to Ubuntu 26 (from 2026-10-19).
10. Document how to rotate LEARNER/ADMIN tokens (Script Properties, .env.local, GitHub secrets).

Done: Hulp "nieuw" marker, "bekend", menu on "Fanki", 🚩 counted per card, teacher review page (bulk approve,
nakijken, build label), abbreviations before first use with "afkorting" badge, listening mode, Voortgang,
e2e for flags/enkel/emoji, Curriculum parity test, Android pass.
