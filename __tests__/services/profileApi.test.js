import { fetchProfile, updateProfile, fetchDocumentStatuses, postJson, getJson } from '../../services/profileApi';
import { getValidToken, getRefreshToken, refreshAuthToken } from '../../services/authService';
import { handleApiError, TimeoutError, NetworkError } from '../../utils/errorHandler';

jest.mock('../../services/authService');
jest.mock('../../utils/errorHandler');
jest.mock('../../config', () => ({
  API_ENDPOINTS: {
    profile: 'https://api.workmatch.dev/profile',
  },
  API_TIMEOUT_MS: 1200,
}));

describe('profileApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('fetchProfile', () => {
    it('должен получить профиль с токеном', async () => {
      const token = 'test-token';
      const profile = { id: 1, name: 'Test User' };

      getValidToken.mockResolvedValue(token);
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ profile }),
      });

      const result = await fetchProfile(token);

      expect(result).toEqual(profile);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.workmatch.dev/profile',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const profile = { id: 1, name: 'Test User' };

      getValidToken.mockResolvedValue(oldToken);
      getRefreshToken.mockResolvedValue(refreshToken);
      refreshAuthToken.mockResolvedValue(newToken);

      // Первый запрос возвращает 401
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ profile }),
        });

      const error = { status: 401 };
      handleApiError.mockReturnValue(error);

      const result = await fetchProfile(oldToken);

      expect(refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(profile);
    });

    it('должен обработать ошибку сети', async () => {
      const token = 'test-token';
      const networkError = new NetworkError('Network error');

      getValidToken.mockResolvedValue(token);
      global.fetch.mockRejectedValue(new Error('Network request failed'));
      handleApiError.mockReturnValue(networkError);

      try {
        await fetchProfile(token);
        // Если не выбросило ошибку, тест должен провалиться
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
      }
    });

    it('должен обработать таймаут', async () => {
      const token = 'test-token';
      const timeoutError = new TimeoutError('Timeout');

      getValidToken.mockResolvedValue(token);
      global.fetch.mockImplementation(() => new Promise(() => {})); // Никогда не резолвится
      handleApiError.mockReturnValue(timeoutError);

      try {
        await fetchProfile(token);
        // Если не выбросило ошибку, тест должен провалиться
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
      }
    });
  });

  describe('updateProfile', () => {
    it('должен обновить профиль', async () => {
      const token = 'test-token';
      const profilePayload = { name: 'Updated Name' };
      const updatedProfile = { id: 1, name: 'Updated Name' };

      getValidToken.mockResolvedValue(token);
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ profile: updatedProfile }),
      });

      const result = await updateProfile(profilePayload, token);

      expect(result).toEqual(updatedProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.workmatch.dev/profile',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ profile: profilePayload }),
        })
      );
    });

    it('должен обработать ошибку при обновлении', async () => {
      const token = 'test-token';
      const profilePayload = { name: 'Updated Name' };
      const apiError = { status: 422, message: 'Validation error' };

      getValidToken.mockResolvedValue(token);
      global.fetch.mockResolvedValue({
        ok: false,
        status: 422,
      });
      handleApiError.mockReturnValue(apiError);

      await expect(updateProfile(profilePayload, token)).rejects.toEqual(apiError);
    });
  });

  describe('fetchDocumentStatuses', () => {
    it('должен получить статусы документов', async () => {
      const token = 'test-token';
      const statuses = { doc1: 'approved', doc2: 'pending' };

      getValidToken.mockResolvedValue(token);
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => statuses,
      });

      const result = await fetchDocumentStatuses(token);

      expect(result).toEqual(statuses);
    });

    it('должен вернуть пустой объект при ошибке', async () => {
      const token = 'test-token';

      getValidToken.mockResolvedValue(token);
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });
      handleApiError.mockReturnValue({ status: 404 });

      const result = await fetchDocumentStatuses(token);

      expect(result).toEqual({});
    });
  });

  describe('postJson', () => {
    it('должен выполнить POST запрос', async () => {
      const url = 'https://api.workmatch.dev/test';
      const payload = { data: 'test' };
      const response = { success: true };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => response,
      });

      const result = await postJson(url, payload);

      expect(result).toEqual(response);
      expect(global.fetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      );
    });

    it('должен обработать ошибку ответа', async () => {
      const url = 'https://api.workmatch.dev/test';
      const payload = { data: 'test' };
      const apiError = { status: 400, message: 'Bad request' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });
      handleApiError.mockReturnValue(apiError);

      await expect(postJson(url, payload)).rejects.toEqual(apiError);
    });
  });

  describe('getJson', () => {
    it('должен выполнить GET запрос', async () => {
      const url = 'https://api.workmatch.dev/test';
      const response = { data: 'test' };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => response,
      });

      const result = await getJson(url);

      expect(result).toEqual(response);
      expect(global.fetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('должен обработать ошибку ответа', async () => {
      const url = 'https://api.workmatch.dev/test';
      const apiError = { status: 500, message: 'Server error' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });
      handleApiError.mockReturnValue(apiError);

      await expect(getJson(url)).rejects.toEqual(apiError);
    });
  });
});

