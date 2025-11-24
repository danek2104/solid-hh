import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReviews, createReview } from '../services/reviewsApi';

/**
 * Хук для получения списка отзывов
 */
export const useReviewsQuery = (params = {}, token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['reviews', params, token],
    queryFn: async () => {
      const reviews = await fetchReviews(params, token);
      return reviews;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 минуты по умолчанию
    gcTime: options?.cacheTime ?? 5 * 60 * 1000, // 5 минут по умолчанию
    retry: options?.retry ?? 2,
    retryDelay: options?.retryDelay ?? 1000,
  });
};

/**
 * Хук для создания отзыва
 */
export const useCreateReview = (token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData) => {
      const review = await createReview(reviewData, token);
      return review;
    },
    onSuccess: (data, variables) => {
      // Инвалидировать список отзывов
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      // Если создан отзыв для конкретного пользователя, обновить его отзывы
      if (variables.userId) {
        queryClient.invalidateQueries({ queryKey: ['reviews', { userId: variables.userId }] });
      }
      // Если создан отзыв для работы, обновить отзывы по этой работе
      if (variables.jobId) {
        queryClient.invalidateQueries({ queryKey: ['reviews', { jobId: variables.jobId }] });
      }
    },
    onSettled: () => {
      // Обновить список отзывов после завершения мутации
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

