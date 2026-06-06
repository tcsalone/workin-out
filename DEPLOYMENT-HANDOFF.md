# Workin Out - Deployment Handoff

## Project Overview

**Workin Out** is a mobile-friendly workout tracking Progressive Web App (PWA) designed for tracking gym workouts on iPhone. The app tracks two alternating workout routines (Workout A and Workout B) with features optimized for use in a chaotic gym environment.

### Key Features
- Mobile-first design with large touch targets
- Plate calculator for barbell exercises (45, 35, 25, 10, 5, 2.5 lb plates)
- Simple weight input for machine/dumbbell exercises
- Progressive warmup sets (50% and 75% of working weight)
- 2 warmup + 3 working sets default (customizable with +/- buttons)
- Workout history tracking
- Installable as PWA on iPhone (no App Store needed)
- Dark theme optimized for gym lighting

### Technology Stack

**Backend:**
- Node.js 18+ with Express
- SQLite database (simple, file-based, easy to backup)
- RESTful API
- Deployed to: GCP Cloud Run (containerized)

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- TanStack Query (React Query) for data management
- PWA support via vite-plugin-pwa
- Deployed to: Vercel

**Domain Structure:**
- Frontend: `https://workin-out.eamongreeley.com`
- Backend API: `https://api.eamongreeley.com`

## Current State

### What Has Been Built ✅

1. **Backend API** - Fully functional with endpoints for:
   - Exercises (GET, POST, PUT, DELETE)
   - Workouts (GET, POST, PUT, DELETE)
   - Workout Sets (POST, PUT, DELETE)
   - Stats (next workout suggestion, last weight, history, progress)

2. **Database Schema** - SQLite with tables for:
   - `workouts` - Each gym session
   - `exercises` - Exercise templates for Workout A and B
   - `workout_sets` - Individual sets performed
   - Fully seeded with user's actual workout routines

3. **Frontend Application** - Complete React SPA with:
   - Workout start screen with A/B suggestion
   - Exercise input screens with plate calculator
   - Workout history view
   - Mobile-optimized UI
   - PWA manifest and service worker

4. **Deployment Configuration**:
   - `backend/Dockerfile` - Ready for GCP Cloud Run
   - `backend/.dockerignore` - Optimized for container builds
   - `deploy-backend.sh` - Automated deployment script
   - Environment variable examples

### What Needs To Be Done 🚀

1. Deploy backend to GCP Cloud Run
2. Deploy frontend to Vercel
3. Configure DNS records for custom domains
4. Test the deployed application
5. Install PWA on iPhone

## Prerequisites

Before starting deployment, ensure you have:

### Required Accounts
- [ ] **Google Cloud account** with billing enabled
  - Free tier: 2M requests/month, 360K GB-seconds/month
  - Expected cost: $0/month for single user
  - Sign up: https://cloud.google.com/free
  
- [ ] **Vercel account** (free tier)
  - Unlimited bandwidth on hobby plan
  - Sign up: https://vercel.com/signup

- [ ] **DNS access** to eamongreeley.com
  - Need ability to add CNAME records

### Required Software
- [ ] **gcloud CLI** installed
  - Install: https://cloud.google.com/sdk/docs/install
  - Verify: `gcloud version`
  
- [ ] **Node.js 18+** (already installed on dev machine)
  - Verify: `node --version`
  
- [ ] **Git** (for pushing to GitHub)
  - Verify: `git --version`

### Optional but Recommended
- [ ] **Vercel CLI** for command-line deployment
  - Install: `npm i -g vercel`

## Detailed Deployment Steps

### STEP 1: Deploy Backend to GCP Cloud Run

#### 1.1: Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# This will open a browser window for authentication
# Follow the prompts to authenticate
```

#### 1.2: Create or Select GCP Project

```bash
# Option A: Create a new project
gcloud projects create workin-out --name="Workin Out"

# Option B: Use existing project
gcloud projects list
gcloud config set project YOUR_PROJECT_ID

# Set the project (use your actual project ID)
gcloud config set project workin-out
```

#### 1.3: Enable Required Google Cloud APIs

```bash
# Enable Cloud Build and Cloud Run APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# This may take 1-2 minutes
```

#### 1.4: Build and Deploy Backend

```bash
# Navigate to the backend directory
cd backend

# Build the container image using Google Cloud Build
# This uploads your code and builds a Docker container
gcloud builds submit --tag gcr.io/workin-out/backend

# This will take 2-5 minutes and show build progress

