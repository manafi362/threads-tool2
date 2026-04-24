# Stripe setup

This app expects four Stripe environment variables in `.env.local`.

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_GROWTH_MONTHLY=
```

## 1. Secret key

Open Stripe Dashboard:

`Developers -> API keys`

Copy:

- `Secret key` -> `STRIPE_SECRET_KEY`

For local development, use the test key that starts with `sk_test_`.

## 2. Products and prices

Open Stripe Dashboard:

`Product catalog`

Create two recurring monthly prices:

- Starter monthly
- Growth monthly

For each price, copy the price id that starts with `price_`.

Map them like this:

- Starter monthly -> `STRIPE_PRICE_STARTER_MONTHLY`
- Growth monthly -> `STRIPE_PRICE_GROWTH_MONTHLY`

## 3. Billing portal

Open Stripe Dashboard:

`Settings -> Billing -> Customer portal`

Turn on at least:

- Subscription management
- Payment methods
- Invoice history

Set the return URL to:

- Local: `http://localhost:3000/account`
- Production: `https://YOUR_DOMAIN/account`

## 4. Webhook

Create a webhook endpoint:

- Local with Stripe CLI: `http://localhost:3000/api/stripe/webhook`
- Production: `https://YOUR_DOMAIN/api/stripe/webhook`

Subscribe these events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the signing secret that starts with `whsec_` into:

- `STRIPE_WEBHOOK_SECRET`

## 5. Local webhook option with Stripe CLI

If you use the Stripe CLI, run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then copy the printed `whsec_...` value into `.env.local`.

## 6. Validate

Run:

```bash
npm run check:setup
```

When Stripe is configured correctly, the remaining missing items should no longer include the four Stripe variables.
