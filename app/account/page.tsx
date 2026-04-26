import BillingButton from "../components/billing-button";
import { requireUser } from "../../lib/auth";
import { getBillingOverview, PLAN_CATALOG } from "../../lib/billing";
import { hasStripeEnv } from "../../lib/env";
import { readState } from "../../lib/store";

export const metadata = {
  title: "アカウント | URLベース チャットボット",
  description: "料金プラン、契約状況、Billing Portal を確認できるアカウント画面です。",
};

export default async function AccountPage() {
  const user = await requireUser();
  const prototypeState = await readState(user.id);
  const overview = hasStripeEnv() && user.email ? await getBillingOverview(user.email) : null;
  const subscriptions = overview?.subscriptions ?? [];
  const billing = prototypeState.billing;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f9fffe_0%,_#edf4f7_100%)] px-4 py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-medium text-teal-700">ログイン中: {user.email}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            料金プランと課金管理
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            ここからプランを開始し、Stripe Billing Portal で契約内容や支払い方法を管理できます。
            Webhook と同期された最新の状態もこのページで確認できます。
          </p>
        </section>

        {!hasStripeEnv() ? (
          <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
            Stripe の環境変数がまだ設定されていません。
            `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、
            `STRIPE_PRICE_STARTER_MONTHLY`、`STRIPE_PRICE_GROWTH_MONTHLY`
            を設定すると本番課金を利用できます。
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-3">
          <StatusCard label="選択中プラン" value={billing.plan ?? "未設定"} />
          <StatusCard label="Webhook ステータス" value={billing.status} />
          <StatusCard
            label="次回更新日"
            value={billing.currentPeriodEnd ? formatDate(billing.currentPeriodEnd) : "未同期"}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {Object.values(PLAN_CATALOG).map((plan) => (
            <article
              key={plan.id}
              className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                {plan.name}
              </p>
              {"trialLabel" in plan ? (
                <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {plan.trialLabel}
                </p>
              ) : null}
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">{plan.priceLabel}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm leading-7 text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature}>・ {feature}</li>
                ))}
              </ul>
              <div className="mt-6">
                <BillingButton
                  endpoint="/api/billing/checkout"
                  plan={plan.id}
                  label={`${plan.name} を始める`}
                />
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">現在の契約情報</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Stripe 上の契約状況を表示します。請求情報の更新、解約、支払い方法の変更は
                Billing Portal から行えます。
              </p>
            </div>
            {hasStripeEnv() ? (
              <BillingButton
                endpoint="/api/billing/portal"
                label="Billing Portal を開く"
                variant="secondary"
              />
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            {subscriptions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                まだ契約情報はありません。上のプランから Checkout を開始すると、ここに最新状態が表示されます。
              </p>
            ) : (
              subscriptions.map((subscription) => (
                <article key={subscription.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{subscription.id}</p>
                  <p className="mt-2 text-sm text-slate-600">状態: {subscription.status}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    次回更新日:{" "}
                    {subscription.items.data[0]?.current_period_end
                      ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(
                          new Date(subscription.items.data[0].current_period_end * 1000),
                        )
                      : "未設定"}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-950">{value}</p>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
