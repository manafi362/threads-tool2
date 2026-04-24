import "server-only";

import Stripe from "stripe";

import { getStripeEnv } from "./env";

export const PLAN_CATALOG = {
  starter: {
    id: "starter",
    name: "Starter",
    priceLabel: "¥4,980 / month",
    description: "小規模サイト向け。まずは1サイトで販売を始めたいときの基本プランです。",
    features: ["1サイトまで", "月3,000メッセージまで", "Google ログイン", "会話ログ確認"],
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceLabel: "¥12,800 / month",
    description: "複数案件や継続運用向け。より大きいトラフィックと提案に耐える上位プランです。",
    features: ["5サイトまで", "月20,000メッセージまで", "請求管理ポータル", "優先サポート"],
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
    limit: 1,
  });

  if (existing.data[0]) {
    return existing.data[0];
  }

  return stripe.customers.create({
    email,
    name: name || undefined,
  });
}

export async function getBillingOverview(email: string) {
  const stripe = getStripeServer();
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });
  const customer = customers.data[0] ?? null;

  if (!customer) {
    return {
      customer: null,
      subscriptions: [],
    };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    limit: 10,
    status: "all",
  });

  return {
    customer,
    subscriptions: subscriptions.data,
  };
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
