# Project context

Last reviewed against the repository’s main branch on 2026-10-28. Treat this as a snapshot of the current website copy and repository structure, not as a guarantee that live prices or availability are unchanged.

## What the project is

Mounir Institute teaches Qur’an recitation Maqamaat with Hassan Mounir. The website frames Maqamaat learning in the context of Qur’an recitation and says Tajweed remains essential. Its four-part learning approach is:

1. Applied Maqamaat
2. Vocal training
3. Breath control
4. Active listening

The main page describes learners progressing from student to diploma over an 18-month programme.

## Current website programme claims

These details are taken from index.html in this repository. Recheck that file and the live site before using them in public announcements or changing checkout behaviour.

| Programme | Current website description |
| --- | --- |
| Recorded Maqamaat Lessons | £250 one-time; eight video modules and vocal and breathing drills; self-paced, with no live classes, community, or private mentoring. Checkout requires a ticked request for immediate access (digital content), which the API records in Stripe metadata. |
| Maqamaat Intensive | £159 per month from launch; eight modules, two live classes weekly from launch, a private student community, daily quizzes and games, and a founding student welcome pack. The page currently says there are 30 places on the Applied Maqamaat intake, each held with a £25 holding payment that comes off the first month if the student starts and is refunded in full if they are not offered a place or decide not to go ahead. |
| Private Mentorship | Includes the Intensive features, a recitation assessment, a tailored learning plan, and four private lessons each month with Hassan Mounir. The page says entry is limited and subject to assessment and approval. |
| Diploma in Applied Maqamaat | The page describes an 18-month programme and says the diploma is awarded by Mounir Institute on completion. |

Prices, launch wording, capacity, and programme terms can change. Do not treat this table as a live availability check or as independent verification of educational accreditation.

## Repository shape

This is a multi-page HTML website. The main page is index.html; assessment.html contains the assessment/questionnaire experience; checkout.html and checkout-success.html cover checkout; waiting-list.html is also present. The api/ directory contains JavaScript endpoints for founding applications, checkout session creation/status, and a Stripe webhook. The docs/ directory contains SQL setup files for application data. vercel.json configures Vercel routing/deployment.

The owners' page admin/refunds.html, backed by api/admin-holding-payments.js, lists and refunds the £25 holding payments; api/stripe-webhook.js records payments and refunds in the founding_reservations table (SQL in docs/).

The homepage's added motion (button glows, the gold light that follows the mouse, the principles glow) lives in assets/motion.css and assets/motion.js, loaded by index.html; the page works without them. The principles glow order and timing are in the inline script that toggles .is-active in index.html; motion.js moves the gliding light to whichever card is active.

Inspect the current source before describing implementation details. File names alone do not prove the runtime behaviour or the current production configuration.

## User-reported needs to carry forward

A prior user report said they could not proceed after filling in the questionnaire detail form. They also asked for the same email address and phone number to be reusable for multiple submissions when the submitted details are correct.

On 23 October 2026 the application endpoint was changed to accept repeat email addresses and phone numbers, and docs/founding-applications.sql now drops the database uniqueness rule on email. On 28 October 2026 the live Supabase project was found to still have that rule, which made Secure My Place fail for returning applicants. The SQL was run that day, so repeat applications are stored as separate records again; the endpoint keeps a fallback that updates the existing application for that email if the database ever refuses a second record.

This is a reported requirement, not a verified diagnosis or confirmation that the current code still has the issue. See TASKS.md before changing validation or record-handling behaviour.
