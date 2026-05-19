---
id: api
title: REST API reference
description: Every EnergiaNostra REST endpoint, grouped by domain.
---

# REST API reference

EnergiaNostra exposes **59 REST endpoints** across 14 domains. This page documents
the ones you'll use most. The full machine-readable spec is available at
**`/api/openapi`** in any running instance (OpenAPI 3.1).

**Base URL** — `http://localhost:3000/api` in development, your domain in production.

**Auth** — pass a `session_id` cookie (browser) or `Authorization: Bearer en_live_...`
(server-to-server).

**Errors** — every error response has the shape:

```json
{ "error": "human message", "code": "machine_code", "details": ["optional details"] }
```

## Authentication

### `POST /auth/login` 🔓

```json
// Request
{ "email": "admin@energianostra.it", "password": "demo2025" }

// Response 200
{ "user": { "id": "user-admin-1", "email": "...", "role": "admin", "cerId": "cer-bertinoro" } }
```

Sets a `session_id` HTTP-only cookie. Errors: `400` missing fields, `401` invalid
credentials, `429` rate-limited.

### `POST /auth/register` 🔓

```json
// Request
{ "email": "mario@example.it", "password": "SecurePass123!", "name": "Mario", "cerId": "cer-bertinoro" }
```

Errors: `400` validation, `409` email already registered.

### `POST /auth/logout`

Revokes the current session.

### `GET /auth/csrf`

Returns `{ "csrfToken": "..." }`. Required for browser-initiated mutations.

### `GET /auth/spid` · `POST /auth/spid/acs`

