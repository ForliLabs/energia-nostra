"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/components/ui/toast-provider";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Assessment CER", href: "/assessment" },
];

const passwordChecklist = [
  "Almeno 8 caratteri",
  "Una lettera maiuscola e una minuscola",
  "Un numero e un simbolo",
];

function validatePassword(password: string) {
  if (password.trim().length < 8) return "La password deve avere almeno 8 caratteri.";
  if (!/[A-Z]/.test(password)) return "Aggiungi almeno una lettera maiuscola.";
  if (!/[a-z]/.test(password)) return "Aggiungi almeno una lettera minuscola.";
  if (!/[0-9]/.test(password)) return "Aggiungi almeno un numero.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Aggiungi almeno un carattere speciale.";
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (name.trim().split(/\s+/).length < 2) {
      const message = "Inserisci almeno nome e cognome per associare correttamente il tuo profilo.";
      setError(message);
      showToast({ title: "Profilo incompleto", description: message, variant: "error" });
      return;
    }

    if (!email.includes("@")) {
      setError("Inserisci un indirizzo email valido.");
      showToast({ title: "Email non valida", description: "Controlla il formato dell'indirizzo email.", variant: "error" });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      showToast({ title: "Password non conforme", description: passwordError, variant: "error" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        const message = data.error || "Errore di registrazione.";
        setError(message);
        showToast({ title: "Registrazione non riuscita", description: message, variant: "error" });
        return;
      }

      showToast({
        title: "Account creato",
        description: "Ti portiamo nel portale membro per completare i prossimi passaggi dell'onboarding.",
        variant: "success",
      });
      router.push("/portale?welcome=1");
    } catch {
      setError("Errore di rete.");
      showToast({ title: "Errore di rete", description: "Non siamo riusciti a completare la registrazione.", variant: "error" });
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Registrazione</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Crea il tuo account membro</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              In pochi minuti ottieni accesso al portale membro, alle fatture CER, ai documenti da firmare e alle votazioni della comunità.
            </p>

            <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Nome completo</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                  placeholder="Mario Rossi"
                  autoComplete="name"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 outline-none transition focus:border-lime-500"
                  placeholder="mario@esempio.it"
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
                  placeholder="Almeno 8 caratteri, numero e simbolo"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </label>

              {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 disabled:opacity-60"
              >
                {loading ? "Registrazione..." : "Crea account e continua"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-600 lg:text-left">
              Hai già un account?{" "}
              <Link href="/login" className="font-semibold text-lime-700 hover:underline">
                Accedi
              </Link>
            </p>
          </section>

          <aside className="mt-8 rounded-3xl border border-lime-100 bg-gradient-to-br from-lime-50 via-white to-amber-50 p-6 lg:mt-0">
            <h2 className="text-lg font-bold text-zinc-950">Come funziona l&apos;onboarding</h2>
            <ol className="mt-5 space-y-4 text-sm text-zinc-600">
              <li className="rounded-2xl bg-white/90 p-4"><strong className="text-zinc-950">1. Crea l&apos;account</strong><br />Usa i dati con cui comparirai nell&apos;elenco membri o nella richiesta di adesione.</li>
              <li className="rounded-2xl bg-white/90 p-4"><strong className="text-zinc-950">2. Verifica il profilo</strong><br />Nel portale membro controllerai abbinamento, documenti e prossimi adempimenti.</li>
              <li className="rounded-2xl bg-white/90 p-4"><strong className="text-zinc-950">3. Completa i passaggi CER</strong><br />Firma i documenti, consulta la tua posizione energetica e partecipa alle votazioni.</li>
            </ol>

            <div className="mt-6 rounded-2xl bg-amber-50/80 p-5">
              <p className="text-sm font-semibold text-zinc-950">Requisiti password</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                {passwordChecklist.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer brand="EnergiaNostra" tagline="Comunità energetiche rinnovabili per la Romagna." />
    </div>
  );
}
