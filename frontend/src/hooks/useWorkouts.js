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

export function useAddSetsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutId, sets }) => {
      console.log('[useAddSetsBatch] Mutation starting', { workoutId, setsCount: sets.length });
      try {
        const result = await api.addSetsBatch(workoutId, sets);
        console.log('[useAddSetsBatch] Mutation succeeded', { result });
        return result;
      } catch (error) {
        console.error('[useAddSetsBatch] Mutation failed', { error, workoutId, sets });
        throw error;
      }
    },
    onSuccess: (data, { workoutId }) => {
      console.log('[useAddSetsBatch] onSuccess - invalidating workout query', { workoutId });
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
    onError: (error, variables) => {
      console.error('[useAddSetsBatch] onError callback', { error, variables });
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
