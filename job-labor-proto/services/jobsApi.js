/**
 * Сервис для работы с вакансиями
 */

import { API_ENDPOINTS, API_TIMEOUT_MS } from '../config';
import { handleApiError, TimeoutError, NetworkError, ApiError } from '../utils/errorHandler';
import { getValidToken, refreshAuthToken, getRefreshToken } from './authService';
import { getJson, postJson } from './profileApi';

// Callback для обработки истечения токена
let onTokenExpired = null;

/**
 * Установить callback для обработки истечения токена
 */
export const setTokenExpiredHandler = (callback) => {
  onTokenExpired = callback;
};

/**
 * Выполнить запрос с автоматическим обновлением токена при необходимости
 */
const requestWithTokenRefresh = async (requestFn, token) => {
  let validToken = token;
  if (token) {
    validToken = await getValidToken();
    if (!validToken && token) {
      validToken = null;
    }
  }

  try {
    return await requestFn(validToken);
  } catch (error) {
    if (error && typeof error === 'object' && error.status === 401 && (validToken || token)) {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          const newToken = await refreshAuthToken(refreshToken);
          return await requestFn(newToken);
        } catch (refreshError) {
          if (onTokenExpired) {
            onTokenExpired();
          }
          throw error;
        }
      } else {
        if (onTokenExpired) {
          onTokenExpired();
        }
        throw error;
      }
    }
    throw error;
  }
};

const requestWithTimeout = (promise, timeout) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError('timeout')), timeout);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

/**
 * Получить список вакансий
 * @param {Object} params - Параметры запроса (page, limit, search, filters и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Список вакансий
 */
export const fetchJobs = async (params = {}, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.location) queryParams.append('location', params.location);
    if (params.skill) queryParams.append('skill', params.skill);
    if (params.minSalary) queryParams.append('minSalary', params.minSalary);
    if (params.maxSalary) queryParams.append('maxSalary', params.maxSalary);
    if (params.availability) queryParams.append('availability', params.availability);
    if (params.status) queryParams.append('status', params.status);

    const url = `${API_ENDPOINTS.jobs}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await getJson(url, API_TIMEOUT_MS, headers);
    return data.jobs || data;
  }, token);
};

/**
 * Получить одну вакансию по ID
 * @param {string|number} jobId - ID вакансии
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Данные вакансии
 */
export const fetchJobById = async (jobId, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    const url = `${API_ENDPOINTS.jobs}/${jobId}`;
    const data = await getJson(url, API_TIMEOUT_MS, headers);
    return data.job || data;
  }, token);
};

/**
 * Подать заявку на вакансию
 * @param {string|number} jobId - ID вакансии
 * @param {Object} applicationData - Данные заявки (message, coverLetter и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Результат подачи заявки
 */
export const applyToJob = async (jobId, applicationData = {}, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const url = `${API_ENDPOINTS.jobs}/apply`;
    const headers = { 'Content-Type': 'application/json' };
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    const payload = {
      jobId,
      ...applicationData,
    };

    let response = null;
    try {
      response = await requestWithTimeout(
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }),
        API_TIMEOUT_MS
      );

      if (!response || !response.ok) {
        const error = handleApiError(
          new Error(response?.status?.toString() || 'REQUEST_FAILED'),
          response
        );

        if (error.status === 401 && onTokenExpired) {
          onTokenExpired();
        }

        throw error;
      }

      const data = await response.json().catch(() => ({}));
      return data.application || data;
    } catch (error) {
      if (error.status || error.name === 'TimeoutError' || error.name === 'NetworkError') {
        if (error.status === 401 && onTokenExpired) {
          onTokenExpired();
        }
        throw error;
      }

      const handledError = handleApiError(error, response);

      if (handledError.status === 401 && onTokenExpired) {
        onTokenExpired();
      }

      throw handledError;
    }
  }, token);
};

/**
 * Получить отклики пользователя
 * @param {Object} params - Параметры запроса (page, limit, status и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Список откликов
 */
export const fetchApplications = async (params = {}, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.jobId) queryParams.append('jobId', params.jobId);

    const url = `${API_ENDPOINTS.jobs}/applications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await getJson(url, API_TIMEOUT_MS, headers);
    return data.applications || data;
  }, token);
};

/**
 * Получить один отклик по ID
 * @param {string|number} applicationId - ID отклика
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Данные отклика
 */
export const fetchApplicationById = async (applicationId, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    const url = `${API_ENDPOINTS.jobs}/applications/${applicationId}`;
    const data = await getJson(url, API_TIMEOUT_MS, headers);
    return data.application || data;
  }, token);
};

