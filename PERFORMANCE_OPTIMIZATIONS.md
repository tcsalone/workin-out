# Performance Optimization Plan

## Quick Wins (Immediate, Free)

### 1. ✅ Code Splitting with React.lazy()
**Impact**: Reduce initial bundle size by ~30-40%
**Effort**: 10 minutes

Currently all components load upfront. Use React.lazy() to split:
- WorkoutHistory (only needed when viewing history)
- Settings (only needed when accessing settings)  
- PlateCalculator, WeightInput, RepsInput (only needed during workout)

**Implementation**:
```javascript
// App.jsx
const WorkoutHistory = lazy(() => import('./components/WorkoutHistory'));
const Settings = lazy(() => import('./components/Settings'));
// Wrap in <Suspense fallback={<div>Loading...</div>}>
```

### 2. ✅ Optimize React Query staleTime per query type
**Impact**: Reduce unnecessary API calls by 50%+
**Effort**: 5 minutes

Different data has different freshness requirements:
- Exercise templates: Never change → `staleTime: Infinity`
- PRs: Change rarely → `staleTime: 30 minutes`
- Last session data: Change rarely → `staleTime: 10 minutes`
- Workout data: Changes frequently → Keep at 5 minutes

### 3. ✅ Add React.memo to component exports
**Impact**: Prevent unnecessary re-renders
**Effort**: 5 minutes

Memoize these components:
- `WorkoutStart` - Doesn't need to re-render on every App state change
- `PlateCalculator` - Only re-render when weight changes
- `WeightInput` / `RepsInput` - Only re-render when value changes

### 4. ✅ Enable Vite build optimizations
**Impact**: Smaller bundle, faster initial load
**Effort**: 5 minutes

Add to vite.config.js:
```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'query-vendor': ['@tanstack/react-query']
      }
    }
  },
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true, // Remove console.logs in production
      drop_debugger: true
    }
  }
}
```

### 5. ✅ Add database indexes
**Impact**: Faster queries (10x+ on filtered queries)
**Effort**: 5 minutes

Add indexes to backend SQLite:
```sql
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_workouts_type_date ON workouts(workout_type, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_completed ON workout_sets(completed, is_warmup);
```

## Medium Impact (Worth Doing)

### 6. Prefetch critical data on app mount
**Impact**: Eliminate loading states
**Effort**: 10 minutes

Prefetch in App.jsx useEffect:
- Next workout suggestion
- Last completed data
- Exercise templates for both workouts

### 7. Optimize WorkoutHistory rendering
**Impact**: Faster history page load
**Effort**: 5 minutes

- Add `React.memo` to individual workout cards
- Use `key={workout.id}` (already doing this ✓)
- Consider virtualization if history > 50 items

### 8. Add service worker caching for API responses
**Impact**: Instant offline access
**Effort**: 15 minutes

PWA plugin is already installed. Configure workbox for API caching:
```javascript
// In VitePWA config
workbox: {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.eamongreeley\.com\/api\/exercises.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'exercises-cache',
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 } // 30 days
      }
    }
  ]
}
```

## Low Priority (Diminishing Returns)

### 9. Image optimization
**Impact**: Minimal (only icons currently)
**Effort**: Low
- Already using PNG icons, could convert to WebP but impact is minimal

### 10. CSS optimization
**Impact**: Very small (~5KB savings)
**Effort**: Low  
- Tailwind already tree-shakes unused CSS
- Consider PurgeCSS for additional savings (probably not needed)

## Backend Optimizations (Already Good!)

✅ Gzip compression enabled
✅ Efficient SQL queries (no N+1 problems)
✅ Proper indexes on JOINs
✅ Single-query data fetching where possible

## Measurement

Before implementing, capture baseline metrics:
1. Lighthouse score on mobile
2. Time to Interactive (TTI)
3. First Contentful Paint (FCP)
4. Bundle size (`npm run build` output)

Target improvements:
- Initial bundle: 150KB → 100KB (33% reduction)
- TTI: < 1.5s on 3G
- Lighthouse Performance: > 95

## Implementation Order

**Phase 1 (30 min total - Do This Week)**
1. Database indexes (5 min)
2. Code splitting (10 min)
3. React.memo on WorkoutStart, PlateCalculator (5 min)
4. Query staleTime optimization (5 min)
5. Vite build config (5 min)

**Phase 2 (If needed)**
6. Prefetching critical data
7. Service worker API caching
8. Additional component memoization
