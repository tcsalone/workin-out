import { useState } from 'react';

const PLATE_SIZES = [45, 35, 25, 10, 5, 2.5];

export default function PlateCalculator({ barWeight = 45, value, onChange, onClose }) {
  const [plates, setPlates] = useState(() => {
    // Calculate initial plates from current weight
    if (!value || value <= barWeight) return {};

    const perSide = (value - barWeight) / 2;
    const result = {};
    let remaining = perSide;

    for (const size of PLATE_SIZES) {
      const count = Math.floor(remaining / size);
      if (count > 0) {
        result[size] = count;
        remaining -= count * size;
      }
    }

    return result;
  });

  const addPlate = (size) => {
    setPlates(prev => ({
      ...prev,
      [size]: (prev[size] || 0) + 1
    }));
  };

  const removePlate = (size) => {
    setPlates(prev => {
      const newCount = (prev[size] || 0) - 1;
      if (newCount <= 0) {
        const { [size]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [size]: newCount };
    });
  };

  const calculateTotal = () => {
    const perSide = Object.entries(plates).reduce(
      (sum, [size, count]) => sum + (parseFloat(size) * count),
      0
    );
    return barWeight + (perSide * 2);
  };

  const total = calculateTotal();

  const handleConfirm = () => {
    onChange(total);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Plate Calculator</h2>

        <div className="mb-6">
          <div className="text-gray-400 text-sm mb-2">Each side:</div>
          <div className="grid grid-cols-3 gap-2">
            {PLATE_SIZES.map(size => (
              <div key={size} className="flex flex-col items-center">
                <button
                  onClick={() => addPlate(size)}
                  className="w-full btn btn-secondary mb-2"
                >
                  {size} lb
                </button>
                {plates[size] > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removePlate(size)}
                      className="w-8 h-8 rounded bg-red-600 hover:bg-red-700 text-white"
                    >
                      −
                    </button>
                    <span className="text-lg font-semibold w-6 text-center">
                      {plates[size]}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="text-gray-400 text-sm">Current load:</div>
          <div className="text-sm text-gray-300 mb-2">
            {Object.entries(plates).filter(([_, count]) => count > 0).map(([size, count]) =>
              `${count}×${size}`
            ).join(' + ') || 'Bar only'} (per side)
          </div>
          <div className="text-3xl font-bold text-primary-400">{total} lbs</div>
          <div className="text-sm text-gray-400">
            {barWeight} lb bar + {((total - barWeight) / 2).toFixed(1)} lbs each side
          </div>
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
