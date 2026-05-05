/**
 * Utility — Tailwind CSS class name merger.
 *
 * Combines {@link clsx} conditional class logic with {@link twMerge} to
 * properly resolve conflicting Tailwind utility classes.
 *
 * @module utils
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge CSS class names with Tailwind conflict resolution.
 *
 * @param inputs - Class values (strings, arrays, objects, conditionals).
 * @returns A single deduplicated, conflict-resolved class string.
 *
 * @example
 * ```tsx
 * <div className={cn("px-4 py-2", isActive && "bg-blue-500", "px-6")} />
 * // → "py-2 bg-blue-500 px-6" (px-4 is overridden by px-6)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
