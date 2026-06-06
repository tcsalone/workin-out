const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Exercises
  getExercises: (workoutType) =>
    fetchJSON(`/exercises${workoutType ? `?workout_type=${workoutType}` : ''}`),

  getExercise: (id) =>
    fetchJSON(`/exercises/${id}`),

  // Workouts
  getWorkouts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJSON(`/workouts${query ? `?${query}` : ''}`);
  },

  getWorkout: (id) =>
    fetchJSON(`/workouts/${id}`),

  createWorkout: (data) =>
    fetchJSON('/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWorkout: (id, data) =>
    fetchJSON(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteWorkout: (id) =>
    fetchJSON(`/workouts/${id}`, { method: 'DELETE' }),

  // Sets
  addSet: (workoutId, data) =>
    fetchJSON(`/workouts/${workoutId}/sets`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSet: (id, data) =>
    fetchJSON(`/workouts/sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSet: (id) =>
    fetchJSON(`/workouts/sets/${id}`, { method: 'DELETE' }),

  // Stats
  getLastWeight: (exerciseId) =>
    fetchJSON(`/stats/last-weight?exercise_id=${exerciseId}`),

  getNextWorkout: () =>
    fetchJSON('/stats/next-workout'),

  getHistory: (limit = 10) =>
    fetchJSON(`/stats/history?limit=${limit}`),

  getProgress: (exerciseId, limit = 10) =>
    fetchJSON(`/stats/progress/${exerciseId}?limit=${limit}`),
};
