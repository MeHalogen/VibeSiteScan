import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 10; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;
  
  try {
    const shareToken = generateShareToken();
    
    const { error } = await supabaseAdmin
      .from('scans')
      .update({ share_token: shareToken })
      .eq('id', scanId);
    
    if (error) throw error;
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${appUrl}/r/${shareToken}`;
    
    return NextResponse.json({ shareToken, shareUrl });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
