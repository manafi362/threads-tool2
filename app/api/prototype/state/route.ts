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

  const user = await requireApiUser();
  const state = await readState(user.id);
  return Response.json(state);
}
