import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import Script from "next/script";
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
  title: "Threads投稿作成ツール | 無料で使える投稿生成アプリ",
  description:
    "Threads投稿文を自動生成。ネタ切れ防止、時短、初心者向けの無料ツールです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9073784290240075"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>

      <body className="min-h-full flex flex-col bg-white text-black">
        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-200 px-6 py-6 text-sm text-gray-600">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Threads投稿作成ツール</p>
            <nav className="flex gap-4">
              <Link href="/privacy" className="hover:underline">
                プライバシーポリシー
              </Link>
              <Link href="/contact" className="hover:underline">
                お問い合わせ
              </Link>
            </nav>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}