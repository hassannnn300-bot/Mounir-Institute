# Shared tasks

Status here is a hand-maintained coordination aid. Update it when work is verified; do not mark a task complete based only on an assumption.

- [ ] Reproduce the reported issue where the user cannot continue after completing the questionnaire detail form. Check field validation, the continue button state, and the response from the application endpoint.
- [ ] If the issue is still present, fix the actual failing step and record how it was verified.
- [ ] Support multiple valid submissions that reuse the same email address and phone number. First decide the intended record behaviour and verify it against the current schema; do not reject a submission only because its contact details were used before.
- [ ] Recheck the prices, launch wording, place limits, and programme terms in index.html before changing public copy or checkout behaviour.
- [ ] Ask the repository owner for the co-partner’s exact GitHub username if write access is wanted. The current public visibility already allows anyone to view the repository.
- [ ] Keep the shared notes in README.md, PROJECT_CONTEXT.md, DECISIONS.md, TASKS.md, and AI_HANDOFF.md current as decisions and verified work change.
- [ ] Refund the £25 holding payment in Stripe when an applicant is declined or decides not to go ahead. Nothing does this automatically yet; the Stripe webhook only marks a place as paid.
