# Deployment Guide

This guide will help you deploy Workin Out to production using GCP Cloud Run (backend) and Vercel (frontend).

## Prerequisites

1. Google Cloud account with billing enabled
2. Vercel account (free tier works)
3. `gcloud` CLI installed ([Install guide](https://cloud.google.com/sdk/docs/install))
4. Domain access to eamongreeley.com for DNS configuration

## Backend Deployment (GCP Cloud Run)

### Step 1: Set up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create workin-out --name="Workin Out"

# Set the project
gcloud config set project workin-out

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

### Step 2: Build and Deploy Backend

```bash
# Navigate to backend directory
cd backend

# Build the container image
gcloud builds submit --tag gcr.io/workin-out/backend

# Deploy to Cloud Run
gcloud run deploy workin-out-backend \
  --image gcr.io/workin-out/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,CORS_ORIGIN=https://workin-out.eamongreeley.com,DATABASE_PATH=/app/data/workouts.db" \
  --memory 512Mi \
  --cpu 1 \
  --port 3001

# Get the service URL
gcloud run services describe workin-out-backend --region us-central1 --format 'value(status.url)'
```

**Note:** The URL will be something like `https://workin-out-backend-xxxxx-uc.a.run.app`

### Step 3: Set up Custom Domain for Backend

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
  --service workin-out-backend \
  --domain api.eamongreeley.com \
  --region us-central1
```

This will give you DNS records to add to your domain. Add these to your DNS provider:
- Type: CNAME
- Name: api
- Value: (provided by gcloud command)

### Step 4: Persistent Storage for SQLite (Optional but Recommended)

Cloud Run is stateless, so the SQLite database will reset on container restart. For persistence:

**Option A: Use Cloud Storage FUSE (Recommended)**
1. Create a Cloud Storage bucket: `gsutil mb gs://workin-out-db`
2. Mount it to the container at `/app/data`
3. Update deployment with volume mount

**Option B: Switch to Cloud SQL PostgreSQL**
For production multi-user, migrate from SQLite to PostgreSQL using Cloud SQL.

For now, the SQLite file will persist between requests but may reset on container updates. You can manually backup/restore via:
```bash
# Backup (run inside container)
gcloud run services proxy workin-out-backend --region us-central1
# Then copy the .db file
```

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

```bash
cd frontend

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=https://api.eamongreeley.com/api
EOF
```

### Step 2: Deploy to Vercel

**Option A: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_API_URL production
# Enter: https://api.eamongreeley.com/api
```

**Option B: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from Git (or upload the `frontend` directory)
4. Set Framework Preset: Vite
5. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://api.eamongreeley.com/api`
6. Deploy

### Step 3: Configure Custom Domain

In Vercel Dashboard:
1. Go to your project → Settings → Domains
2. Add domain: `workin-out.eamongreeley.com`
3. Follow Vercel's DNS instructions to add records to your domain

Typical DNS records needed:
- Type: CNAME
- Name: workin-out
- Value: cname.vercel-dns.com

## DNS Configuration Summary

Add these records to eamongreeley.com DNS:

```
Type    Name        Value
CNAME   api         ghs.googlehosted.com (from gcloud output)
CNAME   workin-out  cname.vercel-dns.com
```

## Post-Deployment

### 1. Test the Deployment

```bash
# Test backend API
curl https://api.eamongreeley.com/health

# Test backend exercises
curl https://api.eamongreeley.com/api/exercises?workout_type=A

# Visit frontend
open https://workin-out.eamongreeley.com
```

### 2. Enable HTTPS (Automatic)
- Cloud Run: HTTPS enabled by default
- Vercel: HTTPS enabled by default with auto-renewal

### 3. Monitor and Logs

**Backend logs:**
```bash
gcloud run logs read workin-out-backend --region us-central1 --limit 50
```

**Vercel logs:**
- Check the Vercel dashboard for deployment and runtime logs

## Backup Strategy

### Manual Backup
```bash
# SSH into Cloud Run container (for debugging)
gcloud run services proxy workin-out-backend --region us-central1 &
curl http://localhost:8080/api/workouts > backup.json

# Or set up a cron job to backup the SQLite file
```

### Automated Backup (Recommended)
1. Create a Cloud Function that runs daily
2. Copies `/app/data/workouts.db` to Cloud Storage
3. Use Cloud Scheduler to trigger it

## Costs

**Free Tier Limits:**
- **Cloud Run:** 2M requests/month, 360K GB-seconds/month (likely free for single user)
- **Vercel:** Unlimited bandwidth, 100 GB-hours/month (free for hobby projects)
- **Cloud Storage:** 5 GB storage, 1 GB egress/month

Expected cost: **$0/month** for single user MVP

## Troubleshooting

### Backend won't start
```bash
# Check logs
gcloud run logs read workin-out-backend --region us-central1 --limit 50

# Common issues:
# - CORS_ORIGIN not set correctly
# - PORT must be 8080 or match --port flag
# - Database path not writable
```

### Frontend can't connect to backend
- Check VITE_API_URL is set correctly
- Verify CORS_ORIGIN on backend includes frontend URL
- Check both services are deployed and accessible

### Database resets on deploy
- This is expected with ephemeral Cloud Run storage
- Implement Cloud Storage FUSE or migrate to Cloud SQL
- Set up automated backups

## Rollback

```bash
# List revisions
gcloud run revisions list --service workin-out-backend --region us-central1

# Rollback to previous revision
gcloud run services update-traffic workin-out-backend \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

## Next Steps

After successful deployment:
1. ✅ Test all features in production
2. ✅ Add to iPhone home screen (PWA)
3. ✅ Set up automated database backups
4. ✅ Monitor usage and costs
5. ✅ Consider migrating to Cloud SQL for production data persistence
