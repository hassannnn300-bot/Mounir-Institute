# Decisions and open questions

## 2026-10-28

- The intake is called Applied Maqamaat, never the Founding Class. The £159 a month plan is the Maqamaat Intensive everywhere; the name Monthly Learning is retired.
- The £25 is a holding payment, not a reservation fee. It comes off the first month if the applicant starts, and is refunded in full if they are not offered a place or decide not to go ahead. Stripe, the site and the terms now all say this.
- Student records and recordings are kept for 3 years after a student leaves, and applications that do not lead to a place for 3 years after last contact. This matches the learning platform's privacy policy.
- The site is hosted on Vercel only. The GitHub Pages workflow was removed because it published a second copy of the site where checkout could not work.
- Pull request #1 from Taaha's fork is superseded by the applied-maqamaat-wording branch, which applies the same wording on top of the 23 October changes.

## 2026-10-21

- Repository visibility was checked through GitHub and is currently public. No visibility change was made.
- The README, PROJECT_CONTEXT.md, DECISIONS.md, TASKS.md, and AI_HANDOFF.md are the shared project notes for collaborators and their AI assistants.
- The user wants valid submissions to be allowed to reuse the same email address and phone number. The exact duplicate-record, update, and abuse-prevention behaviour remains undecided and must be checked against the current data model before implementation.
- Website programme details and prices are recorded as a snapshot from index.html, not as permanent business decisions. Recheck them before publishing claims.

## Open questions

- Does the co-partner need view access only, or permission to edit the repository?
- If edit access is needed, what exact GitHub username should receive it?
- For repeated valid applications, should each submission create a separate application record, or update an existing record? Preserve an audit trail and avoid treating contact details alone as proof that two submissions are the same person.
