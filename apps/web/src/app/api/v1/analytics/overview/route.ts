import { NextRequest, NextResponse } from "next/server";
import { db, links, linkClicks } from "@shortkit/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Total links
  const [totalLinks] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(links)
    .where(eq(links.workspaceId, authResult.workspaceId));

  // Get all link IDs for this workspace
  const workspaceLinks = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.workspaceId, authResult.workspaceId));

  const linkIds = workspaceLinks.map((l) => l.id);

  if (linkIds.length === 0) {
    return NextResponse.json({
      status: "success",
      data: {
        totalLinks: 0,
        totalClicks: 0,
        totalUniqueClicks: 0,
        clicksLast30d: 0,
      },
    });
  }

  // Total clicks across all workspace links
  const [totalClicks] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(linkClicks)
    .where(sql`${linkClicks.linkId} IN ${linkIds}`);

  // Total unique clicks
  const [totalUniqueClicks] = await db
    .select({
      value: sql<number>`count(distinct ${linkClicks.ipHash})::int`,
    })
    .from(linkClicks)
    .where(sql`${linkClicks.linkId} IN ${linkIds}`);

  // Clicks last 30 days
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  );
  const [clicksLast30d] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(linkClicks)
    .where(
      and(
        sql`${linkClicks.linkId} IN ${linkIds}`,
        gte(linkClicks.clickedAt, thirtyDaysAgo)
      )
    );

  return NextResponse.json({
    status: "success",
    data: {
      totalLinks: totalLinks?.value ?? 0,
      totalClicks: totalClicks?.value ?? 0,
      totalUniqueClicks: totalUniqueClicks?.value ?? 0,
      clicksLast30d: clicksLast30d?.value ?? 0,
    },
  });
}
