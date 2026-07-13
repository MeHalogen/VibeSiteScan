/**
 * Plans, credits, and pricing — SINGLE SOURCE OF TRUTH.
 *
 * Everything about what a plan grants and what a scan costs lives here so the
 * pricing page, quota enforcement, Razorpay webhooks, and the UI all agree.
 * Prices are in Indian rupees (INR), matching Razorpay.
 */

export type PlanId = 'free' | 'starter' | 'agency';
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
  starter: {
    id: 'starter',
    name: 'Starter',
    priceInr: 799,
    razorpayPlanEnv: 'RAZORPAY_PLAN_STARTER',
    monthlyCredits: 250,
    allowedDepths: ['quick', 'standard', 'deep'],
    popular: true,
    features: [
      '250 credits / month',
      'Quick + Launch + Deep checks',
      'Scan history',
      'PDF export',
      'Priority scanning',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    priceInr: 1999,
    razorpayPlanEnv: 'RAZORPAY_PLAN_AGENCY',
    monthlyCredits: 1000,
    allowedDepths: ['quick', 'standard', 'deep'],
    features: [
      '1000 credits / month',
      'Everything in Starter',
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
  { id: 'pack_75', name: 'Top-up 75', priceInr: 199, credits: 75 },
  { id: 'pack_200', name: 'Top-up 200', priceInr: 499, credits: 200 },
  { id: 'pack_500', name: 'Top-up 500', priceInr: 999, credits: 500 },
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
