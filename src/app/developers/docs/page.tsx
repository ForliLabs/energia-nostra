import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { generateOpenApiSpec } from "@/lib/openapi";

const navItems = [
  { label: "Developer Portal", href: "/developers" },
  { label: "API Reference", href: "/developers/docs" },
  { label: "Dashboard", href: "/dashboard" },
];

export const metadata = {
  title: "API Reference",
  description: "Documentazione interattiva delle API EnergiaNostra.",
};

export default function ApiDocsPage() {
  const spec = generateOpenApiSpec();
  const paths = Object.entries(spec.paths);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar brand="EnergiaNostra" items={navItems} ctaLabel="OpenAPI JSON" ctaHref="/api/openapi" />

      <main id="main-content" className="flex-1 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">API Reference</h1>
            <p className="mt-2 text-lg text-zinc-600">
              {spec.info.description?.split("\n")[0]}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Versione {spec.info.version} ·{" "}
              <Link href="/api/openapi" className="text-lime-600 hover:underline">
                OpenAPI 3.1 Spec
              </Link>
            </p>
          </div>

          {/* Tags / Categories */}
          <div className="mb-12 flex flex-wrap gap-2">
            {spec.tags.map((tag) => (
              <a
                key={tag.name}
                href={`#tag-${tag.name.toLowerCase()}`}
                className="rounded-full border border-lime-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-lime-50"
              >
                {tag.name}
              </a>
            ))}
          </div>

          {/* Endpoints by tag */}
          {spec.tags.map((tag) => {
            const tagPaths = paths.filter(([, methods]) =>
              Object.values(methods as Record<string, { tags?: string[] }>).some(
                (m) => m.tags?.includes(tag.name)
              )
            );

            if (tagPaths.length === 0) return null;

            return (
              <section key={tag.name} id={`tag-${tag.name.toLowerCase()}`} className="mb-12">
                <h2 className="text-xl font-bold text-zinc-950 mb-1">{tag.name}</h2>
                <p className="text-sm text-zinc-500 mb-6">{tag.description}</p>

                <div className="space-y-4">
                  {tagPaths.map(([path, methods]) =>
                    Object.entries(methods as Record<string, { summary?: string; description?: string; tags?: string[] }>)
                      .filter(([, m]) => m.tags?.includes(tag.name))
                      .map(([method, endpoint]) => (
                        <div key={`${method}-${path}`} className="rounded-xl border border-zinc-200 bg-white p-5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-bold uppercase ${
                                method === "get"
                                  ? "bg-green-100 text-green-800"
                                  : method === "post"
                                    ? "bg-blue-100 text-blue-800"
                                    : method === "put"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {method}
                            </span>
                            <code className="text-sm font-mono text-zinc-700">{path}</code>
                          </div>
                          <p className="mt-2 text-sm font-medium text-zinc-900">{endpoint.summary}</p>
                          {endpoint.description && (
                            <p className="mt-1 text-xs text-zinc-500">{endpoint.description}</p>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </section>
            );
          })}

          {/* Authentication section */}
          <section className="mt-16 rounded-xl border border-lime-200 bg-lime-50 p-8">
            <h2 className="text-xl font-bold text-zinc-950">Autenticazione</h2>
            <div className="mt-4 space-y-4 text-sm text-zinc-700">
              <div>
                <h3 className="font-semibold">Cookie Authentication</h3>
                <p>Effettua login tramite <code className="rounded bg-white px-1.5 py-0.5 text-xs">POST /api/auth/login</code> e il cookie di sessione verrà impostato automaticamente.</p>
              </div>
              <div>
                <h3 className="font-semibold">Bearer Token</h3>
                <p>Passa la tua API key nell&apos;header: <code className="rounded bg-white px-1.5 py-0.5 text-xs">Authorization: Bearer &lt;api-key&gt;</code></p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer brand="EnergiaNostra" tagline="Build the future of community energy." />
    </div>
  );
}
