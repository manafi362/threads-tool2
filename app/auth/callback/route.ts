import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "../../../lib/env";
import { checkRouteRateLimit } from "../../../lib/route-rate-limit";
import { safeDashboardRoute } from "../../../lib/security";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const rateLimited = checkRouteRateLimit(request, {
    name: "auth-callback",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") || "/dashboard";
  const next = safeDashboardRoute(nextParam) ? nextParam : "/dashboard";

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
