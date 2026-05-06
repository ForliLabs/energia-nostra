# API Reference

> EnergiaNostra REST API — 59 endpoints across 14 domain areas.

**Base URL:** `http://localhost:3000/api` (development) · `https://energianostra.it/api` (production)

**Authentication:** Most endpoints require a `session_id` cookie or `Authorization: Bearer <api-key>` header. Public endpoints are marked with 🔓.

**Content-Type:** `application/json` unless otherwise specified.

**Validation errors** return `400` with:
```json
{ "error": "Dati non validi", "details": ["email: Email non valida"] }
```

---

## Table of Contents

- [Authentication](#authentication)
- [CER & Energy](#cer--energy)
- [Members](#members)
- [Invoices & Billing](#invoices--billing)
- [Payments](#payments)
- [Voting & Governance](#voting--governance)
- [Documents](#documents)
- [GDPR & Privacy](#gdpr--privacy)
- [Notifications](#notifications)
- [Trading](#trading)
- [Forecasting & Weather](#forecasting--weather)
- [Smart Grid & IoT](#smart-grid--iot)
- [Carbon Credits](#carbon-credits)
- [Platform & Infrastructure](#platform--infrastructure)

---

## Authentication

### 🔓 POST `/auth/login`

Authenticate with email and password.

**Request:**
```json
{ "email": "admin@energianostra.it", "password": "demo2025" }
```

**Response** `200`:
```json
{ "user": { "id": "user-admin-1", "email": "...", "name": "...", "role": "admin", "cerId": "cer-bertinoro" } }
```

**Errors:** `400` missing fields · `401` invalid credentials

**Side effects:** Sets `session_id` HTTP-only cookie.

---

### 🔓 POST `/auth/register`

Register a new user account.

**Request:**
```json
{
  "email": "mario@example.it",
  "password": "SecurePass123!",
  "name": "Mario Rossi",
  "role": "member",
  "cerId": "cer-bertinoro"
}
```

**Response** `200`:
```json
{ "user": { "id": "user-abc12345", "email": "...", "name": "...", "role": "member", "cerId": "..." } }
```

**Errors:** `400` missing fields · `409` email already registered

---

### 🔓 GET `/auth/spid`

Get SPID (Sistema Pubblico di Identità Digitale) login URL.

**Response** `200`:
```json
{ "loginUrl": "https://idp.spid.gov.it/sso?SAMLRequest=...", "entityId": "...", "provider": "spid" }
```

**Response (test mode)** `200`:
```json
{ "error": "SPID non configurato", "loginUrl": null, "testMode": true }
```

---

### 🔓 POST `/auth/spid`

Handle SPID SAML callback.

**Request:**
```json
{ "samlResponse": "base64-encoded-saml", "testAttributes": { "fiscalNumber": "RSSMRA85M01H501Z", "name": "Mario", "familyName": "Rossi", "email": "mario@pec.it" } }
```

**Response** `200`:
```json
{ "user": { "id": "...", "name": "Mario Rossi", "role": "member" }, "csrfToken": "...", "message": "Autenticazione SPID completata" }
```

**Errors:** `400` missing data · `401` auth failed · `501` SAML not implemented · `503` SPID not configured

---

### 🔓 GET `/auth/cie`

Get CIE (Carta d'Identità Elettronica) login URL. Same response shape as SPID.

### 🔓 POST `/auth/cie`

Handle CIE SAML callback. Same request/response shape as SPID.

---

### GET `/auth/session`

Get current authenticated session.

### POST `/auth/logout`

Destroy current session and clear cookies.

### POST `/auth/refresh`

Refresh session token (production mode).

### GET `/auth/sessions`

List active sessions for the current user (production mode).

---

## CER & Energy

### 🔓 GET `/cer`

Get CER overview with energy data.

**Response** `200`:
```json
{
  "cer": { "id": "cer-bertinoro", "name": "CER Bertinoro", "memberCount": 25 },
  "latestMonth": { "production": 8500, "consumption": 6200, "shared": 4100 },
  "months": [...],
  "totals": { "production": 52000, "consumption": 38000 },
  "memberBreakdown": [...]
}
```

---

### 🔓 GET `/energy`

Get energy summary and time-series data.

**Response** `200`:
```json
{
  "production": 8500,
  "consumption": 6200,
  "shared": 4100,
  "selfConsumption": 2100,
  "gridExport": 2300,
  "gridImport": 2100
}
```

---

### POST `/meter-upload`

Upload meter reading data (CSV or multipart file).

**Request (JSON):**
```json
{ "csv": "timestamp,member_id,production_kwh,consumption_kwh\n2025-01-01T00:00,m1,12.5,8.3" }
```

**Request (multipart):** `Content-Type: multipart/form-data` with `file` field.

**Response** `200`:
```json
{
  "uploadId": "upload-abc123",
  "fileName": "readings.csv",
  "rowsParsed": 150,
  "rowsValid": 148,
  "parseErrors": ["Row 42: invalid timestamp"]
}
```

---

### 🔓 GET `/import`

Import data from external sources.

---

## Members

### 🔓 GET `/members`

List all CER members.

**Response** `200`:
```json
[
  { "id": "m1", "name": "Mario Rossi", "type": "prosumer", "podCode": "IT001E12345678", "energyBalanceKwh": 120 }
]
```

---

### POST `/members`

Add a new CER member.

**Request:**
```json
{
  "name": "Luigi Verdi",
  "type": "consumer",
  "podCode": "IT001E87654321",
  "energyBalanceKwh": 0
}
```

**Response** `201`: Created member object.

**Errors:** `400` missing fields · `409` duplicate POD code

---

## Invoices & Billing

### 🔓 GET `/invoices`

List all invoices with billing stats.

**Response** `200`:
```json
{
  "invoices": [...],
  "stats": {
    "totalInvoiced": 12500.00,
    "totalPaid": 10200.00,
    "totalOverdue": 800.00,
    "collectionRate": 81.6
  }
}
```

---

### POST `/invoices`

Create invoice or mark as paid.

**Request (mark paid):**
```json
{ "action": "mark-paid", "invoiceId": "inv-42" }
```

**Errors:** `400` invalid action · `404` invoice not found

---

## Payments

### GET `/payments`

Query payments, stats, or tax documents.

**Query parameters:**
| Param | Description |
|---|---|
| `view=stats` | Payment statistics |
| `view=certificazione-unica&cerId=...&year=2024` | Italian CU tax document |
| `invoiceId=inv-1` | Payments for specific invoice |
| _(none)_ | All payments |

---

### POST `/payments`

Initiate a payment.

**Actions:**

| Action | Required Fields | Response |
|---|---|---|
| `stripe-checkout` | `invoiceId`, `successUrl`, `cancelUrl` | `{ sessionId, url, expiresAt }` |
| `pagopa-notice` | `invoiceId` | `{ iuv, qrCode, barcode, importo }` |
| `sepa-mandate` | `memberId`, `iban` | `{ mandateId, status }` |
| `simulate` | `invoiceId`, `provider?` | `PaymentRecord` |

---

### POST `/payments/webhook`

🔓 Stripe/PagoPA webhook endpoint. Handles `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.

---

## Voting & Governance

### 🔓 GET `/votes`

List all votes with current results.

**Response** `200`:
```json
[
  {
    "id": "vote-1",
    "title": "Approvazione bilancio 2024",
    "status": "open",
    "results": { "a_favore": 15, "contrario": 3, "astenuto": 2 },
    "quorum": 20,
    "quorumReached": true
  }
]
```

---

### POST `/votes`

Create a vote or cast a ballot.

**Create vote:**
```json
{
  "action": "create",
  "title": "Acquisto pannelli solari",
  "description": "Votazione per l'acquisto di 20 pannelli...",
  "options": ["a_favore", "contrario", "astenuto"],
  "voteType": "majority",
  "quorumPct": 50,
  "closesAt": "2025-02-28T23:59:59"
}
```

**Cast ballot:**
```json
{ "action": "cast", "voteId": "vote-1", "userId": "user-1", "userName": "Mario", "choice": "a_favore" }
```

---

## Documents

### GET `/documents`

List documents and templates.

**Query parameters:**
| Param | Description |
|---|---|
| `cerId` | Filter by CER |
| `view=templates` | List available templates |

---

### POST `/documents`

Generate documents, request signatures, or verify OTP.

| Action | Description |
|---|---|
| `generate` | Generate document from template |
| `request-signatures` | Send signature requests to signers |
| `verify-signature` | Verify OTP and apply signature |

---

## GDPR & Privacy

### GET `/gdpr/consent` 🔒

Get consent records for current user.

**Response** `200`:
```json
{
  "consents": [
    { "purpose": "essential", "granted": true, "grantedAt": "2025-01-01T..." },
    { "purpose": "analytics", "granted": false }
  ]
}
```

---

### POST `/gdpr/consent` 🔒

Set consent for a purpose.

**Request:**
```json
{ "purpose": "analytics", "granted": true }
```

---

### GET `/gdpr/export` 🔒

Export all user data (GDPR Article 15 — Right of Access).

**Query:** `format=json|csv` · `userId=...`

**Response:** Complete data export including profile, energy readings, invoices, payments, votes, notifications, and consents.

---

### POST `/gdpr/erasure` 🔒

Request data erasure (GDPR Article 17 — Right to Erasure).

**Request:**
```json
{ "userId": "user-1", "confirmation": "ELIMINA" }
```

---

### 🔓 GET `/gdpr/processing-records`

Public processing records register (GDPR Article 30).

---

## Notifications

### GET `/notifications`

Get notifications for a user.

**Query parameters:**
| Param | Description |
|---|---|
| `userId` | Target user |
| `view=count` | Unread count only |
| `view=preferences` | Notification preferences |
| `unreadOnly=true` | Filter to unread |
| `limit=20` | Pagination |

---

### POST `/notifications`

Manage notifications and push subscriptions.

| Action | Description |
|---|---|
| `create` | Create a notification |
| `mark-read` | Mark notification as read |
| `mark-all-read` | Mark all as read for user |
| `subscribe-push` | Register push subscription |
| `unsubscribe-push` | Remove push subscription |
| `update-preference` | Update notification preferences |

---

## Trading

### GET `/trading`

Get P2P energy trading data.

**Query parameters:**
| Param | Description |
|---|---|
| `view=offers` | Active trade offers |
| `view=history` | Completed trades |
| `view=accounts` | Trading accounts |
| `cerId` | Filter by CER |
| _(none)_ | Full dashboard (stats + offers + recent) |

---

### POST `/trading`

Create or accept energy trade offers.

**Create offer:**
```json
{
  "action": "create-offer",
  "sellerId": "m1",
  "sellerName": "Mario",
  "cerId": "cer-bertinoro",
  "kwh": 50,
  "pricePerKwh": 0.15,
  "validFrom": "2025-02-01",
  "validTo": "2025-02-28"
}
```

**Accept offer:**
```json
{ "action": "accept-offer", "offerId": "offer-1", "buyerId": "m2", "buyerName": "Luigi" }
```

---

## Forecasting & Weather

### 🔓 GET `/forecasting`

Get energy production forecasts.

**Query parameters:**
| Param | Description |
|---|---|
| `type=weather` | Weather forecast data |
| `lat`, `lng` | Coordinates for weather |
| `days=7` | Forecast horizon |
| `cerId` | CER for production forecast |

---

### 🔓 GET `/pvgis`

Query EU PVGIS solar radiation data for a location.

---

## Smart Grid & IoT

### GET `/smart-grid`

Manage IoT devices, telemetry, EV charging, and demand response.

### POST `/smart-grid`

Register devices, send commands, manage charging sessions and DR events.

---

### GET `/vpp`

Virtual Power Plant aggregation dashboard.

### POST `/vpp`

Manage VPP fleet and dispatch events.

---

### GET `/digital-twin`

Digital twin simulation of CER infrastructure.

---

## Carbon Credits

### GET `/carbon-credits`

Carbon dashboard with CO₂ avoidance calculations and credit portfolio.

### POST `/carbon-credits`

Issue or purchase carbon credits.

---

## Platform & Infrastructure

### 🔓 GET `/health`

Health check endpoint.

**Response** `200`:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "3.0.0",
  "uptime": 86400,
  "memory": { "heapUsed": 45000000 },
  "environment": "production",
  "services": { "redis": "connected", "minio": "connected" }
}
```

**Response** `503`: `{ "status": "unhealthy", ... }`

---

### 🔓 GET `/openapi`

Auto-generated OpenAPI 3.1 specification.

---

### 🔓 GET `/status`

Simplified status endpoint.

---

### 🔓 GET `/metrics`

Prometheus-compatible metrics.

---

### GET `/observability`

Request metrics, latency percentiles, error rates, health dashboard data.

---

### GET `/dashboard-config`

Get dashboard layout, widget configuration, and navigation.

**Query:** `userId` · `role` · `view=tour|widgets|nav`

### POST `/dashboard-config`

Customize dashboard layout and widget visibility.

---

### GET `/api-keys`

List API keys for the current user.

### POST `/api-keys`

Create or revoke API keys.

---

### GET `/webhooks`

List webhook subscriptions.

### POST `/webhooks`

Create, update, or delete webhook subscriptions.

---

### GET `/multi-tenant`

List tenants and platform stats.

### POST `/multi-tenant`

Provision, suspend, or reactivate tenants.

---

### GET `/developer-platform`

OAuth apps, marketplace plugins, developer dashboard.

### POST `/developer-platform`

Register OAuth apps, publish plugins, manage authorizations.

---

### GET `/federation`

Inter-CER federation data.

### POST `/federation`

Join or manage federated CER networks.

---

### 🔓 POST `/trial/signup`

Sign up for a free trial.

**Request:**
```json
{
  "organizationName": "CER San Lorenzo",
  "adminEmail": "admin@cersanlorenzo.it",
  "adminName": "Anna Bianchi",
  "municipality": "San Lorenzo",
  "province": "FC"
}
```

---

### GET `/onboarding`

Get onboarding wizard progress and steps.

### POST `/onboarding`

Update onboarding progress.

---

### GET `/integrations`

Integration health status for all external services.

---

### GET `/resilience`

System resilience metrics and circuit breaker status.

---

### GET `/simulation`

Run energy sharing simulations.

### POST `/simulation`

Create and execute simulation scenarios.

---

### GET `/i18n`

Get translations for a locale.

### POST `/i18n`

Update translation keys.

---

### GET `/gamification`

Leaderboards, achievements, challenges, and nudges.

### POST `/gamification`

Join challenges, award achievements.

---

### GET `/arera-compliance`

ARERA regulatory rules and compliance deadlines.

### POST `/arera-compliance`

Update rules, complete deadlines, record regulatory changes.

---

### GET `/gse-portal`

GSE submission status and reconciliation.

### POST `/gse-portal`

Submit data to GSE, retry submissions, resolve discrepancies.

---

### GET `/gse-reports`

GSE report generation and download.

---

### GET `/community`

Community feed, messages, referrals.

### POST `/community`

Create posts, react, comment, send messages, create referrals.

---

### GET `/community-capital`

Community capital campaign dashboard.

---

### GET `/financial-reconciliation`

Bank transaction matching and tax documents.

### POST `/financial-reconciliation`

Import transactions, confirm matches, generate tax documents.

---

### GET `/ai-optimization`

AI-powered energy optimization recommendations.

### POST `/ai-optimization`

Train optimization models.

---

### GET `/energy-agents`

Autonomous energy agent dashboard.

---

### GET `/events`

Domain event stream.

---

### GET `/offline-pwa`

PWA offline data sync status.

### POST `/offline-pwa`

Sync offline data.

---

### GET `/storage`

List uploaded files and storage stats.

### POST `/storage`

Generate upload/download URLs, register uploads, delete files.

---

## Error Codes

| Status | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Validation error or bad request |
| `401` | Authentication required |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (duplicate) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
| `501` | Not implemented |
| `503` | Service unavailable |

## Rate Limits

| Category | Window | Max Requests |
|---|---|---|
| `auth` | 60 seconds | 10 |
| `api` | 60 seconds | 100 |
| `upload` | 60 seconds | 5 |
| `public` | 60 seconds | 200 |

Rate limit headers are included in responses:
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (on 429)
