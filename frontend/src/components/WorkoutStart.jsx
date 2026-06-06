import { useNextWorkout } from '../hooks/useExercises';
import { useCreateWorkout } from '../hooks/useWorkouts';

export default function WorkoutStart({ onWorkoutStarted, onViewHistory }) {
  const { data: nextWorkout, isLoading } = useNextWorkout();
  const createWorkout = useCreateWorkout();

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
      <div className="max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2">Workin Out</h1>
        <p className="text-gray-400 text-center mb-12">Ready to lift?</p>

        <div className="space-y-4">
          <button
            onClick={() => handleStartWorkout(suggestedType)}
            disabled={createWorkout.isPending}
            className="w-full py-6 bg-primary-600 hover:bg-primary-700 rounded-xl text-2xl font-bold transition-colors disabled:opacity-50"
          >
            {createWorkout.isPending ? 'Starting...' : `Start Workout ${suggestedType}`}
          </button>

          <div className="text-center text-gray-500 text-sm">Suggested next workout</div>

          <button
            onClick={() => handleStartWorkout(otherType)}
            disabled={createWorkout.isPending}
            className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-xl font-semibold transition-colors disabled:opacity-50"
          >
            Start Workout {otherType}
          </button>
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
