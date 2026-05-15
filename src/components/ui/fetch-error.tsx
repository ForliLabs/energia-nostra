import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

interface FetchErrorProps {
  /** Main heading – what failed */
  title: string;
  /** Longer description – what the user can do about it */
  description?: string;
  /** The original error message (shown in a muted code block for operators) */
  errorDetail?: string;
  /** Called when user clicks "Riprova" */
  onRetry?: () => void;
  /** Whether a retry is currently in progress */
  retrying?: boolean;
  /** Extra actions (e.g. "Contatta supporto" link) rendered below the retry button */
  actions?: ReactNode;
}

/**
 * Consistent error state for client-side data fetching.
 *
 * Designed to complement `EmptyState` (no data) vs `FetchError` (data load failed)
 * and provide actionable next steps so community operators never hit a dead end.
 */
export function FetchError({
  title,
  description,
  errorDetail,
  onRetry,
  retrying = false,
  actions,
}: FetchErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-red-200 bg-white/90 px-6 py-8 text-center shadow-sm"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-zinc-950">{title}</h2>

      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">
          {description}
        </p>
      ) : null}

      {errorDetail ? (
        <p className="mx-auto mt-3 max-w-lg rounded-xl bg-red-50/70 px-4 py-2 font-mono text-xs text-red-700">
          {errorDetail}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col items-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Nuovo tentativo…" : "Riprova"}
          </button>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
