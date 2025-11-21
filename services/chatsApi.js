/**
 * Сервис для работы с чатами
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
 * Получить список чатов
 * @param {Object} params - Параметры запроса (page, limit и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Список чатов
 */
export const fetchChats = async (params = {}, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `${API_ENDPOINTS.chats}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await getJson(url, API_TIMEOUT_MS, headers);
    return data.chats || data;
  }, token);
};

/**
 * Отправить сообщение в чат
 * @param {string|number} chatId - ID чата
 * @param {Object} messageData - Данные сообщения (text, attachments и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Отправленное сообщение
 */
export const sendMessage = async (chatId, messageData, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const url = `${API_ENDPOINTS.chats}/${chatId}/messages`;
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
          body: JSON.stringify(messageData),
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
      return data.message || data;
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
 * Получить историю сообщений чата
 * @param {string|number} chatId - ID чата
 * @param {Object} params - Параметры запроса (page, limit, before и т.д.)
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} История сообщений
 */
export const fetchMessages = async (chatId, params = {}, token = null) => {
  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.before) queryParams.append('before', params.before);
    if (params.after) queryParams.append('after', params.after);

    // Убеждаемся, что chatId - строка для URL
    const chatIdStr = String(chatId);
    const url = `${API_ENDPOINTS.chats}/${chatIdStr}/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('[ChatsAPI] Fetching messages from:', url);
    
    try {
      const data = await getJson(url, API_TIMEOUT_MS, headers);
      return data.messages || data;
    } catch (error) {
      console.error('[ChatsAPI] Error fetching messages:', error);
      throw error;
    }
  }, token);
};

/**
 * Получить информацию о чате
 * @param {string|number} chatId - ID чата
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Информация о чате
 */
export const fetchChat = async (chatId, token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    const url = `${API_ENDPOINTS.chats}/${chatId}`;
    const data = await getJson(url, API_TIMEOUT_MS, headers);
    return data.chat || data;
  }, token);
};

/**
 * Пометить сообщения как прочитанные
 * @param {string|number} chatId - ID чата
 * @param {Array<string|number>} messageIds - ID сообщений для пометки
 * @param {string} token - Токен авторизации (опционально)
 * @returns {Promise<Object>} Результат операции
 */
export const markMessagesAsRead = async (chatId, messageIds = [], token = null) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const url = `${API_ENDPOINTS.chats}/${chatId}/messages/read`;
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
          body: JSON.stringify({ messageIds }),
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
      return data;
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

