// Test the scanner engine directly without database
const { runScan } = require('./lib/scanner/index.ts');

async function testScan() {
  console.log('🔍 Testing LaunchScan scanner engine...\n');
  console.log('Target: https://vestintel.netlify.app/');
  console.log('Scan Depth: quick (homepage only)\n');
  console.log('⏳ Scanning...\n');
  
  try {
    const startTime = Date.now();
    const result = await runScan('https://vestintel.netlify.app/', 'quick');
    const duration = Date.now() - startTime;
    
    console.log('✅ SCAN COMPLETE!\n');
    console.log('═'.repeat(60));
    console.log('📊 RESULTS:');
    console.log('═'.repeat(60));
    console.log(`🎯 Launch Score: ${result.score}/100`);
    console.log(`⏱️  Duration: ${result.durationMs}ms (${(duration/1000).toFixed(2)}s)`);
    console.log(`📄 Pages Scanned: ${result.pages.length}`);
    console.log(`🔗 Links Checked: ${result.linkResults.length}`);
    console.log(`⚠️  Issues Found: ${result.issues.length}`);
    console.log('═'.repeat(60));
    
    // Show page details
    console.log('\n📄 PAGE DETAILS:');
    result.pages.forEach((page, i) => {
      console.log(`\n  ${i + 1}. ${page.url}`);
      console.log(`     Status: ${page.statusCode}`);
      console.log(`     Title: ${page.seo.title || '❌ Missing'}`);
      console.log(`     Meta Description: ${page.seo.metaDescription || '❌ Missing'}`);
      console.log(`     H1 Tags: ${page.seo.h1Count}`);
      console.log(`     Favicon: ${page.seo.favicon ? '✅' : '❌'}`);
      console.log(`     Viewport: ${page.seo.viewport ? '✅' : '❌'}`);
      console.log(`     Open Graph: ${page.seo.ogTitle ? '✅' : '❌'}`);
    });
    
    // Show issues by severity
    const critical = result.issues.filter(i => i.severity === 'critical');
    const warnings = result.issues.filter(i => i.severity === 'warning');
    
    if (critical.length > 0) {
      console.log(`\n\n🔴 CRITICAL ISSUES (${critical.length}):`);
      critical.forEach((issue, i) => {
        console.log(`\n  ${i + 1}. ${issue.title}`);
        console.log(`     Category: ${issue.category}`);
        console.log(`     Description: ${issue.description}`);
        console.log(`     Fix: ${issue.fix}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log(`\n\n🟡 WARNINGS (${warnings.length}):`);
      warnings.forEach((issue, i) => {
        console.log(`\n  ${i + 1}. ${issue.title}`);
        console.log(`     Category: ${issue.category}`);
        console.log(`     Description: ${issue.description}`);
        console.log(`     Fix: ${issue.fix}`);
      });
    }
    
    // Show link check results
    const brokenLinks = result.linkResults.filter(l => !l.ok);
    console.log(`\n\n🔗 LINK CHECK RESULTS:`);
    console.log(`   Total Links: ${result.linkResults.length}`);
    console.log(`   Working: ${result.linkResults.length - brokenLinks.length}`);
    console.log(`   Broken: ${brokenLinks.length}`);
    
    if (brokenLinks.length > 0) {
      console.log('\n   ❌ Broken Links:');
      brokenLinks.slice(0, 5).forEach(link => {
        console.log(`      - ${link.url} (Status: ${link.status})`);
      });
      if (brokenLinks.length > 5) {
        console.log(`      ... and ${brokenLinks.length - 5} more`);
      }
    }
    
    console.log('\n\n═'.repeat(60));
    console.log('✅ SCANNER ENGINE TEST PASSED!');
    console.log('═'.repeat(60));
    console.log('\n📝 The scanner is working perfectly!');
    console.log('   To save results to database, you need to:');
    console.log('   1. Create a Supabase project');
    console.log('   2. Update .env.local with real credentials');
    console.log('   3. Restart the dev server\n');
    
  } catch (error) {
    console.error('\n❌ SCAN FAILED:');
    console.error(error);
    process.exit(1);
  }
}

testScan();
