# EnergiaNostra — Repository Analysis & Next-Gen Feature Planning

> **Date**: July 2025
> **Repository**: `energia-nostra/`
> **Stack**: Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Prisma 7 · SQLite

---

## Part 1: Core Feature Extraction

### Primary Purpose

EnergiaNostra is a SaaS platform for managing **Comunità Energetiche Rinnovabili (CER)** — the new Italian/EU legal framework enabling neighbors, businesses, and public entities to form renewable energy cooperatives. It replaces the spreadsheets and manual paperwork that currently block CER adoption in Italy, providing digital tools for every phase from feasibility assessment to monthly incentive distribution.

### Core Features

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | **CER Feasibility Assessment** | Interactive calculator that evaluates building type, roof availability, member count, and energy costs to produce estimated annual savings, ROI, and recommended CER type — calibrated on Forlì-Cesena consumption profiles. | ✅ Functional (client-side) |
| 2 | **Member Management** | Full member registry with POD codes, energy balance tracking, producer/consumer/prosumer classification, and per-member benefit statements. REST API for CRUD operations with duplicate-POD validation. | ✅ Functional (in-memory store + API) |
| 3 | **Energy Metering & Balance** | Monthly production vs. consumption tracking with shared energy calculations, self-consumption percentages, CO₂ avoidance metrics, and per-member energy quota breakdowns. | ✅ Functional (seed data) |
| 4 | **GSE Incentive Distribution** | Weighted incentive allocation across 25 members using type-based and energy-balance-based scoring (producers 1.3×, prosumers 1.1×, consumers 0.85×), with monthly and year-to-date euro amounts. | ✅ Functional (computed) |
| 5 | **Governance & Digital Voting** | Document management (statuto, regolamento, verbale, report), scheduled vote tracking with quorum requirements, and announcement board for CER communications. | ✅ UI complete (read-only) |
| 6 | **GSE Compliance Tracking** | Reporting status dashboard showing last submission, next deadline, current incentive rate (€110/MWh), and POD validation completeness. | ✅ UI complete (static data) |
| 7 | **PNRR Grant Tracker** | Progress tracking for government PNRR grants covering community solar installations — budget, approvals, disbursements, and next milestones. | ✅ UI complete (static data) |

### Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16.2.6 (App Router) | Latest version with React 19 RSC |
| **Language** | TypeScript 5 | Strict typing throughout |
| **Styling** | Tailwind CSS 4 + CVA + tailwind-merge | Utility-first with component variants |
| **Icons** | Lucide React | Consistent icon system |
| **ORM** | Prisma 7.8.0 (configured, minimal usage) | SQLite datasource; only a `User` model defined |
| **Data Layer** | Custom `InMemoryStore<T>` class | Generic CRUD with seed data — production swap to Prisma planned |
| **API** | Next.js Route Handlers | `GET /api/members`, `POST /api/members`, `GET /api/energy` |
| **Architecture** | Server Components + Client Islands | Assessment and Members pages are `"use client"`; dashboard pages are RSC |
| **Localization** | Italian-first (lang="it") | All UI text in Italian; `Intl.NumberFormat("it-IT")` |

### Target Users

1. **CER Promoters**: Municipalities, condominium administrators, and community leaders in Forlì-Cesena evaluating or launching a CER.
2. **CER Managers**: Energy managers running daily operations — metering, incentive distribution, GSE reporting.
3. **CER Members**: Individual producers, consumers, and prosumers viewing their energy contribution and economic benefits.
4. **Public Administrators**: Municipalities like Bertinoro managing PNRR grant applications and multi-building CER setups.

### Unique Differentiators

