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

export function usePR(exerciseId) {
  return useQuery({
    queryKey: ['stats', 'pr', exerciseId],
    queryFn: async () => {
      const data = await api.getPR(exerciseId);
      return data.pr;
    },
    enabled: !!exerciseId,
    staleTime: 60000, // 1 minute
  });
}

export function useLastSession(exerciseId) {
  return useQuery({
    queryKey: ['stats', 'last-session', exerciseId],
    queryFn: async () => {
      const data = await api.getLastSession(exerciseId);
      return data.session;
    },
    enabled: !!exerciseId,
    staleTime: 60000, // 1 minute
  });
}
