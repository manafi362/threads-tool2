import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("受け取ったデータ:", body);

   const { input, tone } = body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
`
  },
  {
    role: "user",
    content: input,
  },
],
      }),
    });

    const data = await response.json();
    console.log("OpenAIレスポンス:", data);

    if (data.error) {
  return NextResponse.json({
    error: data.error.message
  });
}

return NextResponse.json({
  result: data.choices[0].message.content
});

  } catch (error) {
    console.error("エラー詳細:", error);
    return NextResponse.json(
      { error: "サーバーエラー発生" },
      { status: 500 }
    );
  }
}