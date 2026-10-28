# Decisions and open questions

## 2026-10-28

- The intake is called Applied Maqamaat, never the Founding Class. The £159 a month plan is the Maqamaat Intensive everywhere; the name Monthly Learning is retired.
- The £25 is a holding payment, not a reservation fee. It comes off the first month if the applicant starts, and is refunded in full if they are not offered a place or decide not to go ahead. Stripe, the site and the terms now all say this.
- Student records and recordings are kept for 3 years after a student leaves, and applications that do not lead to a place for 3 years after last contact. This matches the learning platform's privacy policy.
- The site is hosted on Vercel only. The GitHub Pages workflow was removed because it published a second copy of the site where checkout could not work.
- Pull request #1 from Taaha's fork is superseded by the applied-maqamaat-wording branch, which applies the same wording on top of the 23 October changes.
- The £250 recorded course is digital content supplied straight away. Checkout asks for a separate, unticked acknowledgement (immediate access requested; 14-day cancellation right ends once access begins), records it in Stripe metadata, and the 7-day money-back guarantee still applies.
- mounirinstitute.com and www.mounirinstitute.com point at Vercel; www is the main address and the root redirects to it. The GoDaddy Website Builder record was replaced.
- Holding payments are refunded by the owners from /admin/refunds.html, with a reason of not offered a place (declined) or withdrew. The page is protected by a shared ADMIN_API_TOKEN rather than user accounts, which is enough for two owners; move it to the learning platform's owner login when applications live there.
- Homepage motion is kept light. A fuller animation layer (hero rosettes, gold dust and voice waves, section dividers, word-by-word headings, tilting cards) was tried and removed the same day as too busy. What stays, in assets/motion.css and assets/motion.js: the button glows (a light sweep, and a pulse on the main hero button), a soft gold light that follows the mouse, and a single white light that glides between the four principles. On screens 761px and wider all four principles are shown at once (two by two, then one row from 1100px) instead of the carousel, and the light travels back and forth along them every 3.8 seconds, softening while it moves; phones keep the swipeable carousel with a per-card glow. It respects prefers-reduced-motion. To change a version, bump the ?v= value on both files in index.html.
- Checkout states each point once. The first card holds what you are buying and its key points; the second card holds only the payment. The 7-day money-back guarantee appears once, in the small print under the payment; on the recorded course it is already in the required acknowledgement, so the small print is hidden there. The footer line about the guarantee was removed from the checkout page.
- Repeat applications are stored as separate records: the live database's one-application-per-email rule was removed on 28 October 2026 by running docs/founding-applications.sql. If the database ever refuses a repeat again, the endpoint updates that applicant's existing application (contact details, answers and presale interest; the owners' status field is not changed) rather than failing. The open question of whether repeats should eventually be merged or kept separate still stands.

## 2026-10-21

- Repository visibility was checked through GitHub and is currently public. No visibility change was made.
- The README, PROJECT_CONTEXT.md, DECISIONS.md, TASKS.md, and AI_HANDOFF.md are the shared project notes for collaborators and their AI assistants.
- The user wants valid submissions to be allowed to reuse the same email address and phone number. The exact duplicate-record, update, and abuse-prevention behaviour remains undecided and must be checked against the current data model before implementation.
- Website programme details and prices are recorded as a snapshot from index.html, not as permanent business decisions. Recheck them before publishing claims.

## Open questions

- Does the co-partner need view access only, or permission to edit the repository?
- If edit access is needed, what exact GitHub username should receive it?
- For repeated valid applications, should each submission create a separate application record, or update an existing record? Preserve an audit trail and avoid treating contact details alone as proof that two submissions are the same person.
