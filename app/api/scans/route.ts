import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const createScanSchema = z.object({
  url: z.string().url().or(z.string().min(3)),
  depth: z.enum(['quick', 'standard']).default('quick')
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, depth } = createScanSchema.parse(body);
    
    // For MVP: Allow anonymous scans or get user from auth header
    // In production, you'd get the user from session/JWT
    const userId = null; // TODO: Get from auth session
    
    // Create scan record
    const { data: scan, error } = await supabaseAdmin
      .from('scans')
      .insert({
        user_id: userId,
        target_url: url,
        normalized_url: url,
        scan_depth: depth,
        status: 'queued'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ scan });
  } catch (error) {
    console.error('Error creating scan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create scan' },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get recent scans (limit to 50)
    const { data: scans, error } = await supabaseAdmin
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    return NextResponse.json({ scans });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scans' },
      { status: 500 }
    );
  }
}
