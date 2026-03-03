import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, workspaces } from "@shortkit/db";
import { eq } from "drizzle-orm";
import dns from "dns/promises";

export async function GET() {
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

  if (!workspace || !workspace.customDomain) {
    return NextResponse.json(
      { status: "fail", message: "No custom domain configured", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  try {
    const records = await dns.resolveCname(workspace.customDomain);
    const pointsToUs = records.some(
      (r) => r === "shortkit.io" || r.endsWith(".shortkit.io")
    );

    if (pointsToUs) {
      await db
        .update(workspaces)
        .set({ customDomainVerified: true })
        .where(eq(workspaces.id, workspace.id));

      return NextResponse.json({
        status: "success",
        data: { verified: true },
      });
    }

    return NextResponse.json({
      status: "success",
      data: {
        verified: false,
        instruction: `Add CNAME record: ${workspace.customDomain} → shortkit.io`,
      },
    });
  } catch {
    return NextResponse.json({
      status: "success",
      data: {
        verified: false,
        instruction: `Add CNAME record: ${workspace.customDomain} → shortkit.io`,
      },
    });
  }
}
