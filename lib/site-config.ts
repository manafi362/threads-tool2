import type { Metadata } from "next";

export const SITE_NAME = "URLベースチャットボット";
export const SITE_TITLE = "URLを登録するだけでサイト専用チャットボットを公開できるSaaS";
export const SITE_DESCRIPTION =
  "URLベースチャットボットは、サイトURLの登録・所有確認・クロール・埋め込みコード発行までをまとめて行える日本語対応のチャットボットSaaSです。";

export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!value) {
    return "https://url-based-chatbot.vercel.app";
  }

  return value.replace(/\/$/, "");
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalPath = path === "/" ? "/" : `/${path.replace(/^\/+/, "")}`;
  const url = `${siteUrl}${canonicalPath === "/" ? "" : canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ja_JP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
