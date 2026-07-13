import Link from 'next/link';
import { PLANS, CREDIT_PACKS, CREDIT_COST } from '@/lib/plans';

export const metadata = {
  title: 'Pricing — VibeSiteScan',
};

const ORDER: Array<keyof typeof PLANS> = ['free', 'pro', 'studio'];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-cream scanline-overlay bg-coord-grid-dark">
      <header className="border-b border-white/10 bg-black/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-mono text-sm font-semibold tracking-widest uppercase text-white/85">
            VibeSiteScan
          </Link>
          <Link
            href="/dashboard/new-scan-pipeline"
            className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 rounded"
          >
            Scan a site
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-4">
          <span className="classified-stamp text-[9px] text-white/45">Pay per site check</span>
        </div>
        <h1 className="text-4xl font-bold text-center mb-3 text-white">Credits, not surprises</h1>
        <p className="text-center text-white/60 mb-3 max-w-2xl mx-auto">
          One credit = one site check. Quick = {CREDIT_COST.quick}, Launch = {CREDIT_COST.standard}, Deep = {CREDIT_COST.deep}.
          Re-verifying the same URL within 15 minutes is always free.
        </p>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {ORDER.map((id) => {
            const plan = PLANS[id];
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-7 border bg-black/30 ${
                  plan.popular ? 'border-emerald-500/50' : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-600 text-white text-[10px] font-mono uppercase tracking-widest rounded-full">
                    Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1 text-white">{plan.name}</h3>
                <div className="text-3xl font-bold mb-1 font-mono text-white">
                  ₹{plan.priceInr}
                  <span className="text-sm text-white/40">{plan.priceInr > 0 ? '/mo' : ''}</span>
                </div>
                <div className="font-mono text-[11px] text-emerald-400/80 mb-5">
                  {plan.monthlyCredits} credits / month
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/75">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.id === 'free' ? '/dashboard/new-scan-pipeline' : `/dashboard?upgrade=${plan.id}`}
                  className={`block w-full text-center px-6 py-3 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors ${
                    plan.popular
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'border border-white/15 text-white/85 hover:bg-white/5'
                  }`}
                >
                  {plan.id === 'free' ? 'Start free' : 'Choose ' + plan.name}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Top-up packs */}
        <div className="mt-16">
          <h2 className="text-center font-mono text-xs uppercase tracking-widest text-white/50 mb-6">
            Need more? One-time top-ups (never expire)
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.id} className="rounded-xl p-5 border border-white/10 bg-black/20 text-center">
                <div className="font-mono text-2xl font-bold text-white">+{pack.credits}</div>
                <div className="font-mono text-[11px] text-white/40 mb-3">credits</div>
                <div className="font-mono text-lg text-emerald-400 mb-3">₹{pack.priceInr}</div>
                <Link
                  href={`/dashboard?topup=${pack.id}`}
                  className="block w-full text-center px-4 py-2 rounded-lg border border-white/15 text-white/85 hover:bg-white/5 font-mono text-[11px] uppercase tracking-widest"
                >
                  Buy
                </Link>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-white/35 text-xs font-mono mt-12">
          Payments via Razorpay. A green light means the site passed every security check we run.
        </p>
      </div>
    </div>
  );
}
