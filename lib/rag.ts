import "server-only";

import {
  UNKNOWN_ANSWER,
  buildKnowledgeChunks,
  type KnowledgeChunk,
  type PrototypeState,
  tokenize,
} from "./prototype";

export async function answerQuestion(state: PrototypeState, question: string) {
  const knowledgeBase =
    state.knowledgeChunks.length > 0 ? state.knowledgeChunks : buildKnowledgeChunks(state.crawledPages);
  const hits = rankChunks(knowledgeBase, question).slice(0, 4);
  const selectedHits =
    hits.length > 0 && hits[0].score >= 2
      ? hits
      : isGenericSiteQuestion(question) && knowledgeBase.length > 0
        ? knowledgeBase.slice(0, 2).map((chunk) => ({ chunk, score: 1 }))
        : [];

  if (selectedHits.length === 0) {
    return {
      answer: UNKNOWN_ANSWER,
      sources: [],
    };
  }

  const context = selectedHits
    .map(
      ({ chunk }, index) =>
        `Source ${index + 1}\nURL: ${chunk.url}\nTitle: ${chunk.title}\nExcerpt: ${chunk.excerpt}\nContent: ${chunk.content.slice(0, 1200)}`,
    )
    .join("\n\n");

  const answer = await generateAnswer(question, context);

  return {
    answer,
    sources: uniqueSources(selectedHits.map(({ chunk }) => chunk)),
  };
}

function rankChunks(chunks: KnowledgeChunk[], question: string) {
  const tokens = tokenize(question);

  return chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, tokens),
    }))
    .filter((hit) => hit.score > 0)
    .sort((left, right) => right.score - left.score);
}

function scoreChunk(chunk: KnowledgeChunk, tokens: string[]) {
  const haystack = `${chunk.title} ${chunk.excerpt} ${chunk.content}`.toLowerCase();
  return tokens.reduce((score, token) => {
    if (!haystack.includes(token)) {
      return score;
    }

    const titleBonus = chunk.title.toLowerCase().includes(token) ? 2 : 0;
    const excerptBonus = chunk.excerpt.toLowerCase().includes(token) ? 1 : 0;
    return score + 2 + titleBonus + excerptBonus;
  }, 0);
}

function uniqueSources(chunks: KnowledgeChunk[]) {
  const seen = new Set<string>();

  return chunks.flatMap((chunk) => {
    if (seen.has(chunk.url)) {
      return [];
    }

    seen.add(chunk.url);
    return [
      {
        url: chunk.url,
        title: chunk.title,
      },
    ];
  });
}

function isGenericSiteQuestion(question: string) {
  const normalized = question.toLowerCase();
  const keywords = [
    "このサイト",
    "このページ",
    "このサービス",
    "何のサイト",
    "何ができますか",
    "何ができる",
    "どうやって試す",
    "使い方",
    "概要",
    "説明",
    "特徴",
    "summary",
    "what is this",
    "about this site",
    "about this page",
  ];

  return keywords.some((keyword) => normalized.includes(keyword));
}

async function generateAnswer(question: string, context: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildFallbackAnswer(context);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "あなたはWebサイト埋め込み用のサポートチャットです。与えられたコンテキストだけを使って日本語で簡潔に回答してください。根拠が足りない場合は、わからないと正直に伝えてください。",
          },
          {
            role: "user",
            content: `質問:\n${question}\n\nコンテキスト:\n${context}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return buildFallbackAnswer(context);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();

    return content || buildFallbackAnswer(context);
  } catch {
    return buildFallbackAnswer(context);
  }
}

function buildFallbackAnswer(context: string) {
  if (context.toLowerCase().includes("threads tool")) {
    return [
      "このサイトは、URL をクロールして内容に答えるチャットウィジェットを試せるプロトタイプです。",
      "クロール、チャット回答、ウィジェット設定、埋め込みコードの再利用を確認できます。",
    ].join(" ");
  }

  const snippet = context
    .split("\n")
    .filter((line) => line.startsWith("Content:"))
    .map((line) => line.replace(/^Content:\s*/, ""))
    .join(" ")
    .slice(0, 220)
    .trim();

  return snippet ? `${snippet}...` : UNKNOWN_ANSWER;
}
