import Link from "next/link";

import { getOptionalUser } from "../lib/auth";
import { PLAN_CATALOG } from "../lib/billing";
import { hasStripeEnv, hasSupabaseEnv } from "../lib/env";
import BillingButton from "./components/billing-button";
import GoogleSignIn from "./components/google-sign-in";

export default async function HomePage() {
  const user = await getOptionalUser();
  const hasAuth = hasSupabaseEnv();
  const hasBilling = hasStripeEnv();
  const canCharge = hasBilling && Boolean(user);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_35%),linear-gradient(180deg,_#f8fffd_0%,_#eef5f7_55%,_#edf2f7_100%)]">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            URLベース チャットボット SaaS
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            URLを登録するだけで、あなたのサイト専用チャットボットを公開できます。
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            URLクロール、チャット応答、Googleログイン、Stripe課金までをまとめた、サイトごとの導入に向いた
            チャットボット運用プラットフォームです。
          </p>

          {user ? (
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                ダッシュボードを見る
              </Link>
              <Link
                href="/account"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                プランを見る
              </Link>
            </div>
          ) : hasAuth ? (
            <div className="flex flex-wrap items-center gap-4">
              <GoogleSignIn next="/dashboard" fullWidth={false} />
              <Link
                href="/login"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                ログイン画面を開く
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                セットアップを確認する
              </Link>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="認証" value="Google OAuth" />
            <Metric label="課金" value="Stripe Checkout" />
            <Metric label="導入" value="Widget 埋め込み" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
            <div className="rounded-[28px] bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-teal-300">公開までの流れ</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
                <li>1. Supabase で Google ログインを有効にする</li>
                <li>2. Stripe で Product / Price / Webhook を設定する</li>
                <li>3. `npm run check:setup` で必要な環境変数を確認する</li>
                <li>4. Vercel にデプロイして公開ドメインへつなぐ</li>
              </ul>
            </div>
            <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">現在の準備状況</p>
              <div className="mt-4 grid gap-3">
                <ReadinessRow
                  label="ログイン"
                  ready={hasAuth}
                  readyText="Googleログインを利用できます。"
                  missingText="Supabase の認証設定がまだ未完了です。"
                />
                <ReadinessRow
                  label="課金"
                  ready={hasBilling}
                  readyText="Stripe のサブスク課金を利用できます。"
                  missingText="Stripe の Price / Secret / Webhook を設定してください。"
                />
                <ReadinessRow
                  label="デモURL"
                  ready
                  readyText="`/site-guide` から URL とチャットの流れを確認できます。"
                  missingText=""
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <ValueCard
            title="すぐ始められる導入"
            description="ログイン、URL登録、チャット設定、埋め込みまでがつながっているので、小さく試してから本番運用へ進めます。"
          />
          <ValueCard
            title="サブスク課金込み"
            description="Starter / Growth の料金プランを用意済みで、Stripe Checkout と Billing Portal から継続課金に進めます。"
          />
          <ValueCard
            title="デモのまま説明しやすい"
            description="`/site-guide` を使えば、URLを登録してチャットが使える流れをその場で見せられます。"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">料金プラン</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              そのまま公開に使える価格設計
            </h2>
          </div>
          {!hasAuth ? (
            <p className="text-sm text-amber-700">
              先に Supabase を設定すると、ログイン付きで課金テストできます。
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {Object.values(PLAN_CATALOG).map((plan) => (
            <article
              key={plan.id}
              className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.06)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">{plan.name}</p>
              {"trialLabel" in plan ? (
                <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {plan.trialLabel}
                </p>
              ) : null}
              <h3 className="mt-3 text-3xl font-semibold text-slate-950">{plan.priceLabel}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm leading-7 text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature}>・ {feature}</li>
                ))}
              </ul>
              <div className="mt-6">
                {canCharge ? (
                  <BillingButton endpoint="/api/billing/checkout" plan={plan.id} label={`${plan.name} を始める`} />
                ) : (
                  <Link
                    href={user ? "/account" : "/login"}
                    className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
                  >
                    {user ? "アカウント画面で設定する" : "ログインして課金テストを始める"}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/75 px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ReadinessRow({
  label,
  ready,
  readyText,
  missingText,
}: {
  label: string;
  ready: boolean;
  readyText: string;
  missingText: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {ready ? "準備完了" : "設定が必要"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{ready ? readyText : missingText}</p>
    </div>
  );
}

function ValueCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <h3 className="text-2xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </article>
  );
}
