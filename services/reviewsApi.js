/**
 * Сервис для работы с отзывами
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
 * Получить список отзывов
 * @param {Object} params - Параметры запроса (page, limit, userId, rating и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Список отзывов
 */
export const fetchReviews = async (params = {}, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.rating) queryParams.append('rating', params.rating);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.order) queryParams.append('order', params.order);

    const url = `${API_ENDPOINTS.reviews}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await getJson(url, API_TIMEOUT_MS, headers);
    return data.reviews || data;
  }, token);
};

/**
 * Создать отзыв
 * @param {Object} reviewData - Данные отзыва (userId, rating, comment, jobId и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Созданный отзыв
 */
export const createReview = async (reviewData, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const url = API_ENDPOINTS.reviews;
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
          body: JSON.stringify(reviewData),
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
      return data.review || data;
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

