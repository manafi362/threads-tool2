import { hasPaidAccess } from "../../../../lib/entitlements";
import { isVerifiedOwnerForOrigin } from "../../../../lib/site-verification";
import { readStateByToken } from "../../../../lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return Response.json({ error: "Missing token." }, { status: 400 });
  }

  const match = await readStateByToken(token);

  if (!match) {
    return Response.json({ active: false }, { status: 404 });
  }

  const { state } = match;
  const allowedOrigin = getAllowedSiteOrigin(state);
  const requestOrigin = resolveRequestOrigin(request);
  const verified = Boolean(allowedOrigin && isVerifiedOwnerForOrigin(state, allowedOrigin));
  const active = Boolean(
    allowedOrigin &&
      verified &&
      hasPaidAccess(state) &&
      requestOrigin &&
      requestOrigin === allowedOrigin,
  );

  return Response.json(
    {
      active,
      widget: active
        ? {
            displayName: state.widget.displayName,
            accentColor: state.widget.accentColor,
            welcomeMessage: state.widget.welcomeMessage,
            positionPreset: state.widget.positionPreset,
            x: state.widget.x,
            y: state.widget.y,
          }
        : null,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": requestOrigin ?? "null",
        Vary: "Origin",
      },
    },
  );
}

function getAllowedSiteOrigin(state: { crawl: { targetUrl: string } }) {
  try {
    return new URL(state.crawl.targetUrl).origin;
  } catch {
    return null;
  }
}

function resolveRequestOrigin(request: Request) {
  const originHeader = request.headers.get("origin");

  if (originHeader) {
    return originHeader;
  }

  const referer = request.headers.get("referer");

  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}
