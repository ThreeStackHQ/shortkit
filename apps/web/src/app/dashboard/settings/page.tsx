import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, workspaces } from "@shortkit/db";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const db = getDb();
  let workspace: { name: string; slug: string; customDomain: string | null; plan: string } | null = null;

  try {
    workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.ownerId, session.user.id),
      columns: { name: true, slug: true, customDomain: true, plan: true },
    }) ?? null;
  } catch {
    // DB not connected
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your workspace configuration</p>
      </div>

      {/* Profile */}
      <div className="bg-[#1e293b] border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Name</label>
            <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm">
              {session.user.name || "—"}
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
            <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm">
              {session.user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="bg-[#1e293b] border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Workspace</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Workspace Name</label>
            <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm">
              {workspace?.name || "—"}
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Slug</label>
            <div className="flex items-center">
              <span className="flex items-center px-3 bg-white/5 border border-r-0 border-white/10 rounded-l-lg text-slate-500 text-sm">
                sk.io/
              </span>
              <div className="flex-1 bg-[#0f172a] border border-white/10 rounded-r-lg px-3.5 py-2.5 text-slate-400 text-sm font-mono">
                {workspace?.slug || "—"}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              Custom Domain
              <span className="ml-2 text-xs bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-medium">Pro</span>
            </label>
            <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3.5 py-2.5 text-slate-500 text-sm">
              {workspace?.customDomain || "Not configured — upgrade to Pro"}
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-4">
        <h2 className="text-red-400 font-semibold">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Delete workspace</p>
            <p className="text-slate-400 text-xs mt-0.5">Permanently delete your workspace and all links</p>
          </div>
          <button className="px-4 py-2 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/10 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
