import { headers } from "next/headers";
import Script from "next/script";

import { getOptionalUser } from "../../lib/auth";
import { readState } from "../../lib/store";

export const metadata = {
  title: "URLベース チャットボット Demo Site",
  description: "URLベース チャットボット の説明文と埋め込みチャットボットを確認できる試験用ページです。",
};

export default async function DemoSitePage() {
  const user = await getOptionalUser();
  const state = await readState(user?.id);
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : "http://127.0.0.1:3000";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fcfffe_0%,_#edf6f3_100%)] px-4 py-14">
      <section className="mx-auto max-w-5xl rounded-[36px] border border-white/70 bg-white/90 p-8 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <p className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
          Demo Site For Crawling
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950">
          URLベース チャットボット は、URL を登録するだけでサイト専用のチャットボットを作れる SaaS です
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
          サイト運営者は URL を登録してクロールを実行し、取得したページ内容をもとに回答するチャットボットを
          自分のサイトへ埋め込めます。Google ログイン、Stripe 課金、管理ダッシュボード、
          会話ログ確認、ウィジェット位置調整に対応しています。
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[30px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-2xl font-semibold text-slate-950">このサービスでできること</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>• URL を入力してサイトをクロールし、チャット回答の材料を集める</li>
              <li>• ウィジェットの表示名、色、初回メッセージ、設置位置を調整する</li>
              <li>• script タグを 1 行貼るだけでサイトにチャットボットを設置する</li>
              <li>• 会話ログを管理画面で確認し、改善に活用する</li>
            </ul>
          </article>

          <article className="rounded-[30px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-2xl font-semibold text-slate-950">試験用の質問例</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>• このサービスは何ができますか？</li>
              <li>• Google ログインには対応していますか？</li>
              <li>• 決済には何を使いますか？</li>
              <li>• 会話ログは確認できますか？</li>
            </ul>
          </article>
        </div>

        <section className="mt-8 rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-950">このページの使い方</h2>
          <ol className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
            <li>1. 管理画面でこの URL をクロール対象に指定する</li>
            <li>2. クロール後、このページ右下のチャットを開く</li>
            <li>3. 上の質問例を投げて、ページ内容に沿って答えるか確認する</li>
          </ol>
          <p className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 font-mono text-xs text-emerald-200">
            {origin}/demo-site
          </p>
        </section>
      </section>

      <Script
        src={`${origin}/widget.js`}
        strategy="afterInteractive"
        data-token={state.tenantToken}
        data-name={state.widget.displayName}
        data-position={state.widget.positionPreset}
        data-x={String(state.widget.x)}
        data-y={String(state.widget.y)}
        data-color={state.widget.accentColor}
        data-welcome={state.widget.welcomeMessage}
      />
    </main>
  );
}
