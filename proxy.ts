import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  hasAdminBasicAuthConfigured,
  hasIpAllowlistConfigured,
  hasValidAdminBasicAuth,
  isClientIpAllowed,
} from "./lib/admin-access";
import { getClientIp } from "./lib/request-ip";
import { applyRateLimitHeaders, takeRateLimit } from "./lib/rate-limit";
import { safeDashboardRoute } from "./lib/security";

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.includes("auth-token"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request.headers);
  const isProtectedPath =
    safeDashboardRoute(pathname) ||
    pathname.startsWith("/api/billing") ||
    pathname === "/api/prototype/crawl" ||
    pathname === "/api/prototype/reset" ||
    pathname === "/api/prototype/state";
  const isAuthPath = pathname === "/login" || pathname.startsWith("/auth/callback");

  if (isAuthPath) {
    const rateLimit = takeRateLimit(`auth:${clientIp}`, 10, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: "Too many login attempts. Please wait before trying again.",
          },
          { status: 429 },
        ),
        rateLimit,
      );
    }
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.next();
  }

  if (isProtectedPath) {
    if (hasIpAllowlistConfigured() && !isClientIpAllowed(request.headers)) {
      return NextResponse.json(
        {
          error: "This IP address is not allowed to access the admin area.",
        },
        { status: 403 },
      );
    }

    if (hasAdminBasicAuthConfigured() && !hasValidAdminBasicAuth(request.headers)) {
      return new NextResponse("Authentication required.", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="URL Based Chatbot Admin"',
        },
      });
    }

    const adminRateLimit = takeRateLimit(`admin:${clientIp}:${pathname}`, 60, 60 * 1000);

    if (!adminRateLimit.allowed) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: "Too many requests. Please slow down and try again.",
          },
          { status: 429 },
        ),
        adminRateLimit,
      );
    }

    if (!hasSupabaseSessionCookie(request)) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/auth/callback/:path*",
    "/dashboard/:path*",
    "/account/:path*",
    "/api/billing/:path*",
    "/api/prototype/:path*",
  ],
};
