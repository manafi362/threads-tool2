import "server-only";

import Stripe from "stripe";

import { getStripeEnv } from "./env";
import type { BillingState, BillingStatus, PrototypeState } from "./prototype";
import { updateState } from "./store";

export const STARTER_TRIAL_DAYS = 14;

export const PLAN_CATALOG = {
  starter: {
    id: "starter",
    name: "Starter",
    priceLabel: "¥4,980 / 月",
    trialLabel: "14日間無料トライアル",
    description: "まずは1サイトで素早く始めたい方向けのスタータープランです。",
    features: ["1サイトまで", "月5,000メッセージまで", "Googleログイン", "会話ログ確認"],
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceLabel: "¥12,800 / 月",
    description: "複数サイトの運用や継続的な改善まで見据えた上位プランです。",
    features: ["5サイトまで", "月20,000メッセージまで", "Billing Portal", "優先サポート"],
  },
} as const;

export type PlanId = keyof typeof PLAN_CATALOG;

export function getStripeServer() {
  const { secretKey } = getStripeEnv();

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function findOrCreateCustomer(email: string, name?: string | null) {
  const stripe = getStripeServer();
  const existing = await stripe.customers.list({
    email,
    limit: 10,
  });

  const reusableCustomer = existing.data.find((customer) => !customer.deleted) ?? null;

  if (reusableCustomer) {
    return reusableCustomer;
  }

  return stripe.customers.create({
    email,
    name: name || undefined,
  });
}

type BillingLookupOptions = {
  customerId?: string | null;
  subscriptionId?: string | null;
};

export async function getBillingOverview(email: string, options?: BillingLookupOptions) {
  const stripe = getStripeServer();

  const directCustomer = options?.customerId
    ? await stripe.customers.retrieve(options.customerId).catch(() => null)
    : null;
  const customerFromId =
    directCustomer && !("deleted" in directCustomer && directCustomer.deleted) ? directCustomer : null;

  if (customerFromId) {
    return {
      customer: customerFromId,
      subscriptions: await listSubscriptionsForCustomer(
        stripe,
        customerFromId.id,
        options?.subscriptionId,
      ),
    };
  }

  const customers = await stripe.customers.list({
    email,
    limit: 10,
  });
  const rankedCustomers = customers.data.filter((customer) => !customer.deleted);

  for (const customer of rankedCustomers) {
    const subscriptions = await listSubscriptionsForCustomer(
      stripe,
      customer.id,
      options?.subscriptionId,
    );

    if (subscriptions.length > 0) {
      return {
        customer,
        subscriptions,
      };
    }
  }

  const customer = rankedCustomers[0] ?? null;

  if (!customer) {
    return {
      customer: null,
      subscriptions: [],
    };
  }

  const subscriptions = await listSubscriptionsForCustomer(
    stripe,
    customer.id,
    options?.subscriptionId,
  );

  return {
    customer,
    subscriptions,
  };
}

export async function syncBillingStateForUser(
  userId: string,
  email: string | null | undefined,
  fallbackState: PrototypeState,
) {
  if (!email) {
    return fallbackState;
  }

  try {
    const overview = await getBillingOverview(email, {
      customerId: fallbackState.billing.customerId,
      subscriptionId: fallbackState.billing.subscriptionId,
    });
    const nextBilling = toBillingState(overview.subscriptions, fallbackState.billing, email);

    if (isSameBillingState(fallbackState.billing, nextBilling)) {
      return fallbackState;
    }

    return await updateState(userId, (current) => ({
      ...current,
      billing: nextBilling,
    }));
  } catch {
    return fallbackState;
  }
}

async function listSubscriptionsForCustomer(
  stripe: Stripe,
  customerId: string,
  preferredSubscriptionId?: string | null,
) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 10,
    status: "all",
  });

  if (!preferredSubscriptionId) {
    return subscriptions.data;
  }

  const preferred = subscriptions.data.find(
    (subscription) => subscription.id === preferredSubscriptionId,
  );

  if (!preferred) {
    return subscriptions.data;
  }

  return [
    preferred,
    ...subscriptions.data.filter((subscription) => subscription.id !== preferredSubscriptionId),
  ];
}

export function getPriceIdForPlan(plan: PlanId) {
  const { starterPriceId, growthPriceId } = getStripeEnv();

  if (plan === "starter") {
    if (!starterPriceId) {
      throw new Error("STRIPE_PRICE_STARTER_MONTHLY is not configured.");
    }

    return starterPriceId;
  }

  if (!growthPriceId) {
    throw new Error("STRIPE_PRICE_GROWTH_MONTHLY is not configured.");
  }

  return growthPriceId;
}

export async function isEligibleForStarterTrial(customerId: string) {
  const stripe = getStripeServer();
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });

  return subscriptions.data.length === 0;
}

function toBillingState(
  subscriptions: Stripe.Subscription[],
  fallback: BillingState,
  email: string,
): BillingState {
  const subscription = pickPrimarySubscription(subscriptions);

  if (!subscription) {
    return {
      ...fallback,
      email,
      status: "inactive",
    };
  }

  return {
    ...fallback,
    email,
    customerId: typeof subscription.customer === "string" ? subscription.customer : fallback.customerId,
    subscriptionId: subscription.id,
    plan: subscription.metadata.plan || subscription.items.data[0]?.price?.id || fallback.plan,
    status: normalizeBillingStatus(subscription.status),
    currentPeriodEnd: toIsoDate(subscription.items.data[0]?.current_period_end ?? null),
  };
}

function pickPrimarySubscription(subscriptions: Stripe.Subscription[]) {
  return [...subscriptions].sort((left, right) => {
    const leftTime = left.items.data[0]?.current_period_end ?? 0;
    const rightTime = right.items.data[0]?.current_period_end ?? 0;
    return rightTime - leftTime;
  })[0] ?? null;
}

function normalizeBillingStatus(status: Stripe.Subscription.Status): BillingStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}

function toIsoDate(timestamp: number | null) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

function isSameBillingState(left: BillingState, right: BillingState) {
  return (
    left.email === right.email &&
    left.customerId === right.customerId &&
    left.subscriptionId === right.subscriptionId &&
    left.plan === right.plan &&
    left.status === right.status &&
    left.currentPeriodEnd === right.currentPeriodEnd
  );
}
