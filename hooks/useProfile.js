import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile } from '../services/profileApi';
import { cacheProfile, getCachedProfile } from '../services/cacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_DRAFT_KEY = '@profile_draft';

/**
 * Хук для получения профиля пользователя
 */
export const useProfileQuery = (token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['profile', token],
    queryFn: async () => {
      // Сначала попытаться получить из кеша
      const cached = await getCachedProfile(options?.staleTime);
      if (cached) {
        // Вернуть кеш и обновить в фоне
        queryClient.setQueryData(['profile', token], cached);
      }

      // Загрузить свежие данные
      const profile = await fetchProfile(token);
      
      // Сохранить в кеш
      await cacheProfile(profile);
      
      return profile;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 минут по умолчанию
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 минут по умолчанию (gcTime вместо cacheTime в v5)
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Хук для обновления профиля пользователя
 */
export const useUpdateProfile = (token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData) => {
      const updated = await updateProfile(profileData, token);
      
      // Сохранить в кеш
      await cacheProfile(updated);
      
      return updated;
    },
    onMutate: async (newProfile) => {
      // Отменить исходящие запросы, чтобы они не перезаписали оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: ['profile', token] });

      // Сохранить предыдущее значение
      const previousProfile = queryClient.getQueryData(['profile', token]);

      // Оптимистично обновить кеш
      queryClient.setQueryData(['profile', token], (old) => ({
        ...old,
        ...newProfile,
      }));

      return { previousProfile };
    },
    onError: (err, newProfile, context) => {
      // В случае ошибки вернуть предыдущее значение
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', token], context.previousProfile);
      }
    },
    onSuccess: (data) => {
      // Обновить кеш с данными с сервера
      queryClient.setQueryData(['profile', token], data);
      queryClient.invalidateQueries({ queryKey: ['profile', token] });
    },
    onSettled: () => {
      // Обновить запрос после завершения мутации
      queryClient.invalidateQueries({ queryKey: ['profile', token] });
    },
  });
};

/**
 * Хук для работы с черновиком профиля
 */
export const useProfileDraft = () => {
  const saveDraft = async (draft) => {
    try {
      await AsyncStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn('Не удалось сохранить черновик профиля', error);
    }
  };

  const loadDraft = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_DRAFT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Не удалось загрузить черновик профиля', error);
      return null;
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_DRAFT_KEY);
    } catch (error) {
      console.warn('Не удалось очистить черновик профиля', error);
    }
  };

  return {
    saveDraft,
    loadDraft,
    clearDraft,
  };
};

/**
 * Хук для получения статусов документов
 */
export const useDocumentStatusesQuery = (token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['documentStatuses', token],
    queryFn: async () => {
      const { getCachedDocumentStatuses } = await import('../services/cacheService');
      const cached = await getCachedDocumentStatuses(5 * 60 * 1000);
      if (cached) {
        queryClient.setQueryData(['documentStatuses', token], cached);
      }

      const { fetchDocumentStatuses } = await import('../services/profileApi');
      const statuses = await fetchDocumentStatuses(token);
      
      const { cacheDocumentStatuses } = await import('../services/cacheService');
      await cacheDocumentStatuses(statuses);
      
      return statuses;
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 5 * 60 * 1000, // 5 минут
    retry: 2,
    refetchInterval: options?.enabled !== false ? 30 * 1000 : false, // Обновлять каждые 30 секунд, если включено
  });
};