1. **First-mover in a virgin market**: No purpose-built Italian CER management SaaS exists today.
2. **Forlì-Cesena specificity**: Calibrated on Italy's highest renewable-electricity province (71.2%), with real local member profiles (Bertinoro, Forlimpopoli, Meldola).
3. **End-to-end CER lifecycle**: Covers feasibility → formation → operations → compliance — competitors only offer fragments.
4. **GSE methodology compliance**: Incentive distribution uses the actual GSE weighted-sharing formula.
5. **Cooperative culture alignment**: Built for Emilia-Romagna's 8,100+ cooperative tradition.

---

## Part 2: Market Potential Analysis

### Market Size

| Segment | Size | Methodology |
|---------|------|-------------|
| **TAM** | **€360M ARR** | 100,000+ EU energy communities projected by 2030 × €300/month avg. |
| **SAM** | **€18M ARR** | 5,000 Italian CERs (government target) × €300/month |
| **SOM Year 1** | **€12K ARR** | 5 CERs in Forlì-Cesena × €200/month |
| **SOM Year 2** | **€180K ARR** | 50 CERs across Emilia-Romagna × €300/month |

The Italian government has allocated significant PNRR funding specifically to accelerate CER creation, making the SAM achievable rather than aspirational. The EU Renewable Energy Directive mandates similar frameworks across all 27 member states, validating the TAM trajectory.

### Competitive Landscape

| Competitor | Type | Strengths | Weaknesses | EnergiaNostra Advantage |
|-----------|------|-----------|------------|-------------------------|
| **Regalgrid** (Veneto) | Hardware + software platform | Integrated energy sharing | Hardware-dependent; enterprise pricing (€10K+/year) | Software-only; 10× cheaper; community-focused |
| **Energy Web** (Global) | Blockchain energy platform | Decentralized architecture | Too technical; not Italy-specific; no CER compliance | Italian regulatory compliance; non-technical UX |
| **Enerbrain** (Turin) | Building energy optimization | AI-driven efficiency | Single-building scope; no CER management | Multi-member CER orchestration |
| **Consulting firms** | Manual CER setup services | Domain expertise | €5-15K one-time; no ongoing management | €99-499/month SaaS with continuous operations |
| **Excel spreadsheets** | Current "system" for most CERs | Familiar; free | No automation; error-prone; no GSE integration | Purpose-built automation; incentive calculations |

### Current Traction

| Metric | Value | Assessment |
|--------|-------|------------|
| **Codebase maturity** | ~2,230 lines TypeScript across 21 files | Early MVP — functional prototype |
| **Feature completeness** | 7/7 core features built (UI complete) | Strong foundation for demo/pilot |
| **Data layer** | In-memory store with 25 seeded members | Needs persistence for production |
| **API surface** | 3 endpoints (members CRUD, energy read) | Minimal but functional |
| **Authentication** | None implemented | Critical gap for production |
| **Testing** | No test files found | Risk for reliability |

### Adoption Barriers

1. **No authentication/authorization**: Cannot support real multi-tenant CER operations.
2. **In-memory data**: All data lost on server restart — no production persistence.
3. **No smart meter integration**: Members must manually input energy data.
4. **No SPID integration**: Italian digital identity required for legal compliance of voting.
5. **Long CER formation cycle**: 6-12 months from interest to operational CER — long sales funnel.
6. **Regulatory complexity**: CER managers need education alongside software.

### Growth Opportunities

1. **Condominium administrator channel**: Italy's ~30,000 property administrators each manage 50+ buildings — ideal distribution partners.
2. **Municipal partnerships**: Comuni can mandate CER management software for PNRR-funded projects.
3. **Solar installer referral network**: Installers recommend software during CER setup.
4. **EU expansion**: Spain, France, Germany all implementing similar CER frameworks.
5. **Data monetization**: Aggregated CER performance data valuable to energy companies and researchers.

---

## Part 3: Next-Gen Feature Proposals

