import { z } from "zod";

import { requireApiUser } from "../../../../lib/auth";
import type { PrototypeState } from "../../../../lib/prototype";
import {
  buildSiteVerification,
  getVerificationInstructions,
  verifySiteOwnership,
} from "../../../../lib/site-verification";
import { checkRouteRateLimit } from "../../../../lib/route-rate-limit";
import { assertSameOrigin } from "../../../../lib/security";
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
    const state = await readState(user.id);

    const nextVerification = buildSiteVerification(state, payload.url);
    const result = await verifySiteOwnership(nextVerification);
    const nextState: PrototypeState = {
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
