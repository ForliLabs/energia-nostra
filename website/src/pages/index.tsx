import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';

const features = [
  {
    icon: '⚡',
    title: 'End-to-end CER lifecycle',
    body: 'Onboard members, ingest meter data, compute energy sharing, distribute GSE incentives — one platform, one source of truth.',
  },
  {
    icon: '🇮🇹',
    title: 'Italian by default',
    body: 'SPID & CIE login, PagoPA payments, GSE portal submission, ARERA compliance, Certificazione Unica, all built in.',
  },
  {
    icon: '🗳️',
    title: 'Democratic governance',
    body: 'Digital voting with quorum tracking, document generation, e-signatures, announcements and a community feed for every member.',
  },
  {
    icon: '🔌',
    title: 'Smart grid ready',
    body: 'IoT device management, OCPP EV charging, demand response events and a virtual power plant — wired into your CER from day one.',
  },
  {
    icon: '🛡️',
    title: 'Compliance built in',
    body: 'GDPR consent ledger, audit logs, role-based access, CSRF protection, rate limiting, regulatory change tracking.',
  },
  {
    icon: '🧩',
    title: 'Open and extensible',
    body: 'MIT-licensed Next.js 16 app, 77 Prisma models, 59 REST endpoints, OAuth2 developer platform, webhooks, OpenAPI spec.',
  },
];

const snippet = `// One CER, one API call.
const cer = await fetch('https://energianostra.it/api/cer/cer-bertinoro/sharing', {
  headers: { Authorization: 'Bearer ' + process.env.EN_API_KEY },
}).then(r => r.json());

console.log(\`Shared energy: \${cer.sharedKwh} kWh\`);
console.log(\`GSE incentive: €\${cer.incentiveEur}\`);
console.log(\`Members benefited: \${cer.members.length}\`);`;

function CopyButton({text}: {text: string}) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      className="copy-btn"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default function Home(): React.ReactElement {
  const installCmd = 'git clone https://github.com/ForliLabs/energia-nostra && cd energia-nostra && npm ci';

  return (
    <Layout
      title="EnergiaNostra — open-source CER management"
      description="The open-source platform for Italian Renewable Energy Communities. Onboard members, meter energy, share incentives, stay GSE-compliant.">

      <header className="hero-en">
        <h1>Run a Renewable Energy Community without the paperwork.</h1>
        <p className="lede">
          EnergiaNostra is the open-source SaaS that turns Italy's CER framework into a working
          product. Member onboarding, energy metering, GSE incentive distribution, governance —
          all in one Next.js app you can run in five minutes.
        </p>

        <div className="cta-row">
          <Link className="cta-btn cta-primary" to="/docs/getting-started/installation">
            Get started in 5 minutes →
          </Link>
          <Link className="cta-btn cta-secondary" to="https://github.com/ForliLabs/energia-nostra">
            ★ Star on GitHub
          </Link>
        </div>

        <div className="hero-install">
          <code>{installCmd}</code>
          <CopyButton text={installCmd} />
        </div>

        <div className="badges-row">
          <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License" />
          <img src="https://img.shields.io/badge/Next.js-16-black.svg" alt="Next.js 16" />
          <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg" alt="TypeScript" />
          <img src="https://img.shields.io/badge/Prisma-7.8-2D3748.svg" alt="Prisma" />
          <img src="https://img.shields.io/badge/SPID-ready-0066CC.svg" alt="SPID ready" />
        </div>
      </header>

      <section className="features-section">
        <h2 className="section-title">Everything a CER needs, out of the box</h2>
        <p className="section-subtitle">
          Stop stitching together spreadsheets, GSE portals and PEC emails. EnergiaNostra covers
          the entire community-energy lifecycle from feasibility study to annual assembly.
        </p>

        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>

        <div className="stats-row">
          <div className="stat"><span className="num">77</span><span className="label">Prisma models</span></div>
          <div className="stat"><span className="num">59</span><span className="label">REST endpoints</span></div>
          <div className="stat"><span className="num">40+</span><span className="label">Dashboard pages</span></div>
          <div className="stat"><span className="num">€110/MWh</span><span className="label">GSE incentive tracked</span></div>
        </div>
      </section>

      <section className="snippet-section">
        <div className="snippet-wrap">
          <div>
            <h2>An API designed for community energy</h2>
            <p>
              Every CER is a first-class resource. Query shared energy, list members, distribute
              GSE incentives, export Certificazione Unica — all with a typed REST API and
              auto-generated OpenAPI spec.
            </p>
            <Link className="cta-btn cta-primary" to="/docs/reference/api">
              Read the API reference →
            </Link>
          </div>
          <CodeBlock language="typescript">{snippet}</CodeBlock>
        </div>
      </section>

      <section className="cta-banner">
        <h2>Ready to power your community?</h2>
        <p>
          Start with the five-minute quickstart, or read the architecture overview to see how the
          pieces fit together. EnergiaNostra is MIT-licensed and ready for production.
        </p>
        <div className="cta-row" style={{justifyContent: 'center'}}>
          <Link className="cta-btn cta-primary" to="/docs/getting-started/quickstart">
            Quickstart
          </Link>
          <Link className="cta-btn cta-secondary" to="/docs/concepts/architecture">
            Architecture
          </Link>
        </div>
      </section>
    </Layout>
  );
}
