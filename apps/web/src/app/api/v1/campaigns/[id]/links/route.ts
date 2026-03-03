import { NextRequest, NextResponse } from "next/server";
import { db, campaigns, linkCampaigns, links } from "@shortkit/db";
import { eq, and, sql } from "drizzle-orm";
import { authenticateRequest } from "@/lib/api-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  // IDOR check
  const campaign = await db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.id, id),
      eq(campaigns.workspaceId, authResult.workspaceId)
    ),
    columns: { id: true },
  });

  if (!campaign) {
    return NextResponse.json(
      { status: "fail", message: "Campaign not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const results = await db
    .select({
      id: links.id,
      slug: links.slug,
      destinationUrl: links.destinationUrl,
      title: links.title,
      clickCount: links.clickCount,
      isActive: links.isActive,
      createdAt: links.createdAt,
    })
    .from(linkCampaigns)
    .innerJoin(links, eq(linkCampaigns.linkId, links.id))
    .where(eq(linkCampaigns.campaignId, id));

  return NextResponse.json({ status: "success", data: results });
}
