import { useState } from 'react';

const PLATE_SIZES = [45, 35, 25, 10, 5, 2.5];

// Get color styling for each plate weight (IWF standard colors)
const getPlateColor = (weight) => {
  switch (weight) {
    case 45:
      return 'bg-blue-600 hover:bg-blue-700 border-blue-800 text-white';
    case 35:
      return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700 text-gray-900';
    case 25:
      return 'bg-green-600 hover:bg-green-700 border-green-800 text-white';
    case 10:
      return 'bg-white hover:bg-gray-100 border-gray-400 text-gray-900';
    case 5:
      return 'bg-gray-500 hover:bg-gray-600 border-gray-700 text-white';
    case 2.5:
      return 'bg-red-600 hover:bg-red-700 border-red-800 text-white';
    default:
      return 'bg-gray-600 hover:bg-gray-700 border-gray-800 text-white';
  }
};

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
          <div className="grid grid-cols-3 gap-3">
            {PLATE_SIZES.map(size => (
              <div key={size} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => addPlate(size)}
                  className={`relative w-full h-20 rounded-full border-4 font-bold text-lg transition-all shadow-lg ${getPlateColor(size)}`}
                  style={{
                    boxShadow: 'inset 0 0 0 8px currentColor, inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  <div className="relative z-10">{size}</div>
                  <div className="absolute inset-0 rounded-full border-8 border-transparent" style={{
                    background: 'radial-gradient(circle at center, transparent 25%, currentColor 25%, currentColor 30%, transparent 30%)'
                  }}></div>
                </button>
                {plates[size] > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removePlate(size)}
                      className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold shadow"
                    >
                      −
                    </button>
                    <span className="text-lg font-bold w-8 text-center text-white">
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
