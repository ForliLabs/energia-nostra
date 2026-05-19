---
id: deploy-production
title: Deploy to production
description: Take EnergiaNostra from your laptop to a hardened production deployment on Docker, Kubernetes or Hetzner.
---

# Deploy to production

This guide goes from "works on my laptop" to a deployment you can trust with real
money and real members. Three target setups, in order of increasing scale.

## Setup A — Docker on a single VM (≤ 5 CERs)

For a pilot or a single-CER deployment, one Hetzner CX22 VM (€4/month) is plenty.

```bash
ssh root@your-vm
git clone https://github.com/ForliLabs/energia-nostra.git
cd energia-nostra
cp .env.production.template .env
$EDITOR .env       # fill in secrets — see Reference → Configuration
docker compose --profile prod up -d
```

The Compose file in the repo runs PostgreSQL, Redis, MinIO and the app behind
Caddy with automatic HTTPS. Set `DOMAIN=cer.example.it` in `.env` and Caddy
provisions Let's Encrypt automatically.

### Hardening checklist

- [ ] `NODE_ENV=production`
- [ ] Strong `SESSION_SECRET` (≥ 32 random bytes, generate with `openssl rand -base64 32`)
- [ ] `DATABASE_URL` points at managed Postgres (not local SQLite)
- [ ] `REDIS_URL` points at a Redis with `requirepass` set
- [ ] S3 bucket has versioning and lifecycle rules
- [ ] Sentry DSN set (`SENTRY_DSN`)
- [ ] SPID/CIE certificates rotated less than 12 months old
- [ ] **Demo seed script disabled** — never run `prisma/seed.ts` in production

## Setup B — Kubernetes (10–100 CERs)

EnergiaNostra ships a Helm chart in `infra/helm/`.

```bash
cd infra/helm
helm install energianostra . \
  --namespace energianostra --create-namespace \
  --set image.tag=v0.9.0 \
  --set ingress.hosts[0].host=cer.example.it \
  --set ingress.tls[0].secretName=cer-tls \
  --set postgresql.auth.password=$(openssl rand -base64 24) \
  --set redis.auth.password=$(openssl rand -base64 24)
```

The chart provisions:

- 2× app `Deployment` replicas with rolling updates.
- PostgreSQL via the Bitnami sub-chart (replace with your managed service in prod).
- Redis via the Bitnami sub-chart.
- A CronJob for monthly GSE reporting.
- A CronJob for nightly database backups to S3.
- Prometheus `ServiceMonitor` and a Grafana dashboard.

### Secrets

Don't put secrets in `values.yaml`. Use Sealed Secrets or your cloud's secret
manager:

```bash
kubectl create secret generic en-env \
  --from-env-file=.env.production \
  --namespace energianostra

helm upgrade energianostra . --reuse-values \
  --set envFromSecret=en-env
```

## Setup C — Terraform on Hetzner Cloud

For repeatable, version-controlled deployments, use the Terraform module in
`infra/terraform/`:

```bash
cd infra/terraform
cp staging.tfvars.example staging.tfvars
$EDITOR staging.tfvars
terraform init
terraform plan -var-file=staging.tfvars
terraform apply -var-file=staging.tfvars
```

The module provisions:

- A k3s cluster on Hetzner (3 nodes, configurable).
- A managed Postgres instance.
- Hetzner Object Storage bucket for files.
- DNS records at your registrar (Route 53, Cloudflare, …).
- A bootstrap step that runs the Helm chart from Setup B.

## Database migrations

Migrations run **automatically on app start** via `npx prisma migrate deploy`.
For zero-downtime deploys:

1. Always write **forward-compatible** schema changes (additive columns first).
2. Tag the release that *uses* the new column separately from the one that
   *adds* it.
3. Use Kubernetes rolling-update strategy with `maxUnavailable: 0`.

## Backups

The Helm chart's nightly CronJob runs `pg_dump` and uploads to S3. To verify:

```bash
kubectl exec -n energianostra deploy/energianostra-backup-verifier -- \
  /scripts/restore-test.sh
```

This restores the latest dump into a scratch database and runs `prisma migrate
status` against it. Run it weekly.

## Observability

- **Logs**: structured JSON to stdout. Ship to Loki, Datadog or CloudWatch.
- **Metrics**: `/api/metrics` exposes Prometheus format.
- **Traces**: enable OpenTelemetry by setting `OTEL_EXPORTER_OTLP_ENDPOINT`.
- **Uptime**: hit `/api/health` (no auth) and `/api/health/deep` (auth required,
  also pings DB + Redis + S3).

## Disaster recovery drills

Run these quarterly:

1. **Restore drill**: replay a backup into a staging cluster, log in, run a
   sharing computation, compare to the production result.
2. **Region failover** (if multi-region): simulate the primary region failing,
   measure recovery time.
3. **Secret rotation**: rotate `SESSION_SECRET`. All sessions log out — that's
   expected and documented in user-facing release notes.

## Common production mistakes

- ❌ **Forgetting to set `ALLOWED_ORIGINS`** — CORS errors in the browser.
- ❌ **Postgres `max_connections` too low** — set to ≥ 100 for a 2-replica app.
- ❌ **Running the seed script in prod** — deletes real data, replaces with demo.
- ❌ **Mixing tariffs across periods** — always create a new `Tariff` row, never
  edit historical ones in place.
- ❌ **Missing GSE certificate renewal** — set a calendar reminder for 60 days
  before expiry.
