import { requireApiUser } from "../../../../lib/auth";
import { checkRouteRateLimit } from "../../../../lib/route-rate-limit";
import { readState } from "../../../../lib/store";

export async function GET(request: Request) {
  const rateLimited = checkRouteRateLimit(request, {
    name: "prototype-state",
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  await requireApiUser();
  const state = await readState();
  return Response.json(state);
}
