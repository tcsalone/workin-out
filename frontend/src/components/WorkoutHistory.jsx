import { useHistory } from '../hooks/useExercises';

export default function WorkoutHistory({ onClose }) {
  const { data: history, isLoading } = useHistory(20);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-4 py-4 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">Workout History</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {history && history.length > 0 ? (
          history.map((workout) => (
            <div key={workout.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">
                  Workout {workout.workout_type}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  workout.completed_at
                    ? 'bg-green-900 text-green-300'
                    : 'bg-yellow-900 text-yellow-300'
                }`}>
                  {workout.completed_at ? 'Completed' : 'In Progress'}
                </span>
              </div>

              <div className="text-gray-400 text-sm mb-3">
                {new Date(workout.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>

              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Exercises:</span>{' '}
                  <span className="font-semibold">{workout.exercises_count || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400">Sets:</span>{' '}
                  <span className="font-semibold">
                    {workout.completed_sets || 0}/{workout.total_sets || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 py-12">
            No workouts yet. Start your first workout!
          </div>
        )}
      </div>
    </div>
  );
}
