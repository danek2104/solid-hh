import {
  fetchReviews,
  createReview,
  setTokenExpiredHandler,
} from '../../services/reviewsApi';
import * as authService from '../../services/authService';
import * as profileApi from '../../services/profileApi';
import { handleApiError, TimeoutError } from '../../utils/errorHandler';

jest.mock('../../services/authService');
jest.mock('../../services/profileApi');
jest.mock('../../utils/errorHandler');
jest.mock('../../config', () => ({
  API_ENDPOINTS: {
    reviews: 'https://api.workmatch.dev/reviews',
  },
  API_TIMEOUT_MS: 1200,
}));

describe('reviewsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    authService.getValidToken.mockResolvedValue('test-token');
    authService.getRefreshToken.mockResolvedValue('refresh-token');
    authService.refreshAuthToken.mockResolvedValue('new-token');
  });

  describe('setTokenExpiredHandler', () => {
    it('должен установить callback для обработки истечения токена', () => {
      const callback = jest.fn();
      setTokenExpiredHandler(callback);
      expect(callback).toBeDefined();
    });
  });

  describe('fetchReviews', () => {
    it('должен получить список отзывов', async () => {
      const mockReviews = [
        { id: 1, rating: 5, comment: 'Great!' },
        { id: 2, rating: 4, comment: 'Good' },
      ];
      const token = 'test-token';
      const params = { page: 1, limit: 10 };

      profileApi.getJson.mockResolvedValue({ reviews: mockReviews });

      const result = await fetchReviews(params, token);

      expect(result).toEqual(mockReviews);
      expect(profileApi.getJson).toHaveBeenCalled();
    });

    it('должен получить отзывы с фильтрами', async () => {
      const mockReviews = [{ id: 1, rating: 5, userId: 1 }];
      const token = 'test-token';
      const params = { userId: 1, rating: 5, sortBy: 'date', order: 'desc' };

      profileApi.getJson.mockResolvedValue({ reviews: mockReviews });

      const result = await fetchReviews(params, token);

      expect(result).toEqual(mockReviews);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const mockReviews = [{ id: 1, rating: 5 }];

      authService.getValidToken.mockResolvedValue(oldToken);
      authService.getRefreshToken.mockResolvedValue(refreshToken);
      authService.refreshAuthToken.mockResolvedValue(newToken);

      const error401 = { status: 401 };
      profileApi.getJson
        .mockRejectedValueOnce(error401)
        .mockResolvedValueOnce({ reviews: mockReviews });

      handleApiError.mockReturnValue(error401);

      const result = await fetchReviews({}, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockReviews);
    });
  });

  describe('createReview', () => {
    it('должен создать отзыв', async () => {
      const reviewData = {
        userId: 1,
        rating: 5,
        comment: 'Great service!',
        jobId: 1,
      };
      const token = 'test-token';
      const createdReview = {
        id: 1,
        ...reviewData,
        createdAt: new Date().toISOString(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ review: createdReview }),
      });

      const result = await createReview(reviewData, token);

      expect(result).toEqual(createdReview);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('должен обработать ошибку создания отзыва', async () => {
      const reviewData = { userId: 1, rating: 5, comment: 'Great!' };
      const token = 'test-token';
      const error = { status: 400, message: 'Bad request' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      handleApiError.mockReturnValue(error);

      await expect(createReview(reviewData, token)).rejects.toEqual(error);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const reviewData = { userId: 1, rating: 5, comment: 'Great!' };
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const createdReview = { id: 1, ...reviewData };

      authService.getValidToken.mockResolvedValue(oldToken);
      authService.getRefreshToken.mockResolvedValue(refreshToken);
      authService.refreshAuthToken.mockResolvedValue(newToken);

      const error401 = { status: 401 };
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ review: createdReview }),
        });

      handleApiError.mockReturnValue(error401);

      const result = await createReview(reviewData, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(createdReview);
    });

    it('должен обработать таймаут', async () => {
      const reviewData = { userId: 1, rating: 5 };
      const token = 'test-token';
      const timeoutError = new TimeoutError('timeout');

      global.fetch.mockImplementation(() => new Promise(() => {}));
      handleApiError.mockReturnValue(timeoutError);

      await expect(createReview(reviewData, token)).rejects.toEqual(timeoutError);
    });
  });
});

