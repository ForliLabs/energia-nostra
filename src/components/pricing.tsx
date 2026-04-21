import { cn } from "@/lib/utils";

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}

interface PricingSectionProps {
  title: string;
  subtitle?: string;
  tiers: PricingTier[];
}

export function PricingSection({ title, subtitle, tiers }: PricingSectionProps) {
  return (
    <section className="bg-amber-50/60 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            {title}
          </h2>
          {subtitle && <p className="mt-4 text-lg text-zinc-600">{subtitle}</p>}
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-8 shadow-sm",
                tier.highlighted ? "border-lime-500 ring-2 ring-lime-400/50" : "border-lime-100"
              )}
            >
              <h3 className="text-lg font-semibold text-zinc-950">{tier.name}</h3>
              <p className="mt-2 text-sm text-zinc-500">{tier.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-zinc-950">{tier.price}</span>
                {tier.period && <span className="text-sm text-zinc-500">/{tier.period}</span>}
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-600">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-lime-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={tier.ctaHref}
                className={cn(
                  "mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition",
                  tier.highlighted
                    ? "bg-lime-600 text-white hover:bg-lime-700"
                    : "border border-lime-200 text-zinc-700 hover:bg-amber-50"
                )}
              >
                {tier.ctaLabel}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
