# LaunchScan

**LaunchScan** is a one-click pre-launch website QA scanner for freelancers, web agencies, SEO teams, and startup founders. Scan any website for broken links, SEO issues, forms, and mobile readiness before your clients or customers find the problems.

## 🌟 Features

- **Homepage & Multi-Page Scanning**: Quick scan (homepage only) or Standard scan (up to 25 pages)
- **Broken Link Detection**: Find all 404s and dead links
- **SEO Analysis**: Title, meta descriptions, H1 headings, canonical URLs
- **Social Media Preview**: Open Graph and Twitter card validation
- **Mobile Readiness**: Viewport configuration checks
- **Form Analysis**: Detect forms and accessibility issues
- **Launch Score**: 0-100 score based on issues found
- **Shareable Reports**: Generate public share links
- **Export Options**: CSV and PDF export

## 🛠 Tech Stack

- Next.js 14 (App Router), React, TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Custom scanner using Cheerio and cross-fetch
- Vercel-ready deployment

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
1. Create project at supabase.com
2. Run SQL migration from supabase/migrations/001_init.sql
3. Get API keys from Project Settings > API

### 3. Configure Environment
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 📊 How It Works

1. User enters URL and selects scan depth
2. Scanner fetches homepage + discovers internal links
3. Analyzes SEO metadata, forms, broken links
4. Calculates Launch Score (0-100)
5. Saves results to Supabase
6. Displays report with issues, fixes, and export options

## 🛣 Roadmap

**MVP (Current):**
- ✅ URL scanning
- ✅ Broken links
- ✅ SEO checks
- ✅ Share links
- ✅ CSV/PDF export

**Future:**
- Auth integration
- Usage limits
- Scheduled scans
- Email alerts
- White-label reports
- Agency workspaces

## 📝 License

MIT - Built for freelancers and agencies 🚀
