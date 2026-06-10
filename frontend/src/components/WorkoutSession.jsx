import { useState } from 'react';
import { useExercises } from '../hooks/useExercises';
import { useWorkout, useAddSet, useUpdateSet, useDeleteSet, useUpdateWorkout } from '../hooks/useWorkouts';
import ExerciseInput from './ExerciseInput';

export default function WorkoutSession({ workoutId, workoutType, onFinish }) {
  const { data: exercises, isLoading: exercisesLoading } = useExercises(workoutType);
  const { data: workout, isLoading: workoutLoading } = useWorkout(workoutId);
  const addSet = useAddSet();
  const updateSet = useUpdateSet();
  const deleteSet = useDeleteSet();
  const updateWorkout = useUpdateWorkout();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  if (exercisesLoading || workoutLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading workout...</div>
      </div>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">No exercises found for Workout {workoutType}</div>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === exercises.length - 1;

  const handleNextExercise = () => {
    if (isLastExercise) {
      handleFinishWorkout();
    } else {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const handleFinishWorkout = async () => {
    try {
      await updateWorkout.mutateAsync({
        id: workoutId,
        data: { completed_at: new Date().toISOString() }
      });
      onFinish();
    } catch (error) {
      console.error('Failed to finish workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  };

  const handleQuitWorkout = () => {
    setShowQuitConfirm(true);
  };

  const handleConfirmQuit = () => {
    // Don't update completed_at - workout stays in-progress
    onFinish();
  };

  const completedSetsCount = workout?.sets?.filter(s => s.completed).length || 0;

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-4 py-4 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={handleQuitWorkout}
            className="text-gray-400 hover:text-white transition-colors text-sm font-semibold"
          >
            ← Home
          </button>
          <h1 className="text-xl font-bold">Workout {workoutType}</h1>
          <div className="text-gray-400 text-sm">
            {currentExerciseIndex + 1}/{exercises.length}
          </div>
        </div>
      </div>

      {/* Exercise Progress Dots */}
      <div className="flex gap-2 justify-center py-4">
        {exercises.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentExerciseIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentExerciseIndex
                ? 'bg-primary-500'
                : index < currentExerciseIndex
                ? 'bg-green-500'
                : 'bg-gray-600'
            }`}
            aria-label={`Go to exercise ${index + 1}`}
          />
        ))}
      </div>

      {/* Current Exercise */}
      <div className="max-w-2xl mx-auto px-4">
        <ExerciseInput
          exercise={currentExercise}
          workoutId={workoutId}
          onAddSet={(data) => addSet.mutate({ workoutId, data })}
          onUpdateSet={(id, data, wId) => updateSet.mutate({ id, data, workoutId: wId || workoutId })}
          onDeleteSet={(id) => deleteSet.mutate({ id, workoutId })}
          sets={workout?.sets?.filter(s => s.exercise_id === currentExercise.id) || []}
        />
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentExerciseIndex > 0 && (
            <button
              onClick={handlePreviousExercise}
              className="btn btn-secondary px-8"
            >
              ← Previous
            </button>
          )}
          <button
            onClick={handleNextExercise}
            className="btn btn-primary flex-1"
          >
            {isLastExercise ? 'Finish Workout ✓' : 'Next Exercise →'}
          </button>
        </div>
      </div>

      {/* Quit Confirmation Modal */}
      {showQuitConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Exit workout without finishing?</h3>

            <p className="text-gray-300 mb-2">
              You've completed {completedSetsCount} set{completedSetsCount !== 1 ? 's' : ''} so far.
            </p>

            <p className="text-gray-400 text-sm mb-6">
              Your progress will be saved, but the workout won't be marked as complete.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 btn bg-gray-700 hover:bg-gray-600"
              >
                Keep Working
              </button>
              <button
                onClick={handleConfirmQuit}
                className="flex-1 btn bg-red-600 hover:bg-red-700"
              >
                Exit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
