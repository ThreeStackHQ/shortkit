"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface LinkItem {
  id: string;
  slug: string;
  destinationUrl: string;
  title: string | null;
  clickCount: number;
  createdAt: string;
  isActive: boolean;
  expiresAt: string | null;
  passwordHash: string | null;
}

interface ApiResponse {
  status: string;
  data: LinkItem[];
  meta: { page: number; limit: number; total: number };
}

// ── Utility ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${minutes}m ago`;
}

function getLinkStatus(link: LinkItem): "active" | "expired" | "disabled" {
  if (!link.isActive) return "disabled";
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return "expired";
  return "active";
}

function StatusBadge({ status }: { status: "active" | "expired" | "disabled" }) {
  const styles = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    expired: "bg-red-500/20 text-red-400 border-red-500/30",
    disabled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Create Link Modal ─────────────────────────────────────────────────────────

function CreateLinkModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    destination: "",
    slug: "",
    title: "",
    expiresAt: "",
    password: "",
    hasPassword: false,
    hasExpiry: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body: Record<string, unknown> = {
      destination: form.destination,
    };
    if (form.slug.trim()) body.slug = form.slug.trim();
    if (form.title.trim()) body.title = form.title.trim();
    if (form.hasExpiry && form.expiresAt) {
      body.expiresAt = new Date(form.expiresAt).toISOString();
    }
    if (form.hasPassword && form.password.trim()) {
      body.password = form.password.trim();
    }

    try {
      const res = await fetch("/api/v1/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { status: string; message?: string };
      if (!res.ok) {
        setError(json.message ?? "Failed to create link");
      } else {
        onCreated();
        onClose();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Create New Link</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Destination URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Destination URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/your-page"
              value={form.destination}
              onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
              className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition"
            />
          </div>

          {/* Custom slug */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Custom Slug <span className="text-slate-500 text-xs">(optional)</span>
            </label>
            <div className="flex">
              <span className="flex items-center px-3 bg-white/5 border border-r-0 border-white/10 rounded-l-lg text-slate-500 text-sm select-none">
                sk.io/
              </span>
              <input
                type="text"
                placeholder="my-link"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") }))}
                className="flex-1 bg-[#0f172a] border border-white/10 rounded-r-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition"
              />
            </div>
            {form.slug && (
              <p className="text-sky-400 text-xs mt-1.5 font-mono">
                Preview: sk.io/{form.slug}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Title <span className="text-slate-500 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Product Hunt launch"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition"
            />
          </div>

          {/* Pro features */}
          <div className="border border-white/10 rounded-xl p-4 space-y-4 bg-[#0f172a]/50">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pro Features</p>

            {/* Expiry date */}
            <div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, hasExpiry: !f.hasExpiry }))}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                    form.hasExpiry ? "bg-sky-500" : "bg-slate-700"
                  }`}
                >
                  <div className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                    form.hasExpiry ? "translate-x-4" : "translate-x-0"
                  }`} />
                </div>
                <span className="text-sm text-slate-300">Expiry date</span>
                <span className="text-xs bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-medium">Pro</span>
              </label>
              {form.hasExpiry && (
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="mt-2 w-full bg-[#0f172a] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500/60 transition"
                />
              )}
            </div>

            {/* Password protection */}
            <div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, hasPassword: !f.hasPassword }))}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                    form.hasPassword ? "bg-sky-500" : "bg-slate-700"
                  }`}
                >
                  <div className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                    form.hasPassword ? "translate-x-4" : "translate-x-0"
                  }`} />
                </div>
                <span className="text-sm text-slate-300">Password protection</span>
                <span className="text-xs bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-medium">Pro</span>
              </label>
              {form.hasPassword && (
                <input
                  type="password"
                  placeholder="Set a password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-2 w-full bg-[#0f172a] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/60 transition"
                />
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-white/10 text-slate-300 text-sm font-medium rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "Creating…" : "Create Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────────────────

function QrModal({ link, onClose }: { link: LinkItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-white font-semibold">QR Code</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          <p className="text-sky-400 font-mono text-sm">sk.io/{link.slug}</p>
          <div className="bg-white p-4 rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/v1/links/${link.id}/qr?format=png&size=256`}
              alt="QR Code"
              width={256}
              height={256}
              className="block"
            />
          </div>
          <a
            href={`/api/v1/links/${link.id}/qr?format=png&size=512`}
            download={`shortkit-qr-${link.slug}.png`}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Analytics Drawer ──────────────────────────────────────────────────────────

interface AnalyticsData {
  total: number;
  unique: number;
  daily: Array<{ date: string; clicks: number }>;
  geo: Array<{ country: string; clicks: number }>;
  referrer: Array<{ referer: string | null; clicks: number }>;
  device: Array<{ device: string; clicks: number }>;
}

function AnalyticsDrawer({
  link,
  onClose,
}: {
  link: LinkItem;
  onClose: () => void;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/v1/links/${link.id}/analytics?period=30d`);
        const json = await res.json() as { status: string; data: AnalyticsData };
        if (json.status === "success") setData(json.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [link.id]);

  const maxClicks = data?.daily ? Math.max(...data.daily.map((d) => d.clicks), 1) : 1;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-[#0f172a] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold">Analytics</h2>
            <p className="text-sky-400 font-mono text-xs mt-0.5">sk.io/{link.slug}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-[#1e293b] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1e293b] border border-white/10 rounded-xl p-4">
                  <p className="text-slate-400 text-xs mb-1">Total Clicks</p>
                  <p className="text-white text-2xl font-bold tabular-nums">{data.total.toLocaleString()}</p>
                </div>
                <div className="bg-[#1e293b] border border-white/10 rounded-xl p-4">
                  <p className="text-slate-400 text-xs mb-1">Unique Visitors</p>
                  <p className="text-white text-2xl font-bold tabular-nums">{data.unique.toLocaleString()}</p>
                </div>
              </div>

              {/* Click chart */}
              {data.daily.length > 0 && (
                <div className="bg-[#1e293b] border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">Clicks over 30d</h3>
                  <div className="flex items-end gap-0.5 h-24">
                    {data.daily.map((d) => (
                      <div
                        key={d.date}
                        className="flex-1 bg-sky-500/60 hover:bg-sky-500 rounded-t transition-colors"
                        style={{ height: `${(d.clicks / maxClicks) * 100}%`, minHeight: d.clicks > 0 ? "4px" : "1px" }}
                        title={`${d.date}: ${d.clicks} clicks`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Geo */}
              {data.geo.length > 0 && (
                <div className="bg-[#1e293b] border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Top Countries</h3>
                  <div className="space-y-2">
                    {data.geo.slice(0, 5).map((g) => (
                      <div key={g.country} className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">{g.country || "Unknown"}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full"
                              style={{ width: `${(g.clicks / data.geo[0]!.clicks) * 100}%` }}
                            />
                          </div>
                          <span className="text-white text-sm font-medium tabular-nums w-8 text-right">{g.clicks}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Referrers */}
              {data.referrer.length > 0 && (
                <div className="bg-[#1e293b] border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Top Referrers</h3>
                  <div className="space-y-2">
                    {data.referrer.slice(0, 5).map((r, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm truncate max-w-[200px]">
                          {r.referer || "Direct / Unknown"}
                        </span>
                        <span className="text-white text-sm font-medium tabular-nums">{r.clicks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No analytics data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Links Page ───────────────────────────────────────────────────────────

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [qrLink, setQrLink] = useState<LinkItem | null>(null);
  const [analyticsLink, setAnalyticsLink] = useState<LinkItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LIMIT = 20;

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      const res = await fetch(`/api/v1/links?${params}`);
      const json = await res.json() as ApiResponse;
      if (json.status === "success") {
        setLinks(json.data);
        setTotal(json.meta.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this link? This cannot be undone.")) return;
    await fetch(`/api/v1/links/${id}`, { method: "DELETE" });
    void loadLinks();
  };

  const handleCopy = (slug: string, id: string) => {
    void navigator.clipboard.writeText(`https://sk.io/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLinks = search.trim()
    ? links.filter(
        (l) =>
          l.slug.toLowerCase().includes(search.toLowerCase()) ||
          l.destinationUrl.toLowerCase().includes(search.toLowerCase()) ||
          (l.title?.toLowerCase() ?? "").includes(search.toLowerCase())
      )
    : links;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Links</h1>
          <p className="text-slate-400 text-sm mt-1">{total} link{total !== 1 ? "s" : ""} in total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Link
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search by title, slug, or URL…"
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            if (searchDebounce.current) clearTimeout(searchDebounce.current);
          }}
          className="w-full bg-[#1e293b] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium">
              {search ? "No links match your search" : "No links yet"}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sky-400 text-sm hover:text-sky-300 transition-colors"
              >
                Create your first link →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/10">
                  <th className="text-left px-6 py-3 font-medium">Short URL</th>
                  <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Original URL</th>
                  <th className="text-right px-6 py-3 font-medium">Clicks</th>
                  <th className="text-center px-6 py-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="text-right px-6 py-3 font-medium hidden md:table-cell">Created</th>
                  <th className="text-right px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Short URL */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sky-400 font-mono text-sm">sk.io/{link.slug}</span>
                        <button
                          onClick={() => handleCopy(link.slug, link.id)}
                          className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
                          title="Copy link"
                        >
                          {copiedId === link.id ? (
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {link.title && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[180px]">{link.title}</p>
                      )}
                      {link.passwordHash && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 110 4 2 2 0 010-4z" />
                          </svg>
                          Protected
                        </span>
                      )}
                    </td>

                    {/* Original URL */}
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-slate-400 text-sm truncate block max-w-[240px]" title={link.destinationUrl}>
                        {link.destinationUrl}
                      </span>
                    </td>

                    {/* Clicks */}
                    <td className="px-6 py-4 text-right">
                      <span className="text-white font-medium tabular-nums">{link.clickCount.toLocaleString()}</span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <StatusBadge status={getLinkStatus(link)} />
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4 text-right hidden md:table-cell">
                      <span className="text-slate-500 text-sm">{timeAgo(link.createdAt)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* QR */}
                        <button
                          onClick={() => setQrLink(link)}
                          title="QR Code"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </button>
                        {/* Analytics */}
                        <button
                          onClick={() => setAnalyticsLink(link)}
                          title="Analytics"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(link.id)}
                          title="Delete"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-slate-500 text-sm">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateLinkModal
          onClose={() => setShowCreate(false)}
          onCreated={() => void loadLinks()}
        />
      )}
      {qrLink && <QrModal link={qrLink} onClose={() => setQrLink(null)} />}
      {analyticsLink && (
        <AnalyticsDrawer link={analyticsLink} onClose={() => setAnalyticsLink(null)} />
      )}
    </div>
  );
}