# Deploy to Cloud Run
gcloud run deploy workin-out-backend \
  --image gcr.io/workin-out/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,CORS_ORIGIN=https://workin-out.eamongreeley.com,DATABASE_PATH=/app/data/workouts.db,PORT=8080" \
  --memory 512Mi \
  --cpu 1 \
  --port 8080

# When prompted:
# - Allow unauthenticated invocations? Y
```

#### 1.5: Get the Backend Service URL

```bash
# Get the automatically generated URL
gcloud run services describe workin-out-backend \
  --region us-central1 \
  --format 'value(status.url)'

# Save this URL - it will look like:
# https://workin-out-backend-xxxxx-uc.a.run.app
```

#### 1.6: Test the Backend

```bash
# Replace SERVICE_URL with the URL from previous step
SERVICE_URL="https://workin-out-backend-xxxxx-uc.a.run.app"

# Test health endpoint
curl $SERVICE_URL/health

# Expected output: {"status":"ok","timestamp":"..."}

# Test exercises endpoint
curl $SERVICE_URL/api/exercises?workout_type=A

# Expected output: JSON array of exercises
```

#### 1.7: Map Custom Domain (api.eamongreeley.com)

```bash
# Map the custom domain to the Cloud Run service
gcloud run domain-mappings create \
  --service workin-out-backend \
  --domain api.eamongreeley.com \
  --region us-central1

# This will output DNS records that look like:
# CNAME: api -> ghs.googlehosted.com

# SAVE THESE DNS RECORDS - you'll add them in Step 3
```

### STEP 2: Deploy Frontend to Vercel

You have two options: CLI or Dashboard. **Dashboard is easier for first deployment.**

#### Option A: Vercel Dashboard (Recommended)

1. **Go to https://vercel.com and sign in**

2. **Click "Add New..." → "Project"**

3. **Import from Git:**
   - If you pushed to GitHub: Click "Import" next to your repository
   - If not using Git: Use "Deploy" button and select the `frontend` folder
   - Or use the Vercel CLI method below

4. **Configure Build Settings:**
   - Framework Preset: **Vite** (should auto-detect)
   - Root Directory: `./` (or `frontend` if deploying from repo root)
   - Build Command: `npm run build` (should auto-detect)
   - Output Directory: `dist` (should auto-detect)
   - Install Command: `npm install` (should auto-detect)

5. **Add Environment Variable:**
   - Click "Environment Variables"
   - Name: `VITE_API_URL`
   - Value: `https://api.eamongreeley.com/api`
   - Environment: Production (checked)

6. **Click "Deploy"**
   - Deployment takes 1-2 minutes
   - You'll get a URL like: `https://workin-out-xxxxx.vercel.app`

7. **Add Custom Domain:**
   - After deployment, go to: Settings → Domains
   - Add domain: `workin-out.eamongreeley.com`
   - Vercel will show DNS records to add
   - **SAVE THESE DNS RECORDS** for Step 3

#### Option B: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login
# Follow prompts in browser

# Navigate to frontend directory
cd frontend

# Deploy to production
vercel --prod

# When prompted:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - What's your project's name? workin-out
# - In which directory is your code located? ./
# - Want to override settings? N

# Add environment variable
vercel env add VITE_API_URL production
# When prompted, enter: https://api.eamongreeley.com/api

# Redeploy to pick up environment variable
vercel --prod

# Get deployment URL
vercel ls

# Add custom domain
vercel domains add workin-out.eamongreeley.com
# This will show DNS records to add
```

### STEP 3: Configure DNS Records

Log in to your DNS provider for **eamongreeley.com** and add these CNAME records:

**Backend API Domain:**
```
Type:  CNAME
Name:  api
Value: ghs.googlehosted.com
       (or the value from gcloud domain-mappings output)
TTL:   Auto or 3600
```

**Frontend Domain:**
```
Type:  CNAME
Name:  workin-out
Value: cname.vercel-dns.com
TTL:   Auto or 3600
```

**DNS Propagation:**
- Takes 5-60 minutes typically
- Check status: https://dnschecker.org
- Until propagation completes, use the temporary URLs from Steps 1 and 2

### STEP 4: Test Production Deployment

Wait for DNS to propagate (check dnschecker.org), then test:

```bash
# Test backend health
curl https://api.eamongreeley.com/health
# Expected: {"status":"ok","timestamp":"..."}

# Test backend API
curl https://api.eamongreeley.com/api/exercises?workout_type=A
# Expected: JSON array of 5 exercises

