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

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Periodic check for workout reminders (hourly when app is open)
  useEffect(() => {
    const checkAndNotify = () => {
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

      if (daysDiff >= 3 && Notification.permission === 'granted') {
        new Notification('Time to Workout! 💪', {
          body: `It's been ${daysDiff} days since your last session. Let's get back to it!`,
          icon: '/icon-192.png',
          tag: 'workout-reminder', // Prevents duplicate notifications
          requireInteraction: false
        });
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