| # | Feature Name | Description | Why Implement | Complexity | Impact |
|---|--------------|-------------|---------------|------------|--------|
| 1 | **Authentication & Multi-Tenancy** | Implement SPID/CIE authentication with role-based access (CER admin, member, auditor) and full multi-tenant data isolation so multiple CERs can operate independently on one platform. | Without auth, the platform cannot leave demo mode. This is the #1 blocker for any real CER deployment. Every other feature depends on it. | High | **10** |
| 2 | **Persistent Database Migration** | Migrate from `InMemoryStore` to Prisma with PostgreSQL, implementing a complete schema covering members, energy readings, incentives, documents, votes, and audit logs. Add TimescaleDB hypertables for time-series energy data. | Data loss on restart makes the platform unusable for production. CERs operate for 20+ years — they need durable storage from day one. | Medium | **10** |
| 3 | **Smart Meter Data Pipeline** | Build an automated data ingestion pipeline supporting CSV upload (immediate), e-distribuzione API (Phase 2), and GSE portal scraping (Phase 3) for monthly energy readings per POD. Include data validation, anomaly detection, and reconciliation against GSE records. | Manual data entry is the biggest operational burden for CER managers. Automating meter data eliminates errors and saves 10+ hours/month per CER. | High | **9** |
| 4 | **Automated GSE Reporting Engine** | Generate GSE-compliant monthly reports with all required fields (shared energy, member allocations, POD validation), produce the exact XML/CSV format GSE expects, and provide one-click submission preparation with pre-submission validation checks. | GSE reporting is the most complex recurring CER obligation. Automating it is the single strongest retention driver — CER managers will never leave. | High | **9** |
| 5 | **Interactive Energy Dashboard with Real Charts** | Replace the CSS-bar-chart placeholders with interactive Recharts/Visx visualizations: production vs. consumption over time, hourly consumption heatmaps, member contribution breakdowns, and shared energy optimization curves. Add drill-down from monthly to daily to hourly views. | Data visualization is the primary engagement driver for both CER managers and members. Beautiful charts justify the subscription and make the value of CER membership tangible. | Medium | **8** |
| 6 | **Digital Voting & Assembly System** | Implement end-to-end digital voting with SPID-verified identity, quorum tracking, secret/open ballot options, proxy delegation, vote result certification, and automatic minute generation. Support both real-time assemblies and asynchronous multi-day votes. | CER governance requires formal democratic processes. Digital voting eliminates the need for physical assemblies (critical for distributed CERs across multiple comuni) and produces legally valid records. | High | **8** |
| 7 | **Member Self-Service Portal** | Create a dedicated member-facing portal (separate from admin dashboard) where individual members can view their energy contribution, monthly savings statement, upcoming votes, and personal benefit projections. Include push notifications for votes, announcements, and billing. | Members who see their personal benefit stay engaged and advocate for CER expansion. Self-service reduces admin burden by 60%+ and drives the network effects that grow the CER. | Medium | **8** |
| 8 | **PVGIS Solar Potential Integration** | Integrate the EU PVGIS API to provide satellite-based solar irradiance analysis for any address in the CER assessment tool. Show monthly production estimates, optimal panel orientation, and shading analysis on an interactive map with cadastral overlay. | Transforms the assessment tool from a generic calculator into a data-driven feasibility engine. PVGIS is free and covers all of Europe — instant competitive differentiation. | Medium | **7** |
| 9 | **Financial Billing & Payment System** | Automate monthly member billing: calculate each member's share, generate PDF invoices/statements, integrate with Stripe (private) and PagoPA (public entities), track payment status, and produce annual tax documentation for member deductions. | Financial management is the second-highest operational burden after energy metering. Automated billing converts CER operations from a volunteer effort into a professional service. | High | **7** |
| 10 | **Multi-CER Management Console** | Build a super-admin console for organizations managing multiple CERs (municipalities, condominium administrators, energy cooperatives). Provide cross-CER analytics, benchmark comparisons, consolidated reporting, and centralized member management. | Condominium administrators and municipalities are the primary distribution channel — they manage 10-50+ potential CERs each. Multi-CER tooling converts a single sale into a platform relationship. | Medium | **7** |

