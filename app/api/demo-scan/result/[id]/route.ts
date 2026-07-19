import { NextResponse } from 'next/server';
import { getReportByScanId } from '@/lib/persistence';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // In-memory fast path, then durable Supabase lookup (required on serverless).
  const stored = await getReportByScanId(id);
  if (!stored) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, scan: stored.scan, result: stored.result });
}
