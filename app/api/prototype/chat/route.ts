import { randomUUID } from "node:crypto";

import { assertPaidAccess } from "../../../../lib/entitlements";
import { UNKNOWN_ANSWER } from "../../../../lib/prototype";
import { answerQuestion } from "../../../../lib/rag";
import { readState, writeState } from "../../../../lib/store";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type ChatPayload = {
  question?: string;
  sessionId?: string;
  token?: string;
};

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  const payload = await parsePayload(request);
  const question = payload.question?.trim();
  const sessionId = payload.sessionId?.trim() || randomUUID();
  const token = payload.token?.trim();

  if (!question) {
    return Response.json(
      { error: "質問を入力してください。" },
      { status: 400, headers: corsHeaders },
    );
  }

  const state = await readState();

  if (!token || token !== state.tenantToken) {
    return Response.json(
      { error: "無効なトークンです。" },
      { status: 403, headers: corsHeaders },
    );
  }

  try {
    assertPaidAccess(state);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "有効なサブスクリプションが必要です。" },
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
  await writeState(state);

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
