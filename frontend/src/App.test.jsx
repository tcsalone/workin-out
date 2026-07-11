import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the api client so React Query calls resolve without a real backend.
// Individual tests can override return values on api.<method>.
vi.mock('./api/client', () => {
  const api = {
    getExercises: vi.fn(),
    getExercise: vi.fn(),
    getWorkouts: vi.fn(),
    getWorkout: vi.fn(),
    createWorkout: vi.fn(),
    updateWorkout: vi.fn(),
    deleteWorkout: vi.fn(),
    addSet: vi.fn(),
    updateSet: vi.fn(),
    deleteSet: vi.fn(),
    getLastWeight: vi.fn(),
    getNextWorkout: vi.fn(),
    getInProgressWorkouts: vi.fn(),
    getHistory: vi.fn(),
    getProgress: vi.fn(),
    getPR: vi.fn(),
    getLastCompleted: vi.fn(),
    getLastSession: vi.fn(),
    resetAllData: vi.fn(),
    resetHistory: vi.fn(),
  };
  return { api };
});

import App from './App';
import { api } from './api/client';

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

describe('App routing', () => {
  beforeEach(() => {
    // Default stubs: enough data to render WorkoutHistory + WorkoutSession
    // without hitting a real backend.
    api.getLastCompleted.mockResolvedValue({ workoutA: null, workoutB: null });
    api.getNextWorkout.mockResolvedValue({ workoutType: 'A' });
    api.getHistory.mockResolvedValue([
      {
        id: 42,
        workout_type: 'A',
        date: '2026-07-10',
        completed_at: null,
        exercises_count: 3,
        total_sets: 9,
        completed_sets: 2,
      },
    ]);
    api.getExercises.mockResolvedValue([
      { id: 1, name: 'Squat', workout_type: 'A', bar_weight: 45, order: 1 },
      { id: 2, name: 'Bench', workout_type: 'A', bar_weight: 45, order: 2 },
      { id: 3, name: 'Row', workout_type: 'A', bar_weight: 45, order: 3 },
    ]);
    api.getWorkout.mockResolvedValue({
      id: 42,
      workout_type: 'A',
      date: '2026-07-10',
      completed_at: null,
      sets: [
        { id: 100, exercise_id: 1, weight: 135, reps: 5, completed: true, set_number: 1 },
        { id: 101, exercise_id: 1, weight: 135, reps: 5, completed: false, set_number: 2 },
      ],
    });
    api.getLastWeight.mockResolvedValue({ weight: 135 });
    api.getPR.mockResolvedValue({ pr: null });
    api.getLastSession.mockResolvedValue({ session: null });
  });

  it('Continue on an in-progress workout in history lands on the workout view (not the start screen)', async () => {
    // Start on the history hash so the History screen is what App renders.
    window.history.replaceState(null, '', '#history');
    renderApp();

    // Sanity: history screen shows up with our in-progress workout.
    const continueBtn = await screen.findByRole('button', { name: /continue/i });

    await userEvent.click(continueBtn);

    // The bug was that this click bounced the user back to the start screen.
    // With the fix, WorkoutSession must mount and stay mounted.
    const workoutSession = await screen.findByTestId('workout-session');
    expect(workoutSession).toBeInTheDocument();

    // And the start-screen "Start Workout" CTA must NOT be showing.
    expect(screen.queryByRole('button', { name: /start workout/i })).not.toBeInTheDocument();
  });
});
