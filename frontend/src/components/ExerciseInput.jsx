import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useLastWeight, usePR, useLastSession } from '../hooks/useExercises';
import PlateCalculator from './PlateCalculator';
import WeightInput from './WeightInput';
import RepsInput from './RepsInput';

export default function ExerciseInput({ exercise, workoutId, onAddSet, onUpdateSet, onDeleteSet, sets }) {
  const { data: lastWeight } = useLastWeight(exercise.id);
  const { data: pr } = usePR(exercise.id);
  const { data: lastSession } = useLastSession(exercise.id);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showRepsInput, setShowRepsInput] = useState(false);
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [currentSetForInput, setCurrentSetForInput] = useState(null);
  const initializedExercisesRef = useRef(new Set());

  const isWeightTracked = exercise.is_weight_tracked;
  const usesBarbell = exercise.bar_weight > 0;

  // Initialize sets if needed - track by exercise ID to prevent duplicate calls per exercise
  useEffect(() => {
    if (!isWeightTracked || sets.length > 0 || initializedExercisesRef.current.has(exercise.id)) {
      return;
    }

    initializedExercisesRef.current.add(exercise.id);

    // Batch all set creations together
    const setsToCreate = [];

    // Use lastSession data if available, otherwise fall back to template defaults
    const warmupCount = lastSession?.warmupSets?.length || exercise.default_warmup_sets;
    const workingCount = lastSession?.workingSets?.length || exercise.default_working_sets;

    // Create warmup sets with progressive weight
    for (let i = 0; i < warmupCount; i++) {
      const setNumber = i + 1;
      const lastSessionSet = lastSession?.warmupSets?.[i];

      // First warmup = 50% of working weight, second = 75%
      const warmupPercentage = warmupCount === 1 ? 0.5 : (0.5 + (i * 0.25));
      const warmupWeight = lastWeight?.weight
        ? Math.round(lastWeight.weight * warmupPercentage)
        : (usesBarbell ? exercise.bar_weight : 0);

      setsToCreate.push({
        exercise_id: exercise.id,
        set_number: setNumber,
        is_warmup: 1,
        reps: lastSessionSet?.reps || exercise.default_reps,
        weight: warmupWeight,
        completed: 0
      });
    }

    // Create working sets
    for (let i = 0; i < workingCount; i++) {
      const setNumber = warmupCount + i + 1;
      const lastSessionSet = lastSession?.workingSets?.[i];

      setsToCreate.push({
        exercise_id: exercise.id,
        set_number: setNumber,
        is_warmup: 0,
        reps: lastSessionSet?.reps || exercise.default_reps,
        weight: lastWeight?.weight || (usesBarbell ? exercise.bar_weight : 0),
        completed: 0
      });
    }

    // Add all sets at once
    setsToCreate.forEach(set => onAddSet(set));
  }, [
    exercise.id,
    exercise.default_warmup_sets,
    exercise.default_working_sets,
    exercise.default_reps,
    exercise.bar_weight,
    isWeightTracked,
    sets.length,
    lastWeight,
    lastSession,
    usesBarbell,
    onAddSet
  ]);

  const handleToggleSet = useCallback((set) => {
    // Check if this is a new PR (only for working sets being marked complete)
    if (!set.completed && !set.is_warmup && set.weight) {
      const currentPR = pr?.weight || 0;
      if (set.weight > currentPR) {
        // Trigger celebration!
        setShowPRCelebration(true);
        setTimeout(() => setShowPRCelebration(false), 3000); // 3 second celebration
      }
    }

    onUpdateSet(set.id, { completed: set.completed ? 0 : 1 }, workoutId);
  }, [pr, onUpdateSet, workoutId]);

  const handleWeightChange = useCallback((set, newWeight) => {
    onUpdateSet(set.id, { weight: newWeight }, workoutId);
  }, [onUpdateSet, workoutId]);

  const handleRepsChange = useCallback((set, newReps) => {
    onUpdateSet(set.id, { reps: newReps }, workoutId);
  }, [onUpdateSet, workoutId]);

  const openWeightSelector = useCallback((set) => {
    setCurrentSetForInput(set);
    if (usesBarbell) {
      setShowCalculator(true);
    } else {
      setShowWeightInput(true);
    }
  }, [usesBarbell]);

  const openRepsSelector = useCallback((set) => {
    setCurrentSetForInput(set);
    setShowRepsInput(true);
  }, []);

  const handleWeightInputChange = useCallback((newWeight) => {
    if (currentSetForInput) {
      handleWeightChange(currentSetForInput, newWeight);
    }
  }, [currentSetForInput, handleWeightChange]);

  const handleRepsInputChange = useCallback((newReps) => {
    if (currentSetForInput) {
      handleRepsChange(currentSetForInput, newReps);
    }
  }, [currentSetForInput, handleRepsChange]);

  const closeInputs = useCallback(() => {
    setShowCalculator(false);
    setShowWeightInput(false);
    setShowRepsInput(false);
    setCurrentSetForInput(null);
  }, []);

  const addWarmupSet = () => {
    const warmupSets = sets.filter(s => s.is_warmup);
    const workingSets = sets.filter(s => !s.is_warmup);
    const newSetNumber = warmupSets.length + 1;

    // Get weight from last warmup or default
    const lastWarmupWeight = warmupSets.length > 0
      ? warmupSets[warmupSets.length - 1].weight
      : (usesBarbell ? exercise.bar_weight : 0);

    onAddSet({
      exercise_id: exercise.id,
      set_number: newSetNumber,
      is_warmup: 1,
      reps: exercise.default_reps,
      weight: lastWarmupWeight,
      completed: 0
    });

    // Renumber working sets
    workingSets.forEach((set, index) => {
      const newNum = warmupSets.length + 1 + index + 1;
      if (set.set_number !== newNum) {
        onUpdateSet(set.id, { set_number: newNum });
      }
    });
  };

  const addWorkingSet = () => {
    const workingSets = sets.filter(s => !s.is_warmup);
    const allSets = sets;
    const newSetNumber = allSets.length + 1;

    // Get weight from last working set or last weight
    const lastWorkingWeight = workingSets.length > 0
      ? workingSets[workingSets.length - 1].weight
      : (lastWeight?.weight || (usesBarbell ? exercise.bar_weight : 0));

    onAddSet({
      exercise_id: exercise.id,
      set_number: newSetNumber,
      is_warmup: 0,
      reps: exercise.default_reps,
      weight: lastWorkingWeight,
      completed: 0
    });
  };

  const removeWarmupSet = () => {
    const warmupSets = sets.filter(s => s.is_warmup).sort((a, b) => a.set_number - b.set_number);
    if (warmupSets.length === 0) return;

    // Delete the last warmup set
    const lastWarmup = warmupSets[warmupSets.length - 1];
    onDeleteSet(lastWarmup.id);

    // Renumber working sets after warmup removal
    const workingSets = sets.filter(s => !s.is_warmup);
    workingSets.forEach((set, index) => {
      const newNum = warmupSets.length - 1 + index + 1;
      if (set.set_number !== newNum) {
        onUpdateSet(set.id, { set_number: newNum });
      }
    });
  };

  const removeWorkingSet = () => {
    const workingSets = sets.filter(s => !s.is_warmup).sort((a, b) => a.set_number - b.set_number);
    if (workingSets.length === 0) return;

    // Delete the last working set
    const lastWorking = workingSets[workingSets.length - 1];
    onDeleteSet(lastWorking.id);
  };

  // Completion-only exercise (like Wrist/Calf)
  if (!isWeightTracked) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">{exercise.name}</h2>
        <p className="text-gray-400 mb-6">Mark when complete</p>
        <button
          onClick={() => {
            if (sets.length === 0) {
              onAddSet({
                exercise_id: exercise.id,
                set_number: 1,
                is_warmup: 0,
                completed: 1
              });
            } else {
              onUpdateSet(sets[0].id, { completed: sets[0].completed ? 0 : 1 });
            }
          }}
          className={`w-full py-8 rounded-xl text-2xl font-bold transition-colors ${
            sets[0]?.completed
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {sets[0]?.completed ? '✓ Completed' : 'Mark Complete'}
        </button>
      </div>
    );
  }

  const warmupSets = sets.filter(s => s.is_warmup).sort((a, b) => a.set_number - b.set_number);
  const workingSets = sets.filter(s => !s.is_warmup).sort((a, b) => a.set_number - b.set_number);

  // Format date for PR display
  const formatPRDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-2xl font-bold">{exercise.name}</h2>
        {pr && (
          <div className="text-right">
            <div className="text-sm font-semibold text-green-400">
              PR: {pr.weight} lbs
            </div>
            <div className="text-xs text-gray-500">
              {formatPRDate(pr.date)}
            </div>
          </div>
        )}
      </div>

      {lastWeight?.weight && (
        <p className="text-gray-400 mb-6">
          Last time: {lastWeight.weight} lbs ({lastWeight.reps} reps)
        </p>
      )}

      {/* Warmup Sets */}
      {warmupSets.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase">
              Warmup Sets
            </h3>
            <div className="flex gap-3">
              {warmupSets.length > 0 && (
                <button
                  onClick={removeWarmupSet}
                  className="text-sm text-red-400 hover:text-red-300 font-semibold"
                >
                  − Remove
                </button>
              )}
              <button
                onClick={addWarmupSet}
                className="text-sm text-primary-400 hover:text-primary-300 font-semibold"
              >
                + Add Warmup
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {warmupSets.map((set) => (
              <SetRow
                key={set.id}
                set={set}
                exercise={exercise}
                onToggle={() => handleToggleSet(set)}
                onWeightClick={() => openWeightSelector(set)}
                onRepsClick={() => openRepsSelector(set)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Working Sets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">
            Working Sets
          </h3>
          <div className="flex gap-3">
            {workingSets.length > 0 && (
              <button
                onClick={removeWorkingSet}
                className="text-sm text-red-400 hover:text-red-300 font-semibold"
              >
                − Remove
              </button>
            )}
            <button
              onClick={addWorkingSet}
              className="text-sm text-primary-400 hover:text-primary-300 font-semibold"
            >
              + Add Set
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {workingSets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              exercise={exercise}
              onToggle={() => handleToggleSet(set)}
              onWeightClick={() => openWeightSelector(set)}
              onRepsClick={() => openRepsSelector(set)}
            />
          ))}
        </div>
      </div>

      {showCalculator && (
        <PlateCalculator
          barWeight={exercise.bar_weight}
          value={currentSetForInput?.weight || exercise.bar_weight}
          onChange={handleWeightInputChange}
          onClose={closeInputs}
        />
      )}

      {showWeightInput && (
        <WeightInput
          value={currentSetForInput?.weight || 0}
          onChange={handleWeightInputChange}
          onClose={closeInputs}
        />
      )}

      {showRepsInput && (
        <RepsInput
          value={currentSetForInput?.reps || exercise.default_reps}
          onChange={handleRepsInputChange}
          onClose={closeInputs}
        />
      )}

      {/* PR Celebration Animation */}
      {showPRCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-bounce-scale text-center">
            <div className="text-9xl text-green-400 mb-4">✓</div>
            <div className="text-4xl font-bold text-white animate-pulse">
              NEW PR!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SetRow = memo(({ set, exercise, onToggle, onWeightClick, onRepsClick }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      set.completed ? 'bg-green-900/30 border border-green-700' : 'bg-gray-700'
    }`}>
      <button
        onClick={onToggle}
        className={`w-12 h-12 rounded-lg font-bold text-lg transition-colors flex-shrink-0 ${
          set.completed
            ? 'bg-green-600 text-white'
            : 'bg-gray-600 text-gray-300'
        }`}
      >
        {set.completed ? '✓' : set.set_number}
      </button>

      <div className="flex-1 flex gap-2">
        <button
          onClick={onWeightClick}
          className="flex-1 text-left py-3 px-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
        >
          <div className="text-2xl font-bold">{set.weight || 0} lbs</div>
          <div className="text-xs text-gray-500">tap to edit</div>
        </button>

        <button
          onClick={onRepsClick}
          className="w-20 py-3 px-2 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors text-center"
        >
          <div className="text-2xl font-bold">{set.reps || exercise.default_reps}</div>
          <div className="text-xs text-gray-500">reps</div>
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if set data actually changed
  return (
    prevProps.set.id === nextProps.set.id &&
    prevProps.set.completed === nextProps.set.completed &&
    prevProps.set.weight === nextProps.set.weight &&
    prevProps.set.reps === nextProps.set.reps
  );
});
