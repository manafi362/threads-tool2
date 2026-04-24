import Link from "next/link";

import { getAppUrl, getStripeEnv, getSupabaseEnv, hasStripeEnv, hasSupabaseEnv } from "../../lib/env";

export const metadata = {
  title: "Setup | URLベース チャットボット",
  description: "本番公開前に必要な環境変数と外部サービス設定を確認するページです。",
};

export default function SetupPage() {
  const appUrl = getAppUrl();
  const supabase = getSupabaseEnv();
  const stripe = getStripeEnv();
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim());

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f9fffe_0%,_#edf4f7_100%)] px-4 py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Setup Checklist</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            本番公開前のセットアップ確認
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Supabase、Stripe、OpenAI、アプリURLの設定状況をここで確認できます。
            実キーを入れたら、このページを見ながらログイン、課金、チャットを順に確認するとスムーズです。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              ログイン導線を確認
            </Link>
            <Link
              href="/account"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              課金導線を確認
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <SetupCard
            title="App URL"
            ready={Boolean(appUrl)}
            detail={appUrl ?? "NEXT_PUBLIC_APP_URL が未設定です"}
          />
          <SetupCard
            title="Supabase"
            ready={hasSupabaseEnv()}
            detail={
              hasSupabaseEnv()
                ? "Google ログインを有効化できます"
                : "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です"
            }
          />
          <SetupCard
            title="Stripe"
            ready={hasStripeEnv()}
            detail={
              hasStripeEnv()
                ? "Checkout と Billing Portal を利用できます"
                : "Stripe Secret / Webhook / Price ID が不足しています"
            }
          />
          <SetupCard
            title="OpenAI"
            ready={hasOpenAi}
            detail={hasOpenAi ? "高品質な回答生成を有効化できます" : "OPENAI_API_KEY が未設定です"}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold text-slate-950">環境変数の確認</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
              <EnvRow name="NEXT_PUBLIC_APP_URL" ready={Boolean(appUrl)} />
              <EnvRow name="NEXT_PUBLIC_SUPABASE_URL" ready={Boolean(supabase.url)} />
              <EnvRow name="NEXT_PUBLIC_SUPABASE_ANON_KEY" ready={Boolean(supabase.anonKey)} />
              <EnvRow name="STRIPE_SECRET_KEY" ready={Boolean(stripe.secretKey)} />
              <EnvRow name="STRIPE_WEBHOOK_SECRET" ready={Boolean(stripe.webhookSecret)} />
              <EnvRow name="STRIPE_PRICE_STARTER_MONTHLY" ready={Boolean(stripe.starterPriceId)} />
              <EnvRow name="STRIPE_PRICE_GROWTH_MONTHLY" ready={Boolean(stripe.growthPriceId)} />
              <EnvRow name="OPENAI_API_KEY" ready={hasOpenAi} />
            </div>
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold text-slate-950">次の手順</h2>
            <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. `.env.local` に Supabase / Stripe / OpenAI の実値を入力する</li>
              <li>2. Supabase で Google Provider を有効化する</li>
              <li>3. Stripe で Product / Price / Webhook / Billing Portal を設定する</li>
              <li>4. `npm run check:setup` を実行する</li>
              <li>5. `/login` で Google ログインを確認する</li>
              <li>6. `/account` から Checkout を開いて課金導線を確認する</li>
              <li>7. `/dashboard` と `/site-guide` でクロールとチャットを確認する</li>
            </ol>
            <div className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 font-mono text-xs text-emerald-200">
              npm run check:setup
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function SetupCard({
  title,
  ready,
  detail,
}: {
  title: string;
  ready: boolean;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">{title}</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {ready ? "Ready" : "Missing"}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{detail}</p>
    </article>
  );
}

function EnvRow({ name, ready }: { name: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <code className="text-xs text-slate-800">{name}</code>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        {ready ? "OK" : "Unset"}
      </span>
    </div>
  );
}
