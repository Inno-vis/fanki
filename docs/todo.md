# To do

Most important first. Every PROD item follows the PROD safety checklist in docs/RELEASE.md.

1. Test the emoji course on DEV, then release it to PROD after your go.
2. Compliment toast: every 3rd correct answer, random Dutch line from Compliments, never twice in a row.
3. Listening mode: Dutch voice (nl-NL/nl-BE), clear message when none — test on iPhone and a real Android.
4. In-app backup: export progress and flags as a JSON file, and import it again.
5. Small progress overview for the learner: cards learned, reviews this week, streak, upcoming reviews.
6. End-to-end tests for 🚩 flags (flag, note, resolve, share) and enkel/emoji cards.
7. Android pass on a physical phone: install via "App installeren", offline, audio (docs/RELEASE.md).
8. Test that apps-script/Curriculum.gs (Dashboard) and src/curriculum.ts give the same unlock results.
9. Docs: remove "typed" wording for the FR→NL track; every card is self-rated.
10. PROD sheet: decide on the 8 unticked app words (scherm, woord, zin, vraag, …): keep off or reactivate.
11. CI: check the workflow after GitHub moves ubuntu-latest to Ubuntu 26 (from 2026-10-19).
12. DEV cleanup: Log/Progress rows of the removed L1-…L3- clock cards (test data only).
13. Document how to rotate LEARNER/ADMIN tokens (Script Properties, .env.local, GitHub secrets).
