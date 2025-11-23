import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useReviewsQuery,
  useCreateReview,
} from '../../hooks/useReviews';
import * as reviewsApi from '../../services/reviewsApi';

jest.mock('../../services/reviewsApi');

describe('useReviews hooks', () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useReviewsQuery', () => {
    it('должен получить список отзывов', async () => {
      const mockReviews = [
        { id: 1, rating: 5, comment: 'Great!' },
        { id: 2, rating: 4, comment: 'Good' },
      ];
      const token = 'test-token';
      const params = { page: 1, limit: 10 };

      reviewsApi.fetchReviews.mockResolvedValue(mockReviews);

      const { result } = renderHook(() => useReviewsQuery(params, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockReviews);
      expect(reviewsApi.fetchReviews).toHaveBeenCalledWith(params, token);
    });

    it('должен получить отзывы с фильтрами', async () => {
      const mockReviews = [{ id: 1, rating: 5, userId: 1 }];
      const token = 'test-token';
      const params = { userId: 1, rating: 5 };

      reviewsApi.fetchReviews.mockResolvedValue(mockReviews);

      const { result } = renderHook(() => useReviewsQuery(params, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(reviewsApi.fetchReviews).toHaveBeenCalledWith(params, token);
    });

    it('должен быть отключен когда enabled=false', () => {
      const token = 'test-token';
      const params = {};

      const { result } = renderHook(
        () => useReviewsQuery(params, token, { enabled: false }),
        { wrapper }
      );

      expect(result.current.isFetching).toBe(false);
      expect(reviewsApi.fetchReviews).not.toHaveBeenCalled();
    });

    it('должен обработать ошибку загрузки', async () => {
      const token = 'test-token';
      const error = new Error('Failed to fetch reviews');

      reviewsApi.fetchReviews.mockRejectedValue(error);

      const { result } = renderHook(() => useReviewsQuery({}, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useCreateReview', () => {
    it('должен создать отзыв', async () => {
      const token = 'test-token';
      const reviewData = {
        userId: 1,
        rating: 5,
        comment: 'Great service!',
        jobId: 1,
      };
      const createdReview = {
        id: 1,
        ...reviewData,
        createdAt: new Date().toISOString(),
      };

      reviewsApi.createReview.mockResolvedValue(createdReview);

      const { result } = renderHook(() => useCreateReview(token), { wrapper });

      await act(async () => {
        result.current.mutate(reviewData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(reviewsApi.createReview).toHaveBeenCalledWith(reviewData, token);
      expect(result.current.data).toEqual(createdReview);
    });

    it('должен инвалидировать кеш после создания отзыва', async () => {
      const token = 'test-token';
      const reviewData = { userId: 1, rating: 5, comment: 'Great!' };
      const createdReview = { id: 1, ...reviewData };

      reviewsApi.createReview.mockResolvedValue(createdReview);

      const { result } = renderHook(() => useCreateReview(token), { wrapper });

      await act(async () => {
        result.current.mutate(reviewData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Проверяем, что кеш был инвалидирован
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('должен инвалидировать кеш для конкретного пользователя', async () => {
      const token = 'test-token';
      const reviewData = { userId: 1, rating: 5, comment: 'Great!' };
      const createdReview = { id: 1, ...reviewData };

      reviewsApi.createReview.mockResolvedValue(createdReview);

      const { result } = renderHook(() => useCreateReview(token), { wrapper });

      await act(async () => {
        result.current.mutate(reviewData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Проверяем, что кеш был инвалидирован для конкретного пользователя
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['reviews', { userId: reviewData.userId }],
      });
    });

    it('должен инвалидировать кеш для конкретной работы', async () => {
      const token = 'test-token';
      const reviewData = { jobId: 1, rating: 5, comment: 'Great!' };
      const createdReview = { id: 1, ...reviewData };

      reviewsApi.createReview.mockResolvedValue(createdReview);

      const { result } = renderHook(() => useCreateReview(token), { wrapper });

      await act(async () => {
        result.current.mutate(reviewData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Проверяем, что кеш был инвалидирован для конкретной работы
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['reviews', { jobId: reviewData.jobId }],
      });
    });

    it('должен обработать ошибку создания отзыва', async () => {
      const token = 'test-token';
      const reviewData = { userId: 1, rating: 5, comment: 'Great!' };
      const error = new Error('Failed to create review');

      reviewsApi.createReview.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateReview(token), { wrapper });

      await act(async () => {
        result.current.mutate(reviewData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });
});

