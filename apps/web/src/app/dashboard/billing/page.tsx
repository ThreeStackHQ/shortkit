import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, workspaces } from "@shortkit/db";
import { eq } from "drizzle-orm";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const db = getDb();
  let plan: string = "free";

  try {
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.ownerId, session.user.id),
      columns: { plan: true },
    });
    plan = workspace?.plan ?? "free";
  } catch {
    // ignore
  }

  const isPro = plan === "pro";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your plan and payment details</p>
      </div>

      {/* Current plan */}
      <div className="bg-[#1e293b] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold">Current Plan</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
            isPro
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
          }`}>
            {isPro ? "Pro" : "Free"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { label: "Links", free: "50 links", pro: "Unlimited" },
            { label: "Analytics", free: "Basic", pro: "Advanced + Geo" },
            { label: "Custom Domain", free: "—", pro: "✓" },
            { label: "QR Codes", free: "—", pro: "✓" },
            { label: "Password Protection", free: "—", pro: "✓" },
            { label: "Campaign Tracking", free: "—", pro: "✓" },
          ].map(({ label, free, pro }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className={`text-sm font-medium ${isPro ? "text-sky-400" : "text-slate-300"}`}>
                {isPro ? pro : free}
              </span>
            </div>
          ))}
        </div>

        {isPro ? (
          <form action="/api/stripe/portal" method="POST">
            <button
              type="submit"
              className="w-full px-4 py-3 border border-white/10 text-slate-300 text-sm font-medium rounded-lg hover:bg-white/5 transition-colors"
            >
              Manage Subscription →
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-br from-sky-500/15 to-blue-500/10 border border-sky-500/20 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-bold text-lg">Pro Plan</h3>
                  <p className="text-slate-400 text-sm">Everything you need to grow</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-2xl font-bold">$9</p>
                  <p className="text-slate-500 text-xs">/month</p>
                </div>
              </div>
            </div>
            <form action="/api/stripe/checkout" method="POST">
              <button
                type="submit"
                className="w-full px-4 py-3 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Upgrade to Pro — $9/mo →
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Invoice note */}
      <p className="text-slate-600 text-xs text-center">
        Payments processed securely by Stripe. Cancel anytime.
      </p>
    </div>
  );
}
