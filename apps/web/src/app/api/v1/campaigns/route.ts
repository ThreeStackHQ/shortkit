import { NextRequest, NextResponse } from "next/server";
import { db, campaigns } from "@shortkit/db";
import { eq, desc } from "drizzle-orm";
import { authenticateRequest } from "@/lib/api-auth";
import { createCampaignSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const body: unknown = await req.json();
  const parsed = createCampaignSchema.safeParse(body);
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

  const [campaign] = await db
    .insert(campaigns)
    .values({
      workspaceId: authResult.workspaceId,
      name: parsed.data.name,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
    })
    .returning();

  return NextResponse.json(
    { status: "success", data: campaign },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const results = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.workspaceId, authResult.workspaceId))
    .orderBy(desc(campaigns.createdAt));

  return NextResponse.json({ status: "success", data: results });
}
