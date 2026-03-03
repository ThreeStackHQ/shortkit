import { NextRequest, NextResponse } from "next/server";
import { db, links } from "@shortkit/db";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";
import { authenticateRequest } from "@/lib/api-auth";
import { isProFeature } from "@/lib/tier";
import { qrQuerySchema } from "@/lib/validation";

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

  // Pro plan only
  const isPro = await isProFeature(authResult.workspaceId);
  if (!isPro) {
    return NextResponse.json(
      {
        status: "fail",
        message: "QR code generation requires Pro plan",
        code: "PLAN_REQUIRED",
      },
      { status: 402 }
    );
  }

  const { id } = await ctx.params;

  const link = await db.query.links.findFirst({
    where: and(eq(links.id, id), eq(links.workspaceId, authResult.workspaceId)),
    columns: { slug: true },
  });

  if (!link) {
    return NextResponse.json(
      { status: "fail", message: "Link not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = qrQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "fail", message: "Invalid parameters", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  const { format, size } = parsed.data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://shortkit.io";
  const shortUrl = `${baseUrl}/${link.slug}`;

  if (format === "svg") {
    const svg = await QRCode.toString(shortUrl, {
      type: "svg",
      width: size,
      margin: 2,
    });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // PNG
  const buffer = await QRCode.toBuffer(shortUrl, {
    type: "png",
    width: size,
    margin: 2,
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
