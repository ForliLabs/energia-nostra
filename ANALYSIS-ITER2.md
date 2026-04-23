# EnergiaNostra — Iteration 2: Next-Gen Feature Planning

> **Date**: July 2025
> **Iteration**: 2 (builds on [NEXT-GEN-ANALYSIS.md](./NEXT-GEN-ANALYSIS.md))
> **Codebase**: 5,857 LOC across 49 files · 16 commits · 12 API routes · 16 Prisma models

---

## Part 1: Current State Assessment (Post-Iteration 1)

### What's Been Implemented Since Iteration 1

All 10 features proposed in Iteration 1 are now **committed and functional** at prototype level:

| # | Feature (from Iter 1) | Status | Implementation Notes |
|---|----------------------|--------|---------------------|
| 1 | Auth & Multi-Tenancy | ✅ Built | SHA-256 hashed sessions, role-based (admin/member/auditor/superadmin), cookie-based auth, login/register flows |
| 2 | Prisma Schema | ✅ Built | 16 models covering CER, Members, Energy, Meters, Voting, Billing, GSE, PNRR, Audit. Still using InMemoryStore runtime. |
| 3 | Smart Meter Pipeline | ✅ Built | CSV parsing with Italian/English column support, POD validation, anomaly detection (negative values, spikes, missing timestamps) |
| 4 | GSE Reporting Engine | ✅ Built | Report generation with 6-point validation checklist, CSV/XML export, period selection |
| 5 | Recharts Dashboards | ✅ Built | 5 chart types: Production/Consumption area, SharedEnergy bar, Savings stacked bar, MemberType pie, SelfConsumption area |
| 6 | Digital Voting | ✅ Built | Open/secret ballots, quorum tracking, result calculation, duplicate-vote prevention, vote creation |
| 7 | Member Portal | ✅ Built | Session-aware portal with personalized incentives, energy history, announcements, optimization tips |
| 8 | PVGIS Integration | ✅ Built | EU JRC API integration with Forlì-Cesena geocoding fallback, 24h cache, estimation fallback |
| 9 | Billing/Invoicing | ✅ Built | Auto-generated invoices with incentive/savings/fee breakdown, payment tracking, collection stats |
| 10 | Multi-CER Console | ✅ Built | Super-admin dashboard with aggregate KPIs, CER comparison, benchmarks |

### Remaining Gaps & Architectural Debt

| Gap | Description | Severity |
|-----|-------------|----------|
| **InMemoryStore still active** | Prisma schema exists (16 models) but runtime still uses `InMemoryStore<T>` — data lost on restart | 🔴 Critical |
| **No real SPID/CIE** | Auth uses email/password with SHA-256 + fixed salt — not Italian digital identity compliant | 🟡 High |
| **No test suite** | Zero test files across 49 source files | 🟡 High |
| **No CI/CD pipeline** | No GitHub Actions, no automated linting/build checks | 🟡 Medium |
| **Static seed data** | 25 hardcoded members, 6 months of energy data — no dynamic data creation flow | 🟡 Medium |
| **No file storage** | Documents and invoice PDFs reference URLs but no actual file upload/storage | 🟠 Medium |
| **No WebSocket/SSE** | Voting and dashboard are polling-based, no real-time updates | 🟠 Low |
| **No i18n framework** | Italian-only with hardcoded strings — no path to multi-language | 🟠 Low |

### Technical Stack (Updated)

| Layer | Technology | Status |
|-------|-----------|--------|
| Framework | Next.js 16.2.6 (App Router) | ✅ Current |
| Language | TypeScript 5 (strict) | ✅ |
| Styling | Tailwind CSS 4 + CVA + tailwind-merge | ✅ |
| Charts | Recharts 3.8.1 | ✅ New |
| ORM | Prisma 7.8.0 (schema only) | ⚠️ Not wired to runtime |
| Data Layer | InMemoryStore\<T\> | ⚠️ Volatile |
| Auth | Custom session store | ⚠️ Demo-grade |
| API | 12 Next.js Route Handlers | ✅ |

---

## Part 2: Market Potential Analysis (Updated)

### Market Size (Unchanged — Still Valid)

