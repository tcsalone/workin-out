import { useState } from 'react';
import { useResetAllData, useResetHistory } from '../hooks/useWorkouts';

export default function Settings({ onClose }) {
  const [showConfirmation, setShowConfirmation] = useState(null); // 'all' or 'history'
  const resetAllData = useResetAllData();
  const resetHistory = useResetHistory();

  const handleResetAll = async () => {
    try {
      await resetAllData.mutateAsync();
      setShowConfirmation(null);
      alert('All data has been reset successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to reset data:', error);
      alert('Failed to reset data. Please try again.');
    }
  };

  const handleResetHistory = async () => {
    try {
      await resetHistory.mutateAsync();
      setShowConfirmation(null);
      alert('Workout history has been cleared successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Failed to clear history. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-bold mb-2">Data Management</h2>
            <p className="text-gray-400 text-sm mb-6">
              Reset or clear your workout data for testing purposes.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setShowConfirmation('history')}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors"
              >
                Clear Workout History
              </button>

              <button
                onClick={() => setShowConfirmation('all')}
                className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                Reset All Data
              </button>
            </div>
          </div>

          <div className="card bg-gray-800/50">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">About</h3>
            <p className="text-sm text-gray-500">
              Workin Out v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">
              {showConfirmation === 'all' ? 'Reset All Data?' : 'Clear Workout History?'}
            </h3>

            <p className="text-gray-300 mb-6">
              {showConfirmation === 'all'
                ? 'This will permanently delete all your workout data, including history, sets, and PRs. This action cannot be undone.'
                : 'This will permanently delete all your workout history, sets, and PRs. Exercise templates will be preserved. This action cannot be undone.'}
            </p>

            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-6">
              <p className="text-yellow-400 text-sm font-semibold">
                ⚠️ Warning: This action is permanent and cannot be undone!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(null)}
                className="flex-1 btn bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmation === 'all' ? handleResetAll : handleResetHistory}
                disabled={resetAllData.isPending || resetHistory.isPending}
                className={`flex-1 btn ${
                  showConfirmation === 'all'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50`}
              >
                {resetAllData.isPending || resetHistory.isPending
                  ? 'Resetting...'
                  : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
