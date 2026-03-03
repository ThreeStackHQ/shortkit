import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { db, workspaces } from "@shortkit/db";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.ownerId, session.user.id),
  });

  if (!workspace) {
    return NextResponse.json(
      { status: "fail", message: "Workspace not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { status: "fail", message: "Stripe not configured", code: "CONFIG_ERROR" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Create or retrieve Stripe customer
  let customerId = workspace.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: { workspaceId: workspace.id },
    });
    customerId = customer.id;
    await db
      .update(workspaces)
      .set({ stripeCustomerId: customerId })
      .where(eq(workspaces.id, workspace.id));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/dashboard/billing`,
    metadata: { workspaceId: workspace.id },
  });

  return NextResponse.json({
    status: "success",
    data: { url: checkoutSession.url },
  });
}
