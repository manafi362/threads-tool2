import Link from "next/link";

import { getOptionalUser } from "@/lib/auth";
import { PLAN_CATALOG } from "@/lib/billing";
import { hasStripeEnv, hasSupabaseEnv } from "@/lib/env";
import {
  buildPageMetadata,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/site-config";
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
          <h1>URLを入れるだけで、RAG対応の自社サイト専用AIチャットを公開。</h1>
          <p className="hero-lead">
            公開中のWebサイトを取り込み、RAGで内容に沿って回答するAIチャットを最短数分で設置できます。
            FAQを一から作らなくても、既存サイトにコードを1つ追加するだけで始められます。
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
                <Link className="secondary-button" href="/site-guide">
                  デモを見る
                </Link>
              </>
            ) : (
              <>
                <Link className="primary-button" href="/login">
                  無料で試す
                </Link>
                <Link className="secondary-button" href="/site-guide">
                  デモを見る
                </Link>
              </>
            )}
          </div>

          <div className="metric-grid">
            <Metric title="導入" value="最短3分" />
            <Metric title="設置" value="1タグで埋め込み" />
            <Metric title="公開" value="サイト所有確認つき" />
          </div>
        </div>

        <div className="hero-aside">
          <div className="setup-card">
            <h2>3ステップで公開できます</h2>
            <ol>
              <li>1. URLを登録してサイト所有確認</li>
              <li>2. クロールしてRAGコンテキストを作成</li>
              <li>3. 埋め込みコードを設置して公開</li>
            </ol>
            <p className="hero-lead">
              デモページでは、RAGでサイト内容を回答する流れと、実際の埋め込みイメージをそのまま確認できます。
            </p>
            <div className="hero-actions">
              <Link className="secondary-button" href="/site-guide">
                デモページを見る
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="value-grid">
        <ValueCard
          title="URL登録だけでRAG対応"
          body="公開ページを取り込み、回答の土台になるRAGコンテキストを自動で作成します。"
        />
        <ValueCard
          title="既存サイトに後付け"
          body="サイトを作り直さなくても、埋め込みコードを1つ追加するだけで設置できます。"
        />
        <ValueCard
          title="運用しながら改善"
          body="会話ログの確認と再クロールで、回答精度を継続的に改善できます。"
        />
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-copy">
          <span className="section-label">Pricing</span>
          <h2>小さく始めて、必要に応じて拡張できる料金プラン</h2>
          <p>
            まずはStarterで1サイトから導入し、複数案件や複数サイトの運用が必要になったらGrowthへ移行できます。
          </p>
        </div>

        <div className="plan-grid">
          {Object.values(PLAN_CATALOG).map((plan) => (
            <article className="plan-card" key={plan.id}>
              <div>
                <p className="plan-kicker">{plan.name.toUpperCase()}</p>
                <h3>{plan.priceLabel}</h3>
                {"trialLabel" in plan ? <p className="trial-chip">{plan.trialLabel}</p> : null}
                <p className="plan-description">
                  {plan.id === "starter"
                    ? "まずは1サイトで試したい方向けのプランです。自社サイトへの初回導入や、小規模サイトでの運用に向いています。"
                    : "複数サイトの運用や、本格活用を想定したプランです。制作会社や複数案件の運用にも向いています。"}
                </p>
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
                  label={plan.id === "starter" ? "Starterで始める" : "Growthを選ぶ"}
                />
              ) : user ? (
                <Link className="secondary-button" href="/account">
                  アカウントで設定する
                </Link>
              ) : (
                <Link className="secondary-button" href="/login">
                  無料で試す
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

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="value-card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
