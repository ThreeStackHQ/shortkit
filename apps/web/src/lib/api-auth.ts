import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db, workspaces, workspaceApiKeys } from "@shortkit/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

interface AuthResult {
  workspaceId: string;
}

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthResult | null> {
  // Try Bearer API key first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7);
    const keyHash = createHash("sha256").update(apiKey).digest("hex");

    const apiKeyRecord = await db.query.workspaceApiKeys.findFirst({
      where: eq(workspaceApiKeys.keyHash, keyHash),
      columns: { workspaceId: true },
    });

    if (apiKeyRecord) {
      return { workspaceId: apiKeyRecord.workspaceId };
    }
    return null;
  }

  // Fall back to session auth
  const session = await auth();
  if (!session?.user?.id) return null;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.ownerId, session.user.id),
    columns: { id: true },
  });

  if (!workspace) return null;
  return { workspaceId: workspace.id };
}
