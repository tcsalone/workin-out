import { useMemo, memo } from 'react';
import { useNextWorkout } from '../hooks/useExercises';
import { useCreateWorkout, useLastCompleted } from '../hooks/useWorkouts';

function WorkoutStart({ onWorkoutStarted, onViewHistory, onViewSettings }) {
  const { data: nextWorkout, isLoading } = useNextWorkout();
  const { data: lastCompleted } = useLastCompleted();
  const createWorkout = useCreateWorkout();

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
    </div>
  );
}

export default memo(WorkoutStart);
