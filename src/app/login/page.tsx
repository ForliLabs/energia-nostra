"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/components/ui/toast-provider";
import { IS_DEMO_MODE } from "@/lib/app-config";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Assessment CER", href: "/assessment" },
];

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Inserisci un indirizzo email valido.");
      showToast({ title: "Email non valida", description: "Controlla il formato dell'indirizzo email.", variant: "error" });
      return;
    }

    if (password.trim().length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      showToast({ title: "Password troppo corta", description: "Usa almeno 8 caratteri per accedere.", variant: "error" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string; user?: { role?: string } };

      if (!response.ok) {
        const message = data.error || "Errore di accesso.";
        setError(message);
        showToast({ title: "Accesso non riuscito", description: message, variant: "error" });
        return;
      }

      const destination = data.user?.role === "member" ? "/portale" : "/dashboard";
      showToast({ title: "Accesso effettuato", description: "Sessione attiva: ti stiamo portando nell'area corretta.", variant: "success" });
      router.push(destination);
    } catch {
      setError("Errore di rete.");
      showToast({ title: "Errore di rete", description: "Non siamo riusciti a contattare il servizio di autenticazione.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar brand="EnergiaNostra" items={navItems} />
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-5xl rounded-[2rem] border border-amber-200 bg-white/90 p-6 shadow-xl shadow-amber-100/40 sm:p-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Accesso piattaforma</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Accedi a EnergiaNostra</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Admin e board accedono alla dashboard CER. I membri vengono accompagnati direttamente nel portale personale con documenti, bollette e votazioni attive.
            </p>

            <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                  placeholder="admin@energianostra.it"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 disabled:opacity-60"
              >
                {loading ? "Accesso in corso..." : "Accedi"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-600 lg:text-left">
              Non hai un account?{" "}
              <Link href="/registrazione" className="font-semibold text-lime-700 hover:underline">
                Registrati
              </Link>
            </p>
          </section>

          <aside className="mt-8 rounded-3xl border border-lime-100 bg-gradient-to-br from-lime-50 via-white to-amber-50 p-6 lg:mt-0">
            <h2 className="text-lg font-bold text-zinc-950">Prima di entrare</h2>
            <ul className="mt-5 space-y-4 text-sm text-zinc-600">
              <li className="rounded-2xl bg-white/90 p-4">• Usa l&apos;email associata al tuo profilo CER per vedere subito stato onboarding e documenti da firmare.</li>
              <li className="rounded-2xl bg-white/90 p-4">• Se sei un amministratore, troverai fatture, pagamenti, votazioni e archivio documentale nella dashboard.</li>
              <li className="rounded-2xl bg-white/90 p-4">• Se hai appena creato l&apos;account, la piattaforma ti accompagna nel portale membro per completare i prossimi passi.</li>
            </ul>

            {IS_DEMO_MODE ? (
              <div className="mt-6 space-y-3 rounded-2xl bg-amber-50/80 p-5">
                <p className="text-xs font-semibold text-zinc-700">Account demo disponibili</p>
                <p className="text-xs text-zinc-600"><strong>Admin:</strong> admin@energianostra.it / demo2025</p>
                <p className="text-xs text-zinc-600"><strong>Membro:</strong> membro@energianostra.it / demo2025</p>
                <p className="text-xs text-zinc-600"><strong>Super Admin:</strong> super@energianostra.it / demo2025</p>
              </div>
            ) : null}
          </aside>
        </div>
      </main>
      <Footer brand="EnergiaNostra" tagline="Comunità energetiche rinnovabili per la Romagna." />
    </div>
  );
}
