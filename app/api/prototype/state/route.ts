import { requireApiUser } from "../../../../lib/auth";
import { syncBillingStateForUser } from "../../../../lib/billing";
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
  const storedState = await readState(user.id);
  const state = await syncBillingStateForUser(user.id, user.email, storedState);
  return Response.json(state);
}
