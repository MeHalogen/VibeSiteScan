/**
 * Plans, credits, and pricing — SINGLE SOURCE OF TRUTH.
 *
 * Everything about what a plan grants and what a scan costs lives here so the
 * pricing page, quota enforcement, Razorpay webhooks, and the UI all agree.
 * Prices are in Indian rupees (INR), matching Razorpay.
 */

export type PlanId = 'free' | 'pro' | 'studio';
export type ScanDepth = 'quick' | 'standard' | 'deep';

/** Credits a scan costs, by depth. Cost tracks compute. */
export const CREDIT_COST: Record<ScanDepth, number> = {
  quick: 1,
  standard: 2,
  deep: 5,
};

/**
 * Re-scanning the SAME url within this window costs 0 credits — rewards the
 * fix → re-verify loop instead of punishing it.
 */
export const FREE_RESCAN_WINDOW_MS = 15 * 60 * 1000;

/** Anonymous visitors get this many free quick checks before sign-in. */
export const ANON_FREE_QUICK_CHECKS = 2;

export interface Plan {
  id: PlanId;
  name: string;
  priceInr: number; // monthly; 0 for free
  razorpayPlanEnv?: string; // env var holding the Razorpay plan id (subscriptions)
  monthlyCredits: number;
  allowedDepths: ScanDepth[];
  features: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceInr: 0,
    monthlyCredits: 15,
    allowedDepths: ['quick', 'standard'],
    features: [
      '15 credits / month',
      'Quick + Launch checks',
      'Public certificate + badge',
      'Free re-verify within 15 min',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceInr: 99,
    razorpayPlanEnv: 'RAZORPAY_PLAN_PRO',
    monthlyCredits: 100,
    allowedDepths: ['quick', 'standard', 'deep'],
    popular: true,
    features: [
      '100 credits / month',
      'Quick + Launch + Deep checks',
      'Scan history',
      'PDF export',
      'Priority scanning',
    ],
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    priceInr: 299,
    razorpayPlanEnv: 'RAZORPAY_PLAN_STUDIO',
    monthlyCredits: 400,
    allowedDepths: ['quick', 'standard', 'deep'],
    features: [
      '400 credits / month',
      'Everything in Pro',
      'White-label certificates',
      'Client workspaces',
      'API access',
    ],
  },
};

/** One-time credit top-up packs (Razorpay Orders). Never expire. */
export interface CreditPack {
  id: string;
  name: string;
  priceInr: number;
  credits: number;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_60', name: 'Top-up 60', priceInr: 49, credits: 60 },
  { id: 'pack_150', name: 'Top-up 150', priceInr: 99, credits: 150 },
  { id: 'pack_350', name: 'Top-up 350', priceInr: 199, credits: 350 },
];

export function getPlan(planId: string | null | undefined): Plan {
  return PLANS[(planId as PlanId) || 'free'] || PLANS.free;
}

export function creditCost(depth: ScanDepth): number {
  return CREDIT_COST[depth] ?? 1;
}

export function planAllowsDepth(planId: string | null | undefined, depth: ScanDepth): boolean {
  return getPlan(planId).allowedDepths.includes(depth);
}

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}
