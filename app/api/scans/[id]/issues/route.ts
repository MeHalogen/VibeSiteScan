import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;
  
  try {
    const { data, error } = await supabaseAdmin
      .from('scan_issues')
      .select('*')
      .eq('scan_id', scanId)
      .order('severity', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}
