import "server-only";

import { getSafetyEnv } from "./env";

type UrlRiskCheck = {
  source: "google-safe-browsing" | "domain-reputation";
  status: "allowed" | "blocked" | "skipped" | "error";
  detail: string;
};

export type UrlRiskAssessment = {
  allowed: boolean;
  checks: UrlRiskCheck[];
  blockedReason: string | null;
};

export async function assessUrlRisk(targetUrl: URL): Promise<UrlRiskAssessment> {
  const checks: UrlRiskCheck[] = [];

  const safeBrowsingCheck = await checkGoogleSafeBrowsing(targetUrl);
  checks.push(safeBrowsingCheck);

  const reputationCheck = await checkDomainReputation(targetUrl);
  checks.push(reputationCheck);

  const blockedCheck = checks.find((check) => check.status === "blocked");

  return {
    allowed: !blockedCheck,
    checks,
    blockedReason: blockedCheck?.detail ?? null,
  };
}

async function checkGoogleSafeBrowsing(targetUrl: URL): Promise<UrlRiskCheck> {
  const { safeBrowsingApiKey, safeBrowsingApiUrl } = getSafetyEnv();

  if (!safeBrowsingApiKey) {
    return {
      source: "google-safe-browsing",
      status: "skipped",
      detail: "Google Safe Browsing API key is not configured.",
    };
  }

  try {
    const endpoint = new URL(safeBrowsingApiUrl);
    endpoint.searchParams.set("key", safeBrowsingApiKey);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client: {
          clientId: "threads-tool",
          clientVersion: "1.0.0",
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: targetUrl.toString() }],
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        source: "google-safe-browsing",
        status: "error",
        detail: `Google Safe Browsing request failed with status ${response.status}.`,
      };
    }

    const data = (await response.json()) as {
      matches?: Array<{ threatType?: string }>;
    };

    if (data.matches && data.matches.length > 0) {
      const threatTypes = data.matches
        .map((match) => match.threatType)
        .filter(Boolean)
        .join(", ");

      return {
        source: "google-safe-browsing",
        status: "blocked",
        detail: `Google Safe Browsing detected risk for this URL (${threatTypes || "unsafe"}).`,
      };
    }

    return {
      source: "google-safe-browsing",
      status: "allowed",
      detail: "Google Safe Browsing did not report this URL as unsafe.",
    };
  } catch (error) {
    return {
      source: "google-safe-browsing",
      status: "error",
      detail: error instanceof Error ? error.message : "Google Safe Browsing request failed.",
    };
  }
}

async function checkDomainReputation(targetUrl: URL): Promise<UrlRiskCheck> {
  const { domainReputationApiUrl, domainReputationApiKey } = getSafetyEnv();

  if (!domainReputationApiUrl) {
    return {
      source: "domain-reputation",
      status: "skipped",
      detail: "Domain reputation API is not configured.",
    };
  }

  try {
    const response = await fetch(domainReputationApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(domainReputationApiKey ? { Authorization: `Bearer ${domainReputationApiKey}` } : {}),
      },
      body: JSON.stringify({
        url: targetUrl.toString(),
        hostname: targetUrl.hostname,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        source: "domain-reputation",
        status: "error",
        detail: `Domain reputation request failed with status ${response.status}.`,
      };
    }

    const data = (await response.json()) as {
      allowed?: boolean;
      score?: number;
      verdict?: string;
      reason?: string;
    };

    if (data.allowed === false) {
      return {
        source: "domain-reputation",
        status: "blocked",
        detail:
          data.reason ||
          `Domain reputation service blocked this hostname${typeof data.score === "number" ? ` (score: ${data.score})` : ""}.`,
      };
    }

    return {
      source: "domain-reputation",
      status: "allowed",
      detail:
        data.verdict ||
        `Domain reputation service allowed this hostname${typeof data.score === "number" ? ` (score: ${data.score})` : ""}.`,
    };
  } catch (error) {
    return {
      source: "domain-reputation",
      status: "error",
      detail: error instanceof Error ? error.message : "Domain reputation request failed.",
    };
  }
}
