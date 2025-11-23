import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJobs, fetchJobById, applyToJob, fetchApplications, fetchApplicationById } from '../services/jobsApi';

/**
 * Хук для получения списка вакансий
 */
export const useJobsQuery = (params = {}, token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['jobs', params, token],
    queryFn: async () => {
      const jobs = await fetchJobs(params, token);
      return jobs;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 минуты по умолчанию
    gcTime: options?.cacheTime ?? 5 * 60 * 1000, // 5 минут по умолчанию
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Хук для получения одной вакансии по ID
 */
export const useJobQuery = (jobId, token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['job', jobId, token],
    queryFn: async () => {
      const job = await fetchJobById(jobId, token);
      return job;
    },
    enabled: options?.enabled !== false && !!jobId,
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 минуты по умолчанию
    gcTime: options?.cacheTime ?? 5 * 60 * 1000, // 5 минут по умолчанию
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Хук для отклика на вакансию
 */
export const useApplyToJob = (token) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, applicationData }) => {
      const application = await applyToJob(jobId, applicationData, token);
      return application;
    },
    onSuccess: (data, variables) => {
      // Инвалидировать список откликов
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      // Инвалидировать данные вакансии (на случай, если там есть информация об отклике)
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      // Инвалидировать список вакансий
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

/**
 * Хук для получения откликов пользователя
 */
export const useApplicationsQuery = (params = {}, token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['applications', params, token],
    queryFn: async () => {
      const applications = await fetchApplications(params, token);
      return applications;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? 1 * 60 * 1000, // 1 минута по умолчанию
    gcTime: options?.cacheTime ?? 3 * 60 * 1000, // 3 минуты по умолчанию
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Хук для получения одного отклика по ID
 */
export const useApplicationQuery = (applicationId, token, options = {}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['application', applicationId, token],
    queryFn: async () => {
      const application = await fetchApplicationById(applicationId, token);
      return application;
    },
    enabled: options?.enabled !== false && !!applicationId,
    staleTime: options?.staleTime ?? 1 * 60 * 1000, // 1 минута по умолчанию
    gcTime: options?.cacheTime ?? 3 * 60 * 1000, // 3 минуты по умолчанию
    retry: 2,
    retryDelay: 1000,
  });
};

