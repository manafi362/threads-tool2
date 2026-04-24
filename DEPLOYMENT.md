# Deployment Guide

このプロジェクトを `Vercel + Supabase + Stripe + OpenAI API` で本番公開するための手順です。
売る前の最短ルートに絞ってあります。

## 1. 必要なもの

- Node.js 20 以上
- GitHub リポジトリ
- Vercel アカウント
- Supabase アカウント
- Stripe アカウント
- Google Cloud アカウント
- OpenAI API キー

## 2. ローカル確認

```bash
npm install
npm run lint
npm run build
```

環境変数の不足確認:

```bash
npm run check:setup
```

## 3. Supabase 設定

### 3-1. プロジェクト作成

1. Supabase で新しい project を作成
2. `Project Settings -> API` から以下を取得
- `Project URL`
- `anon public key`

### 3-2. Google ログイン設定

1. Google Cloud で OAuth Client を作成
2. Application type は `Web application`
3. `Authorized JavaScript origins` に追加
- `http://localhost:3000`
- `https://YOUR_DOMAIN`

4. `Authorized redirect URIs` に Supabase の callback URL を追加
5. Supabase の `Authentication -> Providers -> Google` で Google を有効化

### 3-3. Redirect URL 設定

Supabase `Authentication -> URL Configuration`

- `Site URL`: `https://YOUR_DOMAIN`
- `Redirect URLs`
  - `http://localhost:3000/**`
  - `https://YOUR_DOMAIN/**`
  - `https://*-YOUR_VERCEL_TEAM.vercel.app/**`

## 4. Stripe 設定

### 4-1. Product / Price

Stripe Dashboard で recurring price を2つ作成:

- Starter monthly
- Growth monthly

### 4-2. Customer Portal

Stripe Dashboard で Customer Portal を有効化:

- Subscription management: ON
- Payment methods: ON
- Invoice history: ON
- Return URL: `https://YOUR_DOMAIN/account`

### 4-3. Webhook

Webhook endpoint:

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

イベント:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 5. 環境変数

### 5-1. `.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

STRIPE_SECRET_KEY=sk_live_or_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER_MONTHLY=price_xxx_starter
STRIPE_PRICE_GROWTH_MONTHLY=price_xxx_growth

OPENAI_API_KEY=sk-...
```

### 5-2. Vercel

Vercel Project Settings -> Environment Variables に同じ値を入れます。
`Production` と `Preview` の両方に設定してください。

## 6. デプロイ

### 6-1. Vercel Dashboard

1. `Add New -> Project`
2. GitHub リポジトリを import
3. Framework Preset は `Next.js`
4. Environment Variables を設定
5. `Deploy`

### 6-2. CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel
vercel --prod
```

## 7. 独自ドメイン

1. Vercel `Settings -> Domains`
2. `YOUR_DOMAIN` を追加
3. DNS を設定
4. `NEXT_PUBLIC_APP_URL` を `https://YOUR_DOMAIN` に更新

## 8. 公開前チェック

### ログイン

- `/login` から Google ログインできる
- `/dashboard` が未ログイン時に保護される
- `/account` が未ログイン時に保護される

### 課金

- `/account` から Checkout に遷移できる
- Billing Portal を開ける
- Webhook が 2xx を返す

### チャット

- `/site-guide` をクロールできる
- ウィジェットから質問して回答が返る
- `OPENAI_API_KEY` 設定時に回答品質が上がる

## 9. 最短の販売導線

1. `/site-guide` でデモを見せる
2. `/account` で料金プランを提示する
3. 顧客ごとにクロールURLとウィジェット文言を差し替える
4. 本番ドメインに埋め込みコードを設置する
5. Stripe で月額契約を開始する

## Official Docs

- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Vercel Domains: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Supabase Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Google Login: https://supabase.com/docs/guides/auth/social-login/auth-google
- Stripe Subscriptions with Checkout: https://docs.stripe.com/payments/subscriptions
- Stripe Customer Portal: https://docs.stripe.com/customer-management
