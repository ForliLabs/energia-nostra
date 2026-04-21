import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm shadow-amber-100/40 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-lime-100/40">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-lime-700">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

interface FeatureGridProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function FeatureGrid({ title, subtitle, children, className }: FeatureGridProps) {
  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            {title}
          </h2>
          {subtitle && <p className="mt-4 text-lg text-zinc-600">{subtitle}</p>}
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      </div>
    </section>
  );
}
