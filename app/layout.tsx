import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";

import { signOutAction } from "./actions/auth";
import { getOptionalUser } from "../lib/auth";
import { getSiteVerificationEnv } from "../lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: "URLベース チャットボット",
  description: "URLを読み込んで内容に答えるチャットボットを販売・運用するためのアプリです。",
  verification: {
    google: "u5tcqf-H8kXnbZB6VVZvY8Fb0UnaAid2v6K1S0Ho2Dw",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getOptionalUser();
  const { publicVerificationToken } = getSiteVerificationEnv();

  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        {publicVerificationToken ? (
          <meta name="threads-tool-verification" content={publicVerificationToken} />
        ) : null}
      </head>
      <body className="min-h-full bg-white text-slate-950">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
              <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
                URLベース チャットボット
              </Link>
              <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <Link href="/" className="transition hover:text-slate-950">
                  Home
                </Link>
                <Link href="/dashboard" className="transition hover:text-slate-950">
                  Dashboard
                </Link>
                <Link href="/site-guide" className="transition hover:text-slate-950">
                  Site Guide
                </Link>
                <Link href="/account" className="transition hover:text-slate-950">
                  Account
                </Link>
                <Link href="/privacy" className="transition hover:text-slate-950">
                  Privacy
                </Link>
                <Link href="/legal" className="transition hover:text-slate-950">
                  特商法表記
                </Link>
                <Link href="/contact" className="transition hover:text-slate-950">
                  Contact
                </Link>
                {user ? (
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-800 transition hover:bg-slate-50"
                    >
                      Sign out
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-slate-950 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
                  >
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-slate-200 bg-white px-6 py-6 text-sm text-slate-600">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 URLベース チャットボット</p>
              <p>URLクロール、チャット回答、Stripe課金までをまとめた販売向けアプリ</p>
            </div>
          </footer>
        </div>

        <Analytics />
      </body>
    </html>
  );
}
