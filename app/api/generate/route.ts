import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "60 s"),
  analytics: true,
});

const ALLOWED_TONES = ["バズ系", "真面目系", "恋愛系", "教育系"] as const;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OPENAI_API_KEY is missing");
    return NextResponse.json(
      { error: "サーバー設定エラー" },
      { status: 500 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。少し待ってから再試行してください。" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const input = typeof body?.input === "string" ? body.input.trim() : "";
    const tone = typeof body?.tone === "string" ? body.tone.trim() : "";

    if (!input) {
      return NextResponse.json(
        { error: "入力内容が空です" },
        { status: 400 }
      );
    }

    if (input.length > 1000) {
      return NextResponse.json(
        { error: "入力が長すぎます" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TONES.includes(tone as (typeof ALLOWED_TONES)[number])) {
      return NextResponse.json(
        { error: "tone の値が不正です" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
あなたはSNSマーケターです。
Threadsで${tone}の投稿を作成してください。

条件：
・最初の1行で強いフック
・トーンに合った口調
・改行多め
・共感 or 意外性
・役立つ内容
・最後は問いかけ

出力は投稿文のみ
            `.trim(),
          },
          {
            role: "user",
            content: input,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI生成に失敗しました" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: "AIの応答が空でした" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { result },
      {
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json(
      { error: "サーバーエラー発生" },
      { status: 500 }
    );
  }
}