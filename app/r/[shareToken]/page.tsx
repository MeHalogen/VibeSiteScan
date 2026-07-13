import Link from 'next/link';
import { getScanByToken } from '@/lib/persistence';
import { CertBadge } from '@/app/components/CertBadge';

export const dynamic = 'force-dynamic';

type Gate = 'pass' | 'conditional' | 'fail' | 'unverified';

const GATE_UI: Record<
  Gate,
  { label: string; color: string; bg: string; border: string; glyph: string; sub: string }
> = {
  pass: {
    label: 'VibeSiteScan Verified',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.35)',
    glyph: '✓',
    sub: 'Security-clean and launch-ready',
  },
  conditional: {
    label: 'Conditional',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.35)',
    glyph: '!',
    sub: 'Scanned — some items to fix before you rely on it',
  },
  fail: {
    label: 'Not Verified',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.35)',
    glyph: '✕',
    sub: 'Launch blockers found',
  },
  unverified: {
    label: 'Unverified',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.3)',
    glyph: '?',
    sub: 'Not enough of the site could be verified',
  },
};

const GRADE_COLOR: Record<string, string> = {
  A: '#4ade80',
  B: '#84cc16',
  C: '#f59e0b',
  D: '#fb923c',
  F: '#f87171',
};

function freshness(scannedAt: string): { text: string; stale: boolean } {
  const then = new Date(scannedAt).getTime();
  if (!Number.isFinite(then)) return { text: 'unknown', stale: true };
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days <= 0) return { text: 'today', stale: false };
  if (days === 1) return { text: 'yesterday', stale: false };
  if (days < 30) return { text: `${days} days ago`, stale: days > 14 };
  return { text: `${Math.floor(days / 30)} month(s) ago`, stale: true };
}

