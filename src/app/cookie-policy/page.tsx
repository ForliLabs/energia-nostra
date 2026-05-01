import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getCookieCategories } from "@/lib/gdpr";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Privacy", href: "/privacy" },
  { label: "Accedi", href: "/login" },
];

export const metadata = {
  title: "Cookie Policy",
  description: "Informativa sull'utilizzo dei cookie su EnergiaNostra.",
};

export default function CookiePolicyPage() {
  const categories = getCookieCategories();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar brand="EnergiaNostra" items={navItems} ctaLabel="Dashboard" ctaHref="/dashboard" />
      <main className="flex-1 py-16">
        <div className="prose prose-zinc mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1>Cookie Policy</h1>
          <p className="text-sm text-zinc-500">Ultimo aggiornamento: luglio 2025</p>

          <h2>Cosa sono i cookie</h2>
          <p>
            I cookie sono piccoli file di testo memorizzati dal browser. EnergiaNostra utilizza cookie
            per garantire il funzionamento del sito e, con il tuo consenso, per analisi del traffico.
          </p>

          <h2>Cookie utilizzati</h2>
          {categories.map((category) => (
            <div key={category.id} className="mb-6">
              <h3>
                {category.name}
                {category.required && (
                  <span className="ml-2 text-xs font-normal text-amber-600">(obbligatori)</span>
                )}
              </h3>
              <p>{category.description}</p>
              {category.cookies.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Scopo</th>
                      <th>Durata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.cookies.map((cookie) => (
                      <tr key={cookie.name}>
                        <td><code>{cookie.name}</code></td>
                        <td>{cookie.purpose}</td>
                        <td>{cookie.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          <h2>Come gestire i cookie</h2>
          <p>
            Puoi gestire le tue preferenze cookie in qualsiasi momento dalla barra dei cookie
            o dalle impostazioni del tuo browser. La disattivazione dei cookie essenziali potrebbe
            compromettere il funzionamento della piattaforma.
          </p>

          <h2>Contatti</h2>
          <p>
            Per domande sulla nostra cookie policy: privacy@energianostra.it
          </p>
        </div>
      </main>
      <Footer brand="EnergiaNostra" tagline="La tua CER, gestita con trasparenza." />
    </div>
  );
}
