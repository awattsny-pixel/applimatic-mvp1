# Deploying Applimatic to Railway

## Quick Setup (Recommended)

### Step 1: Create Railway Project
1. Go to https://railway.app
2. Sign in or create an account
3. Click "New Project" → "Deploy from GitHub"
4. Connect your GitHub account and select the `applimatic-mvp1` repository

### Step 2: Configure Environment Variables
In the Railway dashboard, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get these values from:
- **Supabase**: Project Settings → API
- **Anthropic**: Your API keys page

### Step 3: Database Setup (If First Deploy)
Run migrations on your Supabase database:

1. In Supabase, open the SQL Editor
2. Run the migrations from `/migrations/` directory:
   - `002_create_saved_jobs.sql`
   - `003_create_tailored_resumes.sql`

### Step 4: Deploy
Railway automatically deploys when you push to GitHub:

```bash
# From your local machine
git add .
git commit -m "Deploy to Railway"
git push origin main
```

Railway will:
1. Detect Next.js project
2. Install dependencies (`npm install`)
3. Build the app (`npm run build`)
4. Start the server (`npm start`)

## Manual Deploy (Alternative)

If you don't want to use GitHub integration:

### Via Railway CLI
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Environment Variables Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- [ ] `SUPABASE_SERVICE_KEY` - Private service role key
- [ ] `ANTHROPIC_API_KEY` - Claude API key

## Testing After Deploy

Once deployed, Railway will provide a URL like: `https://applimatic-xxxx.railway.app`

Test these endpoints:

1. **Home**: `https://your-railway-url/`
2. **Dashboard**: `https://your-railway-url/dashboard`
3. **Applications**: `https://your-railway-url/dashboard/applications`
4. **Tailor**: `https://your-railway-url/dashboard/tailor`

## Troubleshooting

### Build fails with "Failed to load SWC binary"
- This is expected in some environments
- Railway's Nixpacks builder should handle this automatically
- If it fails, you may need to add a build script

### Environment variables not found
- Ensure all variables are set in Railway's dashboard
- Prefix public variables with `NEXT_PUBLIC_`
- Restart the deployment after updating variables

### Database connection errors
- Verify Supabase credentials in environment variables
- Check that migrations have been run
- Ensure database is accessible from Railway's servers

## Monitoring

In Railway dashboard:
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, network
- **Deploys**: Track deployment history and rollback if needed

## Scaling

To handle more traffic:
1. Increase instance size in Railway settings
2. Add more replicas (load balancing)
3. Configure auto-scaling based on CPU/memory

## Support

- Railway docs: https://docs.railway.app
- Applimatic issues: Check `/CLAUDE.md` in this repo
