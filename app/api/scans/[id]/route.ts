import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;
  
  try {
    const { data, error } = await supabaseAdmin
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching scan:', error);
    return NextResponse.json(
      { error: 'Scan not found' },
      { status: 404 }
    );
  }
}
