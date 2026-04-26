import { z } from "zod";

import { appendAuditLog } from "../../../../lib/audit";
import { requireApiUser } from "../../../../lib/auth";
import { assertSafeCrawlTarget } from "../../../../lib/content-safety";
import type { PrototypeState } from "../../../../lib/prototype";
import {
  buildSiteVerification,
  getVerificationInstructions,
  verifySiteOwnership,
} from "../../../../lib/site-verification";
import { checkRouteRateLimit } from "../../../../lib/route-rate-limit";
import { assertSameOrigin } from "../../../../lib/security";
import { assessUrlRisk } from "../../../../lib/url-risk";
import { writeState, readState } from "../../../../lib/store";

const schema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = checkRouteRateLimit(request, {
      name: "prototype-verify-site",
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (rateLimited) {
      return rateLimited;
    }

    assertSameOrigin(request);
    const user = await requireApiUser();
    const payload = schema.parse(await request.json());
    const targetUrl = new URL(payload.url);
    assertSafeCrawlTarget(targetUrl);
    let state = await readState(user.id);
    state = appendAuditLog(state, {
      action: "site_verification_requested",
      actorUserId: user.id,
      targetUrl: targetUrl.toString(),
      outcome: "info",
      detail: "Site ownership verification was requested.",
    });

    const risk = await assessUrlRisk(targetUrl);

    if (!risk.allowed) {
      state = appendAuditLog(state, {
        action: "risk_check_blocked",
        actorUserId: user.id,
        targetUrl: targetUrl.toString(),
        outcome: "blocked",
        detail: risk.blockedReason ?? "External URL risk checks blocked this site.",
      });
      await writeState(state, user.id);
      throw new Error(risk.blockedReason ?? "このURLは安全性チェックにより拒否されました。");
    }

    const nextVerification = buildSiteVerification(state, payload.url);
    const result = await verifySiteOwnership(nextVerification);
    let nextState: PrototypeState = {
      ...state,
      siteVerification: {
        ...nextVerification,
        status: result.verified ? "verified" : "failed",
        verifiedOrigin: result.verified ? nextVerification.targetOrigin : null,
        verifiedAt: result.verified ? result.checkedAt : null,
        lastCheckedAt: result.checkedAt,
        lastError: result.error,
      },
    };

    nextState = appendAuditLog(nextState, {
      action: result.verified ? "site_verification_succeeded" : "site_verification_failed",
      actorUserId: user.id,
      targetUrl: targetUrl.toString(),
      outcome: result.verified ? "success" : "failed",
      detail:
        result.error ??
        `Ownership verification completed by ${result.method === "file" ? "file" : "meta tag"}.`,
    });

    await writeState(nextState, user.id);

    return Response.json({
      state: nextState,
      instructions: getVerificationInstructions(nextState.siteVerification),
      verificationMethod: result.method,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "サイト所有確認に失敗しました。" },
      { status: 400 },
    );
  }
}
