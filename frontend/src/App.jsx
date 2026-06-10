import { useState } from 'react';
import WorkoutStart from './components/WorkoutStart';
import WorkoutSession from './components/WorkoutSession';
import WorkoutHistory from './components/WorkoutHistory';
import Settings from './components/Settings';

function App() {
  const [currentView, setCurrentView] = useState('start'); // 'start', 'workout', 'history', 'settings'
  const [currentWorkout, setCurrentWorkout] = useState(null);

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
