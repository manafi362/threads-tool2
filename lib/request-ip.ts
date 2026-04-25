export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    const candidate = first?.trim();

    if (candidate) {
      return candidate;
    }
  }

  const fallbackHeaders = ["x-real-ip", "cf-connecting-ip", "x-vercel-forwarded-for"];

  for (const header of fallbackHeaders) {
    const value = headers.get(header)?.trim();

    if (value) {
      return value;
    }
  }

  return "unknown";
}
