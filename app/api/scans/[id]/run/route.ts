import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runScan } from '@/lib/scanner';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;
  
  try {
    // Get scan record
    const { data: scan, error: fetchError } = await supabaseAdmin
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();
    
    if (fetchError || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }
    
    // Update status to running
    await supabaseAdmin
      .from('scans')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', scanId);
    
    // Run the scan
    const result = await runScan(scan.target_url, scan.scan_depth as 'quick' | 'standard');
    
    // Save pages
    const pagesToInsert = result.pages.map(page => ({
      scan_id: scanId,
      url: page.url,
      status_code: page.statusCode,
      title: page.seo.title,
      meta_description: page.seo.metaDescription,
      h1_count: page.seo.h1Count,
      has_canonical: page.seo.canonical,
      has_og_title: page.seo.ogTitle,
      has_og_description: page.seo.ogDescription,
      has_og_image: page.seo.ogImage,
      has_twitter_card: page.seo.twitterCard,
      has_favicon: page.seo.favicon,
      has_viewport: page.seo.viewport,
      robots_noindex: page.seo.robotsNoindex
    }));
    
    if (pagesToInsert.length > 0) {
      await supabaseAdmin.from('scan_pages').insert(pagesToInsert);
    }
    
    // Save issues
    const issuesToInsert = result.issues.map(issue => ({
      scan_id: scanId,
      severity: issue.severity,
      category: issue.category,
      title: issue.title,
      description: issue.description,
      fix_suggestion: issue.fix,
      evidence: issue.page || issue.evidence || ''
    }));
    
    if (issuesToInsert.length > 0) {
      await supabaseAdmin.from('scan_issues').insert(issuesToInsert);
    }
    
    // Save links
    const linksToInsert = result.linkResults.map(link => ({
      scan_id: scanId,
      source_url: link.sourceUrl || '',
      target_url: link.targetUrl,
      status_code: link.status,
      is_broken: !link.ok,
      is_redirect: link.isRedirect,
      error_message: link.error || null
    }));
    
    if (linksToInsert.length > 0) {
      await supabaseAdmin.from('scan_links').insert(linksToInsert);
    }
    
    // Update scan with results
    const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
    const warningCount = result.issues.filter(i => i.severity === 'warning').length;
    
    await supabaseAdmin
      .from('scans')
      .update({
        status: 'completed',
        launch_score: result.score,
        critical_count: criticalCount,
        warning_count: warningCount,
        pages_scanned: result.pages.length,
        completed_at: new Date().toISOString(),
        duration_ms: result.durationMs
      })
      .eq('id', scanId);
    
    return NextResponse.json({ result, scanId });
  } catch (error) {
    console.error('Error running scan:', error);
    
    // Update scan with error
    await supabaseAdmin
      .from('scans')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      })
      .eq('id', scanId);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    );
  }
}
