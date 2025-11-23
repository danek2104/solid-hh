/**
 * Сервис для работы с работниками
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

/**
 * Получить список работников с поиском и фильтрами
 * @param {Object} params - Параметры запроса (page, limit, search, skill, location, availability, rating и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Список работников
 */
export const fetchWorkers = async (params = {}, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    // Формируем query параметры для поиска и фильтрации
    const queryParams = new URLSearchParams();
    
    // Пагинация
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Поиск
    if (params.search) queryParams.append('search', params.search);
    if (params.query) queryParams.append('query', params.query);
    
    // Фильтры по навыкам
    if (params.skill) queryParams.append('skill', params.skill);
    if (params.skills) {
      // Если skills - массив, добавляем каждый элемент отдельно
      if (Array.isArray(params.skills)) {
        params.skills.forEach(skill => queryParams.append('skills[]', skill));
      } else {
        queryParams.append('skills', params.skills);
      }
    }
    
    // Фильтры по локации
    if (params.location) queryParams.append('location', params.location);
    if (params.city) queryParams.append('city', params.city);
    if (params.region) queryParams.append('region', params.region);
    
    // Фильтры по доступности
    if (params.availability) queryParams.append('availability', params.availability);
    if (params.availableFrom) queryParams.append('availableFrom', params.availableFrom);
    if (params.availableTo) queryParams.append('availableTo', params.availableTo);
    
    // Фильтры по рейтингу
    if (params.minRating) queryParams.append('minRating', params.minRating);
    if (params.maxRating) queryParams.append('maxRating', params.maxRating);
    if (params.rating) queryParams.append('rating', params.rating);
    
    // Фильтры по опыту
    if (params.minExperience) queryParams.append('minExperience', params.minExperience);
    if (params.maxExperience) queryParams.append('maxExperience', params.maxExperience);
    
    // Сортировка
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.order) queryParams.append('order', params.order);
    
    // Дополнительные фильтры
    if (params.verified) queryParams.append('verified', params.verified);
    if (params.hasDocuments) queryParams.append('hasDocuments', params.hasDocuments);
    if (params.status) queryParams.append('status', params.status);

    const url = `${API_ENDPOINTS.workers}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await getJson(url, API_TIMEOUT_MS, headers);
    return data.workers || data;
  }, token);
};

