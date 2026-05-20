import { NextResponse } from 'next/server';
import { demoStoreGet } from '@/lib/demo-scan-store';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const stored = demoStoreGet(id);
  if (!stored) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, scan: stored.scan, result: stored.result });
}

