# AI and collaborator handoff

## Start here

At the beginning of a work session, read:

1. README.md
2. PROJECT_CONTEXT.md
3. DECISIONS.md
4. TASKS.md

Then inspect the current code and GitHub state before assuming that a task is still open or that an earlier note describes the live implementation.

## Shared context

Use the repository documents as the project’s shared source of context. Separate ChatGPT accounts do not automatically sync their memories. A partner’s assistant can use these notes only if that assistant can access this repository or a copy of it; a public repository can be viewed without a GitHub invitation.

Keep facts, user reports, and assumptions distinct. If a requirement or business detail is uncertain, say so and record the open question instead of presenting it as settled.

## When changing the project

- Make the requested change in the relevant source files.
- Update TASKS.md when work is verified or priorities change.
- Add a dated entry to DECISIONS.md only when the user or project owner has made a decision.
- Update PROJECT_CONTEXT.md when verified product or architecture facts change.
- In your handoff, summarize what changed, what you checked, and any remaining decision.

## Privacy and safety

GitHub currently reports this repository as public, so every committed file is visible to anyone. Never commit API keys, passwords, access tokens, webhook signing secrets, environment files, applicant records, payment information, or private correspondence. Use synthetic test data and keep sensitive operational notes outside this repository.