# Test frontend (open in browser)
open https://workin-out.eamongreeley.com
# Expected: See "Workin Out" homepage with "Start Workout A" button
```

#### Verify CORS is Working

Open https://workin-out.eamongreeley.com in browser and:
1. Open DevTools Console (F12)
2. Click "Start Workout A"
3. Check Console for errors
4. If you see CORS errors, verify `CORS_ORIGIN` matches your frontend URL exactly

### STEP 5: Install PWA on iPhone

1. Open **Safari** on iPhone (must be Safari, not Chrome)
2. Go to: https://workin-out.eamongreeley.com
3. Tap the **Share** button (square with arrow pointing up)
4. Scroll down and tap **"Add to Home Screen"**
5. Name it: **"Workin Out"**
6. Tap **"Add"**
7. App icon appears on home screen - tap to launch

**PWA Benefits:**
- Launches like a native app (no browser chrome)
- Offline support (once loaded)
- Full screen experience
- Faster than opening in browser

## Project File Structure

```
workin-out/
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql   # Database schema
│   │   │   ├── seed.sql     # Initial exercise data
│   │   │   └── db.js        # SQLite connection
│   │   ├── routes/
│   │   │   ├── exercises.js # Exercise endpoints
│   │   │   ├── workouts.js  # Workout endpoints
│   │   │   └── stats.js     # Stats/helper endpoints
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── server.js        # Express app entry point
│   ├── Dockerfile           # Container configuration
│   ├── .dockerignore
│   ├── package.json
│   └── .env.example
│
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── WorkoutStart.jsx      # Home screen
│   │   │   ├── WorkoutSession.jsx    # Active workout
│   │   │   ├── ExerciseInput.jsx     # Exercise entry
│   │   │   ├── PlateCalculator.jsx   # Barbell plate UI
│   │   │   ├── WeightInput.jsx       # Simple weight input
│   │   │   └── WorkoutHistory.jsx    # Past workouts
│   │   ├── hooks/
│   │   │   ├── useWorkouts.js        # Workout data hooks
│   │   │   └── useExercises.js       # Exercise data hooks
│   │   ├── api/
│   │   │   └── client.js             # API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   │   └── icons/           # PWA icons (need to add)
│   ├── index.html
│   ├── vite.config.js       # Vite + PWA config
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── deploy-backend.sh        # Automated deployment script
├── DEPLOYMENT.md            # Detailed deployment docs
├── DEPLOY-QUICK-START.md    # Quick start guide
├── DEPLOYMENT-HANDOFF.md    # This file
├── README.md                # Project overview
└── .gitignore
```

## Environment Variables Reference

### Backend (.env)
```bash
# Development
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/workouts.db
CORS_ORIGIN=http://localhost:5173

# Production (set in Cloud Run)
PORT=8080
NODE_ENV=production
DATABASE_PATH=/app/data/workouts.db
CORS_ORIGIN=https://workin-out.eamongreeley.com
```

### Frontend (.env)
```bash
# Development
VITE_API_URL=/api

# Production (set in Vercel)
VITE_API_URL=https://api.eamongreeley.com/api
```

## Workout Configuration

### Workout A Exercises
1. **Squats** - 2 warmup + 3 working × 5 reps (45lb bar)
2. **Overhead Press** - 2 warmup + 3 working × 5 reps (45lb bar)
3. **Lat Pull/Chinup** - 0 warmup + 3 working × 10 reps (machine)
4. **Pallof Press** - 0 warmup + 3 working × 10 reps (cable)
5. **Wrist/Calf** - Completion only (no weight tracked)

### Workout B Exercises
1. **Squat** - 2 warmup + 3 working × 5 reps (45lb bar)
2. **Bench Press** - 2 warmup + 3 working × 5 reps (45lb bar)
3. **Deadlift** - 2 warmup + 3 working × 5 reps (45lb bar)
4. **Dumbbell Goblet Squats** - 0 warmup + 3 working × 10 reps (dumbbell)
5. **Suitcase Carries** - 0 warmup + 3 working × 1 rep (dumbbell)
6. **Wrist/Calf** - Completion only

**Exercise Types:**
- **Barbell exercises** (bar_weight = 45): Use plate calculator
- **Machine/dumbbell exercises** (bar_weight = 0): Use simple weight input
- **Completion exercises** (is_weight_tracked = 0): Just mark done

## API Endpoints Reference

### Base URLs
- **Development:** http://localhost:3001/api
- **Production:** https://api.eamongreeley.com/api

### Exercises
- `GET /exercises` - List all exercises
- `GET /exercises?workout_type=A` - Get Workout A exercises
- `GET /exercises/:id` - Get single exercise
- `POST /exercises` - Create exercise (admin)
- `PUT /exercises/:id` - Update exercise (admin)
- `DELETE /exercises/:id` - Delete exercise (admin)

### Workouts
- `GET /workouts` - List workouts (paginated)
- `GET /workouts/:id` - Get workout with sets
- `POST /workouts` - Create new workout
- `PUT /workouts/:id` - Update workout
- `DELETE /workouts/:id` - Delete workout
- `POST /workouts/:workout_id/sets` - Add set to workout
- `PUT /workouts/sets/:id` - Update set
- `DELETE /workouts/sets/:id` - Delete set

### Stats
- `GET /stats/next-workout` - Get suggested workout (A or B)
- `GET /stats/last-weight?exercise_id=X` - Last weight for exercise
- `GET /stats/history?limit=10` - Workout history summary
- `GET /stats/progress/:exercise_id?limit=10` - Exercise progress

## Troubleshooting Common Issues

### Backend Issues

**Build fails with "permission denied"**
```bash
# Make sure you're authenticated
gcloud auth login

