import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, workspaces, links, linkClicks, campaigns } from "@shortkit/db";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import Link from "next/link";

async function getDashboardData(workspaceId: string) {
  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Total links
  const [totalLinksResult] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(links)
    .where(eq(links.workspaceId, workspaceId));

  // All link IDs
  const workspaceLinks = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.workspaceId, workspaceId));
  const linkIds = workspaceLinks.map((l) => l.id);

  let clicksLast30d = 0;
  let uniqueVisitors = 0;
  if (linkIds.length > 0) {
    const [clicksResult] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(linkClicks)
      .where(
        and(
          sql`${linkClicks.linkId} = ANY(ARRAY[${sql.join(
            linkIds.map((id) => sql`${id}::uuid`),
            sql`, `
          )}])`,
          gte(linkClicks.clickedAt, thirtyDaysAgo)
        )
      );
    clicksLast30d = clicksResult?.value ?? 0;

    const [uniqueResult] = await db
      .select({
        value: sql<number>`count(distinct ${linkClicks.ipHash})::int`,
      })
      .from(linkClicks)
      .where(
        and(
          sql`${linkClicks.linkId} = ANY(ARRAY[${sql.join(
            linkIds.map((id) => sql`${id}::uuid`),
            sql`, `
          )}])`,
          gte(linkClicks.clickedAt, thirtyDaysAgo)
        )
      );
    uniqueVisitors = uniqueResult?.value ?? 0;
  }

  // Active campaigns
  const [campaignsResult] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(campaigns)
    .where(eq(campaigns.workspaceId, workspaceId));

  // Recent links (last 5)
  const recentLinks = await db
    .select()
    .from(links)
    .where(eq(links.workspaceId, workspaceId))
    .orderBy(desc(links.createdAt))
    .limit(5);

  return {
    totalLinks: totalLinksResult?.value ?? 0,
    clicksLast30d,
    uniqueVisitors,
    activeCampaigns: campaignsResult?.value ?? 0,
    recentLinks,
  };
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white tabular-nums">
        {value.toLocaleString()}
      </div>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function StatusBadge({ link }: { link: { isActive: boolean; expiresAt: Date | null } }) {
  const now = new Date();
  const isExpired = link.expiresAt && link.expiresAt < now;
  if (!link.isActive) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
        Disabled
      </span>
    );
  }
  if (isExpired) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
      Active
    </span>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${minutes}m ago`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const db = getDb();
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.ownerId, session.user.id),
    columns: { id: true, name: true, plan: true },
  });

  if (!workspace) redirect("/login");

  let data = {
    totalLinks: 0,
    clicksLast30d: 0,
    uniqueVisitors: 0,
    activeCampaigns: 0,
    recentLinks: [] as Array<{
      id: string;
      slug: string;
      destinationUrl: string;
      title: string | null;
      clickCount: number;
      createdAt: Date;
      isActive: boolean;
      expiresAt: Date | null;
    }>,
  };

  try {
    data = await getDashboardData(workspace.id);
  } catch {
    // DB not connected — show empty state
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {workspace.name} · {workspace.plan === "pro" ? "Pro plan" : "Free plan"}
          </p>
        </div>
        <Link
          href="/dashboard/links"
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Link
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Links"
          value={data.totalLinks}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        />
        <KpiCard
          label="Total Clicks"
          value={data.clicksLast30d}
          sub="Last 30 days"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          }
        />
        <KpiCard
          label="Unique Visitors"
          value={data.uniqueVisitors}
          sub="Last 30 days"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Active Campaigns"
          value={data.activeCampaigns}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          }
        />
      </div>

      {/* Recent links */}
      <div className="bg-[#1e293b] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Recent Links</h2>
          <Link
            href="/dashboard/links"
            className="text-sky-400 text-sm hover:text-sky-300 transition-colors"
          >
            View all →
          </Link>
        </div>

        {data.recentLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">No links yet</p>
            <Link
              href="/dashboard/links"
              className="mt-3 text-sky-400 text-sm hover:text-sky-300 transition-colors"
            >
              Create your first link →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th className="text-left px-6 py-3 font-medium">Short URL</th>
                  <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Destination</th>
                  <th className="text-right px-6 py-3 font-medium">Clicks</th>
                  <th className="text-right px-6 py-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="text-right px-6 py-3 font-medium hidden lg:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sky-400 font-mono text-sm">
                        sk.io/{link.slug}
                      </span>
                      {link.title && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[180px]">
                          {link.title}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-slate-400 text-sm truncate block max-w-[220px]">
                        {link.destinationUrl}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-white font-medium tabular-nums">
                        {link.clickCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right hidden sm:table-cell">
                      <StatusBadge link={link} />
                    </td>
                    <td className="px-6 py-4 text-right hidden lg:table-cell">
                      <span className="text-slate-500 text-sm">
                        {timeAgo(link.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
