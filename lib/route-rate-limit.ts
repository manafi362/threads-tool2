import "server-only";

import { getClientIp } from "./request-ip";
import { applyRateLimitHeaders, takeRateLimit } from "./rate-limit";

type RouteRateLimitPolicy = {
  name: string;
  limit: number;
  windowMs: number;
};

export function checkRouteRateLimit(request: Request, policy: RouteRateLimitPolicy) {
  const clientIp = getClientIp(request.headers);
  const pathname = new URL(request.url).pathname;
  const result = takeRateLimit(`${policy.name}:${clientIp}:${pathname}`, policy.limit, policy.windowMs);

  if (result.allowed) {
    return null;
  }

  return applyRateLimitHeaders(
    Response.json(
      {
        error: "Too many requests. Please wait a moment and try again.",
      },
      {
        status: 429,
      },
    ),
    result,
  );
}
