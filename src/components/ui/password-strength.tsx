"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  /** Stable element ID, useful for aria-describedby wiring from the input. */
  id?: string;
}

interface StrengthCheck {
  label: string;
  test: (pw: string) => boolean;
}

const checks: StrengthCheck[] = [
  { label: "Almeno 8 caratteri", test: (pw) => pw.length >= 8 },
  { label: "Una maiuscola", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Una minuscola", test: (pw) => /[a-z]/.test(pw) },
  { label: "Un numero", test: (pw) => /[0-9]/.test(pw) },
  { label: "Un simbolo", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const strengthLabels = ["Molto debole", "Debole", "Discreta", "Buona", "Forte"] as const;

const strengthColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-green-600",
] as const;

export function PasswordStrength({ password, id }: PasswordStrengthProps) {
  const results = useMemo(
    () => checks.map((check) => ({ ...check, passed: check.test(password) })),
    [password],
  );

  const passedCount = results.filter((r) => r.passed).length;
  const strengthIndex = Math.max(passedCount - 1, 0);

  if (!password) return null;

  return (
    <div id={id} className="space-y-3" aria-label="Indicatore sicurezza password">
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {checks.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-200",
                i < passedCount ? strengthColors[strengthIndex] : "bg-zinc-200",
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "text-xs font-semibold",
            passedCount <= 2 ? "text-red-600" : passedCount <= 3 ? "text-amber-600" : "text-green-700",
          )}
          aria-live="polite"
        >
          {strengthLabels[strengthIndex]}
        </span>
      </div>

      {/* Checklist */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs" role="list">
        {results.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                item.passed
                  ? "bg-green-100 text-green-700"
                  : "bg-zinc-100 text-zinc-400",
              )}
              aria-hidden="true"
            >
              {item.passed ? "✓" : "·"}
            </span>
            <span className={cn(item.passed ? "text-zinc-700" : "text-zinc-400")}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
