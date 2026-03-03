import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShortKit — Branded Link Shortener & Analytics for Indie SaaS",
  description:
    "The Bitly alternative indie hackers actually use. $9/mo for unlimited short links, real analytics, QR codes, and custom domains.",
  openGraph: {
    title: "ShortKit — Branded Link Shortener & Analytics",
    description: "The Bitly alternative indie hackers actually use. $9/mo.",
    type: "website",
  },
};

// ── Icons ──────────────────────────────────────────────────────────────────────

function LinkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIconSm() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Feature cards data ─────────────────────────────────────────────────────────

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "Custom Short URLs",
    desc: "Create memorable branded links with custom slugs. sk.io/product-hunt looks better than bit.ly/3xYz9kQ.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Click Analytics",
    desc: "See every click with geo, referrer, device, and daily breakdowns. Know exactly who's clicking.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    title: "QR Codes",
    desc: "Generate QR codes for any link instantly. Download as PNG or SVG. Perfect for offline campaigns.",
    pro: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: "Custom Domains",
    desc: "Use your own domain like go.yourproduct.com. Full DNS verification and HTTPS included.",
    pro: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Password Protection",
    desc: "Gate your links behind a password for client portals, early access, or private content.",
    pro: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
    title: "Campaign Tracking",
    desc: "Automatically append UTM parameters to your links for Google Analytics campaign tracking.",
  },
];

// ── Pricing plans ──────────────────────────────────────────────────────────────

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "Get started with link shortening",
    highlight: false,
    cta: "Start Free",
    ctaHref: "/login",
    features: [
      "50 short links",
      "Basic click analytics",
      "Link management dashboard",
      "REST API access",
    ],
    missing: [
      "Custom domains",
      "QR code downloads",
      "Password protection",
      "Geo & device analytics",
    ],
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    desc: "Everything you need to grow",
    highlight: true,
    cta: "Start Pro — $9/mo",
    ctaHref: "/login",
    features: [
      "Unlimited short links",
      "Advanced analytics (geo, device, referrer)",
      "Custom domains",
      "QR code generation",
      "Password protection",
      "Campaign tracking (UTM)",
      "Link expiration",
      "Priority support",
    ],
    missing: [],
  },
];

// ── Comparison table data ──────────────────────────────────────────────────────

const comparisonRows = [
  { feature: "Price", shortkit: "$9/mo", bitly: "$35+/mo", rebrandly: "$29+/mo" },
  { feature: "Short links", shortkit: "Unlimited", bitly: "Limited on free", rebrandly: "5,000" },
  { feature: "Click analytics", shortkit: "✓ Full", bitly: "✓ Limited", rebrandly: "✓ Basic" },
  { feature: "Custom domains", shortkit: "✓ Included", bitly: "$$$", rebrandly: "✓ 1 free" },
  { feature: "QR codes", shortkit: "✓ Included", bitly: "✓", rebrandly: "✓" },
  { feature: "Password protection", shortkit: "✓ Included", bitly: "✗", rebrandly: "✓" },
  { feature: "API access", shortkit: "✓ Full REST", bitly: "✓", rebrandly: "✓" },
  { feature: "Campaign tracking", shortkit: "✓ UTM builder", bitly: "✓", rebrandly: "✓" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#0f172a]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <LinkIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">ShortKit</span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-6">
              <a href="#pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Docs</a>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            The Bitly alternative for indie hackers
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Short Links with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
              Real Analytics
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            The Bitly alternative indie hackers actually use.{" "}
            <strong className="text-white">$9/mo</strong> for unlimited links, advanced analytics, QR codes, and custom domains.
          </p>

          {/* Example link pill */}
          <div className="inline-flex items-center gap-3 bg-[#1e293b] border border-white/10 rounded-xl px-5 py-3 mb-10 font-mono text-sm shadow-xl">
            <span className="text-slate-500">long-url.com/your-super-long-product-url?utm=true</span>
            <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-sky-400 font-semibold">sk.io/product-hunt</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors text-lg shadow-lg shadow-sky-500/20"
            >
              Start for free →
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto px-8 py-3.5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 font-medium rounded-xl transition-colors text-lg"
            >
              See pricing
            </a>
          </div>

          <p className="text-slate-600 text-sm mt-4">No credit card required · Free plan forever</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/10 bg-[#1e293b]/40 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "10,000+", label: "Links Shortened" },
            { value: "$9/mo", label: "vs $35+ for Bitly" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "<100ms", label: "Redirect Speed" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-slate-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Built for indie hackers and small SaaS teams who need real tools without enterprise pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="bg-[#1e293b] border border-white/10 rounded-xl p-6 hover:border-sky-500/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:bg-sky-500/20 transition-colors">
                  {feat.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold">{feat.title}</h3>
                  {feat.pro && (
                    <span className="text-xs bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-medium">Pro</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 px-4 sm:px-6 bg-[#1e293b]/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How we compare
            </h2>
            <p className="text-slate-400 text-lg">
              Same features, fraction of the price.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#1e293b]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Feature</th>
                  <th className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-white font-bold">ShortKit</span>
                      <span className="text-sky-400 text-xs font-semibold mt-0.5">$9/mo</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-slate-300 font-medium">Bitly</span>
                      <span className="text-slate-500 text-xs mt-0.5">$35+/mo</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-slate-300 font-medium">Rebrandly</span>
                      <span className="text-slate-500 text-xs mt-0.5">$29+/mo</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonRows.map(({ feature, shortkit, bitly, rebrandly }) => (
                  <tr key={feature} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-slate-300 text-sm">{feature}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sky-400 text-sm font-medium">{shortkit}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-500 text-sm">{bitly}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-500 text-sm">{rebrandly}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple pricing</h2>
            <p className="text-slate-400 text-lg">
              One affordable plan. No per-click charges. No surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-gradient-to-br from-sky-500/20 to-blue-600/10 border-2 border-sky-500/50 relative"
                    : "bg-[#1e293b] border border-white/10"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-white font-bold text-xl">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400"><CheckIcon /></span>
                      {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-slate-700"><XIconSm /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaHref}
                  className={`w-full text-center px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25"
                      : "border border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-sky-500/10 to-blue-600/5 border-y border-sky-500/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start for free in 30 seconds
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Sign in with Google or GitHub. No credit card required.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors text-lg shadow-2xl shadow-sky-500/30"
          >
            Get Started Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-slate-600 text-sm mt-4">
            50 free links · No expiry · Upgrade anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center">
              <LinkIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-semibold">ShortKit</span>
          </div>
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} ThreeStack. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
