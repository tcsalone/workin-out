# Quick Deployment Guide

Follow these steps to deploy Workin Out to production.

## Prerequisites Check

Do you have:
- [ ] Google Cloud account with billing enabled?
- [ ] Vercel account (free tier)?
- [ ] Access to manage DNS for eamongreeley.com?

## Step 1: Deploy Backend to GCP Cloud Run

### Option A: Use the deploy script (easiest)

```bash
cd /Users/egreeley/claude/workin_out
./deploy-backend.sh
```

### Option B: Manual deployment

```bash
# 1. Login to Google Cloud
gcloud auth login

# 2. Create/set project
gcloud projects create workin-out --name="Workin Out"
gcloud config set project workin-out

# 3. Enable required services
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# 4. Build and deploy
cd backend
gcloud builds submit --tag gcr.io/workin-out/backend

gcloud run deploy workin-out-backend \
  --image gcr.io/workin-out/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,CORS_ORIGIN=https://workin-out.eamongreeley.com,DATABASE_PATH=/app/data/workouts.db,PORT=8080" \
  --memory 512Mi \
  --port 8080
```

**Save the service URL** you get at the end (e.g., `https://workin-out-backend-xxxxx-uc.a.run.app`)

## Step 2: Deploy Frontend to Vercel

### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod

# When prompted:
# - Link to existing project? No
# - Project name: workin-out
# - In which directory is your code? ./
# - Want to override settings? No

# Set environment variable
vercel env add VITE_API_URL production
# Enter: https://api.eamongreeley.com/api
```

### Option B: Vercel Dashboard (Easier)

1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. If using Git: Import your repository
4. If not using Git: Use "Deploy" button and drag the `frontend` folder
5. Configure:
   - Framework Preset: **Vite**
   - Root Directory: Leave as is
   - Build Command: `npm run build` (should auto-detect)
   - Output Directory: `dist` (should auto-detect)
6. Add Environment Variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://api.eamongreeley.com/api`
7. Click "Deploy"

**Save the deployment URL** (e.g., `https://workin-out-xxxxx.vercel.app`)

## Step 3: Configure Custom Domains

### Backend Domain (api.eamongreeley.com)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service workin-out-backend \
  --domain api.eamongreeley.com \
  --region us-central1
```

This will output DNS records. **Copy them for Step 4.**

### Frontend Domain (workin-out.eamongreeley.com)

In Vercel Dashboard:
1. Go to your project → Settings → Domains
2. Add domain: `workin-out.eamongreeley.com`
3. **Copy the DNS records shown** for Step 4

## Step 4: Update DNS Records

Log in to your DNS provider for eamongreeley.com and add these records:

**For Backend (api.eamongreeley.com):**
```
Type: CNAME
Name: api
Value: <value from gcloud command>
```

**For Frontend (workin-out.eamongreeley.com):**
```
Type: CNAME
Name: workin-out
Value: cname.vercel-dns.com
```

**DNS propagation takes 5-60 minutes.** You can check progress at: https://dnschecker.org

## Step 5: Test Your Deployment

After DNS propagates, test:

```bash
# Test backend health
curl https://api.eamongreeley.com/health

# Test backend API
curl https://api.eamongreeley.com/api/exercises?workout_type=A

# Open frontend in browser
open https://workin-out.eamongreeley.com
```

## Step 6: Install as PWA on iPhone

1. Open https://workin-out.eamongreeley.com in Safari on your iPhone
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "Workin Out"
5. Tap "Add"

Now you have a native-feeling app on your home screen!

## Troubleshooting

### "Failed to fetch" or CORS errors
- Make sure `CORS_ORIGIN` on backend matches your frontend URL exactly
- Redeploy backend if you changed it

### Backend URL not working
- Check DNS has propagated: `dig api.eamongreeley.com`
- May take up to 1 hour for DNS to fully propagate

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` environment variable is set in Vercel
- Make sure you're using the `/api` path (not just the domain)

## Backup Your Data

**Important:** Cloud Run storage is ephemeral. Your SQLite database will persist between requests but may reset on deployments.

To backup manually:
```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe workin-out-backend --region us-central1 --format 'value(status.url)')

# Download workout data
curl $SERVICE_URL/api/workouts > backup-$(date +%Y%m%d).json
```

For production use, consider setting up automated backups or migrating to Cloud SQL.

## What's Next?

- ✅ Test all features in production
- ✅ Start logging your workouts!
- ✅ Set up automated database backups
- ✅ Monitor GCP/Vercel dashboards for any issues
- ✅ Consider upgrading to Cloud SQL for better data persistence

## Need Help?

- Backend logs: `gcloud run logs read workin-out-backend --region us-central1 --limit 50`
- Vercel logs: Check your Vercel dashboard
- Full docs: See DEPLOYMENT.md
