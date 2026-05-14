"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  brand: string;
  items: NavItem[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function Navbar({ brand, items, ctaLabel, ctaHref }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <nav className="sticky top-0 z-50 border-b border-amber-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-black tracking-tight text-lime-950">
          {brand}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-600 transition hover:text-lime-900"
            >
              {item.label}
            </Link>
          ))}
          {ctaLabel && ctaHref && (
            <Link
              href={ctaHref}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-lime-500 px-4 py-2 text-sm font-semibold text-lime-950 shadow-sm transition hover:from-amber-300 hover:to-lime-400"
            >
              {ctaLabel}
            </Link>
          )}
        </div>

        <button
          ref={triggerRef}
          className="rounded-md p-1 text-lime-950 md:hidden"
          onClick={() => setOpen(!open)}
          aria-controls="mobile-navigation"
          aria-expanded={open}
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          type="button"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div id="mobile-navigation" ref={menuRef} className={cn("border-t border-amber-100 md:hidden", open ? "block" : "hidden")}>
        <div className="space-y-1 px-4 py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-base font-medium text-zinc-700 hover:bg-amber-50 hover:text-lime-900"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {ctaLabel && ctaHref && (
            <Link
              href={ctaHref}
              className="mt-2 block rounded-xl bg-gradient-to-r from-amber-400 to-lime-500 px-3 py-2 text-center text-base font-semibold text-lime-950"
              onClick={() => setOpen(false)}
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
