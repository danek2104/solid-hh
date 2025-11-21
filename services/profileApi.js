import { API_ENDPOINTS, API_TIMEOUT_MS } from '../config';
import { handleApiError, TimeoutError, NetworkError, ApiError, CorsError, UnauthorizedError, ForbiddenError } from '../utils/errorHandler';
import { getValidToken, validateToken, refreshAuthToken, getRefreshToken } from './authService';
import { Platform } from 'react-native';

// Callback для обработки истечения токена (будет установлен из App.js)
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
  // Получаем валидный токен (автоматически обновляется при необходимости)
  let validToken = token;
  try {
    if (token) {
      // Используем getValidToken, который автоматически проверяет и обновляет токен
      validToken = await getValidToken();
      // Если токен не удалось получить или обновить, используем переданный токен
      // (но только если он был передан и может быть валидным)
      if (!validToken && token) {
        // Если getValidToken вернул null, это означает, что токен истек и нет refresh token
        // В этом случае не используем переданный токен, а используем null
        // Запрос выполнится без токена, что приведет к 401, который обработается ниже
        validToken = null;
      }
    }
  } catch (tokenError) {
    // Если не удалось получить токен, продолжаем без токена
    // Это вызовет 401, который будет обработан ниже
    console.warn('Не удалось получить валидный токен:', tokenError);
    validToken = null;
  }

  try {
    return await requestFn(validToken);
  } catch (error) {
    // Гарантируем, что ошибка правильно обработана перед дальнейшей обработкой
    // Если ошибка уже является экземпляром наших классов ошибок, используем её как есть
    const isOurError = error instanceof NetworkError || 
                       error instanceof TimeoutError || 
                       error instanceof ApiError ||
                       error instanceof UnauthorizedError ||
                       error instanceof ForbiddenError ||
                       error instanceof CorsError ||
                       (error && typeof error === 'object' && error.name && 
                        (error.name === 'NetworkError' || error.name === 'TimeoutError' || 
                         error.name === 'ApiError' || error.name === 'UnauthorizedError' ||
                         error.name === 'ForbiddenError' || error.name === 'CorsError'));
    
    // Если получили 401, пытаемся обновить токен и повторить запрос
    if (error && typeof error === 'object' && error.status === 401 && (validToken || token)) {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          const newToken = await refreshAuthToken(refreshToken);
          // Повторяем запрос с новым токеном
          return await requestFn(newToken);
        } catch (refreshError) {
          // Не удалось обновить токен, вызываем callback истечения сессии
          if (onTokenExpired) {
            onTokenExpired();
          }
          // Гарантируем, что ошибка правильно обработана
          if (!isOurError) {
            const { handleApiError } = require('../utils/errorHandler');
            const handledError = handleApiError(error, null);
            throw handledError;
          }
          throw error;
        }
      } else {
        // Нет refresh token, вызываем callback истечения сессии
        if (onTokenExpired) {
          onTokenExpired();
        }
        // Гарантируем, что ошибка правильно обработана
        if (!isOurError) {
          const { handleApiError } = require('../utils/errorHandler');
          const handledError = handleApiError(error, null);
          throw handledError;
        }
        throw error;
      }
    }
    
    // Гарантируем, что все остальные ошибки правильно обработаны
    if (!isOurError) {
      const { handleApiError } = require('../utils/errorHandler');
      const handledError = handleApiError(error, null);
      throw handledError;
    }
    
    // Пробрасываем все остальные ошибки (NetworkError, TimeoutError и т.д.)
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

const postJson = async (url, payload, timeout = API_TIMEOUT_MS) => {
  let response = null;
  try {
    // Для веб-версии добавляем режим CORS явно
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    
    // В веб-браузере добавляем режим CORS
    if (Platform.OS === 'web') {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }
    
    response = await requestWithTimeout(
      fetch(url, fetchOptions),
      timeout
    );

    if (!response || !response.ok) {
      const error = handleApiError(new Error(response?.status?.toString() || 'REQUEST_FAILED'), response);
      
      // Обработка истечения токена (401)
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      
      throw error;
    }

    const data = await response.json().catch(() => ({}));
    return data;
  } catch (error) {
    // Если это уже обработанная ошибка, просто пробросить её
    if (error instanceof NetworkError || 
        error instanceof TimeoutError || 
        error instanceof ApiError ||
        error instanceof CorsError ||
        error instanceof UnauthorizedError ||
        error instanceof ForbiddenError) {
      // Обработка истечения токена для уже обработанных ошибок
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }
    
    // Если это ошибка с полем status (обработанная ошибка)
    if (error.status) {
      // Обработка истечения токена для уже обработанных ошибок
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }
    
    // Обработать неизвестную ошибку
    const handledError = handleApiError(error, response);
    
    // Обработка истечения токена
    if (handledError.status === 401 && onTokenExpired) {
      onTokenExpired();
    }
    
    throw handledError;
  }
};

