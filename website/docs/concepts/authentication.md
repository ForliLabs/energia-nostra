---
id: authentication
title: Authentication
description: Email/password, SPID, CIE, sessions, API keys and CSRF — how identity works in EnergiaNostra.
---

# Authentication

EnergiaNostra supports three authentication methods for end users and one for
machines:

| Method | For | Backed by |
|---|---|---|
| Email + password | All users | PBKDF2 (production) / SHA-256 (demo) |
| **SPID** | Italian citizens | SAML 2.0, Sistema Pubblico di Identità Digitale |
| **CIE** | Italian citizens | SAML 2.0, Carta d'Identità Elettronica |
| API key | Machines | `Authorization: Bearer en_live_...` |

## Sessions, not JWTs

Every successful login creates a row in the `Session` table:

```text
Session
  id              -- 32-byte random, sent as session_id cookie
  userId          -- FK to User
  csrfToken       -- per-session, sent in X-CSRF-Token header for mutations
  expiresAt
  refreshToken    -- optional, rotates every 24h
  ipAddress
  userAgent
```

The cookie is **HTTP-only, Secure, SameSite=Lax**. Revoking a session means
deleting the row — instant logout across all open tabs.

We avoid JWTs because:

- The audit value of a server-side row is high (you can see *which* sessions are
  active for a user).
- Token revocation is free.
- Italian regulators (ARERA) appreciate the auditability.

## Email + password

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@energianostra.it","password":"demo2025"}' \
  -c cookies.txt
```

Production builds use **PBKDF2-SHA256** with 600,000 iterations
(`src/lib/auth-production.ts`). Demo builds use SHA-256 so the seeded passwords
can be deterministic.

Failed attempts are tracked on the `User` row; after 5 failures within 15 minutes
the account is locked until `lockedUntil`. The lock is enforced before the
password is even checked, so timing attacks don't help.

## SPID

[SPID](https://www.spid.gov.it/) is Italy's federated digital identity. Click
**Accedi con SPID** in the UI, pick your Identity Provider (Poste, Aruba, Tim,
…), and you'll bounce through SAML.

To enable SPID in production set:

```bash
SPID_ENTITY_ID="https://your-host/spid/metadata"
SPID_CERTIFICATE="-----BEGIN CERTIFICATE-----..."
SPID_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
SPID_ACS_URL="https://your-host/api/auth/spid/acs"
```

The SAML metadata is served at `/api/auth/spid/metadata` — submit that URL to
AgID to register your Service Provider.

```mermaid
sequenceDiagram
    participant U as User
    participant EN as EnergiaNostra
    participant IdP as SPID IdP (Poste/Aruba/...)

    U->>EN: GET /api/auth/spid
    EN-->>U: 302 to IdP with SAMLRequest
    U->>IdP: Authenticate (CIE-OTP, app, ...)
    IdP-->>U: 302 back with SAMLResponse
    U->>EN: POST /api/auth/spid/acs
    EN->>EN: Validate signature, extract attributes
    EN->>EN: Find/create User (spidId)
    EN-->>U: Set session_id cookie + redirect
```

## CIE

The flow is identical to SPID but uses the CIE IdP (`idserver.servizicie.interno.gov.it`).
The user authenticates by tapping their physical electronic ID card on their phone.
Set `CIE_*` env vars analogously to `SPID_*`.

## API keys

For server-to-server use, generate an API key from
**Dashboard → Developers → API Keys**. Keys look like:

```text
en_live_3f4a9b2c8e1d6f5a7b9c0d2e4f6a8b1c
```

Pass it as `Authorization: Bearer en_live_...`. Keys are:

- Scoped to a CER (or all CERs, for superadmin keys).
- Rate-limited per key (default 100 req/min, configurable).
- Revocable instantly.
- Hashed at rest with `argon2id`; the plaintext is shown **once** at creation.

```bash
curl -H 'Authorization: Bearer en_live_3f4a...' \
  http://localhost:3000/api/cer/cer-bertinoro/members
```

## CSRF protection

For browser-based mutations, EnergiaNostra requires a CSRF token in addition to
the session cookie:

```bash
# 1. Get a CSRF token (any GET to /api/auth/csrf)
TOKEN=$(curl -b cookies.txt http://localhost:3000/api/auth/csrf | jq -r .csrfToken)

# 2. Send it as a header on the mutation
curl -b cookies.txt -X POST http://localhost:3000/api/cer \
  -H "X-CSRF-Token: $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"CER Esempio"}'
```

API-key clients skip CSRF (they cannot ride a cookie).

## Roles

The four built-in roles are:

| Role | Can… |
|---|---|
| `superadmin` | Everything across all CERs (multi-tenant operators). |
| `admin` | Manage one CER: members, plants, billing, GSE. |
| `auditor` | Read-only access to one CER, including financial data. |
| `member` | View own data, vote, sign documents, receive payouts. |

Role checks live in `src/lib/auth.ts` → `requireRole()`. Add a custom role by
extending the union type and re-running tests.

## What you shouldn't do

- ❌ Don't bypass `src/lib/auth.ts` from API handlers — the audit log depends on
  going through it.
- ❌ Don't store secondary passwords in the `User` row. Use SPID/CIE or invite a
  second account.
- ❌ Don't reuse API keys across environments. Issue one per environment so
  revocation is surgical.
