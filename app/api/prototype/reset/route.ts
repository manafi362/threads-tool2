import { requireApiUser } from "../../../../lib/auth";
import { checkRouteRateLimit } from "../../../../lib/route-rate-limit";
import { assertSameOrigin } from "../../../../lib/security";
import { updateState } from "../../../../lib/store";

export async function POST(request: Request) {
  try {
    const rateLimited = checkRouteRateLimit(request, {
      name: "prototype-reset",
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (rateLimited) {
      return rateLimited;
    }

    assertSameOrigin(request);
    const user = await requireApiUser();

    const next = await updateState(user.id, (state) => ({
      ...state,
      crawledPages: [],
      conversations: [],
      crawl: {
        ...state.crawl,
        status: "idle",
        lastRunAt: null,
        lastError: null,
      },
    }));

    return Response.json(next);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "リセットに失敗しました。" },
      { status: 400 },
    );
  }
}
