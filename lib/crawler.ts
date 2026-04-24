import "server-only";

import {
  CrawledPage,
  MAX_CRAWL_DEPTH,
  MAX_CRAWL_PAGES,
  type CrawlMode,
} from "./prototype";

type CrawlResult = {
  pages: CrawledPage[];
  warnings: string[];
};

type QueueItem = {
  url: string;
  depth: number;
};

export async function crawlSite(targetUrl: string, mode: CrawlMode) {
  const normalized = new URL(targetUrl);
  const disallowed = await readRobots(normalized);
  const warnings: string[] = [];
  const queue: QueueItem[] = [{ url: normalized.toString(), depth: 0 }];
  const seen = new Set<string>();
  const pages: CrawledPage[] = [];

  while (queue.length > 0 && pages.length < MAX_CRAWL_PAGES) {
    const current = queue.shift();

    if (!current || seen.has(current.url)) {
      continue;
    }

    seen.add(current.url);

    if (isDisallowed(current.url, normalized.origin, disallowed)) {
      warnings.push(`robots.txt によりスキップ: ${current.url}`);
      continue;
    }

    try {
      const response = await fetch(current.url, {
        headers: {
          "User-Agent": "threads-tool-prototype/0.1",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        warnings.push(`取得失敗 (${response.status}): ${current.url}`);
        continue;
      }

      const html = await response.text();
      const text = extractText(html);

      if (!text) {
        warnings.push(`本文が抽出できませんでした: ${current.url}`);
        continue;
      }

      pages.push({
        id: toId(current.url),
        url: current.url,
        title: extractTitle(html) || new URL(current.url).hostname,
        excerpt: text.slice(0, 180),
        content: text,
        depth: current.depth,
        crawledAt: new Date().toISOString(),
      });

      if (mode === "page" || current.depth >= MAX_CRAWL_DEPTH) {
        continue;
      }

      const nextUrls = extractLinks(html, current.url, normalized.origin);

      for (const nextUrl of nextUrls) {
        if (!seen.has(nextUrl)) {
          queue.push({
            url: nextUrl,
            depth: current.depth + 1,
          });
        }
      }
    } catch (error) {
      warnings.push(
        `取得中にエラー: ${current.url} (${error instanceof Error ? error.message : "unknown"})`,
      );
    }
  }

  return {
    pages,
    warnings,
  } satisfies CrawlResult;
}

async function readRobots(baseUrl: URL) {
  try {
    const robotsUrl = new URL("/robots.txt", baseUrl.origin);
    const response = await fetch(robotsUrl, {
      headers: {
        "User-Agent": "threads-tool-prototype/0.1",
      },
    });

    if (!response.ok) {
      return [];
    }

    const robots = await response.text();
    const lines = robots.split(/\r?\n/);
    const disallowRules: string[] = [];
    let applies = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const [directive, ...rest] = line.split(":");
      const value = rest.join(":").trim();

      if (directive.toLowerCase() === "user-agent") {
        applies = value === "*" || value.toLowerCase() === "threads-tool-prototype/0.1";
      }

      if (applies && directive.toLowerCase() === "disallow" && value) {
        disallowRules.push(value);
      }
    }

    return disallowRules;
  } catch {
    return [];
  }
}

function isDisallowed(url: string, origin: string, rules: string[]) {
  const pathname = new URL(url).pathname;
  return rules.some((rule) => {
    try {
      const normalizedRule = new URL(rule, origin).pathname;
      return pathname.startsWith(normalizedRule);
    } catch {
      return pathname.startsWith(rule);
    }
  });
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function extractLinks(html: string, currentUrl: string, origin: string) {
  const matches = html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi);
  const next = new Set<string>();

  for (const match of matches) {
    try {
      const resolved = new URL(match[1], currentUrl);

      if (resolved.origin !== origin) {
        continue;
      }

      if (!/^https?:$/.test(resolved.protocol)) {
        continue;
      }

      resolved.hash = "";
      next.add(resolved.toString());
    } catch {
      continue;
    }
  }

  return [...next];
}

function extractText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toId(value: string) {
  return Buffer.from(value).toString("base64url");
}
