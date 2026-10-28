# Shared tasks

Status here is a hand-maintained coordination aid. Update it when work is verified; do not mark a task complete based only on an assumption.

- [ ] Reproduce the reported issue where the user cannot continue after completing the questionnaire detail form. Check field validation, the continue button state, and the response from the application endpoint.
- [ ] If the issue is still present, fix the actual failing step and record how it was verified.
- [ ] Support multiple valid submissions that reuse the same email address and phone number. First decide the intended record behaviour and verify it against the current schema; do not reject a submission only because its contact details were used before.
- [ ] Recheck the prices, launch wording, place limits, and programme terms in index.html before changing public copy or checkout behaviour.
- [ ] Ask the repository owner for the co-partner’s exact GitHub username if write access is wanted. The current public visibility already allows anyone to view the repository.
- [ ] Keep the shared notes in README.md, PROJECT_CONTEXT.md, DECISIONS.md, TASKS.md, and AI_HANDOFF.md current as decisions and verified work change.
- [ ] After merging the wording change, make one Stripe test-mode payment and check it charges £25 and is named Applied Maqamaat Place Reservation.
- [ ] Unpublish the GitHub Pages site (repository Settings, Pages) so the old copy at hassannnn300-bot.github.io/Mounir-Institute stops being served. Removing the workflow only stops new deploys.
- [ ] Point mounirinstitute.com and www.mounirinstitute.com at Vercel. On 28 October 2026 the domain was parked at GoDaddy with a certificate that expired on 14 May 2026, and www did not resolve.
- [ ] Confirm docs/founding-applications.sql has been run in Supabase, so repeat applications do not fail on the old email uniqueness rule.
- [ ] Add a separate, unticked acknowledgement at checkout for the £250 recorded course (agreeing to immediate access and the loss of the 14-day cancellation right) and keep a record of it. The note about this was removed from the public terms page; the requirement remains.
- [ ] Refund the £25 holding payment automatically when an applicant is declined or withdraws. The Stripe webhook only marks a place as paid or released.
