import "server-only";

const BLOCKED_CHAT_PATTERNS = [
  /死ね/u,
  /殺す/u,
  /自殺/u,
  /レイプ/u,
  /強姦/u,
  /児童ポルノ/u,
  /覚醒剤/u,
  /麻薬/u,
  /爆弾/u,
  /\bkill yourself\b/iu,
  /\brape\b/iu,
  /\bmolest\b/iu,
  /\bbomb\b/iu,
  /\bslut\b/iu,
  /\bnigger\b/iu,
  /\bfaggot\b/iu,
];

const BLOCKED_CRAWL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
]);

const BLOCKED_CRAWL_EXTENSIONS = [
  ".exe",
  ".msi",
  ".dmg",
  ".pkg",
  ".apk",
  ".ipa",
  ".iso",
  ".bin",
  ".scr",
  ".bat",
  ".cmd",
  ".ps1",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
];

const ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml", "text/plain"];

export function getBlockedChatReason(question: string) {
  const value = question.trim();

  if (!value) {
    return null;
  }

  return BLOCKED_CHAT_PATTERNS.some((pattern) => pattern.test(value))
    ? "不適切な表現を含むため、このメッセージは送信できません。"
    : null;
}

export function assertSafeCrawlTarget(targetUrl: URL) {
  if (!/^https?:$/.test(targetUrl.protocol)) {
    throw new Error("http または https の URL のみクロールできます。");
  }

  if (targetUrl.username || targetUrl.password) {
    throw new Error("認証情報を含む URL はクロールできません。");
  }

  if (BLOCKED_CRAWL_HOSTNAMES.has(targetUrl.hostname.toLowerCase())) {
    throw new Error("ローカルまたは内部向けの URL はクロールできません。");
  }

  if (isPrivateHostname(targetUrl.hostname)) {
    throw new Error("プライベートネットワーク宛ての URL はクロールできません。");
  }

  if (
    BLOCKED_CRAWL_EXTENSIONS.some((extension) =>
      targetUrl.pathname.toLowerCase().endsWith(extension),
    )
  ) {
    throw new Error("実行ファイルや圧縮ファイルの URL はクロールできません。");
  }
}

export function assertSafeCrawlResponse(response: Response, currentUrl: string) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (!ALLOWED_CONTENT_TYPES.some((allowed) => contentType.includes(allowed))) {
    throw new Error(`HTML またはテキスト以外の内容はクロールできません: ${currentUrl}`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > 2_000_000) {
    throw new Error(`ページサイズが大きすぎるためクロールできません: ${currentUrl}`);
  }
}

function isPrivateHostname(hostname: string) {
  const lower = hostname.toLowerCase();

  if (
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".home") ||
    lower.endsWith(".lan")
  ) {
    return true;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(lower)) {
    const [first, second] = lower.split(".").map(Number);

    if (first === 10 || first === 127 || first === 0) {
      return true;
    }

    if (first === 169 && second === 254) {
      return true;
    }

    if (first === 172 && second >= 16 && second <= 31) {
      return true;
    }

    if (first === 192 && second === 168) {
      return true;
    }
  }

  if (lower.includes(":")) {
    return (
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80:")
    );
  }

  return false;
}
