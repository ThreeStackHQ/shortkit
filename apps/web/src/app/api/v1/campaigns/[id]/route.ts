import { NextRequest, NextResponse } from "next/server";
import { db, campaigns } from "@shortkit/db";
import { eq, and } from "drizzle-orm";
import { authenticateRequest } from "@/lib/api-auth";
import { createCampaignSchema } from "@/lib/validation";

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

  const campaign = await db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.id, id),
      eq(campaigns.workspaceId, authResult.workspaceId)
    ),
  });

  if (!campaign) {
    return NextResponse.json(
      { status: "fail", message: "Campaign not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ status: "success", data: campaign });
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
  const parsed = createCampaignSchema.partial().safeParse(body);
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

  const [updated] = await db
    .update(campaigns)
    .set(parsed.data)
    .where(
      and(
        eq(campaigns.id, id),
        eq(campaigns.workspaceId, authResult.workspaceId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      { status: "fail", message: "Campaign not found", code: "NOT_FOUND" },
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

  const [deleted] = await db
    .delete(campaigns)
    .where(
      and(
        eq(campaigns.id, id),
        eq(campaigns.workspaceId, authResult.workspaceId)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json(
      { status: "fail", message: "Campaign not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
