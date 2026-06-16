import { useState, useEffect } from 'react';
import { useLastCompleted } from './hooks/useWorkouts';
import WorkoutStart from './components/WorkoutStart';
import WorkoutSession from './components/WorkoutSession';
import WorkoutHistory from './components/WorkoutHistory';
import Settings from './components/Settings';

function App() {
  const [currentView, setCurrentView] = useState('start'); // 'start', 'workout', 'history', 'settings'
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const { data: lastCompleted } = useLastCompleted();

  // Helper to safely check Notification support
  const isNotificationSupported = () => {
    return 'Notification' in window && typeof Notification !== 'undefined';
  };

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
  }, [lastCompleted]);

  const handleWorkoutStarted = (workoutId, workoutType) => {
    setCurrentWorkout({ id: workoutId, type: workoutType });
    setCurrentView('workout');
  };

  const handleWorkoutFinished = () => {
    setCurrentWorkout(null);
    setCurrentView('start');
  };

  const handleViewHistory = () => {
    setCurrentView('history');
  };

  const handleCloseHistory = () => {
    setCurrentView('start');
  };

  const handleViewSettings = () => {
    setCurrentView('settings');
  };

  const handleCloseSettings = () => {
    setCurrentView('start');
  };

  return (
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
        <WorkoutHistory onClose={handleCloseHistory} />
      )}

      {currentView === 'settings' && (
        <Settings onClose={handleCloseSettings} />
      )}
    </div>
  );
}

export default App;
