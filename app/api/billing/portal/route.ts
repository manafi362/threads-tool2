import { findOrCreateCustomer, getStripeServer } from "../../../../lib/billing";
import { requireApiUser } from "../../../../lib/auth";
import { assertSameOrigin } from "../../../../lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();

    if (!user.email) {
      return Response.json({ error: "ユーザーのメールアドレスが必要です。" }, { status: 400 });
    }

    const stripe = getStripeServer();
    const customer = await findOrCreateCustomer(user.email, user.user_metadata.full_name);
    const origin = new URL(request.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/account`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Billing Portal の作成に失敗しました。" },
      { status: 400 },
    );
  }
}
