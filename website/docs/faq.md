---
id: faq
title: FAQ
description: Common questions about EnergiaNostra, CERs, and the project.
---

# FAQ

## About the project

### Is EnergiaNostra really free?

Yes. The code is **MIT-licensed** and you can self-host indefinitely at no cost.
We also offer a managed/hosted version (`€99–€499/month` depending on CER size)
for communities that prefer not to operate the infrastructure themselves — but
it's exactly the same code.

### Who is behind EnergiaNostra?

EnergiaNostra was started by **ForliLabs**, a software collective in
Forlì-Cesena, Italy. The province has the highest renewable-electricity share in
Italy (71.2%) and is one of the first to attempt regional-scale CERs.

### Is the project production-ready?

It's used in production by pilot CERs in Forlì-Cesena. The platform handles real
money and real GSE submissions today. We are pre-1.0 because we want to lock the
public API and database schema before declaring stability — see
[Roadmap](./about/roadmap).

### How do you make money?

Three streams: (1) managed hosting, (2) CER setup services (legal entity, GSE
application), (3) referral commissions from partner solar installers. We
explicitly do **not** sell or monetise CER data.

## About CERs

### What is a CER?

A *Comunità Energetica Rinnovabile* — a legal entity of citizens, businesses
and/or public bodies that share renewable energy locally and receive a GSE
incentive (€110/MWh) for the kWh consumed within the community. See
[What is a CER?](./concepts/cer) for the full model.

### How much can a member save?

It depends on consumption profile, plant size and member type. A typical Italian
household in a 50-member CER saves €200–€500/year in combined energy bill
reduction and incentive distribution. A business member with daytime consumption
can save 2–3× that.

### How long does it take to set up a CER?

The legal entity can be created in 2–4 weeks (faster as an *associazione*,
slower as a *cooperativa*). The GSE approval after that takes 30–60 days. So
plan on 2–3 months from idea to first incentive payment.

### Can I form a CER without a software platform?

You can. But you'll spend dozens of hours a month on spreadsheets, GSE-portal
copy-paste and member statements. EnergiaNostra exists because that work is
both error-prone and fundamentally automatable.

## Technical

### Why Next.js and not Python/Django/Rails?

Three reasons: (1) one language end-to-end (TypeScript on server and client),
(2) Next.js's RSC model fits dashboard-heavy apps well, (3) we want operators
to deploy one process, not two.

### Can I run it on serverless?

Yes — the app is largely stateless. You'll still need Postgres, Redis and S3
somewhere. Vercel + Neon + Upstash + R2 is a known-good combo. The CronJobs in
the Helm chart can become Vercel Cron or AWS EventBridge schedules.

### Can I use a different database?

Postgres and libSQL/SQLite are first-class. MySQL/MariaDB *should* work because
the schema is straightforward, but it's not in CI. PRs welcome.

### Why server-side sessions and not JWTs?

Auditability and revocability. See
[Authentication → Sessions, not JWTs](./concepts/authentication#sessions-not-jwts).

### How big can a single CER get?

The data model supports thousands of members per CER. We've stress-tested up to
500 members × 1 year of 15-minute readings (= ~17.5M `EnergyReading` rows) on a
4-vCPU Postgres without partitioning. Beyond that, partition `EnergyReading` by
`cerId` and `periodStart`.

### Is there an SDK?

The OpenAPI spec at `/api/openapi` generates typed clients in 50+ languages via
`openapi-generator`. We don't ship a hand-written SDK; the generated one is
usually fine. See [CLI & scripts → Generating API clients](./reference/cli-scripts#generating-api-clients).

## Compliance & legal

### Is EnergiaNostra GDPR-compliant?

The platform provides every endpoint and process required: consent ledger,
right to access (`GET /gdpr/export`), right to erasure (`POST /gdpr/erasure`),
processing record, data minimisation, audit trail. GDPR compliance is a
property of the **operator**, not the software — so you also need a privacy
policy and a DPO if your CER size requires it.

### Does the platform handle Italian e-invoicing (FatturaPA)?

Yes. Invoices are generated as FatturaPA XML and submitted to the SDI. Public
administration receivers go through PagoPA.

### What about ARERA inspections?

Every state-changing operation writes an `AuditEvent` with actor, timestamp, IP
and resulting object IDs. Bylaws, *verbali*, GSE receipts and bank statements
are stored as immutable `Document` rows with SHA-256 hashes. This is what an
ARERA auditor expects.

## Community

### How do I contribute?

See [Contributing](./community/contributing). The fastest contribution is to
report a bug from your own CER — those issues get prioritised.

### Is there a roadmap I can vote on?

Yes — every roadmap item is a GitHub issue. Add a 👍 to the ones you care about;
we use those counts (alongside pilot signals) to prioritise.

### How do I get support?

- **GitHub Discussions** — async, public, free.
- **GitHub Issues** — for bugs and feature requests.
- **Managed hosting** customers get email support with SLA.
