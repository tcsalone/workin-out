# Workin Out - Workout Tracker

A mobile-friendly Progressive Web App for tracking gym workouts, built specifically for tracking alternating Workout A and Workout B sessions.

## Features

- **Mobile-First Design**: Optimized for iPhone with large touch targets and gym-friendly UI
- **Plate Calculator**: Visual interface to calculate barbell weight by selecting plates
- **Auto-Suggestions**: Automatically suggests next workout (A or B) based on history
- **Progress Tracking**: See your last weight lifted for each exercise
- **Warmup & Working Sets**: Track both warmup and working sets separately
- **PWA Support**: Installable on iPhone home screen without App Store
- **Offline Capable**: Works without internet connection (when installed as PWA)

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- TanStack Query (React Query) for data fetching
- PWA support with vite-plugin-pwa

### Backend
- Node.js + Express
- SQLite database (easy backups, perfect for single user)
- RESTful API

## Getting Started

### Prerequisites
- Node.js 18+ (you have v25.4.0)
- npm

### Local Development

1. **Start the backend:**
```bash
cd backend
npm install
npm start
```
Backend runs on http://localhost:3001

2. **Start the frontend:**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

3. **Open in browser:**
- Desktop: http://localhost:5173
- iPhone (same network): http://YOUR_IP:5173

## Current Workouts

**Workout A:**
1. Squats (2 warmup + 3 working × 5 reps)
2. Overhead Press (2 warmup + 3 working × 5 reps)
3. Lat Pull/Chinup (3 working × 10 reps)
4. Pallof Press (3 working × 10 reps)
5. Wrist/Calf (completion only)

**Workout B:**
1. Squat (2 warmup + 3 working × 5 reps)
2. Bench Press (2 warmup + 3 working × 5 reps)
3. Deadlift (2 warmup + 1 working × 5 reps)
4. Dumbbell Goblet Squats (2 working × 10 reps)
5. Suitcase Carries (3 working × 1 rep)
6. Wrist/Calf (completion only)

## Project Structure

```
workin-out/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── db/          # Database setup & migrations
│   │   ├── routes/      # API endpoints
│   │   └── server.js    # Express app
│   └── data/            # SQLite database file
│
├── frontend/            # React SPA
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # React Query hooks
│   │   └── api/         # API client
│   └── public/          # Static assets & PWA icons
```

## API Endpoints

- `GET /api/exercises?workout_type=A` - Get exercises for Workout A/B
- `GET /api/workouts` - List all workouts
- `POST /api/workouts` - Create new workout
- `POST /api/workouts/:id/sets` - Log a set
- `PUT /api/workouts/sets/:id` - Update a set
- `GET /api/stats/next-workout` - Get suggested next workout
- `GET /api/stats/last-weight?exercise_id=X` - Get last weight for exercise
- `GET /api/stats/history` - Get workout history

## Next Steps

### Testing on iPhone
1. Find your local IP: `ipconfig getifaddr en0` (Mac) or `hostname -I` (Linux)
2. On iPhone, browse to http://YOUR_IP:5173
3. Test the workout flow
4. Use Safari's "Add to Home Screen" to install as PWA

### Deployment (Ready to implement)
- **Backend**: Deploy to GCP Cloud Run (free tier)
- **Frontend**: Deploy to Vercel or Netlify (free tier)
- **DNS**: Point workin-out.eamongreeley.com and api.eamongreeley.com

### Future Enhancements
- Rest timer between sets
- Progressive overload suggestions (+5 lbs when all reps completed)
- Exercise video library
- Workout reminders/notifications
- Muscle group tracking
- Multi-user support with authentication

## Database Backup

The SQLite database is stored in `backend/data/workouts.db`. To backup:
```bash
cp backend/data/workouts.db backup-$(date +%Y%m%d).db
```

## Development Notes

- Backend uses SQLite for simplicity (can migrate to PostgreSQL for multi-user)
- Frontend proxies `/api` requests to backend during development
- PWA manifest configured for iPhone home screen installation
- All workout data persists in SQLite with full history
