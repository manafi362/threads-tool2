import Stripe from "stripe";
import { headers } from "next/headers";

import { getStripeServer } from "../../../../lib/billing";
import { getStripeEnv } from "../../../../lib/env";
import { updateState } from "../../../../lib/store";
import type { BillingStatus } from "../../../../lib/prototype";

export async function POST(request: Request) {
  const stripe = getStripeServer();
  const { webhookSecret } = getStripeEnv();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !webhookSecret) {
    return new Response("Webhook is not configured.", { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await updateState((current) => ({
          ...current,
          billing: {
            ...current.billing,
            email: session.customer_details?.email ?? current.billing.email,
            customerId: typeof session.customer === "string" ? session.customer : current.billing.customerId,
            subscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : current.billing.subscriptionId,
            plan: session.metadata?.plan ?? current.billing.plan,
            lastWebhookEventId: event.id,
            lastWebhookAt: new Date().toISOString(),
          },
        }));
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const plan = subscription.items.data[0]?.price?.id ?? null;
        await updateState((current) => ({
          ...current,
          billing: {
            ...current.billing,
            customerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : current.billing.customerId,
            subscriptionId: subscription.id,
            plan: current.billing.plan ?? plan,
            status: normalizeBillingStatus(subscription.status),
            currentPeriodEnd: toIsoDate(subscription.items.data[0]?.current_period_end ?? null),
            lastWebhookEventId: event.id,
            lastWebhookAt: new Date().toISOString(),
          },
        }));
        break;
      }
      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Invalid webhook.", {
      status: 400,
    });
  }
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
