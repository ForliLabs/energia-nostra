import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  children?: ReactNode;
  className?: string;
}

export function Hero({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  children,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-amber-100 via-yellow-50 to-lime-100 py-20 sm:py-28 lg:py-32",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(132,204,22,0.2),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex rounded-full border border-amber-200 bg-white/80 px-4 py-1 text-sm font-semibold text-lime-900 shadow-sm">
            Comunità energetiche rinnovabili per Forlì, Cesena e Bertinoro
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-700 sm:text-xl">
            {subtitle}
          </p>
          {(ctaLabel || secondaryLabel) && (
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {ctaLabel && ctaHref && (
                <a
                  href={ctaHref}
                  className="rounded-xl bg-lime-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600"
                >
                  {ctaLabel}
                </a>
              )}
              {secondaryLabel && secondaryHref && (
                <a
                  href={secondaryHref}
                  className="rounded-xl border border-amber-300 bg-white/90 px-8 py-3.5 text-base font-semibold text-zinc-800 shadow-sm transition hover:bg-amber-50"
                >
                  {secondaryLabel}
                </a>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
