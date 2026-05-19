---
id: roadmap
title: Roadmap
description: What's in the box today, what's next, and how we decide.
---

# Roadmap

EnergiaNostra is **pre-1.0 and active**. The roadmap below reflects what's already
in the codebase versus what's coming. Stars next to features mean "merged but not
yet documented" — likely to appear in a near-term docs update.

## v0.x (now)

All of these are merged and exercised by the test suite:

- ✅ Full CER lifecycle (draft → active → reporting → closed)
- ✅ SPID, CIE, email/password authentication
- ✅ Meter ingestion via CSV, XML, and the e-distribuzione API
- ✅ GSE-TIAD sharing computation with four built-in distribution rules
- ✅ FatturaPA / PagoPA / SEPA payment rails
- ✅ Digital voting with quorum and *verbale* generation
- ✅ GSE portal submission (monthly + annual)
- ✅ ARERA compliance rule versioning
- ✅ GDPR exports and erasure
- ✅ P2P energy trading marketplace ★
- ✅ Carbon-credit ledger ★
- ✅ Demand response and VPP grouping ★
- ✅ OAuth2 developer platform with API keys and webhooks
- ✅ Helm chart, Terraform module, Docker Compose

## v1.0 — target Q4 2025

The 1.0 line is about hardening and a public stability commitment:

- Public stability guarantees on the REST API (SemVer).
- Locked Prisma schema with versioned migrations.
- Battle-tested upgrade path from v0.x.
- Performance budget: 10 CERs × 100 members × 90 days of data on a 2-vCPU node.
- Multi-region failover playbook.

## v1.1 — Q1 2026

- **Mobile app** (React Native) for members, focused on consumption alignment.
- **In-app dashboard authoring** so admins can build custom charts without code.
- **Better forecasting**: ML model per CER trained on local weather + historical
  consumption, replacing the current heuristic.

## v1.2 — Q2 2026

- **Cross-CER aggregation** for *consorzi* (consortia) of CERs.
- **Energy community-of-communities**: a parent legal entity coordinating multiple
  CERs.
- **Subsidy programme management**: PNRR grant tracking with milestone-based
  disbursement.

## v2.0 — H2 2026: Europe

- **Spanish "comunidades energéticas"** support (different regulator, different
  perimeter rules).
- **French "communautés d'énergie renouvelable"** support.
- **German "Energiegemeinschaften"** support.
- **Pluggable regulator module**: a `Regulator` interface so adding a new country
  is a matter of implementing perimeter checks, tariffs, and reporting formats.

## Themes we keep investing in

- **Auditability**: every state-changing operation must remain reproducible from
  raw data and the audit log.
- **Open formats**: GSE XML, FatturaPA, SEPA, ISO-20022, OCPP, OpenAPI. We don't
  invent file formats.
- **Self-hostable**: every feature must work on a small Hetzner VM with no
  proprietary services required.
- **TypeScript end-to-end**: no shadow Python services to deploy.

## How we decide

Roadmap items move from "idea" → "draft RFC in `docs/rfcs/`" → "merged"
based on:

1. **Regulatory necessity** — if ARERA, GSE or AgID changes a rule, that work
   jumps the queue.
2. **Pilot demand** — features actually needed by CERs running on the platform.
3. **Strategic value** — does it unlock the next 10× of users?

If you want a feature, the fastest path is to **open an issue** describing the
CER problem you're trying to solve. The fastest-implemented features are the ones
backed by a real pilot.

## What's intentionally *not* on the roadmap

- A proprietary energy marketplace controlled by us.
- Selling member data, even anonymised, to third parties without explicit consent.
- A closed-source "enterprise" fork.

These would compromise the trust that makes a CER want to use the platform.
