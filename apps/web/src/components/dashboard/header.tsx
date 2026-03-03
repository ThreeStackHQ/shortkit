"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/links": "Links",
  "/dashboard/analytics": "Analytics",
  "/dashboard/campaigns": "Campaigns",
  "/dashboard/settings": "Settings",
  "/dashboard/billing": "Billing",
};

export function DashboardHeader() {
  const pathname = usePathname();

  // Find the best matching title
  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES)
      .filter(([key]) => pathname.startsWith(key + "/"))
      .sort(([a], [b]) => b.length - a.length)[0]?.[1] ??
    "Dashboard";

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Dashboard</span>
        {pathname !== "/dashboard" && (
          <>
            <span className="text-slate-600">/</span>
            <span className="text-white font-medium">{title}</span>
          </>
        )}
        {pathname === "/dashboard" && (
          <span className="text-white font-medium">{title}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://docs.shortkit.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Docs
        </a>
        <div className="w-px h-4 bg-white/10" />
        <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
          <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </header>
  );
}