| Segment | Size | Notes |
|---------|------|-------|
| **TAM** | **€360M ARR** | 100K+ EU energy communities × €300/mo |
| **SAM** | **€18M ARR** | 5,000 Italian CERs × €300/mo |
| **SOM Y1** | **€12K ARR** | 5 CERs in Forlì-Cesena × €200/mo |
| **SOM Y2** | **€180K ARR** | 50 CERs across Emilia-Romagna × €300/mo |

### Competitive Landscape Update (July 2025)

| Competitor | Movement Since Iter 1 | EnergiaNostra's New Advantage |
|-----------|----------------------|-------------------------------|
| **Regalgrid** | Still hardware-dependent, enterprise only | EnergiaNostra now has billing + voting — full CER lifecycle |
| **EnergyComm** (new) | SaaS entrant from Milan — basic member registry | EnergiaNostra has GSE reporting + PVGIS — significantly deeper feature set |
| **Excel/manual** | Still dominant (>90% of CERs) | Smart meter pipeline + auto-invoicing = compelling migration story |
| **Consulting firms** | Starting to build their own tools | EnergiaNostra's multi-CER console positions it as the platform consultants build on, not compete with |

### Traction (Updated)

| Metric | Iter 1 | Now | Change |
|--------|--------|-----|--------|
| LOC | ~2,230 | 5,857 | +163% |
| Files | 21 | 49 | +133% |
| Prisma Models | 1 (User) | 16 | +1,500% |
| API Endpoints | 3 | 12 | +300% |
| Chart Components | 0 | 5 | New |
| Features | 7 | 16 | +129% |

### Updated Adoption Barriers

With Iteration 1 features built, the barrier profile has shifted:

1. ~~No authentication~~ → ✅ Solved (demo-grade)
2. ~~No persistence~~ → ⚠️ Schema exists, not wired
3. **No production deployment** → Cannot be used by real CERs yet
4. **No data import from existing CERs** → Switching cost remains high
5. **No mobile experience** → CER members skew older, mobile-first matters
6. **No API documentation** → Third-party integrators (consultants, installers) can't integrate
7. **No GSE portal integration** → Still requires manual copy-paste of GSE data

---

## Part 3: Next-Gen Feature Proposals (Iteration 2)

> **Constraint**: These 10 features are NEW — none overlap with the 10 features from Iteration 1 (all of which are now implemented).

