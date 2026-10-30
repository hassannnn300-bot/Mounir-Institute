# Shared tasks

Status here is a hand-maintained coordination aid. Update it when work is verified; do not mark a task complete based only on an assumption.

- [x] Reproduce the reported issue where the user cannot continue after completing the questionnaire detail form. Done 28 October 2026: the repeat-email database rule was fixed, and a site-wide bug sweep fixed the related questionnaire problems (see DECISIONS.md). Verified in headless Chrome.
- [x] If the issue is still present, fix the actual failing step and record how it was verified.
- [x] Phone-first premium finish. Done 29 October 2026: one shared header and footer on every page (assets/site.css, assets/site.js), header dropdowns that open on Android taps (they used to close straight away), 16px form fields so iPhones do not zoom, a lighter cropped emblem, a stronger gradient on the lit principle, and link-preview tags pointing at www.mounirinstitute.com. Verified in headless Chrome at 360, 390, 430, 768 and 1280px on all eleven pages.
- [ ] Check the header menus on a real iPhone and Android phone after the next deploy.
- [x] Show the logo next to the site in Google results. Done 30 October 2026: the old site icon was a 1777x885 image, and Google only shows square icons, so every page now links a square /favicon.ico (16, 32 and 48px) and assets/icons/icon-192.png, and index.html has WebSite and Organization structured data with assets/icons/logo-512.png.
- [ ] In Google Search Console, inspect https://www.mounirinstitute.com/ and request indexing so Google picks up the new icon sooner (it can take days to weeks).
- [ ] Support multiple valid submissions that reuse the same email address and phone number. First decide the intended record behaviour and verify it against the current schema; do not reject a submission only because its contact details were used before.
- [ ] Recheck the prices, launch wording, place limits, and programme terms in index.html before changing public copy or checkout behaviour.
- [ ] Ask the repository owner for the co-partner’s exact GitHub username if write access is wanted. The current public visibility already allows anyone to view the repository.
- [ ] Keep the shared notes in README.md, PROJECT_CONTEXT.md, DECISIONS.md, TASKS.md, and AI_HANDOFF.md current as decisions and verified work change.
- [ ] After merging the wording change, make one Stripe test-mode payment and check it charges £25 and is named Applied Maqamaat Place Reservation.
- [x] Unpublish the GitHub Pages site. Done 28 October 2026 through the GitHub API; hassannnn300-bot.github.io/Mounir-Institute now returns 404.
- [x] Point mounirinstitute.com and www.mounirinstitute.com at Vercel. Done 28 October 2026: GoDaddy A record @ to 216.198.79.1 and CNAME www to the project's Vercel hostname; both domains show Valid Configuration on Vercel with new certificates, and the root redirects to www. Verified with curl against Vercel and in the Vercel dashboard. Google mail records untouched.
- [x] Run docs/founding-applications.sql in Supabase. Done 28 October 2026. Until then the live table still had the one-application-per-email rule, so Secure My Place failed for anyone who had applied before. The table now has only its primary key and the status check, so repeat applications are stored as separate records; the endpoint keeps its fallback of updating the existing application in case the database ever refuses a repeat again.
- [x] Delete the test application named "Test submission (please ignore)" (email test-2026-10-28@mounirinstitute.com) from founding_applications in Supabase. Created and deleted on 28 October 2026 while diagnosing the Secure My Place failure.
- [x] Add a separate, unticked acknowledgement at checkout for the £250 recorded course. Done 28 October 2026: checkout.html shows the box for the recorded plan and will not start checkout without it; the API refuses the session without it and records the consent text, version and time in the Checkout Session and PaymentIntent metadata; Stripe shows the acknowledgement above its pay button; the success page confirms it; the terms describe it. Page and API logic verified locally. Still to do: one Stripe test-mode payment to see the metadata in the Stripe dashboard.
- [x] Refund the £25 holding payment when an applicant is declined or withdraws. Done 28 October 2026: the owners' page at /admin/refunds.html lists holding payments and refunds one in full through Stripe, marking the reservation refunded (which frees the place) and the application declined or withdrawn; the webhook also records refunds made in the Stripe dashboard. Verified locally against fake Stripe and Supabase responses. Live setup still needed, below.
- [ ] Set ADMIN_API_TOKEN in Vercel (Production) and redeploy, so the refunds page can be unlocked.
- [x] Run docs/founding-refunds.sql in Supabase. Done 28 October 2026: founding_reservations now allows the refunded state and has the stripe_payment_intent_id, stripe_refund_id, refunded_at and refund_reason columns plus the payment index. No reservation had been paid at that point (one held, three released).
- [ ] Add the charge.refunded event to the Stripe webhook endpoint.
- [ ] Test with one Stripe test-mode holding payment: refund it from /admin/refunds.html and check the reservation shows refunded and the place count drops.
- [ ] After the next real or test-mode payment, check Stripe returns the buyer to https://www.mounirinstitute.com/checkout-success.html (fixed 28 October 2026; before that it sent buyers to a Vercel login page).

Owner decisions raised by the 28 October 2026 bug sweep (not changed):
- [ ] The questionnaire asks which kind of learning someone wants, but its results always offer the £25 Applied Maqamaat hold, whatever they chose. Decide whether the recorded course or 1-to-1 mentoring should be offered there too.
- [ ] checkout.html?plan=monthly charges £159 today, while the site says £159 a month from launch; and ?plan=mentoring sells £299 a month without the assessment. Neither is linked from the site. Decide whether to switch them off.
- [ ] The £299 plan has four names (Private Mentorship, 1-to-1 Mentoring with Hassan Mounir, 1-to-1 Learning with Qari Hassan Mounir, VIP Private Mentorship). Pick one.
- [ ] thank-you.html is an old Stripe test-mode page that is still live (not linked, marked noindex). Decide whether to delete it.
