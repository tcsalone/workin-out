import { useWorkout } from '../hooks/useWorkouts';
import { useExercises } from '../hooks/useExercises';

export default function WorkoutDetail({ workoutId, workoutType, onClose }) {
  const { data: workout, isLoading: workoutLoading } = useWorkout(workoutId);
  const { data: exercises, isLoading: exercisesLoading } = useExercises(workoutType);

  if (workoutLoading || exercisesLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading workout...</div>
      </div>
    );
  }

  if (!workout || !exercises) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Workout not found</div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-8">
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-4 py-4 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-sm font-semibold"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Workout {workoutType}</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="text-gray-400 text-sm">{formatDate(workout.date)}</div>

        {exercises.map((exercise) => {
          const exerciseSets = (workout.sets || [])
            .filter(s => s.exercise_id === exercise.id)
            .sort((a, b) => a.set_number - b.set_number);

          if (exerciseSets.length === 0) return null;

          const warmupSets = exerciseSets.filter(s => s.is_warmup);
          const workingSets = exerciseSets.filter(s => !s.is_warmup);

          return (
            <div key={exercise.id} className="card">
              <h2 className="text-xl font-bold mb-4">{exercise.name}</h2>

              {warmupSets.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Warmup</h3>
                  <div className="space-y-2">
                    {warmupSets.map((set) => (
                      <SetRowReadOnly key={set.id} set={set} exercise={exercise} />
                    ))}
                  </div>
                </div>
              )}

              {workingSets.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Working</h3>
                  <div className="space-y-2">
                    {workingSets.map((set) => (
                      <SetRowReadOnly key={set.id} set={set} exercise={exercise} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SetRowReadOnly({ set, exercise }) {
  if (!exercise.is_weight_tracked) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg ${
        set.completed ? 'bg-green-900/30 border border-green-700' : 'bg-gray-700'
      }`}>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
          set.completed ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
        }`}>
          {set.completed ? '✓' : '—'}
        </span>
        <span className="text-gray-300">{set.completed ? 'Completed' : 'Not completed'}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      set.completed ? 'bg-green-900/30 border border-green-700' : 'bg-gray-700'
    }`}>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
        set.completed ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
      }`}>
        {set.completed ? '✓' : set.set_number}
      </span>
      <span className="font-semibold">{set.weight || 0} lbs</span>
      <span className="text-gray-400">×</span>
      <span className="font-semibold">{set.reps || exercise.default_reps} reps</span>
    </div>
  );
}
