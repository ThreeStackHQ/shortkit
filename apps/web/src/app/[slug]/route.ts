import { NextRequest, NextResponse } from "next/server";
import { db, links, linkClicks, workspaces } from "@shortkit/db";
import { eq, and, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { cookies } from "next/headers";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;

  // Skip API and internal routes
  if (slug.startsWith("api") || slug.startsWith("_next") || slug === "favicon.ico") {
    return NextResponse.next();
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { status: "fail", message: "Rate limit exceeded", code: "RATE_LIMIT" },
      { status: 429 }
    );
  }

  // Check if request is from a custom domain
  const host = req.headers.get("host") || "";
  let link;

  if (host && host !== "localhost:3000" && !host.includes("shortkit")) {
    // Custom domain lookup
    const workspace = await db.query.workspaces.findFirst({
      where: and(
        eq(workspaces.customDomain, host),
        eq(workspaces.customDomainVerified, true)
      ),
      columns: { id: true },
    });

    if (workspace) {
      link = await db.query.links.findFirst({
        where: and(
          eq(links.slug, slug),
          eq(links.workspaceId, workspace.id),
          eq(links.isActive, true)
        ),
      });
    }
  }

  if (!link) {
    link = await db.query.links.findFirst({
      where: and(eq(links.slug, slug), eq(links.isActive, true)),
    });
  }

  if (!link) {
    return NextResponse.json(
      { status: "fail", message: "Link not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Check expiry
  if (link.expiresAt && link.expiresAt < new Date()) {
    return new NextResponse(
      "<html><body style='background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif'><div><h1>Link Expired</h1><p>This link is no longer available.</p></div></body></html>",
      { status: 410, headers: { "Content-Type": "text/html" } }
    );
  }

  // Check max clicks
  if (link.maxClicks && link.clickCount >= link.maxClicks) {
    return new NextResponse(
      "<html><body style='background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif'><div><h1>Link Expired</h1><p>This link has reached its click limit.</p></div></body></html>",
      { status: 410, headers: { "Content-Type": "text/html" } }
    );
  }

  // Check password protection
  if (link.passwordHash) {
    const cookieStore = await cookies();
    const unlocked = cookieStore.get(`sk_unlock_${link.slug}`);
    if (!unlocked) {
      return NextResponse.redirect(
        new URL(`/p/${link.slug}`, req.url)
      );
    }
  }

  // Log click asynchronously (fire-and-forget)
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const country = req.headers.get("cf-ipcountry") || null;
  const referer = req.headers.get("referer") || null;
  const userAgent = req.headers.get("user-agent") || null;

  // Don't await — fire and forget for performance
  void Promise.all([
    db.insert(linkClicks).values({
      linkId: link.id,
      country,
      referer,
      userAgent,
      ipHash,
    }),
    db
      .update(links)
      .set({ clickCount: sql`${links.clickCount} + 1` })
      .where(eq(links.id, link.id)),
  ]);

  // 301 for permanent links, 302 for expiring ones
  const statusCode = link.expiresAt ? 302 : 301;
  return NextResponse.redirect(link.destinationUrl, statusCode);
}
