import { NextRequest, NextResponse } from "next/server";
import { db, links } from "@shortkit/db";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";
import { passwordUnlockSchema } from "@/lib/validation";
import { cookies } from "next/headers";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;
  const body: unknown = await req.json();
  const parsed = passwordUnlockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { status: "fail", message: "Password required", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  const link = await db.query.links.findFirst({
    where: and(eq(links.slug, slug), eq(links.isActive, true)),
    columns: { id: true, slug: true, passwordHash: true, destinationUrl: true },
  });

  if (!link || !link.passwordHash) {
    return NextResponse.json(
      { status: "fail", message: "Link not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const inputHash = createHash("sha256")
    .update(parsed.data.password)
    .digest("hex");

  if (inputHash !== link.passwordHash) {
    return NextResponse.json(
      { status: "fail", message: "Incorrect password", code: "WRONG_PASSWORD" },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(`sk_unlock_${link.slug}`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
  });

  return NextResponse.json({
    status: "success",
    data: { destination: link.destinationUrl },
  });
}
