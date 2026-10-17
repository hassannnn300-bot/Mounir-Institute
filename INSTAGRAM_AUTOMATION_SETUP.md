# Mounir Institute Instagram Automation

This repository currently contains the **dashboard MVP** at `/automation.html`. It is a front-end draft builder and setup checklist, not yet connected to Instagram or a persistent lead database.

## Intended production architecture

- Instagram professional account (Creator or Business)
- Meta developer app using the official Instagram Platform / Messaging API
- OAuth connection with CSRF-protected state; never ask for an Instagram password
- HTTPS webhook endpoint that verifies Meta's request signature before processing events
- Secure persistent storage for encrypted access tokens, automation rules, deduplication keys, lead events and opt-outs
- Rule engine for eligible inbound DMs and permitted comment private replies
- Message-window enforcement, rate limiting, STOP/opt-out handling, error logs and human handover
- Questionnaire click/completion attribution using a privacy-conscious tracking identifier

## Required setup before production

1. Create/configure a Meta developer app at https://developers.facebook.com/apps/.
2. Use the current official Instagram messaging product and login flow offered in the Meta dashboard. Exact products and permission names can differ by login method.
3. Request only the permissions needed for the chosen flow (commonly business/basic profile, messaging, and comment-management permissions). Obtain App Review / Advanced Access where required.
4. Configure an HTTPS OAuth callback and webhook callback on the production domain.
5. Configure secure server environment variables for the Meta app ID/secret, OAuth redirect URI, webhook verify token, encryption key, and database connection. Never commit these values to Git.
6. Add durable storage and test token encryption/rotation, webhook signature validation, replay/deduplication, consent and opt-out behaviour.
7. Test in development with app roles and test accounts, then submit the production experience for Meta review as applicable.

## Rules we will enforce

- Do not scrape Instagram, automate browser logins, or collect account passwords.
- Do not initiate unsolicited DMs. Normal messaging requires a user-initiated conversation and is subject to Meta's messaging window and other policies.
- Comment-to-private-reply is a separate capability with its own eligibility and limits; do not treat every comment as permission for unlimited follow-up.
- Respect opt-outs immediately and offer a human handover.
- Collect only data needed to route and measure the questionnaire journey; publish a privacy notice and deletion path.

## Dashboard status

The dashboard's automation configuration is currently stored only in the visitor's browser. It does not send messages, save leads to a server, connect an Instagram account, or report real analytics yet. Those functions should only be marked live after the OAuth, webhook, database, and end-to-end tests succeed.

## Useful official reference

Meta's Instagram API documentation: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
