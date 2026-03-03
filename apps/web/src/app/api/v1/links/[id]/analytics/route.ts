import { NextRequest, NextResponse } from "next/server";
import { db, links, linkClicks } from "@shortkit/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { authenticateRequest } from "@/lib/api-auth";
import { isProFeature } from "@/lib/tier";
import { analyticsQuerySchema } from "@/lib/validation";

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
  const link = await db.query.links.findFirst({
    where: and(eq(links.id, id), eq(links.workspaceId, authResult.workspaceId)),
    columns: { id: true },
  });

  if (!link) {
    return NextResponse.json(
      { status: "fail", message: "Link not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = analyticsQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "fail", message: "Invalid query", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  const { period } = parsed.data;
  const now = new Date();
  let sinceDate: Date | null = null;

  if (period === "7d") {
    sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30d") {
    sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const clickFilter = sinceDate
    ? and(eq(linkClicks.linkId, id), gte(linkClicks.clickedAt, sinceDate))
    : eq(linkClicks.linkId, id);

  // Total clicks
  const [totalResult] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(linkClicks)
    .where(clickFilter);

  // Unique clicks
  const [uniqueResult] = await db
    .select({
      value: sql<number>`count(distinct ${linkClicks.ipHash})::int`,
    })
    .from(linkClicks)
    .where(clickFilter);

  // Clicks today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const [todayResult] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(linkClicks)
    .where(
      and(eq(linkClicks.linkId, id), gte(linkClicks.clickedAt, todayStart))
    );

  // Clicks last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [last7dResult] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(linkClicks)
    .where(
      and(eq(linkClicks.linkId, id), gte(linkClicks.clickedAt, sevenDaysAgo))
    );

  // Daily series (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailySeries = await db
    .select({
      date: sql<string>`to_char(${linkClicks.clickedAt}, 'YYYY-MM-DD')`,
      clicks: sql<number>`count(*)::int`,
    })
    .from(linkClicks)
    .where(
      and(
        eq(linkClicks.linkId, id),
        gte(linkClicks.clickedAt, thirtyDaysAgo)
      )
    )
    .groupBy(sql`to_char(${linkClicks.clickedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${linkClicks.clickedAt}, 'YYYY-MM-DD')`);

  const response: Record<string, unknown> = {
    totalClicks: totalResult?.value ?? 0,
    uniqueClicks: uniqueResult?.value ?? 0,
    clicksToday: todayResult?.value ?? 0,
    clicksLast7d: last7dResult?.value ?? 0,
    dailySeries,
  };

  // Pro-only: geo + referrer data
  const isPro = await isProFeature(authResult.workspaceId);
  if (isPro) {
    const topCountries = await db
      .select({
        country: linkClicks.country,
        clicks: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(and(clickFilter, sql`${linkClicks.country} IS NOT NULL`))
      .groupBy(linkClicks.country)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    const topReferrers = await db
      .select({
        referrer: linkClicks.referer,
        clicks: sql<number>`count(*)::int`,
      })
      .from(linkClicks)
      .where(and(clickFilter, sql`${linkClicks.referer} IS NOT NULL`))
      .groupBy(linkClicks.referer)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    response.topCountries = topCountries;
    response.topReferrers = topReferrers;
  }

  return NextResponse.json({ status: "success", data: response });
}
