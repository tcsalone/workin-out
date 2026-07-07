import { useState } from 'react';
import { useHistory } from '../hooks/useExercises';
import { useDeleteWorkout } from '../hooks/useWorkouts';

export default function WorkoutHistory({ onClose, onContinueWorkout, onViewWorkout }) {
  const { data: history, isLoading } = useHistory(20);
  const deleteWorkout = useDeleteWorkout();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const formatSessionDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCompletedAt = (completedAt) => {
    if (!completedAt) return null;
    const date = new Date(completedAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {history && history.length > 0 ? (
          history.map((workout) => {
            const isInProgress = !workout.completed_at;

            return (
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
                  <div>
                    <span className="text-gray-500">Session date:</span>{' '}
                    <span>{formatSessionDate(workout.date)}</span>
                  </div>
                  {workout.completed_at && (
                    <div className="mt-1">
                      <span className="text-gray-500">Completed:</span>{' '}
                      <span>{formatCompletedAt(workout.completed_at)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 text-sm mb-4">
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

                <div className="flex gap-2">
                  {isInProgress ? (
                    <>
                      <button
                        onClick={() => onContinueWorkout(workout.id, workout.workout_type)}
                        className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold text-sm transition-colors"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(workout.id)}
                        className="px-4 py-2 bg-gray-700 hover:bg-red-900/50 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onViewWorkout(workout.id, workout.workout_type)}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-sm transition-colors"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-400 py-12">
            No workouts yet. Start your first workout!
          </div>
        )}
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
