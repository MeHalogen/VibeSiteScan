#!/usr/bin/env node

/**
 * Limitation Checker
 * 
 * Run this script to see which limitations still exist in your LaunchScan setup.
 * 
 * Usage:
 *   node check-limitations.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 LaunchScan Limitation Checker\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const checks = [
  {
    name: 'Browser Automation (Puppeteer)',
    check: () => {
      try {
        require.resolve('puppeteer');
        return { status: '✅', message: 'Puppeteer installed - JS rendering available' };
      } catch {
        return { 
          status: '❌', 
          message: 'Puppeteer NOT installed - JS content not captured',
          fix: 'npm install puppeteer'
        };
      }
    }
  },
  {
    name: 'Browser Scanner Module',
    check: () => {
      const filePath = path.join(__dirname, 'lib', 'scanner', 'browserScanner.ts');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const isImplemented = !content.includes('TEMPORARY: Return mock data');
        if (isImplemented) {
          return { status: '✅', message: 'Browser scanner implemented' };
        } else {
          return { 
            status: '⚠️', 
            message: 'Browser scanner file exists but not implemented',
            fix: 'Uncomment the Puppeteer code in lib/scanner/browserScanner.ts'
          };
        }
      }
      return { 
        status: '❌', 
        message: 'Browser scanner module not found',
        fix: 'Create lib/scanner/browserScanner.ts (see ELIMINATE_LIMITATIONS.md)'
      };
    }
  },
  {
    name: 'Deep Scan UI Toggle',
    check: () => {
      const filePath = path.join(__dirname, 'app', 'dashboard', 'new-scan', 'page.tsx');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('scanMode') && content.includes('deep')) {
          return { status: '✅', message: 'Deep scan mode available in UI' };
        }
      }
      return { 
        status: '❌', 
        message: 'Deep scan toggle not added to UI',
        fix: 'Add scan mode radio buttons (see ELIMINATE_LIMITATIONS.md)'
      };
    }
  },
  {
    name: 'Form Testing',
    check: () => {
      const filePath = path.join(__dirname, 'lib', 'scanner', 'browserScanner.ts');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('testForm') && !content.includes('not yet implemented')) {
          return { status: '✅', message: 'Form testing implemented' };
        }
      }
      return { 
        status: '❌', 
        message: 'Form testing not implemented',
        fix: 'Uncomment testForm function in browserScanner.ts'
      };
    }
  },
  {
    name: 'Authentication Support',
    check: () => {
      const filePath = path.join(__dirname, 'app', 'dashboard', 'new-scan', 'page.tsx');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('cookies') || content.includes('authentication')) {
          return { status: '✅', message: 'Cookie authentication UI available' };
        }
      }
      return { 
        status: '❌', 
        message: 'Cookie authentication not available',
        fix: 'Add cookie input field (see ELIMINATE_LIMITATIONS.md Phase 2)'
      };
    }
  },
  {
    name: 'Enhanced Link Checking',
    check: () => {
      const filePath = path.join(__dirname, 'lib', 'scanner', 'index.ts');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('Retry failed HEAD') || content.includes('GET fallback')) {
          return { status: '✅', message: 'GET fallback for failed HEAD requests' };
        }
      }
      return { 
        status: '⚠️', 
        message: 'Only HEAD requests - some external links may false positive',
        fix: 'Implement GET fallback (see ELIMINATE_LIMITATIONS.md Phase 4)'
      };
    }
  },
];

// Run all checks
const results = checks.map(check => {
  console.log(`Checking: ${check.name}...`);
  return { name: check.name, ...check.check() };
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📊 RESULTS:\n');

results.forEach(result => {
  console.log(`${result.status} ${result.name}`);
  console.log(`   ${result.message}`);
  if (result.fix) {
    console.log(`   💡 Fix: ${result.fix}`);
  }
  console.log('');
});

// Summary
const passed = results.filter(r => r.status === '✅').length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📈 SCORE: ${passed}/${total} checks passed (${percentage}%)\n`);

if (percentage === 100) {
  console.log('🎉 ALL LIMITATIONS ELIMINATED! 🎉');
  console.log('Your scanner is now production-ready.\n');
} else if (percentage >= 50) {
  console.log('⚡ Good progress! A few more steps to eliminate all limitations.');
  console.log('See ELIMINATE_LIMITATIONS.md for implementation guide.\n');
} else {
  console.log('🚧 Just getting started! Follow ELIMINATE_LIMITATIONS.md to:');
  console.log('   1. Install Puppeteer');
  console.log('   2. Uncomment browser scanner code');
  console.log('   3. Add deep scan toggle to UI\n');
}

console.log('📚 Full implementation guide: ELIMINATE_LIMITATIONS.md\n');
