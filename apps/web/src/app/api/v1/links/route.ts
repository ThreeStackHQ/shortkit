import { NextRequest, NextResponse } from "next/server";
import { db, links, campaigns, linkCampaigns } from "@shortkit/db";
import { eq, and, desc, lt, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import { authenticateRequest } from "@/lib/api-auth";
import { canCreateLink } from "@/lib/tier";
import { createLinkSchema, paginationSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const body: unknown = await req.json();
  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }

  const { destination, title, expiresAt, maxClicks, password, campaignId } =
    parsed.data;
  let { slug } = parsed.data;

  const allowed = await canCreateLink(authResult.workspaceId);
  if (!allowed) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Free plan limit: 50 active links. Upgrade to Pro.",
        code: "PLAN_LIMIT",
      },
      { status: 403 }
    );
  }

  // Generate or validate slug
  if (!slug) {
    slug = nanoid(6);
  } else {
    const existing = await db.query.links.findFirst({
      where: and(
        eq(links.workspaceId, authResult.workspaceId),
        eq(links.slug, slug)
      ),
    });
    if (existing) {
      return NextResponse.json(
        { status: "fail", message: "Slug already in use", code: "SLUG_TAKEN" },
        { status: 409 }
      );
    }
  }

  // Hash password if provided
  let passwordHash: string | null = null;
  if (password) {
    passwordHash = createHash("sha256").update(password).digest("hex");
  }

  // Build destination URL with UTM params if campaign specified
  let finalDestination = destination;
  if (campaignId) {
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, campaignId),
        eq(campaigns.workspaceId, authResult.workspaceId)
      ),
    });
    if (campaign) {
      const url = new URL(finalDestination);
      url.searchParams.set("utm_source", campaign.utmSource);
      url.searchParams.set("utm_medium", campaign.utmMedium);
      url.searchParams.set("utm_campaign", campaign.utmCampaign);
      finalDestination = url.toString();
    }
  }

  const [link] = await db
    .insert(links)
    .values({
      workspaceId: authResult.workspaceId,
      slug,
      destinationUrl: finalDestination,
      title: title ?? null,
      passwordHash,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxClicks: maxClicks ?? null,
    })
    .returning();

  // Create link-campaign join if applicable
  if (campaignId && link) {
    await db.insert(linkCampaigns).values({
      linkId: link.id,
      campaignId,
    });
  }

  return NextResponse.json({ status: "success", data: link }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = paginationSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "fail", message: "Invalid query parameters", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  const { page, limit, filter } = parsed.data;
  const offset = (page - 1) * limit;
  const now = new Date();

  let whereClause = eq(links.workspaceId, authResult.workspaceId);
  if (filter === "active") {
    whereClause = and(
      whereClause,
      eq(links.isActive, true),
      or(
        sql`${links.expiresAt} IS NULL`,
        sql`${links.expiresAt} > ${now}`
      )
    )!;
  } else if (filter === "expired") {
    whereClause = and(
      whereClause,
      or(eq(links.isActive, false), lt(links.expiresAt, now))
    )!;
  }

  const results = await db
    .select()
    .from(links)
    .where(whereClause)
    .orderBy(desc(links.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(links)
    .where(whereClause);

  return NextResponse.json({
    status: "success",
    data: results,
    meta: {
      page,
      limit,
      total: countResult?.value ?? 0,
    },
  });
}
