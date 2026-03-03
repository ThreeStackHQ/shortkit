"use client";

import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  name: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", utmSource: "", utmMedium: "", utmCampaign: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/campaigns");
      const json = await res.json() as { status: string; data: Campaign[] };
      if (json.status === "success") setCampaigns(json.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ name: "", utmSource: "", utmMedium: "", utmCampaign: "" });
      void load();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-slate-400 text-sm mt-1">Manage UTM campaigns for link tracking</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </button>
      </div>

      <div className="bg-[#1e293b] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium">No campaigns yet</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sky-400 text-sm hover:text-sky-300 transition-colors">
              Create your first campaign →
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/10">
                <th className="text-left px-6 py-3 font-medium">Name</th>
                <th className="text-left px-6 py-3 font-medium hidden sm:table-cell">UTM Source</th>
                <th className="text-left px-6 py-3 font-medium hidden md:table-cell">UTM Medium</th>
                <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">UTM Campaign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white font-medium text-sm">{c.name}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm hidden sm:table-cell font-mono">{c.utmSource}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm hidden md:table-cell font-mono">{c.utmMedium}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm hidden lg:table-cell font-mono">{c.utmCampaign}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h2 className="text-white font-semibold text-lg">New Campaign</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {[
                { key: "name", label: "Campaign Name", placeholder: "Black Friday 2025" },
                { key: "utmSource", label: "UTM Source", placeholder: "twitter" },
                { key: "utmMedium", label: "UTM Medium", placeholder: "social" },
                { key: "utmCampaign", label: "UTM Campaign", placeholder: "black-friday" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{label} <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-slate-300 text-sm font-medium rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {saving ? "Creating…" : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
