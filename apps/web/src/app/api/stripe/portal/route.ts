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
    columns: { stripeCustomerId: true },
  });

  if (!workspace?.stripeCustomerId) {
    return NextResponse.json(
      { status: "fail", message: "No billing account found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${baseUrl}/dashboard/billing`,
  });

  return NextResponse.json({
    status: "success",
    data: { url: portalSession.url },
  });
}
