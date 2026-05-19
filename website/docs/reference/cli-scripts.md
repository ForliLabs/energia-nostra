---
id: cli-scripts
title: CLI & scripts
description: The npm scripts and one-off CLIs you'll use day to day.
---

# CLI & scripts

EnergiaNostra is a Next.js project, so most operations are `npm run …`. This page
catalogues every script and a handful of useful one-liners.

## npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server on `:3000` |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | `tsc --noEmit` over the codebase |
| `npm test` | Run Vitest unit + integration tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright E2E tests (requires dev server running) |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:seed` | Seed demo data (`prisma/seed.ts`) |
| `npm run db:reset` | Drop, recreate, and re-seed the dev DB |

## Prisma CLI

```bash
npx prisma generate                # Regenerate the typed client
npx prisma migrate dev --name xyz  # Create a migration
npx prisma migrate deploy          # Apply pending migrations (production)
npx prisma studio                  # Visual DB browser at localhost:5555
npx prisma format                  # Format schema.prisma
```

## Useful one-off scripts

The repo includes administrative scripts under `scripts/` (run with `tsx`):

```bash
# Recompute every SharingBalance for a CER (e.g. after a tariff change)
npx tsx scripts/recompute-cer.ts --cer cer-bertinoro --from 2024-01

# Anonymise the dev DB (for sharing snapshots)
npx tsx scripts/anonymise.ts --output dev-anon.db

# Generate a load-test dataset
npx tsx scripts/generate-load.ts --cers 50 --members-per-cer 30 --days 90

# Validate every Prisma model against fixtures
npx tsx scripts/validate-fixtures.ts
```

Each script accepts `--help` for full usage.

## Database inspection

```bash
# Open a psql shell in the running container
docker compose exec db psql -U energianostra

# Quick row counts
docker compose exec db psql -U energianostra -c \
  "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;"

# Find slow queries
docker compose exec db psql -U energianostra -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

(`pg_stat_statements` is enabled in the provided Postgres image.)

## Health and readiness

```bash
curl http://localhost:3000/api/health             # liveness
curl -b cookies.txt http://localhost:3000/api/health/deep   # full readiness
curl http://localhost:3000/api/metrics            # Prometheus metrics
curl http://localhost:3000/api/openapi            # OpenAPI 3.1 spec
```

## Generating API clients

The OpenAPI spec is auto-generated and stable. Use `openapi-generator-cli` to
produce typed clients:

```bash
npx --yes @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api/openapi \
  -g typescript-fetch \
  -o ./clients/typescript
```

## Logging

In development, logs are human-readable on stdout. In production they're JSON;
pipe them to your favourite tool:

```bash
docker compose logs -f app | jq -c 'select(.level=="error")'
```

## Backup & restore

```bash
# Backup
docker compose exec db pg_dump -U energianostra -Fc energianostra > backup.dump

# Restore
docker compose exec -T db pg_restore -U energianostra -d energianostra -c < backup.dump
```

Always restore into a fresh database, then run `npx prisma migrate deploy` to
ensure schema parity.

## Common debugging commands

```bash
# Find the most recent failed import
npx prisma studio              # then open ImportError, order by createdAt desc

# Tail the audit log for a specific user
docker compose exec db psql -U energianostra -c \
  "SELECT * FROM \"AuditEvent\" WHERE \"actorId\"='user-admin-1' ORDER BY \"createdAt\" DESC LIMIT 20;"

# Force-refresh the GSE status cache
curl -b cookies.txt -X POST http://localhost:3000/api/cer/cer-bertinoro/gse/refresh
```
