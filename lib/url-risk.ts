import "server-only";

import { getSafetyEnv } from "./env";

type UrlRiskCheck = {
  source: "google-web-risk" | "domain-reputation";
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

  const webRiskCheck = await checkGoogleWebRisk(targetUrl);
  checks.push(webRiskCheck);

  const reputationCheck = await checkDomainReputation(targetUrl);
  checks.push(reputationCheck);

  const blockedCheck = checks.find((check) => check.status === "blocked");

  return {
    allowed: !blockedCheck,
    checks,
    blockedReason: blockedCheck?.detail ?? null,
  };
}

async function checkGoogleWebRisk(targetUrl: URL): Promise<UrlRiskCheck> {
  const { webRiskApiKey, webRiskApiUrl } = getSafetyEnv();

  if (!webRiskApiKey) {
    return {
      source: "google-web-risk",
      status: "skipped",
      detail: "Google Web Risk API key is not configured.",
    };
  }

  try {
    const endpoint = new URL(webRiskApiUrl);
    endpoint.searchParams.set("key", webRiskApiKey);
    endpoint.searchParams.set("uri", targetUrl.toString());
    endpoint.searchParams.append("threatTypes", "MALWARE");
    endpoint.searchParams.append("threatTypes", "SOCIAL_ENGINEERING");
    endpoint.searchParams.append("threatTypes", "UNWANTED_SOFTWARE");

    const response = await fetch(endpoint, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        source: "google-web-risk",
        status: "error",
        detail: `Google Web Risk request failed with status ${response.status}.`,
      };
    }

    const data = (await response.json()) as {
      threat?: {
        threatTypes?: string[];
        expireTime?: string;
      };
    };

    if (data.threat?.threatTypes?.length) {
      const threatTypes = data.threat.threatTypes
        .filter(Boolean)
        .join(", ");

      return {
        source: "google-web-risk",
        status: "blocked",
        detail: `Google Web Risk detected risk for this URL (${threatTypes || "unsafe"}).`,
      };
    }

    return {
      source: "google-web-risk",
      status: "allowed",
      detail: "Google Web Risk did not report this URL as unsafe.",
    };
  } catch (error) {
    return {
      source: "google-web-risk",
      status: "error",
      detail: error instanceof Error ? error.message : "Google Web Risk request failed.",
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
