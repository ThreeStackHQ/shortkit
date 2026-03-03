import { db, workspaces, links } from "@shortkit/db";
import { eq, and, count } from "drizzle-orm";

export async function getTier(
  workspaceId: string
): Promise<"free" | "pro"> {
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
    columns: { plan: true },
  });
  return ws?.plan ?? "free";
}

const FREE_LINK_LIMIT = 50;

export async function canCreateLink(workspaceId: string): Promise<boolean> {
  const tier = await getTier(workspaceId);
  if (tier === "pro") return true;

  const [result] = await db
    .select({ value: count() })
    .from(links)
    .where(and(eq(links.workspaceId, workspaceId), eq(links.isActive, true)));

  return (result?.value ?? 0) < FREE_LINK_LIMIT;
}

export async function isProFeature(workspaceId: string): Promise<boolean> {
  const tier = await getTier(workspaceId);
  return tier === "pro";
}
