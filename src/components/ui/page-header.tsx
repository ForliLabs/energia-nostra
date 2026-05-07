import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-white/90 p-6 shadow-lg shadow-amber-100/40 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">{eyebrow}</p>
          ) : null}
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">{title}</h1>
          {description ? <p className="mt-4 text-base leading-7 text-zinc-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
