import { z } from "zod";

import { requireApiUser } from "../../../../lib/auth";
import { crawlSite } from "../../../../lib/crawler";
import { assertPaidAccess } from "../../../../lib/entitlements";
import {
  clampCoordinate,
  normalizeHexColor,
  type PrototypeState,
} from "../../../../lib/prototype";
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
    assertSameOrigin(request);
    await requireApiUser();
    const payload = schema.parse(await request.json());
    const targetUrl = new URL(payload.url);
    const state = await readState();
    assertPaidAccess(state);

    const runningState: PrototypeState = {
      ...state,
      crawl: {
        ...state.crawl,
        targetUrl: targetUrl.toString(),
        mode: payload.mode,
        status: "running",
        lastError: null,
      },
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

    await writeState(runningState);

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

    await writeState(nextState);
    return Response.json(nextState);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "クロールに失敗しました。" },
      { status: 400 },
    );
  }
}
