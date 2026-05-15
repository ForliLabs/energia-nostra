import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Prezzi", href: "/pricing" },
  { label: "Accedi", href: "/login" },
];

export const metadata = {
  title: "Termini e Condizioni",
  description: "Termini e condizioni di utilizzo della piattaforma EnergiaNostra.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar brand="EnergiaNostra" items={navItems} ctaLabel="Dashboard" ctaHref="/dashboard" />
      <main id="main-content" className="flex-1 py-16">
        <div className="prose prose-zinc mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1>Termini e Condizioni</h1>
          <p className="text-sm text-zinc-500">Ultimo aggiornamento: luglio 2025</p>

          <h2>1. Oggetto del servizio</h2>
          <p>
            EnergiaNostra fornisce una piattaforma SaaS per la gestione di Comunità Energetiche
            Rinnovabili (CER) ai sensi del D.Lgs. 199/2021 e della Direttiva EU 2018/2001 (RED II).
            Il servizio include gestione membri, contabilizzazione energia, reportistica GSE,
            fatturazione e governance digitale.
          </p>

          <h2>2. Registrazione e account</h2>
          <p>
            L&apos;accesso alla piattaforma richiede la registrazione con email verificata.
            L&apos;utente è responsabile della riservatezza delle proprie credenziali.
            L&apos;autenticazione può avvenire tramite SPID, CIE o credenziali locali.
          </p>

          <h2>3. Piani e tariffe</h2>
          <p>
            I piani disponibili (Starter, Pro, Enterprise) sono descritti nella pagina Prezzi.
            La prova gratuita dura 30 giorni. Il rinnovo è automatico con preavviso di 7 giorni.
            IVA al 22% esclusa. Pagamento tramite Stripe o PagoPA.
          </p>

          <h2>4. Responsabilità dell&apos;utente</h2>
          <ul>
            <li>Fornire dati veritieri e aggiornati</li>
            <li>Non condividere le credenziali di accesso</li>
            <li>Rispettare le normative vigenti sulla gestione delle CER</li>
            <li>Non utilizzare la piattaforma per scopi illeciti</li>
          </ul>

          <h2>5. Proprietà intellettuale</h2>
          <p>
            Il software EnergiaNostra, inclusi design, codice e documentazione, è di proprietà
            di EnergiaNostra S.r.l. I dati inseriti dall&apos;utente restano di proprietà dell&apos;utente.
          </p>

          <h2>6. Limitazione di responsabilità</h2>
          <p>
            EnergiaNostra non è responsabile per errori nei calcoli GSE derivanti da dati
            errati forniti dall&apos;utente. La piattaforma fornisce strumenti di supporto
            e non consulenza legale, fiscale o energetica.
          </p>

          <h2>7. Recesso e cancellazione</h2>
          <p>
            L&apos;utente può recedere dal contratto in qualsiasi momento con effetto dalla fine
            del periodo di fatturazione corrente. Al recesso, l&apos;utente può esportare i propri
            dati entro 30 giorni, dopodiché verranno cancellati.
          </p>

          <h2>8. SLA (Service Level Agreement)</h2>
          <table>
            <thead>
              <tr><th>Piano</th><th>Uptime garantito</th><th>Tempo di risposta</th></tr>
            </thead>
            <tbody>
              <tr><td>Starter</td><td>99%</td><td>48 ore lavorative</td></tr>
              <tr><td>Pro</td><td>99%</td><td>24 ore lavorative</td></tr>
              <tr><td>Enterprise</td><td>99.9%</td><td>4 ore</td></tr>
            </tbody>
          </table>

          <h2>9. Legge applicabile e foro competente</h2>
          <p>
            Il presente contratto è regolato dalla legge italiana. Per ogni controversia è
            competente il Foro di Forlì (FC).
          </p>

          <h2>10. Modifiche ai termini</h2>
          <p>
            EnergiaNostra si riserva il diritto di modificare i presenti termini con preavviso
            di 30 giorni tramite email. L&apos;uso continuato della piattaforma costituisce
            accettazione delle modifiche.
          </p>
        </div>
      </main>
      <Footer brand="EnergiaNostra" tagline="La tua CER, gestita con trasparenza." />
    </div>
  );
}
