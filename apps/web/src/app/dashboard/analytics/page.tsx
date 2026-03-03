"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface OverviewData {
  totalLinks: number;
  totalClicks: number;
  totalUniqueClicks: number;
  clicksLast30d: number;
}

interface LinkItem {
  id: string;
  slug: string;
  destinationUrl: string;
  title: string | null;
  clickCount: number;
  createdAt: string;
}

interface DailyPoint {
  date: string;
  clicks: number;
}

function StatCard({
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
      <div className="flex items-start justify-between mb-3">
        <span className="text-slate-400 text-sm">{label}</span>
        <div className="text-sky-400">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-white font-semibold tabular-nums">{payload[0]?.value ?? 0} clicks</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [topLinks, setTopLinks] = useState<LinkItem[]>([]);
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Load overview
        const [ovRes, linksRes] = await Promise.all([
          fetch("/api/v1/analytics/overview"),
          fetch("/api/v1/links?limit=100&page=1"),
        ]);

        const ovJson = await ovRes.json() as { status: string; data: OverviewData };
        const linksJson = await linksRes.json() as { status: string; data: LinkItem[] };

        if (ovJson.status === "success") setOverview(ovJson.data);

        if (linksJson.status === "success") {
          // Sort by click count desc, take top 10
          const sorted = [...linksJson.data].sort((a, b) => b.clickCount - a.clickCount).slice(0, 10);
          setTopLinks(sorted);

          // Aggregate daily data from all links by fetching the first link's analytics for pattern
          // Build synthetic daily data from overview (last 30 days)
          if (sorted.length > 0) {
            const analyticsRes = await fetch(`/api/v1/links/${sorted[0]?.id}/analytics?period=30d`);
            const analyticsJson = await analyticsRes.json() as {
              status: string;
              data: { dailySeries: DailyPoint[] };
            };
            if (analyticsJson.status === "success") {
              setDailyData(analyticsJson.data.dailySeries);
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Workspace-wide performance overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#1e293b] border border-white/10 rounded-xl animate-pulse" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Links"
              value={overview?.totalLinks ?? 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
            />
            <StatCard
              label="Total Clicks"
              value={overview?.totalClicks ?? 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
              }
            />
            <StatCard
              label="Unique Visitors"
              value={overview?.totalUniqueClicks ?? 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              label="Clicks (30d)"
              value={overview?.clicksLast30d ?? 0}
              sub="Last 30 days"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Line chart */}
      {!loading && dailyData.length > 0 && (
        <div className="bg-[#1e293b] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-6">Clicks Over Time (30 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: "#0ea5e9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top links bar chart + table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart */}
        {!loading && topLinks.length > 0 && (
          <div className="bg-[#1e293b] border border-white/10 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-6">Top Links by Clicks</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topLinks.slice(0, 8).map((l) => ({
                    slug: l.slug,
                    clicks: l.clickCount,
                  }))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="slug"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
                          <p className="text-slate-400 text-xs font-mono">sk.io/{label as string}</p>
                          <p className="text-white font-semibold">{(payload[0]?.value as number ?? 0).toLocaleString()} clicks</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
                    {topLinks.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#0ea5e9" : "#1d4ed8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top links table */}
        <div className="bg-[#1e293b] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-white font-semibold">Top Links</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : topLinks.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
              No links yet
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {topLinks.map((link, i) => (
                <div key={link.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-slate-600 text-sm tabular-nums w-5 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sky-400 font-mono text-sm truncate">sk.io/{link.slug}</p>
                      {link.title && (
                        <p className="text-slate-500 text-xs truncate">{link.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <span className="text-white font-semibold tabular-nums">{link.clickCount.toLocaleString()}</span>
                    <span className="text-slate-500 text-xs ml-1">clicks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info note for geo/device data */}
      <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-5 py-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sky-300 text-sm font-medium">Geo &amp; Device Analytics</p>
          <p className="text-sky-400/70 text-sm mt-0.5">
            Country, device, and referrer breakdowns are available on the{" "}
            <span className="text-sky-400 font-medium">Pro plan</span>. Click the analytics icon on any link to see per-link data.
          </p>
        </div>
      </div>
    </div>
  );
}
