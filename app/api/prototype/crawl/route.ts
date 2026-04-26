import { z } from "zod";

import { appendAuditLog } from "../../../../lib/audit";
import { requireApiUser } from "../../../../lib/auth";
import { syncBillingStateForUser } from "../../../../lib/billing";
import { assertSafeCrawlTarget } from "../../../../lib/content-safety";
import { crawlSite } from "../../../../lib/crawler";
import { assertPaidAccess } from "../../../../lib/entitlements";
import {
  clampCoordinate,
  normalizeHexColor,
  type PrototypeState,
} from "../../../../lib/prototype";
import { checkRouteRateLimit } from "../../../../lib/route-rate-limit";
import { buildSiteVerification, isVerifiedOwnerForOrigin } from "../../../../lib/site-verification";
import { assertSameOrigin } from "../../../../lib/security";
import { readState, writeState } from "../../../../lib/store";
import { assessUrlRisk } from "../../../../lib/url-risk";

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
  let actorUserId: string | null = null;
  let targetUrl: URL | null = null;

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
    actorUserId = user.id;
    const payload = schema.parse(await request.json());
    targetUrl = new URL(payload.url);
    assertSafeCrawlTarget(targetUrl);

    const storedState = await readState(user.id);
    let state = await syncBillingStateForUser(user.id, user.email, storedState);
    state = appendAuditLog(state, {
      action: "crawl_requested",
      actorUserId: user.id,
      targetUrl: targetUrl.toString(),
      outcome: "info",
      detail: "Crawl was requested.",
    });

    assertPaidAccess(state);

    const risk = await assessUrlRisk(targetUrl);

    if (!risk.allowed) {
      state = appendAuditLog(state, {
        action: "risk_check_blocked",
        actorUserId: user.id,
        targetUrl: targetUrl.toString(),
        outcome: "blocked",
        detail: risk.blockedReason ?? "External URL risk checks blocked this crawl target.",
      });
      await writeState(state, user.id);
      throw new Error(risk.blockedReason ?? "このURLは安全性チェックにより拒否されました。");
    }

    if (!isVerifiedOwnerForOrigin(state, targetUrl.origin)) {
      const nextVerification = buildSiteVerification(state, targetUrl.toString());
      const blockedState = appendAuditLog(
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
        {
          action: "crawl_blocked",
          actorUserId: user.id,
          targetUrl: targetUrl.toString(),
          outcome: "blocked",
          detail: "Crawl was blocked because site ownership verification is incomplete.",
        },
      );
      await writeState(blockedState, user.id);
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
    const nextState = appendAuditLog(
      {
        ...runningState,
        crawledPages: pages,
        crawl: {
          ...runningState.crawl,
          status: "succeeded",
          lastRunAt: new Date().toISOString(),
          lastError: warnings[0] ?? null,
        },
      },
      {
        action: "crawl_succeeded",
        actorUserId: user.id,
        targetUrl: targetUrl.toString(),
        outcome: "success",
        detail:
          warnings[0] ??
          `Crawl completed successfully for ${pages.length} page${pages.length === 1 ? "" : "s"}.`,
      },
    );

    await writeState(nextState, user.id);
    return Response.json(nextState);
  } catch (error) {
    if (actorUserId && targetUrl) {
      try {
        const storedState = await readState(actorUserId);
        const failedState = appendAuditLog(storedState, {
          action: "crawl_failed",
          actorUserId,
          targetUrl: targetUrl.toString(),
          outcome: "failed",
          detail: error instanceof Error ? error.message : "Crawl failed.",
        });
        await writeState(failedState, actorUserId);
      } catch {
        // Ignore audit log failures.
      }
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "クロールに失敗しました。" },
      { status: 400 },
    );
  }
}
