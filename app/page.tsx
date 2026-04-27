import Link from "next/link";

import { getOptionalUser } from "@/lib/auth";
import { PLAN_CATALOG } from "@/lib/billing";
import { hasStripeEnv, hasSupabaseEnv } from "@/lib/env";
import { buildPageMetadata, getSiteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site-config";
import BillingButton from "./components/billing-button";
import GoogleSignIn from "./components/google-sign-in";

export const metadata = buildPageMetadata({
  title: `${SITE_NAME} | ${SITE_TITLE}`,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  const user = await getOptionalUser();
  const stripeReady = hasStripeEnv();
  const authReady = hasSupabaseEnv();
  const siteUrl = getSiteUrl();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "ja",
    url: siteUrl,
    description: SITE_DESCRIPTION,
    offers: [
      {
        "@type": "Offer",
        name: PLAN_CATALOG.starter.name,
        price: "4980",
        priceCurrency: "JPY",
      },
      {
        "@type": "Offer",
        name: PLAN_CATALOG.growth.name,
        price: "12800",
        priceCurrency: "JPY",
      },
    ],
  };

  return (
    <main className="landing-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="hero-grid">
        <div className="hero-copy">
          <span className="hero-badge">URL-Based Chatbot SaaS</span>
          <h1>URLを登録するだけで、サイト専用チャットボットを公開できます。</h1>
          <p className="hero-lead">
            サイト制作者だけが所有確認を通したうえでチャットボットを設置し、訪問者はその内容に沿って質問できます。
            URL登録、所有確認、クロール、埋め込みコード発行、課金管理までをひとつの管理画面で進められます。
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
                  ログインして始める
                </Link>
                <Link className="secondary-button" href="#pricing">
                  料金プランを見る
                </Link>
              </>
            )}
          </div>

          <div className="metric-grid">
            <Metric title="認証" value="Googleログイン" />
            <Metric title="課金" value="Stripe連携" />
            <Metric title="公開" value="埋め込みコード発行" />
          </div>
        </div>

        <div className="hero-aside">
          <div className="setup-card">
            <h2>導入の流れ</h2>
            <ol>
              <li>Googleでログイン</li>
              <li>サイトURLを登録</li>
              <li>所有確認とクロール</li>
              <li>埋め込みコードを設置</li>
            </ol>
          </div>

          <div className="status-card">
            <h2>このサービスでできること</h2>
            <ReadinessRow
              title="サイト内容に沿った回答"
              detail="登録したURLの内容をもとに、FAQだけでなくサイト専用の案内チャットとして活用できます。"
            />
            <ReadinessRow
              title="所有確認つきの公開"
              detail="対象サイトの所有確認が終わったユーザーだけが、公開用の埋め込みコードを取得できます。"
            />
            <ReadinessRow
              title="課金と運用を一元管理"
              detail="アカウント画面から無料トライアル、契約状況の確認、Billing Portal での管理まで行えます。"
            />
          </div>
        </div>
      </section>

      <section className="value-grid">
        <ValueCard
          title="サイト制作者だけが公開可能"
          body="所有確認トークンを対象サイトへ設置できた場合だけ、公開チャットボットの利用とクロールを許可します。"
        />
        <ValueCard
          title="安全確認つきのクロール"
          body="危険URL判定、内部ネットワーク遮断、危険な拡張子や管理系パスの拒否など、公開前提の安全対策を組み込んでいます。"
        />
        <ValueCard
          title="運用しやすい管理画面"
          body="クロール状況、所有確認、チャットプレビュー、埋め込みコード、課金状態をひとつの画面で確認できます。"
        />
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-copy">
          <span className="section-label">Pricing</span>
          <h2>公開前の検証から運用開始まで進めやすい料金プラン</h2>
          <p>
            まずは無料トライアル付きの Starter から始めて、複数サイト運用や継続改善が必要になったら Growth に移行できます。
          </p>
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
