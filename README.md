# Mounir Institute

Mounir Institute is a website for learning Qur’an recitation Maqamaat with Hassan Mounir. The current site describes structured lessons, vocal practice, and breathing techniques.

This repository contains the website, assessment and checkout pages, Vercel API functions, and database setup notes. The public website copy can change; check the current files before relying on prices, availability, or programme details.

## Shared project context

Read these files before working with an AI assistant or collaborator:

- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — project overview, course facts, and known user-reported needs.
- [DECISIONS.md](DECISIONS.md) — decisions and open questions.
- [TASKS.md](TASKS.md) — current work list.
- [AI_HANDOFF.md](AI_HANDOFF.md) — instructions for assistants and collaborators.

These documents are the shared project notes. Separate ChatGPT accounts do not automatically share memories, so each assistant should read the repository notes directly.

## Main files

- index.html — main website and programme information.
- assessment.html — recitation assessment and questionnaire flow.
- checkout.html and checkout-success.html — checkout experience.
- waiting-list.html — waiting list page.
- api/ — serverless JavaScript endpoints for applications, checkout, the Stripe webhook and the owners' refunds.
- admin/refunds.html — the owners' page for refunding holding payments (token-protected).
- assets/site.css and assets/site.js: the one shared header, footer and phone layout used by every public page. The header dropdowns (Discover, Courses) run from site.js; on phones they open as full-width panels under the header. To change either file, bump its ?v= value in every page's head.
- assets/images/hassan-mounir-stage.webp and assets/images/teacher-*.webp: the homepage photos as WebP (made 31 October 2026). The stage photo is cropped from IMG_8642.jpeg, a phone screenshot, to rows 836 to 1491, the only part the page ever showed; every reference to it (the img, the hidden background layers, the ratio script) uses this one file so it downloads once. teacher-moulay-mounir.webp replaces the 6.9 MB IMG_9031.PNG at 800px wide. The original files are kept but no page links them. Add new photos as WebP at no more than twice their display width.
- assets/mounir-emblem.webp: the logo mark (388x480, transparent, 37 KB) used in the header, footer and video thumbnails. It and every icon (favicon.ico, assets/icons/, assets/og-image.png) were made on 31 October 2026 from the owner's 2000x2000 logo file, always at the mark's own proportions. Pages link the tab icons by versioned file names (assets/icons/favicon-v3.ico, icon-192-v3.png, apple-touch-icon-v3.png). When the icon changes, save it under a new file name and update the links: Safari keeps the icon it saved for a page and ignores ?v= query strings. The root /favicon.ico and /apple-touch-icon.png stay for browsers and crawlers that ask for them directly.
- assets/motion.css and assets/motion.js — the homepage's added motion: the button glows, a soft gold light that follows the mouse, and the flowing glow across the four principles. Decoration only; it switches itself off for visitors who ask for reduced motion.
- assets/live-viewers.js and api/live-viewers.js: the "N people viewing now" line on each homepage plan (added 31 October 2026). It counts real visitors only: while a plan card is on someone's screen (all three on a wide screen, the one swiped to on a phone), their page sends a random id every 20 seconds, and a card shows its line only when 2 or more people have it on screen. The id is made fresh on each page load and kept only in memory, so nothing is stored on the visitor's device. Needs `docs/live-viewers.sql` run once in Supabase; until then the endpoint answers nothing and no line shows. Never replace it with a made-up or padded number: fake viewer counts are a misleading practice under UK consumer law.
- docs/ — SQL setup files for the application data and the live viewer count.
- privacy.html, cookies.html, terms.html, and safeguarding.html — policy pages.
- vercel.json — Vercel routing and deployment configuration.

## Owners: refunding holding payments

Open `/admin/refunds.html` on the live site and enter the access token. The page lists every £25 holding payment with the applicant's details and refunds one in full with a single click, either because the applicant was not offered a place or because they withdrew. The refund is made in Stripe, the reservation is marked refunded (which frees the place), and the application status is set to declined or withdrawn. A refund made directly in the Stripe dashboard is picked up by the webhook and recorded the same way.

One-off setup:

1. In Vercel, add `ADMIN_API_TOKEN` for Production: a long random string, for example from `openssl rand -hex 32`. Share it only with the owners; it is the only thing protecting the refunds page. Redeploy after adding it.
2. In Supabase, run `docs/founding-refunds.sql` once.
3. In Stripe, under Developers and then Webhooks, add the `charge.refunded` event to the existing endpoint.

## Environment variables (Vercel)

| Name | Used for |
| --- | --- |
| STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY | Checkout sessions and refunds |
| STRIPE_WEBHOOK_SECRET | Verifying Stripe webhook signatures |
| SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Applications, reservations and the live viewer count |
| ADMIN_API_TOKEN | The owners' refunds page |
| SITE_URL | Optional; the checkout return address |

## Sharing and privacy

GitHub currently reports this repository as public. Anyone can view its code and files. Do not add credentials, API keys, applicant data, private correspondence, or other confidential material here. If the project should become private, confirm that separately before changing the repository visibility.
