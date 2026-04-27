import { getSiteVerificationEnv } from "../../../lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const { publicVerificationToken } = getSiteVerificationEnv();

  if (!publicVerificationToken) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return new Response(publicVerificationToken, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