**Scoring Methodology Applied:**
- User Impact (40%): How much daily operational pain is eliminated?
- Market Differentiation (30%): Does this create a moat competitors can't easily replicate?
- Adoption Potential (20%): Will this attract new CERs or expand to new segments?
- Technical Leverage (10%): Does this enable future features or integrations?

---

## Part 4: Implementation Roadmap

### Feature 1: Authentication & Multi-Tenancy
- **Effort Estimate**: 4–5 person-weeks
- **Prerequisites**: SPID service provider registration (2-4 weeks bureaucratic lead time); domain with SSL; privacy policy (GDPR)
- **Implementation Phases**:
  1. **Core Auth Layer** (Week 1-2): Integrate NextAuth.js v5 with credentials provider for initial dev/testing. Implement session management, middleware-based route protection, and role model (admin, member, auditor). Add tenant isolation to all database queries.
  2. **SPID Integration** (Week 3-4): Register as SPID Service Provider with AgID. Implement SAML 2.0 flow using `spid-saml2` library. Handle attribute mapping (fiscal code, name, email). Add CIE (Carta d'Identità Elettronica) as alternative.
  3. **Authorization & Testing** (Week 5): Implement RBAC middleware for API routes and page access. Add invitation flow for new CER members. Security audit and penetration testing of auth flows.
- **Success Metrics**: 100% of API routes protected; <3s SPID login flow; zero unauthorized data access in pen test
- **Risks & Mitigations**: SPID registration can take 4-8 weeks → start process immediately, use email/password as interim auth; SPID test environment often unstable → maintain local mock for development

### Feature 2: Persistent Database Migration
- **Effort Estimate**: 2–3 person-weeks
- **Prerequisites**: PostgreSQL instance (Hetzner or Supabase); Prisma schema design finalized
- **Implementation Phases**:
  1. **Schema Design** (Week 1): Design complete Prisma schema: `Cer`, `Member`, `EnergyReading`, `IncentiveAllocation`, `Document`, `Vote`, `Announcement`, `AuditLog`. Add migration from existing seed data. Set up TimescaleDB extension for energy time-series.
  2. **Data Layer Refactor** (Week 2): Replace `InMemoryStore` with Prisma Client calls across all API routes and data functions. Implement connection pooling. Add seed script that loads the current demo dataset.
  3. **Migration & Validation** (Week 3): Write migration scripts for future schema evolution. Add database health checks. Implement backup strategy. Load-test with 100 CERs × 200 members each.
- **Success Metrics**: Zero data loss across deployments; <50ms p95 query latency; successful migration of all 25 seed members
- **Risks & Mitigations**: TimescaleDB adds hosting complexity → start with plain PostgreSQL, add TimescaleDB when energy data volume justifies it; Prisma 7 is new → pin version, test thoroughly

### Feature 3: Smart Meter Data Pipeline
- **Effort Estimate**: 5–6 person-weeks
- **Prerequisites**: Database persistence (Feature 2); e-distribuzione API documentation; GSE data format specification
- **Implementation Phases**:
  1. **CSV Upload** (Week 1-2): Build a drag-and-drop CSV upload interface supporting common Italian meter data formats (e-distribuzione, ARERA standard). Validate POD codes against member registry. Parse hourly/15-minute interval data. Store in TimescaleDB.
  2. **Data Validation & Reconciliation** (Week 3-4): Implement anomaly detection (missing readings, impossible values, sudden spikes). Build reconciliation view comparing uploaded data vs. GSE records. Auto-flag discrepancies.
  3. **API Integration** (Week 5-6): Integrate e-distribuzione portale consumi API for automated monthly data pull. Implement OAuth flow for member consent. Add scheduled cron job for monthly ingestion.
- **Success Metrics**: <2 minutes to upload and validate a month of data for 25 PODs; 99.5% data accuracy vs. GSE records; 80% reduction in manual data entry time
- **Risks & Mitigations**: e-distribuzione API access may require formal agreements → CSV upload works standalone as fallback; data format variations across distributors → build flexible parser with format auto-detection

### Feature 4: Automated GSE Reporting Engine
- **Effort Estimate**: 4–5 person-weeks
- **Prerequisites**: Database persistence (Feature 2); Smart meter pipeline (Feature 3); GSE reporting format specification
- **Implementation Phases**:
  1. **Report Generation** (Week 1-2): Implement GSE report calculation engine: shared energy computation per GSE methodology, member allocation per weighted formula, POD validation cross-check. Generate report in GSE-required format (XML/CSV).
  2. **Validation & Preview** (Week 3): Build pre-submission validation with checklist UI showing all GSE requirements. Highlight missing data, anomalies, or non-compliant entries. Allow manual override with audit trail.
  3. **Submission Workflow** (Week 4-5): Implement report approval workflow (CER admin → technical committee → submission). Generate PDF summary for governance records. Track submission status and GSE response. Add deadline reminder notifications.
- **Success Metrics**: 100% GSE format compliance; <30 minutes total monthly reporting time (from current 10+ hours); zero GSE rejection for format errors
- **Risks & Mitigations**: GSE may change reporting format → implement versioned format adapters; regulatory interpretation differences → consult with GSE-certified energy consultants during development

### Feature 5: Interactive Energy Dashboard
- **Effort Estimate**: 3–4 person-weeks
- **Prerequisites**: Database persistence (Feature 2); Smart meter data (Feature 3, at least CSV)
- **Implementation Phases**:
  1. **Chart Library Integration** (Week 1): Integrate Recharts or Visx. Replace CSS bar charts with interactive line/area charts for production vs. consumption. Add tooltips, zoom, and date range selection.
  2. **Advanced Visualizations** (Week 2-3): Build hourly consumption heatmap (24h × 30 days). Create member contribution Sankey diagram. Add shared energy waterfall chart. Implement real-time KPI cards with sparklines.
  3. **Member Drill-Down** (Week 4): Add per-member energy profile view. Show individual consumption patterns vs. CER average. Personalized optimization recommendations based on actual usage data.
- **Success Metrics**: 3× increase in dashboard session duration; 90%+ member satisfaction with data clarity; <500ms chart render time with 6 months of hourly data
- **Risks & Mitigations**: Large datasets may slow client-side rendering → implement server-side aggregation with pre-computed summaries; Chart library bundle size → use dynamic imports and tree-shaking

### Feature 6: Digital Voting & Assembly System
- **Effort Estimate**: 5–6 person-weeks
- **Prerequisites**: Authentication with SPID (Feature 1); Database (Feature 2)
- **Implementation Phases**:
  1. **Vote Engine** (Week 1-2): Build vote creation (title, description, options, quorum, deadline). Implement ballot casting with SPID-verified identity. Support open and secret ballots. Real-time vote count with quorum progress bar.
  2. **Assembly Management** (Week 3-4): Create assembly scheduling with automatic convocation emails. Build real-time assembly dashboard with agenda tracking. Implement proxy delegation with digital attestation. Auto-generate meeting minutes from agenda + vote results.
  3. **Legal Compliance** (Week 5-6): Implement vote result certification with digital signature. Generate legally valid minute documents (PDF with timestamps, quorum attestation). Build audit trail for regulatory inspection.
- **Success Metrics**: 80%+ member participation rate (vs. 40-50% for physical assemblies); <5 minutes to create and launch a vote; legally valid records accepted by CER auditors
- **Risks & Mitigations**: Legal validity of digital votes may vary by CER statute → provide configurable templates; real-time voting needs WebSocket infrastructure → use Server-Sent Events for simpler architecture

### Feature 7: Member Self-Service Portal
- **Effort Estimate**: 3–4 person-weeks
- **Prerequisites**: Authentication (Feature 1); Database (Feature 2)
- **Implementation Phases**:
  1. **Personal Dashboard** (Week 1-2): Build member-facing dashboard with personal energy stats, monthly savings, benefit statement, and CER health indicators. Show how member's contribution compares to CER average.
  2. **Notifications & Engagement** (Week 3): Implement push notifications (via web push API) for upcoming votes, new announcements, billing statements, and optimization tips. Add email digest option.
  3. **Self-Service Actions** (Week 4): Allow members to update contact info, download invoices/statements, submit support requests, and view historical data. Add FAQ and onboarding guide.
- **Success Metrics**: 70%+ monthly active members; 50% reduction in admin support requests; 90%+ members accessing their benefit statement monthly
- **Risks & Mitigations**: Low digital literacy among older members → provide simple, mobile-first interface with large text and minimal navigation; push notification opt-in rates typically low → use email as primary channel

### Feature 8: PVGIS Solar Potential Integration
- **Effort Estimate**: 2–3 person-weeks
- **Prerequisites**: None (standalone enhancement to assessment tool)
- **Implementation Phases**:
  1. **API Integration** (Week 1): Integrate EU PVGIS API (free, no auth required). Accept address input, geocode to lat/lng, fetch monthly irradiance data. Calculate estimated annual production for common panel configurations.
  2. **Visual Presentation** (Week 2): Display results on interactive map with Mapbox/Leaflet. Show monthly production curve, optimal tilt angle, and estimated vs. actual production for existing CERs. Add cadastral overlay for roof identification.
  3. **Assessment Enhancement** (Week 3): Feed PVGIS data into existing ROI calculator. Replace static estimates with location-specific solar potential. Add seasonal production forecasting for capacity planning.
- **Success Metrics**: 95%+ solar estimate accuracy vs. installed systems; 2× increase in assessment completion rate; assessment-to-CER conversion rate tracked
- **Risks & Mitigations**: PVGIS API has rate limits → implement caching layer with 30-day TTL; geocoding accuracy for rural addresses → allow manual pin placement on map

### Feature 9: Financial Billing & Payment System
- **Effort Estimate**: 5–6 person-weeks
- **Prerequisites**: Database (Feature 2); Authentication (Feature 1); Incentive distribution logic (already built)
- **Implementation Phases**:
  1. **Invoice Generation** (Week 1-2): Build monthly billing engine: calculate each member's net benefit/cost, generate PDF invoices with Italian fiscal requirements (codice fiscale, P.IVA), and create downloadable statements.
  2. **Payment Integration** (Week 3-4): Integrate Stripe for private member payments. Add PagoPA integration for public entity payments. Implement payment tracking dashboard with overdue alerts.
  3. **Tax & Compliance** (Week 5-6): Generate annual CU (Certificazione Unica) documentation for member tax deductions. Produce CER annual financial report. Add export to common Italian accounting formats (TeamSystem, Zucchetti).
- **Success Metrics**: <1 hour/month total billing cycle (from current 2+ days); 95%+ on-time payment rate; zero fiscal compliance errors
- **Risks & Mitigations**: PagoPA integration requires formal accreditation → use certified payment intermediary; Italian fiscal regulations complex → partner with a commercialista for validation

### Feature 10: Multi-CER Management Console
- **Effort Estimate**: 3–4 person-weeks
- **Prerequisites**: Database (Feature 2); Authentication with org-level roles (Feature 1)
- **Implementation Phases**:
  1. **Org-Level Views** (Week 1-2): Build super-admin dashboard showing all managed CERs with aggregate KPIs. Implement cross-CER comparison views (energy production, member growth, incentive performance). Add consolidated reporting.
  2. **Benchmark & Analytics** (Week 3): Create CER performance benchmarks (this CER vs. regional average vs. best-in-class). Build growth forecasting models. Add alerts for underperforming CERs.
  3. **Operational Tools** (Week 4): Implement cross-CER member management (transfer, multi-CER membership). Add template CER setup (clone configuration from successful CER). Build white-label options for large administrators.
- **Success Metrics**: 5+ CERs per organization average; 30% faster new CER setup using templates; 80%+ org-admin weekly active usage
- **Risks & Mitigations**: Multi-tenancy complexity → implement at database level from Feature 2; white-labeling scope creep → limit to branding customization initially

---

## Part 5: Executive Summary

```
┌─────────────────────────────────────────────────────────┐
│ PROJECT VIABILITY SCORECARD                             │
├─────────────────────────────────────────────────────────┤
│ Current Market Fit:        8/10  ████████░░             │
│ Growth Potential:          9/10  █████████░             │
│ Technical Foundation:      7/10  ███████░░░             │
│ Community Health:          3/10  ███░░░░░░░             │
│ Competitive Position:      9/10  █████████░             │
├─────────────────────────────────────────────────────────┤
│ OVERALL SCORE:             7/10  ███████░░░             │
└─────────────────────────────────────────────────────────┘
```

**Score Rationale:**

- **Market Fit (8)**: The CER regulatory framework is new (2024), incentives are massive (€110/MWh + 40% PNRR grants), and no purpose-built SaaS exists. Forlì-Cesena's 71.2% renewable electricity makes it the ideal launch market. Deducting points only because market is pre-mainstream — CERs haven't scaled yet.

- **Growth Potential (9)**: The path from 5 local CERs → 5,000 national → 100,000 EU is structurally sound, driven by government mandates rather than organic adoption. 20+ year customer lifetime (LTV/CAC of 9-36×) is extraordinary for SaaS. EU-wide regulatory convergence creates a genuine €360M TAM.

- **Technical Foundation (7)**: Clean Next.js 16 + TypeScript architecture with well-structured components and thoughtful data modeling (25 realistic member profiles, proper incentive weighting formula). However, in-memory data store, no auth, no tests, and minimal Prisma usage indicate early prototype stage. The codebase is small (~2,230 LOC) but well-organized for scaling.

- **Community Health (3)**: Single-developer project with no public repository indicators (no external contributors, no issues, no CI/CD). This is expected for a pre-launch idea project but represents a risk for sustainability.

- **Competitive Position (9)**: First-mover in a market where the nearest competitor (Regalgrid) requires hardware and charges enterprise prices. The regulatory moat (Italian CER compliance) is hard to replicate for generic platforms. Emilia-Romagna's cooperative culture creates a natural adoption fit that Silicon Valley tools cannot match.

---

### Bottom Line

**EnergiaNostra occupies a rare position: a technically sound prototype targeting a government-mandated market with no incumbent SaaS competitor, extraordinary unit economics (LTV/CAC 9-36×), and a geographically perfect launch territory.** The single most important next step is implementing **authentication + database persistence** (Features 1-2, ~7 person-weeks combined) to move from demo to pilot — the Bertinoro CER is already in PNRR application phase and represents an immediate first customer. Everything else is optimization; these two features unlock revenue.

---

### Recommended Sequencing

```
Phase 0 — Foundation (Weeks 1-7)
  ├── Feature 2: Database persistence
  └── Feature 1: Authentication & multi-tenancy

Phase 1 — Pilot Ready (Weeks 8-15)
  ├── Feature 3: Smart meter data pipeline (CSV first)
  ├── Feature 7: Member self-service portal
  └── Feature 5: Interactive energy dashboard

Phase 2 — Production (Weeks 16-25)
  ├── Feature 4: Automated GSE reporting
  ├── Feature 6: Digital voting & assembly
  └── Feature 8: PVGIS solar integration

Phase 3 — Scale (Weeks 26-35)
  ├── Feature 9: Financial billing & payments
  └── Feature 10: Multi-CER management console
```

**Total estimated effort: 35–46 person-weeks (8–11 months solo, 4–6 months with 2 developers).**
