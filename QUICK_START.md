# 🚀 Quick Start Guide

## Get VibeSiteScan Running in 5 Minutes

### Step 1: Install Dependencies (1 min)
```bash
npm install
```

### Step 2: Set Up Supabase (2 min)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Name: "vibesitescan" (or whatever you want)
   - Database Password: (save this securely)
   - Region: Choose closest to you
   - Wait for project to be created (~2 minutes)

2. **Run Database Migration**
   - In Supabase dashboard, click "SQL Editor" (left sidebar)
   - Click "New Query"
   - Copy the entire contents of `supabase/migrations/001_init.sql`
   - Paste into the SQL editor
   - Click "Run" button
   - You should see "Success. No rows returned"

3. **Get Your API Keys**
   - Click "Project Settings" (gear icon in sidebar)
   - Click "API" in the left menu
   - Copy these values:
     - **URL**: Your project URL (looks like `https://xxxxx.supabase.co`)
     - **anon public**: Your anon/public key (long string)
     - **service_role**: Your service role key (long string, keep secret!)

### Step 3: Configure Environment (1 min)

Create `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the `xxxxx` and `your-*-key-here` with your actual values from Step 2.

### Step 4: Start the App (1 min)

```bash
npm run dev
```

Visit http://localhost:3000 (or whatever port is shown)

### Step 5: Test It!

1. Click **"Run free scan"**
2. Enter a website URL (try: `example.com` or any website you own)
3. Select **"Standard scan"** for full analysis
4. Click **"Start Scan"**
5. Wait 10-60 seconds (depends on website size)
6. View your report! 🎉

---

## What to Test

### Basic Flow
- ✅ Landing page loads
- ✅ Can create a new scan
- ✅ Scan completes successfully
- ✅ Dashboard shows scan in history
- ✅ Can view detailed report
- ✅ Can filter issues (All/Critical/Warnings)

### Export Features
- ✅ Click "Export CSV" - downloads CSV file
- ✅ Click "Export PDF" - generates and downloads PDF
- ✅ Click "Share Report" - creates public link, copies to clipboard
- ✅ Visit public link `/r/xxxxx` - works without login

### Example URLs to Test
- `example.com` - Simple site, fast scan
- `github.com` - More complex, finds more issues
- Your own website - See real issues!

---

## Troubleshooting

### "Scan failed" or connection errors
- ✅ Check `.env.local` has correct Supabase credentials
- ✅ Check Supabase project is running (not paused)
- ✅ Check SQL migration was run successfully

### "Cannot find module" errors
- ✅ Run `npm install` again
- ✅ Delete `node_modules` and `.next` folders, then `npm install`

### Port already in use
- ✅ Next.js will automatically try ports 3001, 3002, etc.
- ✅ Or specify a port: `npm run dev -- -p 3005`

### Scan takes too long or times out
- ✅ Try "Quick scan" first (homepage only, faster)
- ✅ Try a simpler website
- ✅ Standard scan of large sites can take 30-60 seconds (normal)

---

## What's Next?

Once you've tested the basic flow:

1. **Customize the branding** - Update logo, colors in the code
2. **Enable authentication** - Follow Supabase Auth documentation
3. **Deploy to Vercel** - `vercel` command or connect GitHub repo
4. **Add your domain** - Configure in Vercel settings
5. **Set up billing** - Integrate Stripe or Razorpay for paid plans

---

## Need Help?

- 📖 Read `README.md` for full documentation
- 📊 Check `IMPLEMENTATION_SUMMARY.md` for technical details
- 🗄️ Review `supabase/migrations/001_init.sql` for database schema
- 💬 The code is well-commented and organized

---

## Pro Tips

### Testing Quickly
```bash
# Skip manual testing, scan directly via API:
curl -X POST http://localhost:3000/api/scans \
  -H "Content-Type: application/json" \
  -d '{"url":"example.com","depth":"quick"}'

# Then run the scan (copy ID from above):
curl -X POST http://localhost:3000/api/scans/YOUR-SCAN-ID/run
```

### Sample Data
The app doesn't have seed data, but every scan you run creates real data in your Supabase database. Run 2-3 scans on different websites to populate your dashboard.

### Development
- Hot reload works - edit any file and see changes instantly
- Check browser console for any errors
- Use Supabase Table Editor to view database records

---

**You're all set! Happy scanning! 🚀**
