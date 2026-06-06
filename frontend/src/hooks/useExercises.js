import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useExercises(workoutType) {
  return useQuery({
    queryKey: ['exercises', workoutType],
    queryFn: () => api.getExercises(workoutType),
  });
}

export function useNextWorkout() {
  return useQuery({
    queryKey: ['stats', 'next-workout'],
    queryFn: api.getNextWorkout,
  });
}

export function useLastWeight(exerciseId) {
  return useQuery({
    queryKey: ['stats', 'last-weight', exerciseId],
    queryFn: () => api.getLastWeight(exerciseId),
    enabled: !!exerciseId,
  });
}

export function useHistory(limit = 10) {
  return useQuery({
    queryKey: ['stats', 'history', limit],
    queryFn: () => api.getHistory(limit),
  });
}
