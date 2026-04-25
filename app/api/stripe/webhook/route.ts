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
        await safelyUpdatePrototypeState(() => ({
          billingPatch: {
            email: session.customer_details?.email ?? null,
            customerId: typeof session.customer === "string" ? session.customer : null,
            subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
            plan: session.metadata?.plan ?? null,
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
        await safelyUpdatePrototypeState(() => ({
          billingPatch: {
            customerId: typeof subscription.customer === "string" ? subscription.customer : null,
            subscriptionId: subscription.id,
            plan,
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

async function safelyUpdatePrototypeState(
  getPatch: () => {
    billingPatch: {
      email?: string | null;
      customerId?: string | null;
      subscriptionId?: string | null;
      plan?: string | null;
      status?: BillingStatus;
      currentPeriodEnd?: string | null;
      lastWebhookEventId?: string | null;
      lastWebhookAt?: string | null;
    };
  },
) {
  try {
    const { billingPatch } = getPatch();

    await updateState((current) => ({
      ...current,
      billing: {
        ...current.billing,
        ...Object.fromEntries(
          Object.entries(billingPatch).filter(([, value]) => value !== null && value !== undefined),
        ),
        email: billingPatch.email ?? current.billing.email,
        customerId: billingPatch.customerId ?? current.billing.customerId,
        subscriptionId: billingPatch.subscriptionId ?? current.billing.subscriptionId,
        plan: billingPatch.plan ?? current.billing.plan,
        status: billingPatch.status ?? current.billing.status,
        currentPeriodEnd: billingPatch.currentPeriodEnd ?? current.billing.currentPeriodEnd,
        lastWebhookEventId: billingPatch.lastWebhookEventId ?? current.billing.lastWebhookEventId,
        lastWebhookAt: billingPatch.lastWebhookAt ?? current.billing.lastWebhookAt,
      },
    }));
  } catch (error) {
    if (isReadonlyFilesystemError(error)) {
      return;
    }

    throw error;
  }
}

function isReadonlyFilesystemError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "EROFS" || error.code === "EPERM" || error.code === "EACCES")
  );
}