SPID SAML flow. See [Authentication](../concepts/authentication#spid).

### `GET /auth/cie` · `POST /auth/cie/acs`

CIE SAML flow.

## CER & energy

### `POST /cer`

Create a CER. Body: `{ name, legalForm, municipality, province, cabinaPrimaria, vatNumber, foundedYear }`.
Returns the created `Cer` with `status: "draft"`.

### `GET /cer/{cerId}`

Returns the CER with embedded `members[]`, `plants[]`, `documents[]`.

### `POST /cer/{cerId}/activate`

Transitions a draft CER to `active`. Requires at least one plant, signed bylaws,
and one admin.

### `POST /cer/{cerId}/plants`

```json
{ "pod": "IT001E99887766", "type": "photovoltaic", "kwp": 49.5, "installedOn": "2024-09-12", "address": "..." }
```

### `POST /cer/{cerId}/sharing/compute`

```json
// Request
{ "period": "2025-04" }

// Response 200
{
  "cerId": "...",
  "period": "2025-04",
  "totalProducedKwh": 4820.5,
  "totalConsumedKwh": 9112.3,
  "sharedKwh": 3214.7,
  "incentiveEur": 353.62,
  "methodology": "GSE-TIAD-2024"
}
```

### `POST /cer/{cerId}/sharing/recompute`

Force a recomputation for a closed period. Requires `admin` role and a `reason`.

### `POST /cer/{cerId}/sharing/dry-run`

Like `compute` but does not persist. Use to validate before closing a period.

### `GET /cer/{cerId}/sharing?period=2025-04`

Returns the persisted `SharingBalance` for the period.

## Members

### `POST /cer/{cerId}/invitations`

Send invitations. See [Onboard members](../guides/onboard-members).

### `POST /cer/{cerId}/invitations/bulk`

Multipart upload of a CSV (`file=@members.csv`).

### `GET /cer/{cerId}/members?status=active`

Filters: `status` (`active`, `pending`, `left`), `memberType`.

### `PATCH /cer/{cerId}/members/{memberId}`

Update member fields. `newPod` triggers an atomic POD migration with
`effectiveDate`.

### `POST /cer/{cerId}/members/{memberId}/leave`

Mark member as `left` with `reason` and `effectiveDate`.

## Meters

### `POST /meters/upload`

Multipart: `cerId`, `period`, `format` (default `csv`), `file`, optional
`supersedes`.

### `GET /imports/{uploadId}`

Returns the import's status, row counts and error list.

### `GET /cer/{cerId}/meters/health`

Returns ingestion freshness and coverage.

## Invoices & billing

### `POST /incentives/distribute`

Implicit on CER ID via the URL path. Body: `{ period, rule }`.

### `POST /billing/invoices/generate`

Body: `{ cerId, period, issueDate }`.

### `POST /billing/run`

Executes payments. Body: `{ cerId, period }`.

### `POST /billing/reconcile/sepa`

Multipart: `file=@camt053.xml`.

### `POST /billing/certificazione-unica`

Body: `{ cerId, year }`. Returns a ZIP URL.

## Payments

### `POST /payments/stripe/webhook` 🔓

Stripe webhook receiver. Don't call manually.

### `POST /payments/pagopa/webhook` 🔓

PagoPA webhook receiver.

### `GET /payments?cerId=...&period=...`

List payments with filters.

## Voting & governance

### `POST /cer/{cerId}/votes`

Create a vote.

### `POST /cer/{cerId}/votes/{voteId}/cast`

Cast a ballot. Requires `X-CSRF-Token`.

### `GET /cer/{cerId}/votes/{voteId}`

Returns the vote with tally and quorum status.

### `POST /cer/{cerId}/assemblies`

Generate a *verbale* PDF bundling multiple votes.

### `POST /cer/{cerId}/announcements`

Post an announcement.

## Documents

### `POST /cer/{cerId}/documents`

Multipart upload: `type` (`statuto`, `verbale`, `gse_receipt`, …), `file`.

### `GET /documents/{documentId}/download`

Streams the file with the original filename.

### `POST /documents/{documentId}/sign`

Trigger an e-signature workflow.

## GDPR & privacy

### `GET /gdpr/export`

Returns a ZIP of every row belonging to the calling user (or, for admins, the
member specified by `?memberId=`).

### `POST /gdpr/erasure`

Schedules erasure under Art. 17 GDPR.

### `GET /gdpr/consents`

Lists current consent grants.

### `POST /gdpr/consents`

Update a consent. Body: `{ purpose, granted }`.

## Notifications

### `GET /notifications`

List the current user's notifications.

### `POST /notifications/{id}/read`

Mark as read.

### `POST /push/subscribe`

Web Push subscription endpoint.

## Trading

### `GET /trading/orders?cerId=...`

P2P energy trading order book.

### `POST /trading/orders`

Create a buy/sell order.

### `POST /trading/orders/{id}/cancel`

Cancel an open order.

## Forecasting & weather

### `GET /forecast/production?cerId=...&horizon=24h`

Returns the next-24h production forecast per plant.

### `GET /weather/current?lat=...&lon=...`

Cached weather snapshot for a location.

## Smart grid & IoT

### `GET /iot/devices?cerId=...`

List registered devices.

### `POST /iot/devices`

Register a device.

### `POST /iot/devices/{id}/command`

Send a command (OCPP, demand-response trigger).

### `GET /vpp/groups`

List VPP groups (virtual power plant aggregations).

## Carbon credits

### `GET /carbon/ledger?cerId=...`

Carbon-credit ledger entries.

### `POST /carbon/issue`

Issue carbon credits from confirmed shared kWh.

## Platform & infrastructure

### `GET /health` 🔓

Liveness probe. Returns `200 {"status":"ok"}`.

### `GET /health/deep`

Readiness probe (auth required). Verifies DB, Redis, S3.

### `GET /metrics` 🔓

Prometheus-format metrics.

### `GET /audit?cerId=...&period=...`

Audit events for a CER and period.

### `GET /openapi` 🔓

Full OpenAPI 3.1 spec.

## Webhooks (outbound)

Configure under **Dashboard → Developers → Webhooks**. Events delivered:

| Event | Payload |
|---|---|
| `meter.import_completed` | `{ uploadId, cerId, period, validRows, errors }` |
| `meter.reimport` | `{ uploadId, supersedes, period }` |
| `sharing.computed` | `{ cerId, period, sharedKwh, incentiveEur }` |
| `incentive.distributed` | `{ cerId, period, totalEur, lineItems }` |
| `payment.succeeded` / `payment.failed` | `{ paymentId, memberId, amount, rail }` |
| `vote.closed` | `{ voteId, result, tally }` |
| `gse.report_submitted` / `gse.report_rejected` | `{ submissionId, period, status }` |
| `arera.rule_change` | `{ ruleId, version, validFrom }` |

Every webhook is signed with HMAC-SHA256; verify with the signing secret shown
once when you create the webhook.

## Rate limits

- **Unauthenticated**: 30 req/min/IP.
- **Authenticated cookie**: 600 req/min/user.
- **API key**: 100 req/min/key (configurable per key, up to 6000/min).
- Exceeding returns `429` with `Retry-After` header.
