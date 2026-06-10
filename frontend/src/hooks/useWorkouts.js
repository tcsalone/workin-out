import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useWorkouts(params) {
  return useQuery({
    queryKey: ['workouts', params],
    queryFn: () => api.getWorkouts(params),
  });
}

export function useWorkout(id) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => api.getWorkout(id),
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateWorkout(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workout', id] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useAddSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workoutId, data }) => api.addSet(workoutId, data),
    onSuccess: (_, { workoutId }) => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });
}

export function useUpdateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateSet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout'] });
    },
  });
}

export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteSet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout'] });
    },
  });
}

export function useLastCompleted() {
  return useQuery({
    queryKey: ['stats', 'last-completed'],
    queryFn: api.getLastCompleted,
    staleTime: 30000, // 30 seconds
  });
}

export function useResetAllData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.resetAllData,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useResetHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.resetHistory,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
