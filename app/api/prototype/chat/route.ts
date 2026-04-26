import { randomUUID } from "node:crypto";

import { getOptionalUser } from "../../../../lib/auth";
import { getBlockedChatReason } from "../../../../lib/content-safety";
import { assertPaidAccess } from "../../../../lib/entitlements";
import type { PrototypeState } from "../../../../lib/prototype";
import { UNKNOWN_ANSWER } from "../../../../lib/prototype";
import { answerQuestion } from "../../../../lib/rag";
import { checkRouteRateLimit } from "../../../../lib/route-rate-limit";
import { isVerifiedOwnerForOrigin } from "../../../../lib/site-verification";
import { readStateByToken, writeState } from "../../../../lib/store";

type ChatPayload = {
  question?: string;
  sessionId?: string;
  token?: string;
};

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(null),
  });
}

export async function POST(request: Request) {
  const rateLimited = checkRouteRateLimit(request, {
    name: "prototype-chat",
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const payload = await parsePayload(request);
  const question = payload.question?.trim();
  const sessionId = payload.sessionId?.trim() || randomUUID();
  const token = payload.token?.trim();

  if (!question) {
    return Response.json(
      { error: "質問を入力してください。" },
      { status: 400, headers: buildCorsHeaders(null) },
    );
  }

  const blockedReason = getBlockedChatReason(question);

  if (blockedReason) {
    return Response.json(
      { error: blockedReason },
      { status: 400, headers: buildCorsHeaders(null) },
    );
  }

  if (!token) {
    return Response.json(
      { error: "無効なチャットボットです。" },
      { status: 403, headers: buildCorsHeaders(null) },
    );
  }

  const match = await readStateByToken(token);

  if (!match) {
    return Response.json(
      { error: "無効なチャットボットです。" },
      { status: 403, headers: buildCorsHeaders(null) },
    );
  }

  const { state, userId } = match;
  const requestOrigin = resolveRequestOrigin(request);
  const corsHeaders = buildCorsHeaders(requestOrigin);
  const allowedOrigin = getAllowedSiteOrigin(state);

  if (!allowedOrigin || !isVerifiedOwnerForOrigin(state, allowedOrigin)) {
    return Response.json(
      { error: "このチャットボットはサイト所有確認が完了していません。" },
      { status: 403, headers: corsHeaders },
    );
  }

  if (!(await canAccessChatbot(request, state, requestOrigin, userId))) {
    return Response.json(
      { error: "このチャットボットは登録されたサイト上でのみ利用できます。" },
      { status: 403, headers: corsHeaders },
    );
  }

  try {
    assertPaidAccess(state);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "有効なサブスクリプションが必要です。",
      },
      { status: 402, headers: corsHeaders },
    );
  }

  const response = await answerQuestion(state, question);
  const answer = response.answer || UNKNOWN_ANSWER;
  const now = new Date().toISOString();
  const existing = state.conversations.find((conversation) => conversation.sessionId === sessionId);

  if (existing) {
    existing.updatedAt = now;
    existing.messages.push(
      { role: "user", content: question, timestamp: now },
      { role: "assistant", content: answer, timestamp: now },
    );
  } else {
    state.conversations.unshift({
      id: randomUUID(),
      sessionId,
      startedAt: now,
      updatedAt: now,
      messages: [
        { role: "user", content: question, timestamp: now },
        { role: "assistant", content: answer, timestamp: now },
      ],
    });
  }

  state.conversations = state.conversations.slice(0, 20);
  await writeState(state, userId);

  return Response.json(
    {
      sessionId,
      answer,
      sources: response.sources,
    },
    {
      headers: corsHeaders,
    },
  );
}

async function parsePayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as ChatPayload;
  }

  const text = await request.text();

  try {
    return JSON.parse(text) as ChatPayload;
  } catch {
    return {} as ChatPayload;
  }
}

function buildCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

async function canAccessChatbot(
  request: Request,
  state: PrototypeState,
  requestOrigin: string | null,
  ownerUserId: string | null,
) {
  const user = await getOptionalUser();

  if (user) {
    return Boolean(ownerUserId && user.id === ownerUserId);
  }

  const allowedOrigin = getAllowedSiteOrigin(state);

  if (!allowedOrigin || !requestOrigin) {
    return false;
  }

  return requestOrigin === allowedOrigin;
}

function getAllowedSiteOrigin(state: PrototypeState) {
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
