import {
  fetchJobs,
  fetchJobById,
  applyToJob,
  fetchApplications,
  fetchApplicationById,
  setTokenExpiredHandler,
} from '../../services/jobsApi';
import * as authService from '../../services/authService';
import * as profileApi from '../../services/profileApi';
import { handleApiError, TimeoutError } from '../../utils/errorHandler';

jest.mock('../../services/authService');
jest.mock('../../services/profileApi');
jest.mock('../../utils/errorHandler');
jest.mock('../../config', () => ({
  API_ENDPOINTS: {
    jobs: 'https://api.workmatch.dev/jobs',
  },
  API_TIMEOUT_MS: 1200,
}));

describe('jobsApi', () => {
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

  describe('fetchJobs', () => {
    it('должен получить список вакансий', async () => {
      const mockJobs = [
        { id: 1, title: 'Job 1', salary: 1000 },
        { id: 2, title: 'Job 2', salary: 2000 },
      ];
      const token = 'test-token';
      const params = { page: 1, limit: 10 };

      profileApi.getJson.mockResolvedValue({ jobs: mockJobs });

      const result = await fetchJobs(params, token);

      expect(result).toEqual(mockJobs);
      expect(profileApi.getJson).toHaveBeenCalled();
    });

    it('должен получить вакансии с фильтрами', async () => {
      const mockJobs = [{ id: 1, title: 'Job 1', location: 'Moscow' }];
      const token = 'test-token';
      const params = {
        search: 'developer',
        location: 'Moscow',
        minSalary: 1000,
        maxSalary: 5000,
      };

      profileApi.getJson.mockResolvedValue({ jobs: mockJobs });

      const result = await fetchJobs(params, token);

      expect(result).toEqual(mockJobs);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const mockJobs = [{ id: 1, title: 'Job 1' }];

      authService.getValidToken.mockResolvedValue(oldToken);
      authService.getRefreshToken.mockResolvedValue(refreshToken);
      authService.refreshAuthToken.mockResolvedValue(newToken);

      const error401 = { status: 401 };
      profileApi.getJson
        .mockRejectedValueOnce(error401)
        .mockResolvedValueOnce({ jobs: mockJobs });

      handleApiError.mockReturnValue(error401);

      const result = await fetchJobs({}, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockJobs);
    });
  });

  describe('fetchJobById', () => {
    it('должен получить вакансию по ID', async () => {
      const mockJob = { id: 1, title: 'Job 1', description: 'Description' };
      const jobId = '1';
      const token = 'test-token';

      profileApi.getJson.mockResolvedValue({ job: mockJob });

      const result = await fetchJobById(jobId, token);

      expect(result).toEqual(mockJob);
      expect(profileApi.getJson).toHaveBeenCalled();
    });
  });

  describe('applyToJob', () => {
    it('должен подать заявку на вакансию', async () => {
      const jobId = '1';
      const applicationData = { message: 'I want this job', coverLetter: 'Letter' };
      const token = 'test-token';
      const application = {
        id: 1,
        jobId: 1,
        status: 'pending',
        ...applicationData,
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ application }),
      });

      const result = await applyToJob(jobId, applicationData, token);

      expect(result).toEqual(application);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('должен обработать ошибку подачи заявки', async () => {
      const jobId = '1';
      const applicationData = { message: 'I want this job' };
      const token = 'test-token';
      const error = { status: 400, message: 'Bad request' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      handleApiError.mockReturnValue(error);

      await expect(applyToJob(jobId, applicationData, token)).rejects.toEqual(error);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const jobId = '1';
      const applicationData = { message: 'I want this job' };
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const application = { id: 1, jobId: 1, status: 'pending' };

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
          json: async () => ({ application }),
        });

      handleApiError.mockReturnValue(error401);

      const result = await applyToJob(jobId, applicationData, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(application);
    });
  });

  describe('fetchApplications', () => {
    it('должен получить список откликов', async () => {
      const mockApplications = [
        { id: 1, jobId: 1, status: 'pending' },
        { id: 2, jobId: 2, status: 'accepted' },
      ];
      const token = 'test-token';
      const params = { page: 1, limit: 10 };

      profileApi.getJson.mockResolvedValue({ applications: mockApplications });

      const result = await fetchApplications(params, token);

      expect(result).toEqual(mockApplications);
      expect(profileApi.getJson).toHaveBeenCalled();
    });

    it('должен получить отклики с фильтрами', async () => {
      const mockApplications = [{ id: 1, jobId: 1, status: 'pending' }];
      const token = 'test-token';
      const params = { status: 'pending', jobId: 1 };

      profileApi.getJson.mockResolvedValue({ applications: mockApplications });

      const result = await fetchApplications(params, token);

      expect(result).toEqual(mockApplications);
    });
  });

  describe('fetchApplicationById', () => {
    it('должен получить отклик по ID', async () => {
      const mockApplication = { id: 1, jobId: 1, status: 'pending', message: 'Hello' };
      const applicationId = '1';
      const token = 'test-token';

      profileApi.getJson.mockResolvedValue({ application: mockApplication });

      const result = await fetchApplicationById(applicationId, token);

      expect(result).toEqual(mockApplication);
      expect(profileApi.getJson).toHaveBeenCalled();
    });
  });
});