export default async function CertificatePage({
  params,
}: {
  params: { shareToken: string };
}) {
  const record = await getScanByToken(params.shareToken);

  if (!record || !record.certification) {
    return (
      <div className="launch-console scanline-overlay min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="classified-stamp mb-4" style={{ borderColor: '#94a3b8', color: '#94a3b8' }}>
            NO CERTIFICATE
          </div>
          <h1 className="text-2xl font-bold mb-3 text-[var(--cream)] font-mono">
            Certificate not found
          </h1>
          <p className="text-[var(--cream)]/60 mb-6 text-sm">
            This certificate link is invalid, or it was generated in a dev session
            that has since restarted. Run a fresh scan to get a durable certificate.
          </p>
          <Link
            href="/dashboard/new-scan-pipeline"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-sm tracking-wide"
          >
            Scan a website
          </Link>
        </div>
      </div>
    );
  }

  const cert = record.certification;
  const gate: Gate = (cert.gate as Gate) || 'unverified';
  const ui = GATE_UI[gate];
  const fresh = freshness(record.scannedAt);
  const pillars = (cert.pillars || []) as Array<any>;
  const issues = (record.issues || []) as Array<any>;

  const bySeverity = (s: string) => issues.filter((i) => i.severity === s);
  const criticalIssues = bySeverity('critical');
  const warningIssues = bySeverity('warning');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const certUrl = `${appUrl}/r/${params.shareToken}`;

  return (
    <div className="launch-console scanline-overlay min-h-screen">
      {/* Header */}
      <header className="intel-panel-dark border-b ops-hairline px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="class-label text-[var(--cream)]/80">VibeSiteScan</span>
          <span className="classified-stamp text-[9px] hidden sm:inline">Certificate</span>
        </Link>
        <Link
          href="/dashboard/new-scan-pipeline"
          className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 rounded"
        >
          Scan your site
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
        {/* Seal */}
        <div
          className="intel-panel-dark rounded-2xl p-8 mb-6 text-center"
          style={{ borderColor: ui.border, background: ui.bg }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-bold"
              style={{ background: ui.bg, border: `2px solid ${ui.border}`, color: ui.color }}
            >
              {ui.glyph}
            </div>
            {cert.overallGrade && (
              <div
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center"
                style={{
                  border: `2px solid ${GRADE_COLOR[cert.overallGrade] || '#94a3b8'}`,
                  color: GRADE_COLOR[cert.overallGrade] || '#94a3b8',
                }}
              >
                <span className="text-3xl font-bold font-mono leading-none">{cert.overallGrade}</span>
                <span className="text-[9px] uppercase tracking-widest opacity-70">grade</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold font-mono mb-1" style={{ color: ui.color }}>
            {ui.label}
          </h1>
          <p className="text-[var(--cream)]/70 mb-4">{ui.sub}</p>
          <div className="font-mono text-sm text-[#4ade80] break-all mb-2">{record.targetUrl}</div>
          <div className="flex items-center justify-center gap-3 text-xs font-mono text-[var(--cream)]/50">
            <span>Scanned {fresh.text}</span>
            <span>·</span>
            <span>Coverage {cert.coverage}%</span>
            {cert.score != null && (
              <>
                <span>·</span>
                <span>Score {cert.score}/100</span>
              </>
            )}
          </div>
          {fresh.stale && (
            <div className="mt-3 text-xs font-mono text-amber-400/80">
              This certificate is aging — re-scan to confirm the site still passes.
            </div>
          )}
        </div>

        {/* Reasons */}
        {cert.reasons?.length > 0 && (
          <div className="intel-panel-dark rounded-xl p-5 mb-6 border-l-2" style={{ borderLeftColor: ui.color }}>
            <div className="ops-kicker mb-2">Why this verdict</div>
            <ul className="space-y-1.5">
              {cert.reasons.map((r: string, i: number) => (
                <li key={i} className="text-sm text-[var(--cream)]/80 flex gap-2">
                  <span style={{ color: ui.color }}>›</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pillars */}
        <div className="mb-6">
          <div className="ops-kicker mb-3 px-1">Pillar grades</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pillars.map((p: any) => {
              const c = p.grade ? GRADE_COLOR[p.grade] : '#64748b';
              return (
                <div key={p.key} className="intel-panel-dark rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--cream)]/60">
                      {p.label}
                    </span>
                    <span className="text-2xl font-bold font-mono" style={{ color: c }}>
                      {p.grade || '—'}
                    </span>
                  </div>
                  {p.grade ? (
                    <div className="text-[11px] font-mono text-[var(--cream)]/45">
                      {p.blockers > 0 && <span className="text-red-400">{p.blockers} blocker </span>}
                      {p.warnings > 0 && <span className="text-amber-400">{p.warnings} warn </span>}
                      {p.blockers === 0 && p.warnings === 0 && <span>clean</span>}
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-[var(--cream)]/35">
                      {p.notAssessedReason || 'not assessed'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Key issues with fixes */}
        {(criticalIssues.length > 0 || warningIssues.length > 0) && (
          <div className="intel-panel-dark rounded-xl mb-6 overflow-hidden">
            <div className="px-5 py-3 border-b ops-hairline flex items-center justify-between">
              <span className="ops-kicker">What to fix</span>
              <span className="text-xs font-mono text-[var(--cream)]/50">
                {criticalIssues.length} critical · {warningIssues.length} warnings
              </span>
            </div>
            <div className="divide-y divide-[rgba(237,232,220,0.08)]">
              {[...criticalIssues, ...warningIssues].slice(0, 12).map((issue: any, i: number) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider shrink-0"
                      style={{
                        background: issue.severity === 'critical' ? 'rgba(248,113,113,0.15)' : 'rgba(245,158,11,0.15)',
                        color: issue.severity === 'critical' ? '#f87171' : '#f59e0b',
                      }}
                    >
                      {issue.severity}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--cream)] mb-1">{issue.title}</div>
                      {issue.whatFound && (
                        <p className="text-xs text-[var(--cream)]/60 mb-1.5 leading-relaxed">{issue.whatFound}</p>
                      )}
                      {issue.developerFix && (
                        <p className="text-xs text-emerald-400/80 leading-relaxed">
                          <span className="opacity-60">Fix:</span> {issue.developerFix}
                        </p>
                      )}
                      <span className="inline-block mt-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--cream)]/35">
                        {issue.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embeddable badge */}
        <div className="intel-panel-dark rounded-xl p-5 mb-6">
          <div className="ops-kicker mb-3">Show the badge on your site</div>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <CertBadge token={params.shareToken} gate={gate} grade={cert.overallGrade} />
            <div className="flex-1 min-w-0 w-full">
              <p className="text-xs text-[var(--cream)]/55 mb-2">
                Paste this where you want the badge. It links back to this live certificate.
              </p>
              <pre className="text-[10.5px] font-mono bg-black/40 rounded-lg p-3 overflow-x-auto text-[var(--cream)]/80 whitespace-pre-wrap break-all">
{`<a href="${certUrl}" target="_blank" rel="noopener">
  <img src="${appUrl}/api/badge/${params.shareToken}" alt="VibeSiteScan certificate" width="200" height="60" />
</a>`}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs font-mono text-[var(--cream)]/40 mb-3">
            Independently scanned by VibeSiteScan · deterministic, evidence-based checks
          </p>
          <Link
            href="/dashboard/new-scan-pipeline"
            className="inline-block px-6 py-3 text-sm font-mono uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
          >
            Scan your own site
          </Link>
        </div>
      </div>
    </div>
  );
}
