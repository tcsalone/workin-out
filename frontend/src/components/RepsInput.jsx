import { useState } from 'react';

export default function RepsInput({ value, onChange, onClose }) {
  const [reps, setReps] = useState(value || 5);

  const handleConfirm = () => {
    onChange(reps);
    onClose();
  };

  const adjustReps = (amount) => {
    const newReps = Math.max(1, Math.min(50, reps + amount));
    setReps(newReps);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4">Set Reps</h3>

        <div className="mb-6">
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="50"
            value={reps}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setReps(Math.max(1, Math.min(50, val)));
            }}
            className="w-full bg-gray-700 text-white text-3xl font-bold text-center py-4 rounded-lg border-2 border-gray-600 focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => adjustReps(-5)}
            className="btn btn-secondary py-3"
          >
            -5
          </button>
          <button
            onClick={() => adjustReps(-1)}
            className="btn btn-secondary py-3"
          >
            -1
          </button>
          <button
            onClick={() => adjustReps(1)}
            className="btn btn-secondary py-3"
          >
            +1
          </button>
          <button
            onClick={() => adjustReps(5)}
            className="btn btn-secondary py-3"
          >
            +5
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 btn btn-primary"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
