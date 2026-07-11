import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useLastCompleted } from './hooks/useWorkouts';
import WorkoutStart from './components/WorkoutStart';
import WorkoutSession from './components/WorkoutSession';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components that aren't needed immediately
const WorkoutHistory = lazy(() => import('./components/WorkoutHistory'));
const WorkoutDetail = lazy(() => import('./components/WorkoutDetail'));
const Settings = lazy(() => import('./components/Settings'));

function App() {
  const [currentView, setCurrentView] = useState('start'); // 'start', 'workout', 'history', 'workout-detail', 'settings'
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [detailWorkout, setDetailWorkout] = useState(null);
  const { data: lastCompleted } = useLastCompleted();

  const setView = useCallback((view) => {
    setCurrentView(view);
    try {
      // Only expose stable, top-level pages via URL hash.
      // Workout flows require in-memory state (ids), so keep them un-hashed.
      const hashableViews = new Set(['history', 'settings']);
      const newHash = hashableViews.has(view) ? `#${view}` : '';
      if (window.location.hash !== newHash) {
        // Use replaceState (not `window.location.hash = ...`) so we don't fire
        // hashchange — the listener would treat an empty hash as "go to start"
        // and undo the setCurrentView(view) above.
        const url = window.location.pathname + window.location.search + newHash;
        window.history.replaceState(null, '', url);
      }
    } catch {
      // ignore URL update errors (e.g. restricted environments)
    }
  }, []);

  // Hash-based routing so screens are directly addressable (/#history, /#settings, etc.)
  useEffect(() => {
    const hashableViews = new Set(['history', 'settings']);
    const initialApplied = { current: false };

    const applyHash = () => {
      const raw = (window.location.hash || '').replace(/^#/, '');
      if (hashableViews.has(raw)) {
        setCurrentView(raw);
        return;
      }
      // Empty or unknown hash: only fall back to 'start' on initial mount.
      // On later hashchange events, leave in-memory views (workout,
      // workout-detail) alone so a stray hash clear can't kick the user out.
      if (!initialApplied.current) {
        setCurrentView('start');
      }
    };

    applyHash();
    initialApplied.current = true;
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  // Helper to safely check Notification support - memoized to prevent recreating on each render
  const isNotificationSupported = useCallback(() => {
    return 'Notification' in window && typeof Notification !== 'undefined';
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    try {
      if (isNotificationSupported() && Notification.permission === 'default') {
        Notification.requestPermission().catch(err => {
          console.warn('Error requesting notification permission:', err);
        });
      }
    } catch (error) {
      console.warn('Notification permission request is not supported or failed:', error);
    }
  }, []);

  // Periodic check for workout reminders (hourly when app is open)
  useEffect(() => {
    const checkAndNotify = async () => {
      try {
        if (!isNotificationSupported()) return;
        if (Notification.permission !== 'granted') return;
        if (!lastCompleted?.workoutA && !lastCompleted?.workoutB) return;

        const lastA = lastCompleted.workoutA?.completedAt
          ? new Date(lastCompleted.workoutA.completedAt)
          : null;
        const lastB = lastCompleted.workoutB?.completedAt
          ? new Date(lastCompleted.workoutB.completedAt)
          : null;

        const mostRecent = [lastA, lastB]
          .filter(Boolean)
          .sort((a, b) => b - a)[0];

        if (!mostRecent) return;

        const daysDiff = Math.floor((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff >= 3) {
          const title = 'Time to Workout! 💪';
          const options = {
            body: `It's been ${daysDiff} days since your last session. Let's get back to it!`,
            icon: '/icon-192.png',
            tag: 'workout-reminder', // Prevents duplicate notifications
            requireInteraction: false
          };

          // Try showing via service worker registration first (best for mobile/PWA)
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && 'showNotification' in registration) {
              await registration.showNotification(title, options);
              return;
            }
          }

          // Fallback to standard constructor
          new Notification(title, options);
        }
      } catch (error) {
        console.warn('Failed to process or show notification safely:', error);
      }
    };

    // Initial check
    checkAndNotify();

    // Check every hour
    const checkInterval = setInterval(checkAndNotify, 60 * 60 * 1000);

    return () => clearInterval(checkInterval);
  }, [lastCompleted, isNotificationSupported]);

  const handleWorkoutStarted = (workoutId, workoutType) => {
    setCurrentWorkout({ id: workoutId, type: workoutType });
    setView('workout');
  };

  const handleWorkoutFinished = () => {
    setCurrentWorkout(null);
    setView('start');
  };

  const handleViewHistory = () => {
    setView('history');
  };

  const handleCloseHistory = () => {
    setView('start');
  };

  const handleContinueWorkout = (workoutId, workoutType) => {
    setCurrentWorkout({ id: workoutId, type: workoutType });
    setView('workout');
  };

  const handleViewWorkout = (workoutId, workoutType) => {
    setDetailWorkout({ id: workoutId, type: workoutType });
    setView('workout-detail');
  };

  const handleCloseWorkoutDetail = () => {
    setDetailWorkout(null);
    setView('history');
  };

  const handleViewSettings = () => {
    setView('settings');
  };

  const handleCloseSettings = () => {
    setView('start');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900">
        {currentView === 'start' && (
          <WorkoutStart
            onWorkoutStarted={handleWorkoutStarted}
            onViewHistory={handleViewHistory}
            onViewSettings={handleViewSettings}
          />
        )}

        {currentView === 'workout' && currentWorkout && (
          <WorkoutSession
            workoutId={currentWorkout.id}
            workoutType={currentWorkout.type}
            onFinish={handleWorkoutFinished}
          />
        )}

        {currentView === 'history' && (
          <Suspense fallback={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="text-gray-400">Loading...</div>
            </div>
          }>
            <WorkoutHistory
              onClose={handleCloseHistory}
              onContinueWorkout={handleContinueWorkout}
              onViewWorkout={handleViewWorkout}
            />
          </Suspense>
        )}

        {currentView === 'workout-detail' && detailWorkout && (
          <Suspense fallback={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="text-gray-400">Loading...</div>
            </div>
          }>
            <WorkoutDetail
              workoutId={detailWorkout.id}
              workoutType={detailWorkout.type}
              onClose={handleCloseWorkoutDetail}
            />
          </Suspense>
        )}

        {currentView === 'settings' && (
          <Suspense fallback={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="text-gray-400">Loading...</div>
            </div>
          }>
            <Settings onClose={handleCloseSettings} />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
