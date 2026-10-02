# To do

Most important first. Every PROD item follows the PROD safety checklist in docs/RELEASE.md.

1. Test the emoji course on DEV, then release it to PROD after your go.
2. Compliment toast: every 3rd correct answer, random Dutch line from Compliments, never twice in a row.
3. In-app backup: export progress and flags as a JSON file, and import it again.
4. Android pass on a physical phone: install via "App installeren", offline, audio (docs/RELEASE.md).
5. Teach the new UI words: hoor, Nederlandse, stem, telefoon, gekend, herhalingen, morgen, rij.
6. Docs: remove "typed" wording for the FR→NL track; every card is self-rated.
7. PROD sheet: decide on the 8 unticked app words (scherm, woord, zin, vraag, …): keep off or reactivate.
8. CI: check the workflow after GitHub moves ubuntu-latest to Ubuntu 26 (from 2026-10-19).
9. DEV cleanup: Log/Progress rows of the removed L1-…L3- clock cards (test data only).
10. Document how to rotate LEARNER/ADMIN tokens (Script Properties, .env.local, GitHub secrets).

Done: listening mode (🔊 + listening cards + no-voice message), Voortgang screen, e2e for 🚩 flags and enkel/emoji
cards, Curriculum.gs ↔ curriculum.ts parity test, teacher review page.
