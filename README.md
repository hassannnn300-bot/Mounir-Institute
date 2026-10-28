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
- docs/ — SQL setup files for the application data.
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
| SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Applications and reservations |
| ADMIN_API_TOKEN | The owners' refunds page |
| SITE_URL | Optional; the checkout return address |

## Sharing and privacy

GitHub currently reports this repository as public. Anyone can view its code and files. Do not add credentials, API keys, applicant data, private correspondence, or other confidential material here. If the project should become private, confirm that separately before changing the repository visibility.