const getJson = async (url, timeout = API_TIMEOUT_MS, headers = {}) => {
  let response = null;
  try {
    // Для веб-версии добавляем режим CORS явно
    const fetchOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    
    // В веб-браузере добавляем режим CORS
    if (Platform.OS === 'web') {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }
    
    response = await requestWithTimeout(
      fetch(url, fetchOptions),
      timeout
    );

    if (!response || !response.ok) {
      // Пытаемся извлечь сообщение об ошибке из ответа
      let errorMessage = null;
      try {
        const errorData = await response.json().catch(() => null);
        if (errorData && (errorData.message || errorData.error)) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch (e) {
        // Игнорируем ошибки при парсинге
      }
      
      const error = handleApiError(
        errorMessage ? new Error(errorMessage) : new Error(response?.status?.toString() || 'REQUEST_FAILED'), 
        response
      );
      
      // Обработка истечения токена (401)
      if (error && error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      
      throw error;
    }

    const data = await response.json().catch((parseError) => {
      // Если не удалось распарсить JSON, возвращаем пустой объект
      // Но логируем ошибку для отладки
      console.warn('Не удалось распарсить JSON ответ:', parseError);
      return {};
    });
    return data;
  } catch (error) {
    // Если это уже обработанная ошибка (NetworkError, TimeoutError, ApiError), просто пробросить её
    if (error instanceof NetworkError || error instanceof TimeoutError || error instanceof ApiError) {
      // Обработка истечения токена для уже обработанных ошибок
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }
    
    // Проверяем по имени ошибки (на случай, если это мок или ошибка из другого контекста)
    if (error && typeof error === 'object' && error.name && (error.name === 'NetworkError' || error.name === 'TimeoutError' || error.name === 'ApiError')) {
      // Обработка истечения токена для уже обработанных ошибок
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }
    
    // Если это ошибка с полем status (обработанная ошибка), но не экземпляр наших классов
    if (error && typeof error === 'object' && 'status' in error && error.status !== undefined) {
      // Обработка истечения токена для уже обработанных ошибок
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }
    
    // Обработать неизвестную ошибку - обязательно выбрасываем результат handleApiError
    const handledError = handleApiError(error, response);
    
    // Обработка истечения токена
    if (handledError && handledError.status === 401 && onTokenExpired) {
      onTokenExpired();
    }
    
    // Гарантируем, что ошибка выбрасывается
    // Всегда выбрасываем результат handleApiError, если он есть, иначе исходную ошибку
    if (handledError) {
      throw handledError;
    }
    throw error;
  }
};

/**
 * Получить профиль пользователя
 */
export const fetchProfile = async (token) => {
  try {
    return await requestWithTokenRefresh(async (validToken) => {
      const headers = {};
      if (validToken) {
        headers['Authorization'] = `Bearer ${validToken}`;
      }

      const data = await getJson(API_ENDPOINTS.profile, API_TIMEOUT_MS, headers);
      return data.profile || data;
    }, token);
  } catch (error) {
    // Гарантируем, что ошибка правильно обработана
    // Если ошибка уже является экземпляром наших классов ошибок, просто пробросить её
    if (error instanceof NetworkError || 
        error instanceof TimeoutError || 
        error instanceof ApiError ||
        error instanceof UnauthorizedError ||
        error instanceof ForbiddenError) {
      throw error;
    }
    
    // Если ошибка имеет поле status или name, это может быть обработанная ошибка
    if (error && typeof error === 'object' && (error.status || error.name)) {
      // Проверяем, является ли это уже обработанной ошибкой
      if (error.name === 'NetworkError' || error.name === 'TimeoutError' || error.name === 'ApiError' || 
          error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
        throw error;
      }
      
      // Если это ошибка с status, но не наш класс, преобразуем её
      const { handleApiError } = require('../utils/errorHandler');
      const handledError = handleApiError(error, null);
      throw handledError;
    }
    
    // Для всех остальных ошибок вызываем handleApiError
    const { handleApiError } = require('../utils/errorHandler');
    const handledError = handleApiError(error, null);
    throw handledError;
  }
};

/**
 * Обновить профиль пользователя
 */
export const updateProfile = async (profilePayload, token) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const url = API_ENDPOINTS.profile;
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
          body: JSON.stringify({ profile: profilePayload }),
        }),
        API_TIMEOUT_MS
      );

      if (!response || !response.ok) {
        const error = handleApiError(new Error(response?.status?.toString() || 'REQUEST_FAILED'), response);
        
        // Обработка истечения токена (401)
        if (error.status === 401 && onTokenExpired) {
          onTokenExpired();
        }
        
        throw error;
      }

      const data = await response.json().catch(() => ({}));
      return data?.profile || data;
    } catch (error) {
      // Если это уже обработанная ошибка, просто пробросить её
      if (error.status || error.name === 'TimeoutError' || error.name === 'NetworkError') {
        throw error;
      }
      
      // Обработать неизвестную ошибку
      const handledError = handleApiError(error, response);
      
      // Обработка истечения токена
      if (handledError.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      
      throw handledError;
    }
  }, token);
};

/**
 * Получить статусы документов
 */
export const fetchDocumentStatuses = async (token) => {
  return await requestWithTokenRefresh(async (validToken) => {
    // Предполагаем, что есть отдельный endpoint для статусов документов
    // Если нет, можно использовать общий profile endpoint с параметром
    const url = `${API_ENDPOINTS.profile}/documents/status`;
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }
    
    try {
      const response = await getJson(url, API_TIMEOUT_MS, headers);
      return response;
    } catch (error) {
      // Если endpoint не существует, возвращаем пустой объект
      console.warn('Не удалось получить статусы документов', error);
      return {};
    }
  }, token);
};

export { postJson, getJson };

