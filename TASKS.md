# Shared tasks

Status here is a hand-maintained coordination aid. Update it when work is verified; do not mark a task complete based only on an assumption.

- [ ] Reproduce the reported issue where the user cannot continue after completing the questionnaire detail form. Check field validation, the continue button state, and the response from the application endpoint.
- [ ] If the issue is still present, fix the actual failing step and record how it was verified.
- [ ] Support multiple valid submissions that reuse the same email address and phone number. First decide the intended record behaviour and verify it against the current schema; do not reject a submission only because its contact details were used before.
- [ ] Recheck the prices, launch wording, place limits, and programme terms in index.html before changing public copy or checkout behaviour.
- [ ] Ask the repository owner for the co-partner’s exact GitHub username if write access is wanted. The current public visibility already allows anyone to view the repository.
- [ ] Keep the shared notes in README.md, PROJECT_CONTEXT.md, DECISIONS.md, TASKS.md, and AI_HANDOFF.md current as decisions and verified work change.
- [ ] After merging the wording change, make one Stripe test-mode payment and check it charges £25 and is named Applied Maqamaat Place Reservation.
- [x] Unpublish the GitHub Pages site. Done 28 October 2026 through the GitHub API; hassannnn300-bot.github.io/Mounir-Institute now returns 404.
- [x] Point mounirinstitute.com and www.mounirinstitute.com at Vercel. Done 28 October 2026: GoDaddy A record @ to 216.198.79.1 and CNAME www to the project's Vercel hostname; both domains show Valid Configuration on Vercel with new certificates, and the root redirects to www. Verified with curl against Vercel and in the Vercel dashboard. Google mail records untouched.
- [ ] Confirm docs/founding-applications.sql has been run in Supabase, so repeat applications do not fail on the old email uniqueness rule.
- [x] Add a separate, unticked acknowledgement at checkout for the £250 recorded course. Done 28 October 2026: checkout.html shows the box for the recorded plan and will not start checkout without it; the API refuses the session without it and records the consent text, version and time in the Checkout Session and PaymentIntent metadata; Stripe shows the acknowledgement above its pay button; the success page confirms it; the terms describe it. Page and API logic verified locally. Still to do: one Stripe test-mode payment to see the metadata in the Stripe dashboard.
- [ ] Refund the £25 holding payment automatically when an applicant is declined or withdraws. The Stripe webhook only marks a place as paid or released.
