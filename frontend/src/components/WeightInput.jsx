import { useState } from 'react';

export default function WeightInput({ value, onChange, onClose }) {
  const [weight, setWeight] = useState(value || 0);

  const handleConfirm = () => {
    onChange(parseFloat(weight));
    onClose();
  };

  const adjustWeight = (amount) => {
    setWeight(prev => Math.max(0, parseFloat(prev || 0) + amount));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Enter Weight</h2>

        <div className="mb-6">
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full text-4xl text-center font-bold bg-gray-900 border-2 border-gray-700 rounded-lg py-4 px-6"
            autoFocus
          />
          <div className="text-center text-gray-400 mt-2">lbs</div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => adjustWeight(-10)}
            className="btn btn-secondary text-lg"
          >
            -10
          </button>
          <button
            onClick={() => adjustWeight(-5)}
            className="btn btn-secondary text-lg"
          >
            -5
          </button>
          <button
            onClick={() => adjustWeight(5)}
            className="btn btn-secondary text-lg"
          >
            +5
          </button>
          <button
            onClick={() => adjustWeight(10)}
            className="btn btn-secondary text-lg"
          >
            +10
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn btn-primary flex-1">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
