import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EnergiaNostra | CER in Romagna",
    template: "%s | EnergiaNostra",
  },
  description:
    "EnergiaNostra accompagna comunità energetiche in Romagna dalla fattibilità alla gestione operativa, con dashboard, incentivi GSE e governance digitale.",
  applicationName: "EnergiaNostra",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-amber-50 antialiased`}
    >
      <body className="min-h-full text-zinc-900">{children}</body>
    </html>
  );
}