| # | Feature Name | Description | Why Implement | Complexity | Impact |
|---|--------------|-------------|---------------|------------|--------|
| 1 | **Prisma Runtime Migration** | Wire the existing 16-model Prisma schema to replace InMemoryStore across all 12 API routes. Add seed migration, connection pooling, and database health checks. This is the "flip the switch" that makes the existing schema useful. | Without this, every feature built so far is a demo. This single change converts 5,857 lines of demo code into a production-capable system. Highest ROI change possible. | Medium | **10** |
| 2 | **Energy Forecasting Engine** | ML-based energy production and consumption forecasting using historical meter data + PVGIS irradiance + weather APIs (Open-Meteo). Predict next-month shared energy, incentive amounts, and optimal self-consumption windows per member. | Transforms the platform from backward-looking reporting to forward-looking advisory. CER managers can plan operations; members can shift consumption to maximize shared energy. No competitor offers CER-specific forecasting. | High | **9** |
| 3 | **Mobile-First PWA** | Convert the app to a Progressive Web App with offline-capable service worker, push notifications (web-push), app-manifest for home-screen install, and responsive redesign of the member portal for 320px-width screens. | 62% of Italian internet users are mobile-primary (AGCOM 2024). CER members — especially elderly — will access their portal on phones. PWA avoids app store friction while enabling push notifications for votes, bills, and energy tips. | Medium | **9** |
| 4 | **Automated E2E Test Suite** | Playwright E2E tests covering all 16 features + API integration tests with Vitest. Add GitHub Actions CI pipeline with lint → type-check → test → build. Target 80% coverage on critical paths (auth, billing, GSE reporting). | Zero tests on a financial platform handling incentive distribution and invoicing is a liability. Tests are required before any real CER pilot. Also unblocks confident refactoring (e.g., InMemoryStore → Prisma migration). | Medium | **9** |
| 5 | **Peer-to-Peer Energy Trading Ledger** | Intra-CER energy trading system where prosumers can offer surplus energy to consumers at negotiated or spot prices. Includes offer/accept workflow, settlement via billing system, and trading history dashboard. | EU Directive 2019/944 enables peer-to-peer energy trading within CERs. This is the next evolution of shared energy — from passive pooling to active marketplace. Creates a powerful network effect: each new member increases trading liquidity. | High | **8** |
| 6 | **Document Generation & E-Signature** | Auto-generate CER legal documents (statuto, verbali, atti constitutivi) from templates with member data. Integrate qualified e-signature (FEQ) via InfoCert or Namirial API for legally binding digital signatures. | CER formation requires 5-10 legal documents, each needing signatures from all founding members. Auto-generation + e-signature reduces formation time from weeks to days — a massive conversion accelerator. | High | **8** |
| 7 | **Gamification & Behavioral Nudges** | Member engagement system with energy-saving challenges, community leaderboards, achievement badges (first month CO₂ offset, consistent self-consumer, top producer), and personalized nudges based on consumption patterns. | CER success depends on member behavior — shifting consumption to solar hours maximizes shared energy and incentives. Gamification drives 15-25% engagement increase (Opower studies). Also reduces churn by making membership emotionally rewarding beyond financial returns. | Medium | **7** |
| 8 | **Open API & Webhook Platform** | RESTful API with OpenAPI 3.1 spec, API key management, rate limiting, and webhook subscriptions for key events (new member, invoice generated, vote opened, anomaly detected). Add developer portal with interactive docs. | Enables third-party integrations: solar installers can push production data, accountants can pull invoices, municipalities can aggregate reporting. Transforms EnergiaNostra from a closed tool into a CER platform ecosystem. | Medium | **7** |
| 9 | **Carbon Credit Marketplace** | Track and certify CO₂ avoidance per CER using verified methodology (ISO 14064). Enable CERs to sell carbon credits on voluntary markets via integration with registries (Verra, Gold Standard) or direct B2B sales to local businesses seeking offsets. | Creates a second revenue stream for CERs beyond energy incentives. A 25-member CER avoiding ~50 tonnes CO₂/year at €30-80/tonne generates €1,500-4,000 additional annual income. Also strengthens the environmental narrative for member recruitment. | High | **7** |
| 10 | **Multi-Language & EU Expansion Kit** | Implement i18n framework (next-intl) with Italian as base, add Spanish and French translations. Create country-specific regulatory modules (Spain's comunidades energéticas, France's communautés d'énergie) with localized incentive calculation engines. | The €360M TAM requires EU expansion. Spain (5,000 target CERs by 2026) and France (1,000 by 2025) have nearly identical regulatory frameworks. Multi-language is a prerequisite; country-specific regulation modules are the moat. First CER SaaS to go pan-EU wins the market. | High | **7** |

**Scoring Methodology:**
- User Impact (40%): How much new operational value does this create beyond what exists?
- Market Differentiation (30%): Does this widen the competitive moat?
- Adoption Potential (20%): Does this unblock new user segments or remove barriers?
- Technical Leverage (10%): Does this enable future features or integrations?

---

## Part 4: Implementation Roadmap

### Feature 1: Prisma Runtime Migration
- **Effort Estimate**: 2–3 person-weeks
- **Prerequisites**: None — Prisma schema and client already exist
- **Implementation Phases**:
  1. **Seed & Migration** (Days 1-3): Write `prisma db push` script to create SQLite tables. Port the 25-member seed dataset + energy data + governance data into a `prisma/seed.ts` script. Validate all 16 models create/read correctly.
  2. **API Route Refactor** (Week 1-2): Replace `InMemoryStore` calls in all 12 route handlers with `PrismaClient` queries. Refactor `src/lib/data.ts` from exported constants to async database queries. Add connection singleton pattern.
  3. **Validation & Cleanup** (Week 3): Remove `InMemoryStore` class and all in-memory seed data. Add database health endpoint. Test all 16 features against persisted data. Document the migration in README.
- **Success Metrics**: Zero data loss across server restarts; all 12 API routes return identical responses; <50ms p95 query latency on SQLite
- **Risks & Mitigations**: SQLite concurrent write limitations → acceptable for MVP/pilot scale (<100 concurrent users); upgrade path to PostgreSQL is straightforward with Prisma's provider swap

---

### Feature 2: Energy Forecasting Engine
- **Effort Estimate**: 5–6 person-weeks
- **Prerequisites**: Prisma migration (Feature 1); at least 3 months historical meter data
- **Implementation Phases**:
  1. **Data Pipeline** (Week 1-2): Integrate Open-Meteo API for historical and forecast weather data (temperature, cloud cover, solar radiation) for CER locations. Build feature engineering pipeline: combine meter readings + PVGIS baseline + weather → training dataset. Implement in TypeScript with simple linear regression + seasonal decomposition.
  2. **Forecast Models** (Week 3-4): Build per-CER production forecast (solar irradiance × installed capacity × weather adjustment). Build per-member consumption forecast (historical pattern + temperature correlation + day-of-week seasonality). Calculate predicted shared energy and incentive amounts.
  3. **UI & Alerts** (Week 5-6): Add forecast dashboard showing next 7/30/90 day predictions with confidence intervals. Build "optimal consumption windows" view showing members when to use energy for maximum shared benefit. Add alert system for forecast anomalies (expected shortfall, excess production).
- **Success Metrics**: ±15% accuracy on 30-day production forecasts; ±20% on consumption; members shifting >10% of flexible consumption to optimal windows
- **Risks & Mitigations**: Insufficient historical data at launch → use PVGIS + regional averages as cold-start model; forecast accuracy depends on weather API reliability → cache 72h forecasts, degrade gracefully

---

### Feature 3: Mobile-First PWA
- **Effort Estimate**: 3–4 person-weeks
- **Prerequisites**: None (enhances existing app)
- **Implementation Phases**:
  1. **PWA Foundation** (Week 1): Add `manifest.json` with CER branding, icons, theme color. Implement service worker with network-first strategy for API calls, cache-first for static assets. Add offline fallback page showing last-synced data.
  2. **Responsive Redesign** (Week 2-3): Audit all 16 pages for mobile breakpoints. Redesign member portal for thumb-friendly navigation (bottom tab bar, larger touch targets, collapsible sections). Optimize Recharts for small screens (simplified legends, touch-friendly tooltips). Add pull-to-refresh.
  3. **Push Notifications** (Week 4): Implement Web Push API with VAPID keys. Add notification preferences UI. Create notification triggers: vote opened (immediate), invoice generated (immediate), weekly energy summary (scheduled), consumption tip (smart-timed based on usage pattern).
- **Success Metrics**: Lighthouse PWA score >90; <3s first contentful paint on 3G; 60%+ members installing PWA; 40%+ notification opt-in rate
- **Risks & Mitigations**: iOS Safari PWA limitations (no push until iOS 16.4+) → most Italian mobile is Android (72% market share); service worker caching complexity → use Workbox library for tested strategies

---

### Feature 4: Automated E2E Test Suite
- **Effort Estimate**: 3–4 person-weeks
- **Prerequisites**: None (tests existing code)
- **Implementation Phases**:
  1. **Test Infrastructure** (Days 1-3): Add Vitest for unit/integration tests, Playwright for E2E. Configure GitHub Actions workflow: `lint → typecheck → vitest → playwright → build`. Add test database setup (SQLite in-memory for tests).
  2. **Critical Path Tests** (Week 1-2): Write E2E tests for: auth flow (register → login → session → logout), member CRUD (add → list → benefit statement), meter upload (CSV → validation → anomaly detection), GSE report generation (select period → validate → export CSV/XML), voting (create → cast → quorum → results), billing (generate → view → mark paid).
  3. **API & Edge Case Tests** (Week 3-4): Unit tests for all `src/lib/` modules (billing calculations, meter parsing, GSE validation, PVGIS fallback). Integration tests for all 12 API routes. Add snapshot tests for chart components. Target 80% line coverage on `src/lib/`, 100% route coverage on `src/app/api/`.
- **Success Metrics**: 80%+ coverage on critical business logic; CI pipeline <5 minutes; zero regressions on refactor PRs
- **Risks & Mitigations**: Playwright flaky tests → use strict waiting strategies, avoid time-dependent assertions; InMemoryStore makes tests non-idempotent → prioritize Feature 1 (Prisma) first for test isolation

---

### Feature 5: Peer-to-Peer Energy Trading Ledger
- **Effort Estimate**: 5–6 person-weeks
- **Prerequisites**: Prisma migration (Feature 1); Energy forecasting (Feature 2, for optimal pricing signals)
- **Implementation Phases**:
  1. **Trading Model** (Week 1-2): Design Prisma models: `EnergyOffer` (seller, kWh, price, validity window), `TradeMatch` (offer, buyer, settled amount), `TradingAccount` (member balance, credits, debits). Build matching engine: FIFO order book for intra-CER surplus energy. Define pricing rules (floor = GSE incentive rate, ceiling = grid purchase rate).
  2. **Trading UI** (Week 3-4): Build marketplace dashboard showing available offers, market depth, and price history. Create offer submission form for prosumers (quantity, min price, available hours). Build auto-match toggle for members who prefer automated trading. Add trading history with P&L per member.
  3. **Settlement & Compliance** (Week 5-6): Integrate with billing system — trades settle monthly alongside incentive distribution. Generate trading reports for tax documentation. Add regulatory compliance checks per ARERA delibera 727/2022. Build audit trail for all trades.
- **Success Metrics**: 30%+ of surplus energy traded (vs. pooled); €5-15/month additional benefit per active trader; <2% settlement disputes
- **Risks & Mitigations**: Regulatory uncertainty on P2P within CERs → implement as "preferential allocation" initially (legally simpler); low liquidity in small CERs → aggregate multiple CERs on same cabina primaria into shared trading pool

---

### Feature 6: Document Generation & E-Signature
- **Effort Estimate**: 4–5 person-weeks
- **Prerequisites**: Prisma migration (Feature 1); auth with real identity verification
- **Implementation Phases**:
  1. **Template Engine** (Week 1-2): Build document template system using structured templates (not PDF manipulation). Create templates for: Atto Constitutivo, Statuto CER, Regolamento Interno, Verbale di Assemblea, Contratto di Adesione. Auto-populate with CER data, member list, and governance decisions. Generate PDF output via `@react-pdf/renderer`.
  2. **E-Signature Integration** (Week 3-4): Integrate InfoCert or Namirial API for FEQ (Firma Elettronica Qualificata) — legally equivalent to handwritten signature in Italy. Build signature workflow: document prepared → sent to signatories → OTP verification → signed PDF stored. Track signature status per document/member.
  3. **Workflow Orchestration** (Week 5): Build CER formation wizard that guides through all required documents in sequence. Add approval chain (draft → review → sign → archive). Create member onboarding document pack (auto-generated from CER template). Version control for document amendments.
- **Success Metrics**: CER formation document set generated in <30 minutes (vs. 2-3 weeks manual); 90%+ members completing e-signature within 48h of request; zero document re-work due to data errors
- **Risks & Mitigations**: FEQ provider costs (€0.50-2.00 per signature) → pass through to CER; legal template validation → partner with a notaio for template certification; InfoCert API complexity → start with FEA (simple electronic signature) and upgrade

---

### Feature 7: Gamification & Behavioral Nudges
- **Effort Estimate**: 3–4 person-weeks
- **Prerequisites**: Prisma migration (Feature 1); member portal (already built); energy data (already captured)
- **Implementation Phases**:
  1. **Achievement System** (Week 1): Design badge/achievement framework: `Achievement` model (type, criteria, icon), `MemberAchievement` (member, earned date, displayed). Create 15 initial achievements: "Primo Mese" (first month active), "Auto-Consumatore" (>80% self-consumption), "Ambasciatore" (referred 3 members), "Campione Solare" (top producer in month), "Risparmiatore" (10% consumption reduction), etc.
  2. **Challenges & Leaderboards** (Week 2-3): Build monthly community challenges ("Reduce consumption by 5% this month", "Shift 20% of consumption to solar hours"). Create anonymized leaderboard with opt-in. Add team challenges (neighborhood vs. neighborhood within CER). Build push notification integration for challenge updates and achievements earned.
  3. **Smart Nudges** (Week 4): Analyze individual consumption patterns to generate personalized tips. Example: "You use 40% of energy between 19-22h — shifting your dishwasher to 13-15h would earn €3.20 more per month." Schedule nudges at optimal times. Track nudge effectiveness (did consumption shift?).
- **Success Metrics**: 50%+ members earning ≥3 badges in first 3 months; 10-15% consumption shift to solar hours; 20% increase in monthly portal visits
- **Risks & Mitigations**: Gamification fatigue → keep badges meaningful and sparse (not inflation); privacy concerns on leaderboards → anonymize by default, opt-in to reveal name; older users may find gamification patronizing → frame as "community progress" not "game"

---

### Feature 8: Open API & Webhook Platform
- **Effort Estimate**: 3–4 person-weeks
- **Prerequisites**: Prisma migration (Feature 1); stable API surface
- **Implementation Phases**:
  1. **API Formalization** (Week 1): Document all 12 existing endpoints with OpenAPI 3.1 spec. Add request/response validation with Zod schemas. Implement API versioning (`/api/v1/`). Add consistent error response format.
  2. **Authentication & Rate Limiting** (Week 2): Build API key management UI (generate, revoke, scope-limit). Implement rate limiting (100 req/min per key). Add API usage dashboard showing call counts, errors, and latency. Support both API key and OAuth2 client credentials.
  3. **Webhooks & Developer Portal** (Week 3-4): Implement webhook subscription system: events (member.created, invoice.generated, vote.opened, meter.anomaly, gse_report.validated), delivery (signed payload, retry with exponential backoff, delivery log). Build interactive API docs page using Scalar or Swagger UI. Add SDK generation setup (openapi-typescript).
- **Success Metrics**: 3+ third-party integrations within 6 months; <200ms p95 API latency; 99.5%+ webhook delivery rate; developer docs NPS >8
- **Risks & Mitigations**: API stability — breaking changes alienate integrators → strict versioning with 6-month deprecation window; webhook delivery failures → implement dead letter queue and alerting; abuse prevention → per-key scoping and anomaly detection

---

### Feature 9: Carbon Credit Marketplace
- **Effort Estimate**: 6–8 person-weeks
- **Prerequisites**: Prisma migration (Feature 1); at least 12 months energy data; GSE reporting (for verified avoided emissions)
- **Implementation Phases**:
  1. **CO₂ Accounting Engine** (Week 1-3): Implement ISO 14064-compliant emissions avoidance calculation using Italian grid emission factor (ISPRA published: 256 gCO₂/kWh for 2024). Build monthly CO₂ avoidance reports per CER and per member. Create verification pipeline: meter data → shared energy → avoided grid consumption → CO₂ tonnes avoided. Generate verification-ready documentation.
  2. **Credit Certification** (Week 4-5): Integrate with voluntary carbon credit registries (Verra VCS, Gold Standard). Build credit issuance workflow: calculate → verify → register → issue. Create credit ledger tracking: issued, reserved, sold, retired. Add transparency dashboard showing credit lifecycle.
  3. **Marketplace & Sales** (Week 6-8): Build B2B sales channel: local businesses in Forlì-Cesena can purchase offsets directly from neighboring CERs. Create credit listing page with price, vintage, project details. Implement payment flow (Stripe) and certificate generation. Add analytics: revenue per tonne, buyer demographics, seasonal pricing.
- **Success Metrics**: First carbon credit sale within 3 months of launch; €2,000+ annual carbon revenue per CER; 100% traceability from meter reading to credit retirement
- **Risks & Mitigations**: Registry certification is expensive (€5-10K per project type) → start with unregistered "local offset" sales to nearby businesses (lower barrier); carbon price volatility → offer fixed-price annual contracts; additionality challenges → CERs with PNRR-funded installations have strong additionality case

---

### Feature 10: Multi-Language & EU Expansion Kit
- **Effort Estimate**: 5–6 person-weeks
- **Prerequisites**: Stable feature set (Features 1-4 recommended first)
- **Implementation Phases**:
  1. **i18n Infrastructure** (Week 1-2): Integrate `next-intl` for routing-based locale switching (`/it/dashboard`, `/es/dashboard`, `/fr/dashboard`). Extract all ~800 Italian strings from 49 source files into message catalogs. Add locale-aware number/date formatting (already partially using `Intl.NumberFormat`). Build language switcher component.
  2. **Spanish & French Localization** (Week 3-4): Translate message catalogs to Spanish and French (professional translator + domain expert review). Create country-specific regulatory modules: Spain — RD 244/2019 comunidades energéticas, incentive at €45/MWh; France — ordonnance 2021-236 communautés d'énergie, tarif d'achat complémentaire. Adapt PVGIS integration for Spanish/French locations.
  3. **Country-Specific Compliance** (Week 5-6): Build pluggable regulatory engine: each country module defines incentive formula, reporting format, compliance checklist, and fiscal requirements. Spain: CNMC reporting format. France: ENEDIS data integration format. Add country selector in CER creation flow. Test with 3 demo CERs (Forlì, Barcelona, Lyon).
- **Success Metrics**: 3 fully localized country experiences; <5% string coverage gaps; 10+ non-Italian CER sign-ups within 6 months of launch
- **Risks & Mitigations**: Translation quality for technical/legal terms → hire energy sector translators, not generic; regulatory divergence may be larger than expected → start with common 80% features, add country-specific 20% incrementally; maintenance burden of 3 codepaths → use feature flags and country module architecture

---

## Part 5: Executive Summary

```
┌─────────────────────────────────────────────────────────┐
│ PROJECT VIABILITY SCORECARD (Iteration 2)               │
├─────────────────────────────────────────────────────────┤
│ Current Market Fit:        8/10  ████████░░             │
│ Growth Potential:          9/10  █████████░             │
│ Technical Foundation:      8/10  ████████░░  (was 7)   │
│ Community Health:          3/10  ███░░░░░░░             │
│ Competitive Position:      9/10  █████████░             │
├─────────────────────────────────────────────────────────┤
│ OVERALL SCORE:             7.5/10 ████████░░            │
│ DELTA FROM ITER 1:         +0.5                         │
└─────────────────────────────────────────────────────────┘
```

**Score Changes:**
- **Technical Foundation: 7 → 8**: The addition of a comprehensive 16-model Prisma schema, Recharts visualizations, CSV pipeline, GSE reporting engine, and voting system represents a significant maturity leap. Codebase grew 163% with consistent quality. Still docked for InMemoryStore runtime and zero tests.
- **All other scores hold**: Market dynamics haven't changed (still greenfield), no external community has formed, and competitive position remains strong with expanded feature set.

---

### Recommended Sequencing (Iteration 2)

```
Phase 0 — Production Readiness (Weeks 1-6)
  ├── Feature 1: Prisma Runtime Migration (2-3 weeks)
  └── Feature 4: E2E Test Suite (3-4 weeks, overlapping)

Phase 1 — Engagement & Mobile (Weeks 5-12)
  ├── Feature 3: Mobile-First PWA (3-4 weeks)
  ├── Feature 7: Gamification & Nudges (3-4 weeks)
  └── Feature 8: Open API & Webhooks (3-4 weeks)

Phase 2 — Intelligence & Documents (Weeks 10-20)
  ├── Feature 2: Energy Forecasting Engine (5-6 weeks)
  └── Feature 6: Document Generation & E-Signature (4-5 weeks)

Phase 3 — Market Expansion (Weeks 18-30)
  ├── Feature 5: P2P Energy Trading (5-6 weeks)
  ├── Feature 9: Carbon Credit Marketplace (6-8 weeks)
  └── Feature 10: Multi-Language & EU Kit (5-6 weeks)
```

**Total estimated effort: 40–52 person-weeks (10–13 months solo, 5–7 months with 2 developers).**

---

### Bottom Line

**EnergiaNostra has executed remarkably in Iteration 1 — all 10 proposed features are now implemented, growing from 2,230 to 5,857 LOC across 49 files.** The immediate priority is **Feature 1 (Prisma Runtime Migration)** — a 2-3 week effort that converts the entire platform from "impressive demo" to "deployable pilot." Combined with **Feature 4 (Test Suite)**, this creates the foundation for a real Bertinoro CER pilot. After that, **Feature 3 (PWA)** and **Feature 2 (Energy Forecasting)** are the highest-impact differentiators: PWA unlocks the 62% mobile-primary Italian user base, and forecasting transforms the platform from a record-keeping tool into a strategic advisor — a positioning no competitor occupies.
