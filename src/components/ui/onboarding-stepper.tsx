import { cn } from "@/lib/utils";

type StepStatus = "completed" | "current" | "upcoming";

interface Step {
  title: string;
  description: string;
  status: StepStatus;
}

interface OnboardingStepperProps {
  steps: Step[];
}

const statusStyles: Record<StepStatus, { ring: string; bg: string; text: string; line: string }> = {
  completed: {
    ring: "border-green-500 bg-green-500",
    bg: "bg-green-50 border-green-100",
    text: "text-green-800",
    line: "bg-green-300",
  },
  current: {
    ring: "border-lime-500 bg-lime-500 ring-4 ring-lime-100",
    bg: "bg-lime-50 border-lime-200",
    text: "text-lime-900",
    line: "bg-zinc-200",
  },
  upcoming: {
    ring: "border-zinc-300 bg-white",
    bg: "bg-white border-zinc-100",
    text: "text-zinc-500",
    line: "bg-zinc-200",
  },
};

export function OnboardingStepper({ steps }: OnboardingStepperProps) {
  return (
    <nav aria-label="Progressi onboarding" className="rounded-3xl border border-lime-100 bg-white/90 p-6 shadow-sm shadow-lime-100/40 sm:p-8">
      <h2 className="text-lg font-bold text-zinc-950">I tuoi progressi</h2>
      <ol className="mt-6 space-y-0" role="list">
        {steps.map((step, index) => {
          const style = statusStyles[step.status];
          const isLast = index === steps.length - 1;

          return (
            <li key={step.title} className="relative flex gap-4">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all", style.ring)}
                  aria-hidden="true"
                >
                  {step.status === "completed" ? (
                    <span className="text-white text-xs">✓</span>
                  ) : (
                    <span className={step.status === "current" ? "text-white" : "text-zinc-400"}>{index + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div className={cn("w-0.5 flex-1 min-h-[2rem]", style.line)} aria-hidden="true" />
                )}
              </div>

              {/* Content */}
              <div className={cn("mb-4 flex-1 rounded-2xl border p-4", style.bg)}>
                <p className={cn("text-sm font-semibold", style.text)}>
                  {step.title}
                  {step.status === "current" && (
                    <span className="ml-2 inline-block rounded-full bg-lime-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-800">
                      In corso
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
