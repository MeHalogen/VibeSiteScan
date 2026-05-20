"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/design-system';

type ScanTier = 'quick' | 'launch' | 'deep';

export default function ScanInputPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [selectedTier, setSelectedTier] = useState<ScanTier>('launch');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tiers = [
    {
      id: 'quick' as ScanTier,
      name: 'Quick check',
      description: 'homepage only',
      duration: '~5s',
      free: true,
    },
    {
      id: 'launch' as ScanTier,
      name: 'Launch check',
      description: 'all routes',
      duration: '~45s',
      free: true,
    },
    {
      id: 'deep' as ScanTier,
      name: 'Deep scan',
      description: '100 pages, screenshots',
      duration: '1–3min',
      pro: true,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSubmitting(true);
    
    // Navigate to pipeline with URL and tier as query params
    const params = new URLSearchParams({
      url: url.trim(),
      mode: selectedTier,
    });
    
    router.push(`/dashboard/new-scan-pipeline?${params.toString()}`);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: colors.bgBase }}
    >
      <div className="w-full max-w-[560px] text-center">
        {/* Eyebrow */}
        <div 
          className="font-mono text-[10px] uppercase tracking-[0.1em] mb-8"
          style={{ color: colors.textTertiary }}
        >
          LAUNCHSCAN · FORENSIC_AUDIT_v2
        </div>

        {/* Heading */}
        <h1 
          className="text-[32px] font-medium mb-3"
          style={{ 
            color: colors.textPrimary,
            fontWeight: 500,
          }}
        >
          Check before you ship.
        </h1>

        {/* Subtext */}
        <p 
          className="text-base mb-12"
          style={{ color: colors.textSecondary }}
        >
          Catch what AI builders miss.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-site.com"
            className="w-full h-[44px] px-4 font-mono text-sm rounded-md transition-all"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.borderSubtle}`,
              color: colors.textPrimary,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.tealPrimary;
              e.target.style.boxShadow = `0 0 0 3px ${colors.tealGlow}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.borderSubtle;
              e.target.style.boxShadow = 'none';
            }}
            disabled={isSubmitting}
          />

          {/* Tier Selection */}
          <div className="flex gap-3">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => !tier.pro && setSelectedTier(tier.id)}
                disabled={tier.pro || isSubmitting}
                className="flex-1 px-4 py-3 rounded-[99px] text-sm font-medium transition-all"
                style={{
                  backgroundColor: selectedTier === tier.id ? colors.tealGlow : colors.surface,
                  border: selectedTier === tier.id 
                    ? `1px solid ${colors.tealPrimary}` 
                    : `1px solid ${colors.borderSubtle}`,
                  color: tier.pro ? colors.textTertiary : colors.textPrimary,
                  cursor: tier.pro ? 'not-allowed' : 'pointer',
                  opacity: tier.pro ? 0.5 : 1,
                }}
              >
                <div className="font-medium">{tier.name}</div>
                <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {tier.description} · {tier.duration}
                  {tier.pro && ' · PRO'}
                  {tier.free && ' · free'}
                </div>
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <button
            type="submit"
            disabled={!url.trim() || isSubmitting}
            className="w-full h-[44px] rounded-md font-medium text-white transition-all"
            style={{
              backgroundColor: colors.tealPrimary,
              opacity: (!url.trim() || isSubmitting) ? 0.5 : 1,
              cursor: (!url.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (url.trim() && !isSubmitting) {
                e.currentTarget.style.transform = 'scale(1.01)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isSubmitting ? 'Starting scan...' : 'Run Launch Check →'}
          </button>

          {/* Footer note */}
          <p 
            className="text-xs"
            style={{ color: colors.textTertiary }}
          >
            No code required · Works with Netlify / Vercel · Public pages only
          </p>
        </form>
      </div>
    </div>
  );
}
