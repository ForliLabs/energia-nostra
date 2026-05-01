import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ArrowRight, Book, Code2, Key, Webhook } from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Docs API", href: "/developers/docs" },
  { label: "Prezzi", href: "/pricing" },
  { label: "Dashboard", href: "/dashboard" },
];

export const metadata = {
  title: "Developers",
  description: "Portale sviluppatori EnergiaNostra — API, SDK, documentazione.",
};

export default function DevelopersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar brand="EnergiaNostra" items={navItems} ctaLabel="API Docs" ctaHref="/developers/docs" />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 py-20 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Developer Platform
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
              Integra la tua applicazione con EnergiaNostra. API REST, SDK TypeScript/Python,
              webhook real-time.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/developers/docs"
                className="inline-flex items-center gap-2 rounded-xl bg-lime-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-lime-400"
              >
                API Reference <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/api/openapi"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
              >
                OpenAPI Spec
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-zinc-950">Inizia in 5 minuti</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <Key className="h-6 w-6" />,
                  title: "1. Ottieni API Key",
                  description: "Registrati e genera una API key dal tuo pannello di controllo.",
                },
                {
                  icon: <Book className="h-6 w-6" />,
                  title: "2. Esplora i Docs",
                  description: "Consulta l'API reference interattiva con esempi per ogni endpoint.",
                },
                {
                  icon: <Code2 className="h-6 w-6" />,
                  title: "3. Usa l'SDK",
                  description: "Installa @energianostra/sdk e inizia a integrare in pochi minuti.",
                },
                {
                  icon: <Webhook className="h-6 w-6" />,
                  title: "4. Ricevi Webhook",
                  description: "Configura webhook per ricevere eventi in real-time.",
                },
              ].map(({ icon, title, description }) => (
                <div key={title} className="rounded-xl border border-lime-100 bg-white p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-lime-100 text-lime-700">
                    {icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-950">{title}</h3>
                  <p className="mt-2 text-sm text-zinc-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-zinc-50 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-zinc-950">Quick Start</h2>
            <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-950 p-6">
              <div className="mb-2 text-xs font-semibold text-zinc-400">TypeScript</div>
              <pre className="overflow-x-auto text-sm text-lime-400">
{`// npm install @energianostra/sdk

import { EnergiaNostra } from '@energianostra/sdk';

const client = new EnergiaNostra({
  apiKey: process.env.ENERGIANOSTRA_API_KEY,
});

// Ottieni i membri della tua CER
const members = await client.members.list();
console.log(\`CER con \${members.length} membri\`);

// Leggi dati energetici
const energy = await client.energy.getReadings({
  period: '2025-06',
});
console.log(\`Energia condivisa: \${energy.sharedKwh} kWh\`);`}
              </pre>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-950 p-6">
              <div className="mb-2 text-xs font-semibold text-zinc-400">cURL</div>
              <pre className="overflow-x-auto text-sm text-lime-400">
{`# Autenticazione
curl -X POST https://api.energianostra.it/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@energianostra.it","password":"demo2025"}'

# Lista membri
curl https://api.energianostra.it/api/members \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Health check
curl https://api.energianostra.it/api/health`}
              </pre>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-zinc-950">Risorse</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Link href="/api/openapi" className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:shadow-md">
                <h3 className="font-semibold text-zinc-950">OpenAPI Spec</h3>
                <p className="mt-2 text-sm text-zinc-500">Specifica OpenAPI 3.1 completa in JSON</p>
              </Link>
              <Link href="/developers/docs" className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:shadow-md">
                <h3 className="font-semibold text-zinc-950">API Reference</h3>
                <p className="mt-2 text-sm text-zinc-500">Documentazione interattiva con Try It</p>
              </Link>
              <Link href="/api/gdpr/processing-records" className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:shadow-md">
                <h3 className="font-semibold text-zinc-950">GDPR Compliance</h3>
                <p className="mt-2 text-sm text-zinc-500">Registro trattamenti e privacy API</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer brand="EnergiaNostra" tagline="Build the future of community energy." />
    </div>
  );
}