# Check current project
gcloud config get-value project

# Set correct project
gcloud config set project workin-out
```

**Deployment succeeds but service won't start**
```bash
# Check logs
gcloud run logs read workin-out-backend --region us-central1 --limit 50

# Common causes:
# - PORT must be 8080 (or match --port flag)
# - CORS_ORIGIN must match frontend URL exactly
# - Database path not writable
```

**CORS errors in browser console**
```bash
# Redeploy with correct CORS_ORIGIN
gcloud run services update workin-out-backend \
  --region us-central1 \
  --set-env-vars "CORS_ORIGIN=https://workin-out.eamongreeley.com"
```

### Frontend Issues

**Build fails on Vercel**
- Check build logs in Vercel dashboard
- Verify package.json is in frontend directory
- Ensure all dependencies are in package.json (not dev-only)

**"Failed to fetch" in browser**
- Check `VITE_API_URL` is set in Vercel environment variables
- Verify API is accessible: `curl https://api.eamongreeley.com/health`
- Check browser console for CORS errors
- Verify backend `CORS_ORIGIN` matches frontend URL

**Blank page after deployment**
- Check browser console for errors
- Verify build completed successfully in Vercel
- Check that index.html exists in dist folder
- Clear browser cache and hard reload (Cmd+Shift+R)

### DNS Issues

**Domain not working after adding records**
- DNS takes 5-60 minutes to propagate
- Check status: https://dnschecker.org
- Verify CNAME records are correct (no typos)
- Make sure CNAME points to correct target
- Some DNS providers don't allow CNAME on apex domain

**SSL certificate errors**
- Cloud Run and Vercel provide automatic HTTPS
- Wait 10-15 minutes after DNS propagates
- If persists, check domain mappings in GCP/Vercel

### Database Issues

**Data disappears after deployment**
- Cloud Run storage is ephemeral
- Database resets on container restarts/updates
- Solution: Set up automated backups (see next section)
- Long-term: Migrate to Cloud SQL PostgreSQL

**Can't see past workouts**
- Check browser console for API errors
- Verify GET /api/workouts endpoint works:
  ```bash
  curl https://api.eamongreeley.com/api/workouts
  ```
- Check backend logs for errors

## Data Backup Strategy

### Quick Manual Backup

```bash
# Export all workout data as JSON
curl https://api.eamongreeley.com/api/workouts > backup-$(date +%Y%m%d).json

# Export exercises
curl https://api.eamongreeley.com/api/exercises > exercises-backup.json
```

### Automated Backup (Recommended for Production)

The SQLite database is stored in the container at `/app/data/workouts.db`. Since Cloud Run storage is ephemeral, set up automated backups:

**Option 1: Cloud Storage Backup (Recommended)**
1. Create a new endpoint `/api/admin/backup` that exports DB to JSON
2. Set up Cloud Scheduler to hit this endpoint daily
3. Store backups in Cloud Storage bucket

**Option 2: Migrate to Cloud SQL**
For production multi-user use:
1. Create Cloud SQL PostgreSQL instance
2. Update backend to use `pg` instead of `sqlite3`
3. Migrate schema and data
4. Update DATABASE_PATH env var

## Post-Deployment Checklist

- [ ] Backend deployed to Cloud Run
- [ ] Backend health endpoint responds: `curl https://api.eamongreeley.com/health`
- [ ] Backend API endpoint works: `curl https://api.eamongreeley.com/api/exercises`
- [ ] Frontend deployed to Vercel
- [ ] Frontend loads in browser: https://workin-out.eamongreeley.com
- [ ] Can start a workout and log sets
- [ ] Can navigate between exercises
- [ ] Can view workout history
- [ ] Plate calculator works for barbell exercises
- [ ] Weight input works for machine/dumbbell exercises
- [ ] PWA installed on iPhone
- [ ] DNS records configured and propagated
- [ ] HTTPS working on both frontend and backend
- [ ] Set up backup strategy for database

