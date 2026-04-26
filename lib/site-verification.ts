import "server-only";

import { createHash } from "node:crypto";

import type { PrototypeState, SiteVerificationState } from "./prototype";

const META_NAME = "threads-tool-verification";
const WELL_KNOWN_PATH = "/.well-known/threads-tool-verification.txt";
const USER_AGENT = "threads-tool-site-verifier/0.1";

export function createVerificationToken(tenantToken: string, origin: string) {
  return createHash("sha256").update(`${tenantToken}:${origin}`).digest("hex").slice(0, 32);
}

export function normalizeSiteOrigin(value: string) {
  const url = new URL(value);
  return url.origin;
}

export function buildSiteVerification(state: PrototypeState, siteUrl: string): SiteVerificationState {
  const origin = normalizeSiteOrigin(siteUrl);
  const challengeToken = createVerificationToken(state.tenantToken, origin);
  const isVerified = state.siteVerification.verifiedOrigin === origin;

  return {
    ...state.siteVerification,
    status: isVerified ? "verified" : "pending",
    challengeToken,
    targetOrigin: origin,
    verifiedOrigin: isVerified ? origin : state.siteVerification.verifiedOrigin,
    verifiedAt: isVerified ? state.siteVerification.verifiedAt : null,
    lastError: isVerified ? null : state.siteVerification.lastError,
  };
}

export function getVerificationInstructions(verification: SiteVerificationState) {
  if (!verification.targetOrigin || !verification.challengeToken) {
    return null;
  }

  return {
    metaTag: `<meta name="${META_NAME}" content="${verification.challengeToken}" />`,
    filePath: WELL_KNOWN_PATH,
    fileContents: verification.challengeToken,
    fileUrl: `${verification.targetOrigin}${WELL_KNOWN_PATH}`,
  };
}

export async function verifySiteOwnership(verification: SiteVerificationState) {
  if (!verification.targetOrigin || !verification.challengeToken) {
    throw new Error("検証するサイトURLを先に設定してください。");
  }

  const byFile = await checkVerificationFile(verification.targetOrigin, verification.challengeToken);

  if (byFile.ok) {
    return {
      verified: true,
      method: "file" as const,
      checkedAt: new Date().toISOString(),
      error: null,
    };
  }

  const byMeta = await checkVerificationMetaTag(
    verification.targetOrigin,
    verification.challengeToken,
  );

  if (byMeta.ok) {
    return {
      verified: true,
      method: "meta" as const,
      checkedAt: new Date().toISOString(),
      error: null,
    };
  }

  return {
    verified: false,
    method: null,
    checkedAt: new Date().toISOString(),
    error:
      byFile.error ||
      byMeta.error ||
      "検証トークンが見つかりませんでした。metaタグまたは検証ファイルを確認してください。",
  };
}

export function isVerifiedOwnerForOrigin(state: PrototypeState, origin: string) {
  return state.siteVerification.verifiedOrigin === origin;
}

async function checkVerificationFile(origin: string, expectedToken: string) {
  try {
    const response = await fetch(`${origin}${WELL_KNOWN_PATH}`, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `検証ファイルが取得できませんでした (${response.status})。`,
      };
    }

    const text = (await response.text()).trim();

    if (text !== expectedToken) {
      return {
        ok: false,
        error: "検証ファイルの内容が一致しません。",
      };
    }

    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "検証ファイルの確認に失敗しました。",
    };
  }
}

async function checkVerificationMetaTag(origin: string, expectedToken: string) {
  try {
    const response = await fetch(origin, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `トップページが取得できませんでした (${response.status})。`,
      };
    }

    const html = await response.text();
    const pattern = new RegExp(
      `<meta[^>]+name=["']${META_NAME}["'][^>]+content=["']${escapeRegExp(expectedToken)}["'][^>]*>`,
      "i",
    );

    if (!pattern.test(html)) {
      return {
        ok: false,
        error: "metaタグに検証トークンが見つかりませんでした。",
      };
    }

    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "metaタグの確認に失敗しました。",
    };
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
