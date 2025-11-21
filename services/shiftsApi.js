/**
 * Сервис для работы со сменами
 */

import { API_ENDPOINTS, API_TIMEOUT_MS } from '../config';
import { handleApiError, TimeoutError, NetworkError, ApiError } from '../utils/errorHandler';
import { getValidToken, refreshAuthToken, getRefreshToken } from './authService';
import { getJson } from './profileApi';

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
 * Получить список смен
 * @param {Object} params - Параметры запроса (page, limit, date, status и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Список смен
 */
export const fetchShifts = async (params = {}, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.date) queryParams.append('date', params.date);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);
    if (params.location) queryParams.append('location', params.location);

    const url = `${API_ENDPOINTS.shifts}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await getJson(url, API_TIMEOUT_MS, headers);
    return data.shifts || data;
  }, token);
};

/**
 * Принять смену
 * @param {string|number} shiftId - ID смены
 * @param {Object} acceptData - Дополнительные данные (confirmation и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Результат принятия смены
 */
export const acceptShift = async (shiftId, acceptData = {}, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const url = `${API_ENDPOINTS.shifts}/${shiftId}/accept`;
    const headers = { 'Content-Type': 'application/json' };
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    let response = null;
    try {
      response = await requestWithTimeout(
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(acceptData),
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
      return data.shift || data;
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
 * Отклонить смену
 * @param {string|number} shiftId - ID смены
 * @param {Object} rejectData - Дополнительные данные (reason и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Результат отклонения смены
 */
export const rejectShift = async (shiftId, rejectData = {}, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const url = `${API_ENDPOINTS.shifts}/${shiftId}/reject`;
    const headers = { 'Content-Type': 'application/json' };
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    let response = null;
    try {
      response = await requestWithTimeout(
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(rejectData),
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
      return data.shift || data;
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

