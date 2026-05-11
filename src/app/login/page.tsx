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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Inserisci un indirizzo email valido.");
      showToast({ title: "Email non valida", description: "Controlla il formato dell'indirizzo email.", variant: "error" });
      return;
    }

    if (password.trim().length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      showToast({ title: "Password troppo corta", description: "Usa almeno 6 caratteri per accedere.", variant: "error" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const message = (data as { error?: string })?.error || "Errore di accesso.";
        setError(message);
        showToast({ title: "Accesso non riuscito", description: message, variant: "error" });
        return;
      }
      showToast({ title: "Accesso effettuato", description: "Ti stiamo portando nella dashboard CER.", variant: "success" });
      router.push("/dashboard");
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
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-xl shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Accesso piattaforma</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Accedi a EnergiaNostra</h1>
          <p className="mt-3 text-sm text-zinc-600">Gestisci la tua comunità energetica rinnovabile.</p>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                placeholder="admin@energianostra.it"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                placeholder="••••••••"
                required
              />
            </label>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 disabled:opacity-60"
            >
              {loading ? "Accesso in corso..." : "Accedi"}
            </button>
          </form>

          {IS_DEMO_MODE ? (
            <div className="mt-6 space-y-3 rounded-2xl bg-amber-50/70 p-4">
              <p className="text-xs font-semibold text-zinc-700">Account demo disponibili:</p>
              <p className="text-xs text-zinc-600">
                <strong>Admin:</strong> admin@energianostra.it / demo2025
              </p>
              <p className="text-xs text-zinc-600">
                <strong>Membro:</strong> membro@energianostra.it / demo2025
              </p>
              <p className="text-xs text-zinc-600">
                <strong>Super Admin:</strong> super@energianostra.it / demo2025
              </p>
            </div>
          ) : null}

          <p className="mt-6 text-center text-sm text-zinc-600">
            Non hai un account?{" "}
            <Link href="/registrazione" className="font-semibold text-lime-700 hover:underline">
              Registrati
            </Link>
          </p>
        </div>
      </main>
      <Footer brand="EnergiaNostra" tagline="Comunità energetiche rinnovabili per la Romagna." />
    </div>
  );
}
