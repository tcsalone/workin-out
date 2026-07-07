import { useMemo, useState, memo } from 'react';
import { useNextWorkout } from '../hooks/useExercises';
import { useCreateWorkout, useLastCompleted, useInProgressWorkouts, useDeleteWorkout } from '../hooks/useWorkouts';

function WorkoutStart({ onWorkoutStarted, onViewHistory, onViewSettings }) {
  const { data: nextWorkout, isLoading } = useNextWorkout();
  const { data: lastCompleted } = useLastCompleted();
  const { data: inProgressWorkouts } = useInProgressWorkouts();
  const createWorkout = useCreateWorkout();
  const deleteWorkout = useDeleteWorkout();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const daysSinceLastWorkout = useMemo(() => {
    if (!lastCompleted?.workoutA && !lastCompleted?.workoutB) return null;

    const lastA = lastCompleted.workoutA?.completedAt
      ? new Date(lastCompleted.workoutA.completedAt)
      : null;
    const lastB = lastCompleted.workoutB?.completedAt
      ? new Date(lastCompleted.workoutB.completedAt)
      : null;

    const mostRecent = [lastA, lastB]
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    if (!mostRecent) return null;

    return Math.floor((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
  }, [lastCompleted]);

  const formatLastCompleted = (completedData) => {
    if (!completedData || !completedData.completedAt) return 'Never completed';
    const date = new Date(completedData.completedAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatWorkoutDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStartWorkout = async (type) => {
    try {
      const workout = await createWorkout.mutateAsync({
        workout_type: type,
        date: new Date().toISOString().split('T')[0]
      });
      onWorkoutStarted(workout.id, type);
    } catch (error) {
      console.error('Failed to create workout:', error);
      alert('Failed to start workout. Please try again.');
    }
  };

  const handleDeleteWorkout = async (id) => {
    try {
      await deleteWorkout.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete workout:', error);
      alert('Failed to delete workout. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const suggestedType = nextWorkout?.next_workout_type || 'A';
  const otherType = suggestedType === 'A' ? 'B' : 'A';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full relative">
        <button
          onClick={onViewSettings}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-300 transition-colors text-2xl"
          title="Settings"
        >
          ⚙️
        </button>

        <h1 className="text-4xl font-bold text-center mb-2">Workin Out</h1>
        <p className="text-gray-400 text-center mb-12">Ready to lift?</p>

        {daysSinceLastWorkout !== null && daysSinceLastWorkout >= 3 && (
          <div className="mb-8 p-4 bg-orange-900/30 border border-orange-700 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💪</span>
              <div>
                <p className="text-orange-400 font-semibold">
                  It's been {daysSinceLastWorkout} days since your last workout!
                </p>
                <p className="text-sm text-gray-400">
                  Time to get back in the gym 🔥
                </p>
              </div>
            </div>
          </div>
        )}

        {inProgressWorkouts && inProgressWorkouts.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">
              Continue Workout
            </h2>
            {inProgressWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="card border border-yellow-700/50 bg-yellow-900/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">Workout {workout.workout_type}</h3>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-900 text-yellow-300">
                    In Progress
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{formatWorkoutDate(workout.date)}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {workout.completed_sets || 0}/{workout.total_sets || 0} sets completed
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onWorkoutStarted(workout.id, workout.workout_type)}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-colors"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(workout.id)}
                    className="px-4 py-3 bg-gray-700 hover:bg-red-900/50 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <button
              onClick={() => handleStartWorkout(suggestedType)}
              disabled={createWorkout.isPending}
              className="w-full py-6 bg-primary-600 hover:bg-primary-700 rounded-xl text-2xl font-bold transition-colors disabled:opacity-50"
            >
              {createWorkout.isPending ? 'Starting...' : `Start Workout ${suggestedType}`}
            </button>
            {lastCompleted && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Last completed: {formatLastCompleted(
                  suggestedType === 'A' ? lastCompleted.workoutA : lastCompleted.workoutB
                )}
              </p>
            )}
          </div>

          <div className="text-center text-gray-500 text-sm">Suggested next workout</div>

          <div>
            <button
              onClick={() => handleStartWorkout(otherType)}
              disabled={createWorkout.isPending}
              className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-xl font-semibold transition-colors disabled:opacity-50"
            >
              Start Workout {otherType}
            </button>
            {lastCompleted && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Last completed: {formatLastCompleted(
                  otherType === 'A' ? lastCompleted.workoutA : lastCompleted.workoutB
                )}
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={onViewHistory}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            View History
          </button>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Delete in-progress workout?</h3>
            <p className="text-gray-300 mb-6">
              This will permanently delete this workout and all logged sets. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 btn bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteWorkout(deleteConfirmId)}
                disabled={deleteWorkout.isPending}
                className="flex-1 btn bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleteWorkout.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(WorkoutStart);
