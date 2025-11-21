import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchShifts, acceptShift, rejectShift } from '../services/shiftsApi';

/**
 * Хук для получения списка смен
 */
export const useShiftsQuery = (params = {}, token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['shifts', params, token],
    queryFn: async () => {
      const shifts = await fetchShifts(params, token);
      return shifts;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 1 * 60 * 1000, // 1 минута по умолчанию
    gcTime: options?.gcTime ?? 5 * 60 * 1000, // 5 минут по умолчанию
    retry: 2,
    retryDelay: 1000,
    refetchInterval: options?.refetchInterval, // Опциональная автоматическая перезагрузка
  });
};

/**
 * Хук для принятия смены
 */
export const useAcceptShift = (token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, acceptData = {} }) => {
      const shift = await acceptShift(shiftId, acceptData, token);
      return shift;
    },
    onSuccess: (data, variables) => {
      // Инвалидировать список смен
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      // Обновить конкретную смену в кеше, если она там есть
      queryClient.setQueryData(['shift', variables.shiftId], data);
    },
  });
};

/**
 * Хук для отклонения смены
 */
export const useRejectShift = (token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shiftId, rejectData = {} }) => {
      const shift = await rejectShift(shiftId, rejectData, token);
      return shift;
    },
    onSuccess: (data, variables) => {
      // Инвалидировать список смен
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      // Обновить конкретную смену в кеше, если она там есть
      queryClient.setQueryData(['shift', variables.shiftId], data);
    },
  });
};





