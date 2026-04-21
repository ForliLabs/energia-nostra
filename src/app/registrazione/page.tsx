"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Assessment CER", href: "/assessment" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError((data as { error?: string })?.error || "Errore di registrazione.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Errore di rete.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar brand="EnergiaNostra" items={navItems} />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-xl shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Registrazione</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Crea il tuo account</h1>
          <p className="mt-3 text-sm text-zinc-600">Unisciti alla comunità energetica rinnovabile di Romagna.</p>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Nome completo</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                placeholder="Mario Rossi"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                placeholder="mario@esempio.it"
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
                placeholder="Minimo 6 caratteri"
                minLength={6}
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
              {loading ? "Registrazione..." : "Crea account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Hai già un account?{" "}
            <Link href="/login" className="font-semibold text-lime-700 hover:underline">
              Accedi
            </Link>
          </p>
        </div>
      </main>
      <Footer brand="EnergiaNostra" tagline="Comunità energetiche rinnovabili per la Romagna." />
    </div>
  );
}
