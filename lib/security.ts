import "server-only";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return;
  }

  const requestOrigin = new URL(request.url).origin;

  if (origin !== requestOrigin) {
    throw new Error("Origin mismatch.");
  }
}

export function safeDashboardRoute(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/account");
}
