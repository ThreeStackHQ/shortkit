import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, workspaces } from "@shortkit/db";
import { eq } from "drizzle-orm";
import { isProFeature } from "@/lib/tier";
import { domainSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.ownerId, session.user.id),
  });

  if (!workspace) {
    return NextResponse.json(
      { status: "fail", message: "Workspace not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const isPro = await isProFeature(workspace.id);
  if (!isPro) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Custom domains require Pro plan",
        code: "PLAN_REQUIRED",
      },
      { status: 402 }
    );
  }

  const body: unknown = await req.json();
  const parsed = domainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Invalid domain",
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
    .update(workspaces)
    .set({
      customDomain: parsed.data.customDomain,
      customDomainVerified: false,
    })
    .where(eq(workspaces.id, workspace.id))
    .returning();

  return NextResponse.json({ status: "success", data: updated });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.ownerId, session.user.id),
    columns: { id: true },
  });

  if (!workspace) {
    return NextResponse.json(
      { status: "fail", message: "Workspace not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  await db
    .update(workspaces)
    .set({ customDomain: null, customDomainVerified: false })
    .where(eq(workspaces.id, workspace.id));

  return new NextResponse(null, { status: 204 });
}