## Monitoring and Maintenance

### View Backend Logs
```bash
# Real-time logs
gcloud run logs tail workin-out-backend --region us-central1

# Last 50 log entries
gcloud run logs read workin-out-backend --region us-central1 --limit 50

# Filter for errors
gcloud run logs read workin-out-backend --region us-central1 | grep ERROR
```

### View Frontend Logs
- Vercel Dashboard → Your Project → Logs
- Real-time deployment logs
- Runtime logs (Edge Functions, etc.)

### Check Resource Usage
```bash
# Cloud Run metrics (requests, latency, etc.)
gcloud run services describe workin-out-backend --region us-central1

# Or use GCP Console: Cloud Run → workin-out-backend → Metrics
```

### Redeploy Backend
```bash
# After making code changes
cd backend
gcloud builds submit --tag gcr.io/workin-out/backend
gcloud run deploy workin-out-backend \
  --image gcr.io/workin-out/backend \
  --region us-central1
```

### Redeploy Frontend
```bash
# If using Vercel CLI
cd frontend
vercel --prod

# Or push to Git and Vercel auto-deploys
git push origin main
```

## Cost Management

### Expected Costs (Free Tier)
- **GCP Cloud Run:** $0/month
  - Free tier: 2M requests/month, 360K GB-seconds/month
  - Single user: ~100-500 requests/month
  - Well within free tier
  
- **Vercel:** $0/month
  - Hobby plan: Unlimited bandwidth
  - Perfect for personal projects

### If You Exceed Free Tier
- Cloud Run charges ~$0.00002400/request after free tier
- Monitor usage: GCP Console → Billing

## Security Considerations

### Current Security Posture
- ✅ HTTPS enforced on both frontend and backend
- ✅ CORS configured to only allow frontend domain
- ✅ No authentication (single user MVP)
- ✅ No sensitive data stored
- ⚠️ API is public (anyone can read/write workouts)

### Adding Authentication (Future)
When ready for multi-user:
1. Add user table to database
2. Implement JWT authentication
3. Add middleware to verify tokens
4. Add user_id to workouts/sets tables
5. Update frontend to handle login/logout

### Current Recommendations
- Keep API URL private (don't share publicly)
- Monitor Cloud Run logs for unusual activity
- Set up billing alerts in GCP
- Regular backups of workout data

## Future Enhancements

### Phase 2 Features (Post-MVP)
- Rest timer between sets (90-180 seconds)
- Progressive overload suggestions (+5 lbs when all reps completed)
- Exercise video library (YouTube embeds)
- Workout reminders (Push notifications via PWA)
- Export workout data (CSV/JSON download)
- 1RM calculator and tracking
- Body weight and measurements tracking

### Phase 3 Features (Multi-User)
- User authentication (email/password or OAuth)
- User profiles and settings
- Workout templates and customization
- Social features (share workouts, follow friends)
- Mobile app (React Native conversion)
- Premium features (coaching, AI suggestions)

## Support and Resources

### Documentation
- **This file:** Complete deployment guide
- **DEPLOYMENT.md:** Detailed technical documentation
- **DEPLOY-QUICK-START.md:** Quick reference guide
- **README.md:** Project overview

### Useful Links
- GCP Cloud Run Docs: https://cloud.google.com/run/docs
- Vercel Docs: https://vercel.com/docs
- React Query Docs: https://tanstack.com/query/latest
- Tailwind CSS Docs: https://tailwindcss.com/docs

### Getting Help
- Backend logs: `gcloud run logs read workin-out-backend`
- Frontend logs: Vercel Dashboard
- Database: Inspect via API endpoints or download .db file
- Browser console: Check for JavaScript errors

## Summary

This is a **fully functional MVP** ready for deployment. The app has been tested locally and all features work correctly. The deployment process is straightforward:

1. **30 minutes:** Deploy backend to GCP Cloud Run
2. **10 minutes:** Deploy frontend to Vercel  
3. **15 minutes:** Configure DNS
4. **30 minutes:** Wait for DNS propagation
5. **5 minutes:** Test and install PWA

**Total time: ~90 minutes** (mostly waiting for DNS)

After deployment, you'll have a production-ready workout tracker accessible from any device, with a native-app-like experience on iPhone.

Good luck with the deployment! 🏋️
