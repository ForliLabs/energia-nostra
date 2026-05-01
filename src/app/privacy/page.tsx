import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Prezzi", href: "/pricing" },
  { label: "Accedi", href: "/login" },
];

export const metadata = {
  title: "Informativa sulla Privacy",
  description: "Informativa sulla privacy di EnergiaNostra ai sensi del GDPR.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar brand="EnergiaNostra" items={navItems} ctaLabel="Dashboard" ctaHref="/dashboard" />
      <main className="flex-1 py-16">
        <div className="prose prose-zinc mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1>Informativa sulla Privacy</h1>
          <p className="text-sm text-zinc-500">Ultimo aggiornamento: luglio 2025</p>

          <h2>1. Titolare del trattamento</h2>
          <p>
            Il Titolare del trattamento dei dati personali è EnergiaNostra S.r.l., con sede legale in
            Forlì (FC), Italia. Email: privacy@energianostra.it
          </p>

          <h2>2. Dati personali raccolti</h2>
          <p>Raccogliamo le seguenti categorie di dati personali:</p>
          <ul>
            <li><strong>Dati identificativi:</strong> nome, cognome, codice fiscale, email</li>
            <li><strong>Dati di contatto:</strong> indirizzo email, numero di telefono</li>
            <li><strong>Dati energetici:</strong> letture contatore, consumi, produzione, codice POD</li>
            <li><strong>Dati finanziari:</strong> fatture, pagamenti, IBAN (tramite processori terzi)</li>
            <li><strong>Dati tecnici:</strong> indirizzo IP, user agent, log di accesso</li>
          </ul>

          <h2>3. Finalità e base giuridica</h2>
          <table>
            <thead>
              <tr><th>Finalità</th><th>Base giuridica</th></tr>
            </thead>
            <tbody>
              <tr><td>Gestione account e autenticazione</td><td>Art. 6(1)(b) — esecuzione del contratto</td></tr>
              <tr><td>Contabilizzazione energia</td><td>Art. 6(1)(b) — esecuzione del contratto</td></tr>
              <tr><td>Fatturazione e pagamenti</td><td>Art. 6(1)(b) — esecuzione del contratto</td></tr>
              <tr><td>Reportistica GSE</td><td>Art. 6(1)(c) — obbligo legale</td></tr>
              <tr><td>Analisi e profilazione energetica</td><td>Art. 6(1)(a) — consenso esplicito</td></tr>
              <tr><td>Marketing e newsletter</td><td>Art. 6(1)(a) — consenso esplicito</td></tr>
            </tbody>
          </table>

          <h2>4. Periodo di conservazione</h2>
          <ul>
            <li>Dati contrattuali: durata del contratto + 10 anni</li>
            <li>Letture energetiche: 7 anni (obbligo fiscale)</li>
            <li>Fatture e pagamenti: 10 anni (obbligo fiscale)</li>
            <li>Dati di marketing: fino a revoca del consenso</li>
            <li>Log di accesso: 90 giorni</li>
          </ul>

          <h2>5. Destinatari dei dati</h2>
          <p>I dati possono essere condivisi con:</p>
          <ul>
            <li>GSE (Gestore Servizi Energetici) — per adempimenti normativi</li>
            <li>Stripe Inc. — per elaborazione pagamenti (PCI DSS compliant)</li>
            <li>PagoPA S.p.A. — per pagamenti alla pubblica amministrazione</li>
            <li>SendGrid (Twilio) — per invio email transazionali</li>
          </ul>

          <h2>6. Diritti dell&apos;interessato</h2>
          <p>Ai sensi degli articoli 15-22 del GDPR, hai diritto di:</p>
          <ul>
            <li><strong>Accesso (Art. 15):</strong> ottenere copia dei tuoi dati personali</li>
            <li><strong>Rettifica (Art. 16):</strong> correggere dati inesatti</li>
            <li><strong>Cancellazione (Art. 17):</strong> richiedere la cancellazione dei tuoi dati</li>
            <li><strong>Limitazione (Art. 18):</strong> limitare il trattamento</li>
            <li><strong>Portabilità (Art. 20):</strong> ricevere i dati in formato strutturato</li>
            <li><strong>Opposizione (Art. 21):</strong> opporsi al trattamento</li>
          </ul>
          <p>
            Per esercitare i tuoi diritti, accedi alla sezione &quot;Privacy&quot; nel tuo profilo
            oppure scrivi a privacy@energianostra.it.
          </p>

          <h2>7. Trasferimenti extra-UE</h2>
          <p>
            Alcuni processori di pagamento (Stripe) hanno sede negli Stati Uniti. Il trasferimento
            avviene sulla base delle Clausole Contrattuali Standard (SCC) approvate dalla Commissione Europea.
          </p>

          <h2>8. Sicurezza</h2>
          <p>
            Adottiamo misure tecniche e organizzative appropriate: crittografia TLS 1.3,
            hashing password con PBKDF2/bcrypt, backup giornalieri crittografati,
            accesso basato su ruoli, audit log delle operazioni.
          </p>

          <h2>9. Contatti</h2>
          <p>
            Per qualsiasi domanda sulla privacy: privacy@energianostra.it<br />
            Garante per la Protezione dei Dati Personali: www.garanteprivacy.it
          </p>
        </div>
      </main>
      <Footer brand="EnergiaNostra" tagline="La tua CER, gestita con trasparenza." />
    </div>
  );
}
