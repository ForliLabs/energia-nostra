"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
  /** Additional element IDs that describe the input (e.g. a strength indicator). */
  "aria-describedby"?: string;
}

export function PasswordInput({
  label,
  hint,
  className,
  id: externalId,
  "aria-describedby": externalDescribedBy,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = externalId ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  const describedByParts = [hintId, externalDescribedBy].filter(Boolean);
  const describedBy = describedByParts.length > 0 ? describedByParts.join(" ") : undefined;

  return (
    <div className="grid gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-zinc-700">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded-2xl border border-lime-200 bg-amber-50/60 px-4 py-3 pr-12 outline-none transition focus:border-lime-500",
            className,
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 transition hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500"
          aria-label={visible ? "Nascondi password" : "Mostra password"}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
