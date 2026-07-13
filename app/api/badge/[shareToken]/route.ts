import { getScanByToken } from '@/lib/persistence';

export const dynamic = 'force-dynamic';

type Gate = 'pass' | 'conditional' | 'fail' | 'unverified';

const GATE: Record<Gate, { label: string; color: string; glyph: string }> = {
  pass: { label: 'VERIFIED', color: '#16a34a', glyph: '✓' },
  conditional: { label: 'CONDITIONAL', color: '#d97706', glyph: '!' },
  fail: { label: 'NOT VERIFIED', color: '#dc2626', glyph: '✕' },
  unverified: { label: 'UNVERIFIED', color: '#64748b', glyph: '?' },
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function badgeSvg(gate: Gate, grade?: string | null): string {
  const g = GATE[gate] || GATE.unverified;
  const gradeBox = grade
    ? `<g transform="translate(160,10)">
         <rect width="30" height="40" rx="6" fill="${g.color}22" stroke="${g.color}" stroke-opacity="0.5"/>
         <text x="15" y="27" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="18" font-weight="700" fill="${g.color}">${esc(grade)}</text>
       </g>`
    : '';
  const width = grade ? 200 : 168;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="60" viewBox="0 0 ${width} 60" role="img" aria-label="VibeSiteScan ${esc(g.label)}">
  <rect width="${width}" height="60" rx="8" fill="#0d1117" stroke="${g.color}" stroke-opacity="0.9"/>
  <g transform="translate(12,10)">
    <rect width="40" height="40" rx="6" fill="${g.color}22" stroke="${g.color}"/>
    <text x="20" y="28" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="20" font-weight="700" fill="${g.color}">${esc(g.glyph)}</text>
  </g>
  <text x="62" y="26" font-family="ui-monospace,Menlo,monospace" font-size="9" letter-spacing="2" fill="#ffffff80">VIBESITESCAN</text>
  <text x="62" y="42" font-family="ui-monospace,Menlo,monospace" font-size="13" font-weight="700" letter-spacing="0.5" fill="${g.color}">${esc(g.label)}</text>
  ${gradeBox}
</svg>`;
}

export async function GET(
  _req: Request,
  { params }: { params: { shareToken: string } }
) {
  const record = await getScanByToken(params.shareToken);
  const gate = (record?.certification?.gate as Gate) || 'unverified';
  const grade = record?.certification?.overallGrade ?? null;

  const svg = badgeSvg(gate, grade);
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Short cache so a re-scan updates the badge reasonably quickly.
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
