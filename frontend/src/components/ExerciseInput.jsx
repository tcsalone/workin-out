import { useState, useEffect, useRef } from 'react';
import { useLastWeight } from '../hooks/useExercises';
import PlateCalculator from './PlateCalculator';
import WeightInput from './WeightInput';

export default function ExerciseInput({ exercise, workoutId, onAddSet, onUpdateSet, onDeleteSet, sets }) {
  const { data: lastWeight } = useLastWeight(exercise.id);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
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

    // Create warmup sets with progressive weight
    for (let i = 0; i < exercise.default_warmup_sets; i++) {
      const setNumber = i + 1;
      // First warmup = 50% of working weight, second = 75%
      const warmupPercentage = exercise.default_warmup_sets === 1 ? 0.5 : (0.5 + (i * 0.25));
      const warmupWeight = lastWeight?.weight
        ? Math.round(lastWeight.weight * warmupPercentage)
        : (usesBarbell ? exercise.bar_weight : 0);

      setsToCreate.push({
        exercise_id: exercise.id,
        set_number: setNumber,
        is_warmup: 1,
        reps: exercise.default_reps,
        weight: warmupWeight,
        completed: 0
      });
    }

    // Create working sets
    for (let i = 0; i < exercise.default_working_sets; i++) {
      const setNumber = exercise.default_warmup_sets + i + 1;
      setsToCreate.push({
        exercise_id: exercise.id,
        set_number: setNumber,
        is_warmup: 0,
        reps: exercise.default_reps,
        weight: lastWeight?.weight || (usesBarbell ? exercise.bar_weight : 0),
        completed: 0
      });
    }

    // Add all sets at once
    setsToCreate.forEach(set => onAddSet(set));
  }, [exercise.id]); // Re-run when exercise changes

  const handleToggleSet = (set) => {
    onUpdateSet(set.id, { completed: set.completed ? 0 : 1 });
  };

  const handleWeightChange = (set, newWeight) => {
    onUpdateSet(set.id, { weight: newWeight });
  };

  const openWeightSelector = (set) => {
    setCurrentSetForInput(set);
    if (usesBarbell) {
      setShowCalculator(true);
    } else {
      setShowWeightInput(true);
    }
  };

  const handleWeightInputChange = (newWeight) => {
    if (currentSetForInput) {
      handleWeightChange(currentSetForInput, newWeight);
    }
  };

  const closeInputs = () => {
    setShowCalculator(false);
    setShowWeightInput(false);
    setCurrentSetForInput(null);
  };

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

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-2">{exercise.name}</h2>

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
    </div>
  );
}

function SetRow({ set, exercise, onToggle, onWeightClick }) {
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

      <button
        onClick={onWeightClick}
        className="flex-1 text-left py-3 px-4 bg-gray-800 rounded-lg"
      >
        <div className="text-2xl font-bold">{set.weight || 0} lbs</div>
        <div className="text-sm text-gray-400">{set.reps || exercise.default_reps} reps</div>
      </button>
    </div>
  );
}
