---
id: troubleshooting
title: Troubleshooting
description: Symptoms, root causes, and fixes for the most common issues.
---

# Troubleshooting

Symptom → root cause → fix. If your issue isn't here,
[open a discussion](https://github.com/ForliLabs/energia-nostra/discussions).

## Setup & install

### `npm ci` fails on macOS with `node-gyp` errors

You're missing Xcode command-line tools.

```bash
xcode-select --install
```

If you're on Apple Silicon, also ensure you're on Node 20 ARM64
(`node -p "process.arch"` should print `arm64`).

### `npx prisma db push` says `Environment variable not found: DATABASE_URL`

Your `.env` is missing or in the wrong directory.

```bash
cp .env.production.template .env
# Edit to add at least DATABASE_URL=file:./dev.db
```

### `npm run dev` starts but the page is blank

Almost always a port collision with another Next.js project. Either kill the other
process or run on a different port:

```bash
PORT=3001 npm run dev
```

## Authentication

### Login returns `429 Too many attempts`

The user account is locked after 5 failed attempts in 15 minutes. Wait, or unlock
from the admin dashboard. The lock is on the `User` row's `lockedUntil` column.

### SPID redirect loop

Your `SPID_ACS_URL` doesn't match what's registered with AgID. Compare:

```bash
curl http://localhost:3000/api/auth/spid/metadata | grep AssertionConsumerService
```

against the AssertionConsumerServiceURL registered in your SPID application.

### Session cookie not set

Browser is blocking it. Check that `BASE_URL` matches the URL the browser is
hitting (`http://localhost:3000` not `http://127.0.0.1:3000` — they're different
origins).

## Meter data

### Upload says `unknown_pod` for every row

The PODs in your CSV aren't registered as `Plant` or `Member` PODs in the CER.
Either register them first, or set `?createUnknownPods=true` (admin only) to
auto-create.

### Sharing returns `0` shared kWh

Either:

- No overlap between production and consumption hours (check the **Heatmap**).
- All production rows have `kwh_produced = 0` (check the upload's error list).
- The plant POD is not flagged as a producer.

### `coverage` is below 95%

Look at `GET /cer/{id}/meters/health` — `stalePods` lists which PODs are missing
data. The fix is either re-uploading the period or contacting e-distribuzione for
a corrected export.

## Payments

### Stripe payout says `Account not connected`

You enabled Stripe Connect but the member hasn't completed Stripe onboarding.
They need to visit `Dashboard → Profile → Payouts → Connect Stripe`.

### SEPA file rejected by your bank

Check the file with [iso20022.com validator](https://www.iso20022.org/iso-20022-message-definitions).
Common issues:

- `CreditorId` missing (set `SEPA_CREDITOR_ID`).
- `EndToEndId` longer than 35 chars (this is a bug — open an issue).

### PagoPA notice not delivered

The receiver's *codice fiscale* may not be enrolled with PagoPA. The PA member
needs a valid PagoPA registration first.

## GSE

### GSE submission rejected with `coverage_below_threshold`

The GSE requires ≥95% (POD × hour) coverage for the period. Re-import the missing
days and resubmit:

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/cer/{id}/gse/report \
  -d '{"period":"2025-04","force":true}'
```

`force: true` only works after you've cleared the underlying coverage issue.

### GSE registration stuck in `submitted`

It can take 30–60 days for GSE to respond. Don't resubmit — `submitted` is normal.
You can pre-emptively fix common issues by running the local checks:

```bash
curl -b cookies.txt http://localhost:3000/api/cer/{id}/gse/pre-flight
```

## Performance

### Sharing computation is slow

The default implementation is O(PODs × hours). For 100 PODs × 720 hours it should
finish in under 1 second on Postgres. If it's slow:

1. Check that you have indexes on `EnergyReading(cerId, periodStart)`. They're
   created by the migration; verify with `\d "EnergyReading"` in psql.
2. Make sure `DB_POOL_SIZE` ≥ 10.
3. If you're on SQLite with many CERs, switch to Postgres.

### Dashboard page slow to load

Run `npm run build` and check the Next.js output for any page exceeding 200 KB
first-load JS. The dashboard pages are server-rendered by default; if you've
added a heavy client component, isolate it with `next/dynamic`.

## Deployment

### Helm install fails on `MissingFields`

Likely the secret with env vars isn't created yet. Run:

```bash
kubectl create secret generic en-env --from-env-file=.env.production -n energianostra
helm upgrade ... --set envFromSecret=en-env
```

### Migrations don't run on deploy

The app calls `prisma migrate deploy` on start. If your deployment uses an
init-container pattern, ensure the init container has the same env vars.

### After upgrade, login is broken

You probably changed `SESSION_SECRET`. All previous sessions are now invalid by
design — users need to log in again. If this wasn't intentional, restore the old
secret.
