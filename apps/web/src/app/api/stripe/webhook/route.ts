import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db, workspaces, subscriptions } from "@shortkit/db";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const item = sub.items?.data?.[0];
  if (item?.current_period_end) {
    return new Date(item.current_period_end * 1000);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { status: "fail", message: "Missing signature" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { status: "fail", message: "Webhook not configured" },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { status: "fail", message: "Invalid signature" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId) break;

      await db
        .update(workspaces)
        .set({ plan: "pro" })
        .where(eq(workspaces.id, workspaceId));

      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const periodEnd = getPeriodEnd(sub);
        await db
          .insert(subscriptions)
          .values({
            workspaceId,
            stripeSubscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: periodEnd,
          })
          .onConflictDoUpdate({
            target: subscriptions.workspaceId,
            set: {
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: periodEnd,
            },
          });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.stripeCustomerId, customerId),
        columns: { id: true },
      });

      if (workspace) {
        const plan = sub.status === "active" ? "pro" : "free";
        const periodEnd = getPeriodEnd(sub);
        await db
          .update(workspaces)
          .set({ plan })
          .where(eq(workspaces.id, workspace.id));

        await db
          .insert(subscriptions)
          .values({
            workspaceId: workspace.id,
            stripeSubscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: periodEnd,
          })
          .onConflictDoUpdate({
            target: subscriptions.workspaceId,
            set: {
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: periodEnd,
            },
          });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.stripeCustomerId, customerId),
        columns: { id: true },
      });

      if (workspace) {
        await db
          .update(workspaces)
          .set({ plan: "free" })
          .where(eq(workspaces.id, workspace.id));

        await db
          .update(subscriptions)
          .set({ status: "canceled" })
          .where(eq(subscriptions.workspaceId, workspace.id));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
