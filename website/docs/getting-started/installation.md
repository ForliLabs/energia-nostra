---
id: installation
title: Installation
description: Install EnergiaNostra locally in under five minutes.
---

# Installation

This page gets EnergiaNostra running on your laptop in **under five minutes**, on
SQLite, with seeded demo data. No Docker, no Postgres, no Redis required.

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | **≥ 20** | `node -v` |
| npm | **≥ 10** | `npm -v` |
| git | any recent | `git --version` |

:::tip macOS users
Install Node.js with `brew install node@20`. Apple Silicon is fully supported.
:::

## 1. Clone the repository

```bash
git clone https://github.com/ForliLabs/energia-nostra.git
cd energia-nostra
```

## 2. Install dependencies

```bash
npm ci
```

This installs the exact versions pinned in `package-lock.json`. Expect ~90 seconds
on a warm cache.

## 3. Initialise the database

EnergiaNostra ships with a SQLite-backed development database. One command creates
the schema and seeds a working CER:

```bash
npx prisma generate     # Generate the typed Prisma client
npx prisma db push      # Create tables in dev.db
npx tsx prisma/seed.ts  # Seed demo CER, users, meters, invoices
```

The seed script creates:

- A CER called **Bertinoro CER** in the province of Forlì-Cesena.
- Four user roles (admin, member, auditor, superadmin).
- Six members with realistic POD codes.
- 90 days of synthetic 15-minute meter readings.
- Three months of invoices and one open vote.

## 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should land on the public
homepage. Click **Accedi** (Login) and sign in:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@energianostra.it` | `demo2025` |
| Member | `membro@energianostra.it` | `demo2025` |
| Auditor | `auditor@energianostra.it` | `demo2025` |
| Superadmin | `super@energianostra.it` | `demo2025` |

:::caution Demo passwords
The seeded users use a deterministic password for convenience. Never run the seed
script against a production database — see
[Guides → Deploy to production](../guides/deploy-production).
:::

## 5. Verify the install

A green install looks like this:

```bash
$ npm test
✓ tests/auth.test.ts (12)
✓ tests/energy-sharing.test.ts (8)
✓ tests/billing.test.ts (6)
...
Test Files  29 passed (29)
     Tests  214 passed (214)
```

If you'd rather verify visually, the **Dashboard → Energy** page should show a
heat-map of shared energy for the last 90 days.

## Optional: full stack with Docker Compose

For a setup closer to production — PostgreSQL, Redis, MinIO — use Docker Compose:

```bash
docker compose up -d
open http://localhost:3000
open http://localhost:9001   # MinIO console (minioadmin / minioadmin123)
```

This is what you want before you start integrating Stripe, SPID or the GSE portal.

## Next steps

- [Quickstart](./quickstart) — four API calls to see the platform end-to-end.
- [Your first CER](./your-first-cer) — create a real CER from scratch.
- [Architecture](../concepts/architecture) — how the pieces fit together.
