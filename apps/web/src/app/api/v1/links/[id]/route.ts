import { NextRequest, NextResponse } from "next/server";
import { db, links } from "@shortkit/db";
import { eq, and } from "drizzle-orm";
import { authenticateRequest } from "@/lib/api-auth";
import { updateLinkSchema } from "@/lib/validation";

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

  const link = await db.query.links.findFirst({
    where: and(eq(links.id, id), eq(links.workspaceId, authResult.workspaceId)),
  });

  if (!link) {
    return NextResponse.json(
      { status: "fail", message: "Link not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ status: "success", data: link });
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const body: unknown = await req.json();
  const parsed = updateLinkSchema.safeParse(body);
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

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined)
    updateData.title = parsed.data.title;
  if (parsed.data.destination !== undefined)
    updateData.destinationUrl = parsed.data.destination;
  if (parsed.data.expiresAt !== undefined)
    updateData.expiresAt = parsed.data.expiresAt
      ? new Date(parsed.data.expiresAt)
      : null;
  if (parsed.data.maxClicks !== undefined)
    updateData.maxClicks = parsed.data.maxClicks;
  if (parsed.data.isActive !== undefined)
    updateData.isActive = parsed.data.isActive;

  const [updated] = await db
    .update(links)
    .set(updateData)
    .where(
      and(eq(links.id, id), eq(links.workspaceId, authResult.workspaceId))
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      { status: "fail", message: "Link not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ status: "success", data: updated });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  const [updated] = await db
    .update(links)
    .set({ isActive: false })
    .where(
      and(eq(links.id, id), eq(links.workspaceId, authResult.workspaceId))
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      { status: "fail", message: "Link not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
