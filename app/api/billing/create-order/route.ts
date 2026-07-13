import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isRazorpayConfigured, createOrder } from '@/lib/razorpay';
import { getCreditPack } from '@/lib/plans';

const schema = z.object({ packId: z.string(), userId: z.string().optional() });

/** Create a Razorpay order for a one-time credit top-up pack. */
export async function POST(request: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Billing is not configured yet. Add Razorpay keys to enable purchases.' },
      { status: 503 }
    );
  }

  let packId: string;
  let userId: string | undefined;
  try {
    ({ packId, userId } = schema.parse(await request.json()));
  } catch {
    return NextResponse.json({ success: false, error: 'packId required' }, { status: 400 });
  }

  const pack = getCreditPack(packId);
  if (!pack) {
    return NextResponse.json({ success: false, error: 'Unknown pack' }, { status: 400 });
  }

  try {
    const order = await createOrder(pack.priceInr, {
      type: 'credit_pack',
      packId: pack.id,
      credits: String(pack.credits),
      userId: userId || '',
    });
    return NextResponse.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      pack,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 });
  }
}
