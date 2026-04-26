export const SERVICE_DOMAIN_FALLBACK = "demo.threads-tool.local";
export const PROTOTYPE_STORE_PATH = "data/prototype-store.json";
export const DEFAULT_TOKEN = "tenant_demo_01";
export const MAX_CRAWL_DEPTH = 1;
export const MAX_CRAWL_PAGES = 8;
export const DEFAULT_WIDGET_OFFSET = 24;
export const UNKNOWN_ANSWER = "その質問にはまだうまく答えられませんでした。";

export type CrawlMode = "site" | "page";
export type WidgetPreset =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "custom";

export type CrawlStatus = "idle" | "running" | "succeeded" | "failed";
export type BillingStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled";
export type SiteVerificationStatus = "unverified" | "pending" | "verified" | "failed";

export type WidgetSettings = {
  displayName: string;
  accentColor: string;
  welcomeMessage: string;
  positionPreset: WidgetPreset;
  x: number;
  y: number;
};

export type CrawlConfig = {
  targetUrl: string;
  mode: CrawlMode;
  status: CrawlStatus;
  lastRunAt: string | null;
  lastError: string | null;
};

export type BillingState = {
  email: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  plan: string | null;
  status: BillingStatus;
  currentPeriodEnd: string | null;
  lastCheckoutAt: string | null;
  lastWebhookEventId: string | null;
  lastWebhookAt: string | null;
};

export type SiteVerificationState = {
  status: SiteVerificationStatus;
  challengeToken: string | null;
  targetOrigin: string | null;
  verifiedOrigin: string | null;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
};

export type CrawledPage = {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  content: string;
  depth: number;
  crawledAt: string;
};

export type ChatEntry = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type ConversationLog = {
  id: string;
  startedAt: string;
  updatedAt: string;
  sessionId: string;
  messages: ChatEntry[];
};

export type PrototypeState = {
  tenantName: string;
  tenantToken: string;
  serviceDomain: string;
  crawl: CrawlConfig;
  billing: BillingState;
  siteVerification: SiteVerificationState;
  widget: WidgetSettings;
  crawledPages: CrawledPage[];
  conversations: ConversationLog[];
};

export function createDefaultState(): PrototypeState {
  return {
    tenantName: "Acme Support",
    tenantToken: DEFAULT_TOKEN,
    serviceDomain:
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? SERVICE_DOMAIN_FALLBACK,
    crawl: {
      targetUrl: "https://example.com",
      mode: "site",
      status: "idle",
      lastRunAt: null,
      lastError: null,
    },
    billing: {
      email: null,
      customerId: null,
      subscriptionId: null,
      plan: null,
      status: "inactive",
      currentPeriodEnd: null,
      lastCheckoutAt: null,
      lastWebhookEventId: null,
      lastWebhookAt: null,
    },
    siteVerification: {
      status: "unverified",
      challengeToken: null,
      targetOrigin: null,
      verifiedOrigin: null,
      verifiedAt: null,
      lastCheckedAt: null,
      lastError: null,
    },
    widget: {
      displayName: "サポートチャット",
      accentColor: "#0f766e",
      welcomeMessage: "こんにちは。サイトについて知りたいことを聞いてください。",
      positionPreset: "bottom-right",
      x: DEFAULT_WIDGET_OFFSET,
      y: DEFAULT_WIDGET_OFFSET,
    },
    crawledPages: [],
    conversations: [],
  };
}

export function normalizeHexColor(input: string) {
  const value = input.trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0f766e";
}

export function buildEmbedCode(state: PrototypeState) {
  return `<script
  src="${state.serviceDomain}/widget.js"
  data-token="${state.tenantToken}"
  data-name="${escapeAttribute(state.widget.displayName)}"
  data-position="${state.widget.positionPreset}"
  data-x="${state.widget.x}"
  data-y="${state.widget.y}"
  data-color="${state.widget.accentColor}"
  data-welcome="${escapeAttribute(state.widget.welcomeMessage)}"
  async
></script>`;
}

function escapeAttribute(value: string) {
  return value.replace(/"/g, "&quot;");
}

export function clampCoordinate(value: number) {
  return Math.max(0, Math.min(320, Math.round(value)));
}

export function tokenize(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .trim();
  const spacedTokens = normalized.split(/\s+/).filter((token) => token.length >= 2);
  const compact = normalized.replace(/\s+/g, "");
  const ngrams: string[] = [];

  for (let index = 0; index < compact.length - 1; index += 1) {
    ngrams.push(compact.slice(index, index + 2));
  }

  return [...new Set([...spacedTokens, ...ngrams])];
}
