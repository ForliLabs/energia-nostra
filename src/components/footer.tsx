import Link from "next/link";

interface FooterProps {
  brand: string;
  tagline?: string;
}

export function Footer({ brand, tagline }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-lime-100 bg-lime-950 text-lime-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="md:flex md:items-start md:justify-between">
          <div>
            <p className="text-lg font-bold text-white">{brand}</p>
            {tagline && <p className="mt-1 text-sm text-lime-100/80">{tagline}</p>}
          </div>
          <div className="mt-6 space-y-3 md:mt-0 md:text-right">
            <div className="flex flex-wrap gap-6 md:justify-end">
              <Link href="/assessment" className="text-sm text-lime-100/80 transition hover:text-white">
                Assessment gratuito
              </Link>
              <Link href="/dashboard" className="text-sm text-lime-100/80 transition hover:text-white">
                Dashboard CER
              </Link>
              <Link
                href="/dashboard/governance"
                className="text-sm text-lime-100/80 transition hover:text-white"
              >
                Governance
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 md:justify-end">
              <Link href="/privacy" className="text-sm text-lime-100/80 transition hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-lime-100/80 transition hover:text-white">
                Termini
              </Link>
              <Link href="/cookie-policy" className="text-sm text-lime-100/80 transition hover:text-white">
                Cookie
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-lime-100/70">
          © {new Date().getFullYear()} {brand}. Comunità energetiche rinnovabili per la Romagna.
        </p>
      </div>
    </footer>
  );
}
