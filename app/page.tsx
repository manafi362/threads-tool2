import Link from "next/link";

import { getOptionalUser } from "@/lib/auth";
import { PLAN_CATALOG } from "@/lib/billing";
import { hasStripeEnv, hasSupabaseEnv } from "@/lib/env";
import BillingButton from "./components/billing-button";
import GoogleSignIn from "./components/google-sign-in";

export default async function HomePage() {
  const user = await getOptionalUser();
  const stripeReady = hasStripeEnv();
  const authReady = hasSupabaseEnv();

  return (
    <main className="landing-shell">
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="hero-badge">URL-Based Chatbot SaaS</span>
          <h1>URLを登録するだけで、あなたのサイト専用チャットボットを公開できます。</h1>
          <p className="hero-lead">
            サイトURLを登録すると、その内容に沿って回答するチャットボットを作成できます。
            ログイン、課金、サイト所有確認、ウィジェット公開までをひとつの流れで進められます。
          </p>

          <div className="hero-actions">
            {user ? (
              <>
                <Link className="primary-button" href="/dashboard">
                  ダッシュボードを見る
                </Link>
                <Link className="secondary-button" href="/account">
                  アカウントを見る
                </Link>
              </>
            ) : authReady ? (
              <>
                <GoogleSignIn fullWidth={false} />
                <Link className="secondary-button" href="/login">
                  ログインページへ
                </Link>
              </>
            ) : (
              <>
                <Link className="primary-button" href="/login">
                  ログインを開始
                </Link>
                <Link className="secondary-button" href="#pricing">
                  料金プランを見る
                </Link>
              </>
            )}
          </div>

          <div className="metric-grid">
            <Metric title="認証" value="Googleログイン" />
            <Metric title="課金" value="Stripe決済" />
            <Metric title="公開" value="ウィジェット埋め込み" />
          </div>
        </div>

        <div className="hero-aside">
          <div className="setup-card">
            <h2>導入の流れ</h2>
            <ol>
              <li>Googleでログイン</li>
              <li>サイトURLを登録</li>
              <li>所有確認とクロール</li>
              <li>ウィジェットをサイトへ設置</li>
            </ol>
          </div>

          <div className="status-card">
            <h2>このサービスでできること</h2>
            <ReadinessRow
              title="サイト内容に沿った回答"
              detail="登録したURLの内容をもとに、サイト訪問者の質問へ答える専用チャットを公開できます。"
            />
            <ReadinessRow
              title="始めやすい料金プラン"
              detail="Starter は 14 日間の無料トライアル付きで、公開前の確認から始めやすい設計です。"
            />
            <ReadinessRow
              title="継続運用しやすい管理"
              detail="アカウント画面から契約状況を確認でき、Billing Portal で課金管理も行えます。"
            />
          </div>
        </div>
      </section>

      <section className="value-grid">
        <ValueCard
          title="サイト専用の回答"
          body="FAQだけでなく、登録したサイトの情報をもとにした案内チャットとして活用できます。"
        />
        <ValueCard
          title="導入と公開がシンプル"
          body="URL登録からチャットの確認、サイト埋め込みまでをひとつの流れで進められます。"
        />
        <ValueCard
          title="運用と見直しがしやすい"
          body="課金状況やクロール状態、保存された会話ログを見ながら改善を進められます。"
        />
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-copy">
          <span className="section-label">Pricing</span>
          <h2>導入規模に合わせて選べるシンプルな料金プラン</h2>
          <p>
            まずは無料トライアル付きの Starter から始めて、必要に応じて Growth に移行できます。
          </p>
          {!authReady ? (
            <p className="inline-note">
              ログイン開始には Supabase の認証設定が必要です。環境変数を設定してから確認してください。
            </p>
          ) : null}
        </div>

        <div className="plan-grid">
          {Object.values(PLAN_CATALOG).map((plan) => (
            <article className="plan-card" key={plan.id}>
              <div>
                <p className="plan-kicker">{plan.name.toUpperCase()}</p>
                <h3>{plan.priceLabel}</h3>
                {"trialLabel" in plan ? <p className="trial-chip">{plan.trialLabel}</p> : null}
                <p className="plan-description">{plan.description}</p>
              </div>
              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {user && stripeReady ? (
                <BillingButton
                  endpoint="/api/billing/checkout"
                  plan={plan.id}
                  label={`${plan.name}を始める`}
                />
              ) : user ? (
                <Link className="secondary-button" href="/account">
                  アカウント画面で設定する
                </Link>
              ) : (
                <Link className="secondary-button" href="/login">
                  ログインしてプランを見る
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="metric-card">
      <p>{title}</p>
      <strong>{value}</strong>
    </div>
  );
}

function ReadinessRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="status-row">
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <span>利用可能</span>
    </div>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="value-card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
