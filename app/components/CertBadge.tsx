/**
 * Live preview of the embeddable certificate badge. The canonical artifact is
 * the SVG served by /api/badge/[token]; this mirrors it for the certificate page.
 */

type Gate = 'pass' | 'conditional' | 'fail' | 'unverified';

const GATE: Record<Gate, { label: string; color: string; glyph: string }> = {
  pass: { label: 'VERIFIED', color: '#16a34a', glyph: '✓' },
  conditional: { label: 'CONDITIONAL', color: '#d97706', glyph: '!' },
  fail: { label: 'NOT VERIFIED', color: '#dc2626', glyph: '✕' },
  unverified: { label: 'UNVERIFIED', color: '#64748b', glyph: '?' },
};

export function CertBadge({
  gate,
  grade,
}: {
  token: string;
  gate: Gate;
  grade?: string | null;
}) {
  const g = GATE[gate] || GATE.unverified;
  return (
    <div
      className="inline-flex items-center gap-3 rounded-lg px-4 py-3 shrink-0"
      style={{ background: '#0d1117', border: `1px solid ${g.color}` }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center text-lg font-bold"
        style={{ background: `${g.color}22`, color: g.color, border: `1px solid ${g.color}` }}
      >
        {g.glyph}
      </div>
      <div className="leading-tight">
        <div className="text-[9px] font-mono tracking-widest text-white/50">VIBESITESCAN</div>
        <div className="text-sm font-mono font-bold tracking-wide" style={{ color: g.color }}>
          {g.label}
        </div>
      </div>
      {grade && (
        <div
          className="ml-1 w-8 h-8 rounded-md flex items-center justify-center text-base font-bold font-mono"
          style={{ background: `${g.color}18`, color: g.color, border: `1px solid ${g.color}55` }}
        >
          {grade}
        </div>
      )}
    </div>
  );
}
