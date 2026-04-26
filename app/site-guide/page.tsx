import { headers } from "next/headers";
import Link from "next/link";
import Script from "next/script";

import { getOptionalUser } from "../../lib/auth";
import { readState } from "../../lib/store";

export const metadata = {
  title: "Site Guide | URLベース チャットボット",
  description:
    "URLベース チャットボット の役割、試し方、チャットで質問できる内容をまとめたテスト用ページです。",
};

export default async function SiteGuidePage() {
  const user = await getOptionalUser();
  const state = await readState(user?.id);
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : "http://127.0.0.1:3000";
  const pageUrl = `${origin}/site-guide`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(180deg,_#fcfffe_0%,_#eef6f4_55%,_#e8eef6_100%)] px-4 py-14">
      <section className="mx-auto max-w-5xl rounded-[36px] border border-white/70 bg-white/90 p-8 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <p className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
          Test URL
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          URLベース チャットボット を試すための説明ページ
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
          このページは、URLベース チャットボット がクロールして学習するためのサンプルURLです。
          サイトの説明を文章でまとめてあり、右下のチャットウィジェットからこの内容について質問できます。
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[30px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-2xl font-semibold text-slate-950">このサイトでできること</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>URL を入力して、ページの本文をクロールできます。</li>
              <li>クロールした内容をもとに、チャット形式で質問へ回答できます。</li>
              <li>チャットウィジェットの名前、色、初期メッセージ、表示位置を調整できます。</li>
              <li>生成された埋め込みコードを別サイトへ貼って、同じチャット体験を再利用できます。</li>
            </ul>
          </article>

          <article className="rounded-[30px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-2xl font-semibold text-slate-950">試し方</h2>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. ダッシュボードでこのページの URL をクロール対象にします。</li>
              <li>2. クロール完了後、プレビューか埋め込みウィジェットから質問します。</li>
              <li>3. たとえば「このサイトでできることは？」と聞くと概要を確認できます。</li>
              <li>4. 回答履歴はダッシュボード側にも保存されます。</li>
            </ol>
          </article>
        </div>

        <section className="mt-8 rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-950">このページで答えられる想定の質問</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              このサイトは何をするサービスですか？
            </p>
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              チャットウィジェットでは何を変更できますか？
            </p>
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              どうやって試せばいいですか？
            </p>
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              埋め込みコードはどこで使えますか？
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] bg-slate-950 px-6 py-5 text-slate-50">
          <p className="text-sm uppercase tracking-[0.22em] text-teal-300">Current Test URL</p>
          <p className="mt-3 break-all rounded-2xl bg-slate-900 px-4 py-3 font-mono text-sm text-emerald-200">
            {pageUrl}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              ダッシュボードを開く
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              ホームに戻る
            </Link>
          </div>
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
