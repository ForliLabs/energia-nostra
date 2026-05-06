<div align="center">

# ⚡ EnergiaNostra

**Open-source platform for managing Italian Comunità Energetiche Rinnovabili (CER)**

[![CI](https://github.com/energianostra/energianostra/actions/workflows/ci.yml/badge.svg)](https://github.com/energianostra/energianostra/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

EnergiaNostra is a full-stack platform for creating, managing, and scaling **Renewable Energy Communities** (Comunità Energetiche Rinnovabili — CER) under Italian and EU regulation (D.Lgs. 199/2021, RED II). It covers the entire lifecycle — from member onboarding and energy metering to GSE reporting, incentive distribution, GDPR compliance, and P2P energy trading.

## ✨ Key Features

| Domain | Capabilities |
|---|---|
| **Energy Management** | Meter data upload (CSV/XML), energy sharing calculation, PVGIS solar estimation, weather-based forecasting, AI optimization |
| **Governance** | Democratic voting (quorum tracking), document generation & e-signatures, announcements, community feed |
| **Finance** | Invoicing, Stripe + PagoPA + SEPA payments, incentive distribution, financial reconciliation, Certificazione Unica |
| **Regulatory** | GSE portal submission, ARERA compliance rules, PNRR grant tracking, regulatory change impact analysis |
| **Identity** | SPID & CIE authentication (SAML), role-based access (admin/member/auditor/superadmin), CSRF protection |
| **Smart Grid** | IoT device management, OCPP EV charging, demand response events, virtual power plant (VPP) |
| **Platform** | Multi-tenant SaaS, developer platform (OAuth2, marketplace), API keys, webhooks, i18n |
| **Sustainability** | Carbon credit issuance & trading, CO₂ avoidance tracking, gamification & challenges |
| **Compliance** | GDPR (consent, export, erasure, processing records), audit logging, cookie policy |
| **Infrastructure** | Docker Compose, Helm charts, Terraform (Hetzner), PWA offline support, observability |

> **77 Prisma models** · **59 API routes** · **54 library modules** · **29+ test suites** · **40+ dashboard pages**

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                  Next.js 16 App                 │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Pages &   │  │  API      │  │  Middleware   │ │
│  │  Dashboard │  │  Routes   │  │  (proxy.ts)  │ │
│  └─────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│        │              │               │         │
│  ┌─────▼──────────────▼───────────────▼───────┐ │
│  │           src/lib/ — Domain Services        │ │
│  │  auth · payments · trading · gdpr · energy  │ │
│  │  billing · documents · voting · community   │ │
│  └──────────────────┬─────────────────────────┘ │
│                     │                           │
│  ┌──────────────────▼─────────────────────────┐ │
│  │      Prisma ORM (77 models) + libSQL       │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
         │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐
    │ Postgres │   │   Redis   │  │  MinIO  │
    │  (prod)  │   │  (cache)  │  │  (S3)   │
    └─────────┘   └───────────┘  └─────────┘
```

For a detailed architecture overview with Mermaid diagrams, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
For the full API reference, see [docs/API.md](docs/API.md).

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **Docker** + **Docker Compose** (for full-stack local setup)

### Development (SQLite)

```bash
# 1. Clone and install
git clone https://github.com/energianostra/energianostra.git
cd energianostra
npm ci

# 2. Set up the database
npx prisma generate       # Generate Prisma client
npx prisma db push        # Create SQLite tables
npx tsx prisma/seed.ts    # Seed demo data

# 3. Start development server
npm run dev               # → http://localhost:3000
```

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@energianostra.it` | `demo2025` |
| Member | `membro@energianostra.it` | `demo2025` |
| Auditor | `auditor@energianostra.it` | `demo2025` |
| Superadmin | `super@energianostra.it` | `demo2025` |

### Full Stack (Docker Compose)

```bash
# Start PostgreSQL, Redis, MinIO, and the app
docker compose up -d

# Access the application
open http://localhost:3000

# MinIO console (file storage)
open http://localhost:9001   # minioadmin / minioadmin123
```

## 📦 Project Structure

```
energia-nostra/
├── prisma/
│   ├── schema.prisma         # 77 data models
│   └── seed.ts               # Demo data seeding
├── src/
│   ├── app/
│   │   ├── api/              # 59 API route handlers
│   │   ├── dashboard/        # 30+ dashboard pages
│   │   ├── admin/            # Admin panel
│   │   ├── login/            # Auth pages
│   │   └── page.tsx          # Landing page
│   ├── components/           # React UI components
│   ├── generated/prisma/     # Generated Prisma client
│   ├── hooks/                # React hooks
│   ├── lib/                  # 54 domain service modules
│   └── proxy.ts              # Edge middleware (auth, CORS, headers)
├── tests/                    # Vitest unit & integration tests
├── e2e/                      # Playwright E2E tests
├── infra/
│   ├── helm/                 # Kubernetes Helm chart
│   └── terraform/            # Hetzner Cloud IaC
├── docker-compose.yml        # Local full-stack environment
├── Dockerfile                # Multi-stage production build
└── .github/workflows/ci.yml  # CI pipeline
```

## 🧪 Testing

```bash
# Unit & integration tests (Vitest)
npm test                      # Single run
npm run test:watch            # Watch mode

# End-to-end tests (Playwright)
npm run test:e2e              # Requires running dev server
```

## 🔧 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint check |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset and re-seed database |

## ⚙️ Configuration

Copy the environment template and fill in your values:

```bash
cp .env.production.template .env
```

Key environment variable groups:

| Group | Variables | Required |
|---|---|---|
| **Database** | `DATABASE_URL`, `POSTGRES_*` | ✅ |
| **Redis** | `REDIS_URL` | Production |
| **SPID** | `SPID_ENTITY_ID`, `SPID_CERTIFICATE`, `SPID_PRIVATE_KEY` | Production |
| **CIE** | `CIE_ENTITY_ID`, `CIE_CERTIFICATE`, `CIE_PRIVATE_KEY` | Production |
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments |
| **PagoPA** | `PAGOPA_API_KEY`, `PAGOPA_FISCAL_CODE` | Italian payments |
| **Storage** | `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | File uploads |
| **Email** | `SENDGRID_API_KEY` | Notifications |
| **Monitoring** | `SENTRY_DSN` | Production |
| **Push** | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Push notifications |

See [`.env.production.template`](.env.production.template) for the full list.

## 🏭 Deployment

### Docker

```bash
docker build -t energianostra:latest .
docker run -p 3000:3000 --env-file .env energianostra:latest
```

### Kubernetes (Helm)

```bash
cd infra/helm
helm install energianostra . \
  --set image.tag=latest \
  --set ingress.hosts[0].host=energianostra.it
```

### Hetzner Cloud (Terraform)

```bash
cd infra/terraform
terraform init
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"
```

## 🔐 Authentication

EnergiaNostra supports three authentication methods:

1. **Email/Password** — Standard registration with password validation (PBKDF2 in production, SHA-256 in demo)
2. **SPID** — Sistema Pubblico di Identità Digitale (Italian digital identity via SAML 2.0)
3. **CIE** — Carta d'Identità Elettronica (Italian electronic ID card via SAML 2.0)

Session management uses HTTP-only cookies with CSRF protection, rate limiting, and audit logging. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#authentication) for details.

## 📖 Documentation

- **[Architecture Overview](docs/ARCHITECTURE.md)** — System design, data flow, component diagrams
- **[API Reference](docs/API.md)** — All 59 REST API endpoints
- **[OpenAPI Spec](http://localhost:3000/api/openapi)** — Auto-generated OpenAPI 3.1 spec (runtime)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test && npm run lint`)
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ❤️ for Italian renewable energy communities
</div>
