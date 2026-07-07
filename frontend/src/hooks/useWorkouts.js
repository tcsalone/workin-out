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
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useAddSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutId, data }) => {
      console.log('[useAddSet] Mutation starting', { workoutId, data });
      try {
        const result = await api.addSet(workoutId, data);
        console.log('[useAddSet] Mutation succeeded', { result });
        return result;
      } catch (error) {
        console.error('[useAddSet] Mutation failed', { error, workoutId, data });
        throw error;
      }
    },
    onSuccess: (_, { workoutId }) => {
      console.log('[useAddSet] onSuccess - invalidating workout query', { workoutId });
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
    onError: (error, variables) => {
      console.error('[useAddSet] onError callback', { error, variables });
    },
  });
}

export function useUpdateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, workoutId }) => api.updateSet(id, data),
    // Optimistic update - UI updates instantly before server responds
    onMutate: async ({ id, data, workoutId }) => {
      if (!workoutId) return; // Skip optimistic update if no workoutId

      // Cancel any ongoing queries for this workout
      await queryClient.cancelQueries({ queryKey: ['workout', workoutId] });

      // Snapshot current data for rollback
      const previousWorkout = queryClient.getQueryData(['workout', workoutId]);

      // Optimistically update the cache
      queryClient.setQueryData(['workout', workoutId], (old) => {
        if (!old) return old;
        return {
          ...old,
          sets: old.sets.map(s => s.id === id ? { ...s, ...data } : s)
        };
      });

      return { previousWorkout, workoutId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousWorkout && context?.workoutId) {
        queryClient.setQueryData(['workout', context.workoutId], context.previousWorkout);
      }
    },
    onSuccess: (_, { workoutId }) => {
      // Only invalidate THIS specific workout, not all workouts
      if (workoutId) {
        queryClient.invalidateQueries({ queryKey: ['workout', workoutId], exact: true });
      }
    },
  });
}

export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, workoutId }) => api.deleteSet(id),
    onMutate: async ({ id, workoutId }) => {
      if (!workoutId) return;

      await queryClient.cancelQueries({ queryKey: ['workout', workoutId] });
      const previousWorkout = queryClient.getQueryData(['workout', workoutId]);

      // Optimistically remove the set
      queryClient.setQueryData(['workout', workoutId], (old) => {
        if (!old) return old;
        return {
          ...old,
          sets: old.sets.filter(s => s.id !== id)
        };
      });

      return { previousWorkout, workoutId };
    },
    onError: (err, variables, context) => {
      if (context?.previousWorkout && context?.workoutId) {
        queryClient.setQueryData(['workout', context.workoutId], context.previousWorkout);
      }
    },
    onSuccess: (_, { workoutId }) => {
      if (workoutId) {
        queryClient.invalidateQueries({ queryKey: ['workout', workoutId], exact: true });
      }
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

export function useInProgressWorkouts() {
  return useQuery({
    queryKey: ['stats', 'in-progress'],
    queryFn: api.getInProgressWorkouts,
    staleTime: 10000,
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
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
