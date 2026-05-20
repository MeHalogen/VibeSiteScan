import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;
  
  try {
    const { data: issues, error } = await supabaseAdmin
      .from('scan_issues')
      .select('severity, category, title, description, fix_suggestion, evidence, status')
      .eq('scan_id', scanId);
    
    if (error) throw error;
    
    // Generate CSV
    const headers = ['Severity', 'Category', 'Title', 'Description', 'Fix Suggestion', 'Evidence', 'Status'];
    const rows = issues?.map(issue => [
      issue.severity,
      issue.category,
      `"${(issue.title || '').replace(/"/g, '""')}"`,
      `"${(issue.description || '').replace(/"/g, '""')}"`,
      `"${(issue.fix_suggestion || '').replace(/"/g, '""')}"`,
      `"${(issue.evidence || '').replace(/"/g, '""')}"`,
      issue.status
    ]) || [];
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="scan-${scanId}-issues.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
