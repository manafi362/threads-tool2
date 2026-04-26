import { z } from "zod";

import {
  findOrCreateCustomer,
  getPriceIdForPlan,
  getStripeServer,
  isEligibleForStarterTrial,
  STARTER_TRIAL_DAYS,
} from "../../../../lib/billing";
import { requireApiUser } from "../../../../lib/auth";
import { checkRouteRateLimit } from "../../../../lib/route-rate-limit";
import { updateState } from "../../../../lib/store";
import { assertSameOrigin } from "../../../../lib/security";

const schema = z.object({
  plan: z.enum(["starter", "growth"]),
});

export async function POST(request: Request) {
  try {
    const rateLimited = checkRouteRateLimit(request, {
      name: "billing-checkout",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (rateLimited) {
      return rateLimited;
    }

    assertSameOrigin(request);
    const user = await requireApiUser();
    const payload = schema.parse(await request.json());

    if (!user.email) {
      return Response.json({ error: "ユーザーのメールアドレスが必要です。" }, { status: 400 });
    }

    const stripe = getStripeServer();
    const customer = await findOrCreateCustomer(user.email, user.user_metadata.full_name);
    const price = getPriceIdForPlan(payload.plan);
    const origin = new URL(request.url).origin;
    const starterTrialEligible =
      payload.plan === "starter" ? await isEligibleForStarterTrial(customer.id) : false;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/account?checkout=cancelled`,
      customer_update: {
        address: "auto",
        name: "auto",
      },
      metadata: {
        supabaseUserId: user.id,
        plan: payload.plan,
      },
      subscription_data: starterTrialEligible
        ? {
            trial_period_days: STARTER_TRIAL_DAYS,
          }
        : undefined,
    });

    await updateState(user.id, (current) => ({
      ...current,
      billing: {
        ...current.billing,
        email: user.email ?? null,
        customerId: customer.id,
        plan: payload.plan,
        lastCheckoutAt: new Date().toISOString(),
      },
    }));

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Checkout の作成に失敗しました。" },
      { status: 400 },
    );
  }
}
