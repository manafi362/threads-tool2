import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

  if (!hasSupabaseConfig()) {
    return NextResponse.next();
  }

  if (
    safeDashboardRoute(pathname) ||
    pathname.startsWith("/api/billing") ||
    pathname === "/api/prototype/crawl" ||
    pathname === "/api/prototype/reset" ||
    pathname === "/api/prototype/state"
  ) {
    if (!hasSupabaseSessionCookie(request)) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/api/billing/:path*", "/api/prototype/:path*"],
};
