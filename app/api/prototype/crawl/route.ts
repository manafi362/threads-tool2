import { z } from "zod";

import { requireApiUser } from "../../../../lib/auth";
import { syncBillingStateForUser } from "../../../../lib/billing";
import { assertSafeCrawlTarget } from "../../../../lib/content-safety";
import { checkRouteRateLimit } from "../../../../lib/route-rate-limit";
import { crawlSite } from "../../../../lib/crawler";
import { assertPaidAccess } from "../../../../lib/entitlements";
import {
  clampCoordinate,
  normalizeHexColor,
  type PrototypeState,
} from "../../../../lib/prototype";
import { buildSiteVerification, isVerifiedOwnerForOrigin } from "../../../../lib/site-verification";
import { assertSameOrigin } from "../../../../lib/security";
import { readState, writeState } from "../../../../lib/store";

const schema = z.object({
  url: z.string().url(),
  mode: z.enum(["site", "page"]).default("site"),
  widget: z
    .object({
      displayName: z.string().trim().min(1).max(40).optional(),
      accentColor: z.string().trim().optional(),
      welcomeMessage: z.string().trim().min(1).max(300).optional(),
      positionPreset: z
        .enum(["bottom-right", "bottom-left", "top-right", "top-left", "custom"])
        .optional(),
      x: z.number().min(0).max(320).optional(),
      y: z.number().min(0).max(320).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = checkRouteRateLimit(request, {
      name: "prototype-crawl",
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    if (rateLimited) {
      return rateLimited;
    }

    assertSameOrigin(request);
    const user = await requireApiUser();
    const payload = schema.parse(await request.json());
    const targetUrl = new URL(payload.url);
    assertSafeCrawlTarget(targetUrl);
    const storedState = await readState(user.id);
    const state = await syncBillingStateForUser(user.id, user.email, storedState);
    assertPaidAccess(state);

    if (!isVerifiedOwnerForOrigin(state, targetUrl.origin)) {
      const nextVerification = buildSiteVerification(state, targetUrl.toString());
      await writeState(
        {
          ...state,
          siteVerification: {
            ...nextVerification,
            status: "pending",
            verifiedOrigin: null,
            verifiedAt: null,
            lastError: "先にサイト所有確認を完了してください。",
          },
        },
        user.id,
      );
      throw new Error("先にサイト所有確認を完了してください。");
    }

    const runningState: PrototypeState = {
      ...state,
      crawl: {
        ...state.crawl,
        targetUrl: targetUrl.toString(),
        mode: payload.mode,
        status: "running",
        lastError: null,
      },
      siteVerification: buildSiteVerification(state, targetUrl.toString()),
      widget: payload.widget
        ? {
            ...state.widget,
            displayName: payload.widget.displayName || state.widget.displayName,
            accentColor: normalizeHexColor(payload.widget.accentColor || state.widget.accentColor),
            welcomeMessage: payload.widget.welcomeMessage || state.widget.welcomeMessage,
            positionPreset: payload.widget.positionPreset || state.widget.positionPreset,
            x: clampCoordinate(payload.widget.x ?? state.widget.x),
            y: clampCoordinate(payload.widget.y ?? state.widget.y),
          }
        : state.widget,
    };

    await writeState(runningState, user.id);

    const { pages, warnings } = await crawlSite(targetUrl.toString(), payload.mode);
    const nextState: PrototypeState = {
      ...runningState,
      crawledPages: pages,
      crawl: {
        ...runningState.crawl,
        status: "succeeded",
        lastRunAt: new Date().toISOString(),
        lastError: warnings[0] ?? null,
      },
    };

    await writeState(nextState, user.id);
    return Response.json(nextState);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "クロールに失敗しました。" },
      { status: 400 },
    );
  }
}
