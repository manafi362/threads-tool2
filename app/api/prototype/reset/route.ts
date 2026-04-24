import { requireApiUser } from "../../../../lib/auth";
import { assertSameOrigin } from "../../../../lib/security";
import { updateState } from "../../../../lib/store";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiUser();

    const next = await updateState((state) => ({
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
