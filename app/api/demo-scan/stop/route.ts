import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requestStop } from '@/lib/scan-control';

const schema = z.object({ scanId: z.string().min(1) });

/**
 * Ask a running scan to stop at its next checkpoint. The scan then finalizes a
 * partial result over its existing stream — this endpoint only flips the flag.
 */
export async function POST(request: Request) {
  let scanId: string;
  try {
    ({ scanId } = schema.parse(await request.json()));
  } catch {
    return NextResponse.json({ success: false, error: 'scanId required' }, { status: 400 });
  }

  const found = requestStop(scanId);
  return NextResponse.json({ success: true, acknowledged: found });
}
