---
id: changelog
title: Changelog
description: Release notes for EnergiaNostra.
---

# Changelog

This page summarises notable changes. For the full, machine-readable changelog see
[CHANGELOG.md](https://github.com/ForliLabs/energia-nostra/blob/main/CHANGELOG.md).
We follow [Keep a Changelog](https://keepachangelog.com/) and SemVer.

While in 0.x, **minor** versions may include breaking changes. Each entry calls
them out explicitly.

## Unreleased

- **docs**: New Docusaurus documentation site under `website/`.
- **chore**: Tightened ESLint rules around unused imports.

## 0.9.0 — 2025-05-15

### Added

- P2P energy trading marketplace (`src/lib/trading.ts`).
- Carbon-credit ledger with issuance, transfer and retirement (`carbon-credits.ts`).
- Demand response events and VPP group aggregation (`smart-grid.ts`).
- OAuth2 developer platform with scopes, refresh tokens and consent screen.
- Web Push notifications with VAPID.

### Changed

- **Breaking**: `SharingBalance.methodology` is now required. Migration is
  automatic for existing rows.
- Energy-sharing computation moved to a dedicated Postgres function for ~10×
  speedup on large CERs.
- `src/lib/observability.ts` now uses pino JSON logs by default.

### Fixed

- SPID redirect loop when `BASE_URL` contained a trailing slash.
- Stripe Connect payouts incorrectly rounding when the incentive split produced
  more than 2 decimals.

## 0.8.0 — 2025-04-02

### Added

- e-distribuzione API ingestion for near-real-time meter data.
- Certificazione Unica annual export bundling all members.
- Multi-tenant mode (`MULTI_TENANT=true`) with per-tenant DB schema.

### Changed

- **Breaking**: `Member.memberType` no longer accepts `null`. Existing rows are
  migrated to `consumer`.
- GSE report XML schema updated to the 2025 version.

## 0.7.0 — 2025-02-20

### Added

- SPID and CIE authentication (SAML 2.0).
- PagoPA inbound payments for public-administration members.
- Helm chart and Terraform module under `infra/`.

### Fixed

- `prisma migrate deploy` failing when the schema had a CHECK constraint added
  before the column was created.

## 0.6.0 — 2025-01-08

### Added

- Digital voting with quorum tracking and *verbale* PDF generation.
- Bylaws templates for association, cooperative and SRL.

## 0.5.0 — 2024-11-25

### Added

- Energy-sharing computation following GSE TIAD methodology.
- Distribution rules: pro-rata-shared, pro-rata-consumed, equal-split,
  weighted-stake.
- Member onboarding state machine.

## Earlier versions

For releases before 0.5.0, see the
[full CHANGELOG.md](https://github.com/ForliLabs/energia-nostra/blob/main/CHANGELOG.md).
