import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useExercises(workoutType) {
  return useQuery({
    queryKey: ['exercises', workoutType],
    queryFn: () => api.getExercises(workoutType),
    staleTime: Infinity, // Exercise templates never change
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
    staleTime: 1000 * 60 * 30, // 30 minutes - PRs change rarely
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
    staleTime: 1000 * 60 * 10, // 10 minutes - last session changes rarely
  });
}
