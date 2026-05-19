---
id: contributing
title: Contributing
description: How to contribute code, docs, translations and bug reports to EnergiaNostra.
---

# Contributing

Thank you for considering a contribution. EnergiaNostra is built by people who
believe community-owned energy needs community-owned software, and every PR
moves that forward.

## Ways to contribute

You don't need to write code:

- **Report a bug** — the most valuable contribution. Include reproduction steps
  and your environment (Node version, OS, deployment topology).
- **Open a discussion** for design proposals or use-case questions before opening
  an issue.
- **Improve the docs** — typos, missing examples, unclear explanations. Every
  page has an "Edit this page" link.
- **Translate** — the UI is internationalised. Italian and English are first-class;
  PRs for Spanish, French, German and others are welcome.
- **Write a guide** about your own CER's setup. We feature them in the docs.

## Development setup

```bash
git clone https://github.com/ForliLabs/energia-nostra.git
cd energia-nostra
npm ci
cp .env.production.template .env       # then edit DATABASE_URL=file:./dev.db
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Run the full check before opening a PR:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e        # optional but recommended
```

## Pull request flow

1. **Open an issue first** if your change is larger than a typo. We'll quickly
   indicate whether the approach is likely to be accepted.
2. **Branch off `main`** with a descriptive name (`feat/sepa-pain-002`, `fix/spid-loop`).
3. **One topic per PR**. Smaller PRs are reviewed faster.
4. **Tests required** for any business-logic change. We aim for >85% line
   coverage on `src/lib/`.
5. **Update the docs** in `website/docs/` whenever you change behaviour visible
   to users or operators.
6. **Conventional Commits** for the PR title (`feat:`, `fix:`, `docs:`, `chore:`).
   The release note is generated from them.

## Coding standards

- **TypeScript strict** — no `any` without an inline justification.
- **Server-side first** — prefer React Server Components and direct Prisma access
  over client-side fetches.
- **Domain logic stays in `src/lib/`** — handlers in `src/app/api/` should be
  thin (validate → call lib → respond).
- **Audit-relevant operations** must write an `AuditEvent`. If you're unsure,
  add one.
- **Prisma migrations are forward-compatible** — additive first; remove columns
  only after they're unreferenced for at least one release.
- **No console.log** in committed code. Use `src/lib/observability.ts`.

## Reviewing

We aim for **first review within 3 working days**. If a PR is sitting for longer,
ping it — we may have missed the notification.

A PR is merged when:

- One maintainer approves.
- CI is green.
- The PR description includes a "Why" section.
- Docs have been updated if behaviour changed.

## Security disclosures

**Do not open a public issue for security vulnerabilities.** Email
`security@energianostra.it` with a clear description and (if possible) a
proof-of-concept. We respond within 48 hours and aim to publish a fix within
7 days. We credit reporters in the changelog unless they prefer to stay
anonymous.

## Releases

EnergiaNostra follows **Semantic Versioning** post-1.0. While we're in 0.x, every
minor version may include breaking changes — read the [changelog](./changelog).

Release cadence: roughly every 4–6 weeks, on a Tuesday.

## Code of conduct

By participating you agree to the [Code of Conduct](./code-of-conduct). In short:
be patient, be helpful, be excellent to each other.
