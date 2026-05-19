---
id: configuration
title: Configuration
description: Every environment variable EnergiaNostra reads, what it does, and sensible defaults.
---

# Configuration

EnergiaNostra is configured via environment variables. Copy
`.env.production.template` to `.env` and fill in values; the app refuses to start
if required ones are missing in production mode.

Variables are grouped by domain below. Defaults shown are what's used in the
absence of an explicit value.

## Core

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | `development` \| `production` \| `test` |
| `PORT` | no | `3000` | HTTP port |
| `BASE_URL` | yes (prod) | `http://localhost:3000` | Public URL, used in emails and SAML |
| `SESSION_SECRET` | yes (prod) | — | ≥ 32-byte random string for session signing |
| `ALLOWED_ORIGINS` | yes (prod) | — | Comma-separated CORS origins |
| `LOG_LEVEL` | no | `info` | `debug` \| `info` \| `warn` \| `error` |

## Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` | Prisma connection string |
| `POSTGRES_USER` | for Compose | `energianostra` | Postgres user |
| `POSTGRES_PASSWORD` | for Compose | — | Postgres password |
| `POSTGRES_DB` | for Compose | `energianostra` | Postgres database name |
| `DB_POOL_SIZE` | no | `20` | Prisma connection pool size |

## Redis & cache

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | yes (prod) | — | e.g. `redis://:password@host:6379/0` |
| `RATE_LIMIT_PREFIX` | no | `rl:` | Key prefix for rate-limit counters |

## Storage (S3)

| Variable | Required | Default | Description |
|---|---|---|---|
| `S3_ENDPOINT` | yes (prod) | — | e.g. `https://s3.eu-central-1.amazonaws.com` |
| `S3_REGION` | yes (prod) | — | Region |
| `S3_BUCKET` | yes (prod) | — | Bucket name |
| `S3_ACCESS_KEY` | yes (prod) | — | Access key |
| `S3_SECRET_KEY` | yes (prod) | — | Secret key |
| `S3_FORCE_PATH_STYLE` | no | `false` | Set `true` for MinIO |

## SPID

| Variable | Required | Default | Description |
|---|---|---|---|
| `SPID_ENTITY_ID` | for SPID | — | Service Provider entity ID |
| `SPID_CERTIFICATE` | for SPID | — | PEM-encoded certificate |
| `SPID_PRIVATE_KEY` | for SPID | — | PEM-encoded private key |
| `SPID_ACS_URL` | for SPID | `{BASE_URL}/api/auth/spid/acs` | Assertion Consumer Service URL |
| `SPID_IDP_METADATA_URL` | for SPID | AgID URL | IdP metadata source |

## CIE

| Variable | Required | Default | Description |
|---|---|---|---|
| `CIE_ENTITY_ID` | for CIE | — | Service Provider entity ID |
| `CIE_CERTIFICATE` | for CIE | — | PEM certificate |
| `CIE_PRIVATE_KEY` | for CIE | — | PEM private key |
| `CIE_ACS_URL` | for CIE | `{BASE_URL}/api/auth/cie/acs` | ACS URL |

## Payments

| Variable | Required | Default | Description |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | for Stripe | — | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | for Stripe | — | `whsec_...` |
| `STRIPE_CONNECT_ENABLED` | no | `false` | Enable Connect for member payouts |
| `PAGOPA_API_KEY` | for PA payers | — | PagoPA REST API key |
| `PAGOPA_FISCAL_CODE` | for PA payers | — | Your PA fiscal code |
| `SEPA_CREDITOR_ID` | for SEPA | — | Your SEPA Creditor Identifier |
| `SEPA_IBAN` | for SEPA | — | Source IBAN for outgoing transfers |

## GSE & ARERA

| Variable | Required | Default | Description |
|---|---|---|---|
| `GSE_API_KEY` | yes (prod) | — | GSE portal API key |
| `GSE_CLIENT_ID` | yes (prod) | — | OAuth client ID |
| `GSE_TARIFF_EUR_PER_KWH` | no | `0.110` | Override the default tariff |
| `ARERA_RULESET_VERSION` | no | `TIAD-2024-v3` | Active rule version |

## Meter ingestion

| Variable | Required | Default | Description |
|---|---|---|---|
| `EDISTRIBUZIONE_CLIENT_ID` | for API | — | e-distribuzione API client ID |
| `EDISTRIBUZIONE_CLIENT_SECRET` | for API | — | e-distribuzione API secret |
| `EDISTRIBUZIONE_DELEGA_TOKEN` | for API | — | Per-POD delega token |
| `METER_SFTP_HOST` | for SFTP | — | SFTP host for scheduled pulls |
| `METER_SFTP_USER` | for SFTP | — | Username |
| `METER_SFTP_KEY` | for SFTP | — | Private key path |

## Email & notifications

| Variable | Required | Default | Description |
|---|---|---|---|
| `SENDGRID_API_KEY` | yes (prod) | — | SendGrid API key |
| `EMAIL_FROM` | yes (prod) | `noreply@example.it` | Sender address |
| `VAPID_PUBLIC_KEY` | for Push | — | Web Push public key |
| `VAPID_PRIVATE_KEY` | for Push | — | Web Push private key |
| `VAPID_SUBJECT` | for Push | `mailto:admin@example.it` | Contact email |

## Observability

| Variable | Required | Default | Description |
|---|---|---|---|
| `SENTRY_DSN` | no | — | Sentry error tracking |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | no | — | OpenTelemetry collector endpoint |
| `OTEL_SERVICE_NAME` | no | `energianostra` | Service name in traces |

## Multi-tenant & developer platform

| Variable | Required | Default | Description |
|---|---|---|---|
| `MULTI_TENANT` | no | `false` | Enable tenant isolation by domain |
| `OAUTH2_ISSUER` | for OAuth | `{BASE_URL}` | OIDC issuer URL |
| `API_KEY_PREFIX` | no | `en_live_` | Prefix for generated API keys |

## Feature flags

| Variable | Default | Description |
|---|---|---|
| `FEATURE_TRADING` | `false` | Enable P2P trading marketplace |
| `FEATURE_CARBON_CREDITS` | `false` | Enable carbon-credit ledger |
| `FEATURE_VPP` | `false` | Enable virtual power plant aggregation |
| `AUTO_APPROVE_MEMBERS` | `false` | Skip admin approval step in onboarding |

## A minimal `.env` for production

```bash
NODE_ENV=production
BASE_URL=https://cer.example.it
SESSION_SECRET=$(openssl rand -base64 48)
ALLOWED_ORIGINS=https://cer.example.it

DATABASE_URL=postgresql://user:pass@db:5432/energianostra
REDIS_URL=redis://:pass@redis:6379/0

S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com
S3_REGION=eu-central-1
S3_BUCKET=energianostra-prod
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@cer.example.it

GSE_API_KEY=...
GSE_CLIENT_ID=...
```

Everything else can be added when you actually need that feature.

## Validating your config

```bash
npm run check:env
```

Lists every required variable and whether it's set, exits non-zero on missing
production-required ones. Wire it into your CI.
