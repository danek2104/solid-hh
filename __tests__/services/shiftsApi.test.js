import {
  fetchShifts,
  acceptShift,
  rejectShift,
  setTokenExpiredHandler,
} from '../../services/shiftsApi';
import * as authService from '../../services/authService';
import * as profileApi from '../../services/profileApi';
import { handleApiError, TimeoutError } from '../../utils/errorHandler';

jest.mock('../../services/authService');
jest.mock('../../services/profileApi');
jest.mock('../../utils/errorHandler');
jest.mock('../../config', () => ({
  API_ENDPOINTS: {
    shifts: 'https://api.workmatch.dev/shifts',
  },
  API_TIMEOUT_MS: 1200,
}));

describe('shiftsApi', () => {
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

  describe('fetchShifts', () => {
    it('должен получить список смен', async () => {
      const mockShifts = [
        { id: 1, jobTitle: 'Shift 1', date: '2024-01-01' },
        { id: 2, jobTitle: 'Shift 2', date: '2024-01-02' },
      ];
      const token = 'test-token';
      const params = { page: 1, limit: 10 };

      profileApi.getJson.mockResolvedValue({ shifts: mockShifts });

      const result = await fetchShifts(params, token);

      expect(result).toEqual(mockShifts);
      expect(profileApi.getJson).toHaveBeenCalled();
    });

    it('должен получить смены с фильтрами', async () => {
      const mockShifts = [{ id: 1, jobTitle: 'Shift 1', status: 'pending' }];
      const token = 'test-token';
      const params = {
        date: '2024-01-01',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: 'pending',
        location: 'Moscow',
      };

      profileApi.getJson.mockResolvedValue({ shifts: mockShifts });

      const result = await fetchShifts(params, token);

      expect(result).toEqual(mockShifts);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const mockShifts = [{ id: 1, jobTitle: 'Shift 1' }];

      authService.getValidToken.mockResolvedValue(oldToken);
      authService.getRefreshToken.mockResolvedValue(refreshToken);
      authService.refreshAuthToken.mockResolvedValue(newToken);

      const error401 = { status: 401 };
      profileApi.getJson
        .mockRejectedValueOnce(error401)
        .mockResolvedValueOnce({ shifts: mockShifts });

      handleApiError.mockReturnValue(error401);

      const result = await fetchShifts({}, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockShifts);
    });
  });

  describe('acceptShift', () => {
    it('должен принять смену', async () => {
      const shiftId = '1';
      const acceptData = { confirmation: true };
      const token = 'test-token';
      const acceptedShift = {
        id: 1,
        status: 'accepted',
        ...acceptData,
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ shift: acceptedShift }),
      });

      const result = await acceptShift(shiftId, acceptData, token);

      expect(result).toEqual(acceptedShift);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('должен обработать ошибку принятия смены', async () => {
      const shiftId = '1';
      const acceptData = {};
      const token = 'test-token';
      const error = { status: 400, message: 'Bad request' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      handleApiError.mockReturnValue(error);

      await expect(acceptShift(shiftId, acceptData, token)).rejects.toEqual(error);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const shiftId = '1';
      const acceptData = {};
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const acceptedShift = { id: 1, status: 'accepted' };

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
          json: async () => ({ shift: acceptedShift }),
        });

      handleApiError.mockReturnValue(error401);

      const result = await acceptShift(shiftId, acceptData, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(acceptedShift);
    });
  });

  describe('rejectShift', () => {
    it('должен отклонить смену', async () => {
      const shiftId = '1';
      const rejectData = { reason: 'Not available' };
      const token = 'test-token';
      const rejectedShift = {
        id: 1,
        status: 'rejected',
        ...rejectData,
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ shift: rejectedShift }),
      });

      const result = await rejectShift(shiftId, rejectData, token);

      expect(result).toEqual(rejectedShift);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('должен обработать ошибку отклонения смены', async () => {
      const shiftId = '1';
      const rejectData = { reason: 'Not available' };
      const token = 'test-token';
      const error = { status: 400, message: 'Bad request' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      handleApiError.mockReturnValue(error);

      await expect(rejectShift(shiftId, rejectData, token)).rejects.toEqual(error);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const shiftId = '1';
      const rejectData = { reason: 'Not available' };
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const rejectedShift = { id: 1, status: 'rejected' };

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
          json: async () => ({ shift: rejectedShift }),
        });

      handleApiError.mockReturnValue(error401);

      const result = await rejectShift(shiftId, rejectData, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(rejectedShift);
    });
  });
});

