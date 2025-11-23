/**
 * Сервис для работы с документами
 */

import { API_ENDPOINTS, API_TIMEOUT_MS } from '../config';
import { handleApiError, TimeoutError, NetworkError, ApiError, CorsError, UnauthorizedError, ForbiddenError } from '../utils/errorHandler';
import { getValidToken, refreshAuthToken, getRefreshToken } from './authService';
import { Platform } from 'react-native';

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
 * Получить список документов пользователя
 */
export const fetchDocuments = async (token) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    const fetchOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    
    if (Platform.OS === 'web') {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }

    const response = await requestWithTimeout(
      fetch(API_ENDPOINTS.documents, fetchOptions),
      API_TIMEOUT_MS
    );

    if (!response || !response.ok) {
      const error = handleApiError(new Error(response?.status?.toString() || 'REQUEST_FAILED'), response);
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }

    const data = await response.json().catch(() => ({}));
    return data.documents || data || [];
  }, token);
};

/**
 * Получить конкретный документ по ID
 */
export const fetchDocument = async (documentId, token) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    const fetchOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    
    if (Platform.OS === 'web') {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }

    const url = `${API_ENDPOINTS.documents}/${documentId}`;
    const response = await requestWithTimeout(
      fetch(url, fetchOptions),
      API_TIMEOUT_MS
    );

    if (!response || !response.ok) {
      const error = handleApiError(new Error(response?.status?.toString() || 'REQUEST_FAILED'), response);
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }

    const data = await response.json().catch(() => ({}));
    return data.document || data;
  }, token);
};

/**
 * Загрузить документ (файл)
 */
export const uploadDocument = async (file, documentType, metadata = {}, token) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const formData = new FormData();
    
    // Добавляем файл
    if (Platform.OS === 'web') {
      // Для веб-версии
      formData.append('file', file);
    } else {
      // Для мобильных версий
      formData.append('file', {
        uri: file.uri || file,
        type: file.type || 'application/pdf',
        name: file.name || 'document.pdf',
      });
    }
    
    // Добавляем тип документа и метаданные
    formData.append('documentType', documentType);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);

    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }
    // Не устанавливаем Content-Type для FormData, браузер сделает это автоматически

    const fetchOptions = {
      method: 'POST',
      headers,
      body: formData,
    };
    
    if (Platform.OS === 'web') {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }

    const response = await requestWithTimeout(
      fetch(API_ENDPOINTS.documents, fetchOptions),
      API_TIMEOUT_MS * 3 // Увеличиваем таймаут для загрузки файлов
    );

    if (!response || !response.ok) {
      const error = handleApiError(new Error(response?.status?.toString() || 'REQUEST_FAILED'), response);
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }

    const data = await response.json().catch(() => ({}));
    return data.document || data;
  }, token);
};

/**
 * Загрузить фото документа
 */
export const uploadDocumentPhoto = async (photo, documentType, metadata = {}, token) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const formData = new FormData();
    
    // Добавляем фото
    if (Platform.OS === 'web') {
      // Для веб-версии
      formData.append('photo', photo);
    } else {
      // Для мобильных версий
      formData.append('photo', {
        uri: photo.uri || photo,
        type: photo.type || 'image/jpeg',
        name: photo.name || 'photo.jpg',
      });
    }
    
    // Добавляем тип документа и метаданные
    formData.append('documentType', documentType);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);

    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    const fetchOptions = {
      method: 'POST',
      headers,
      body: formData,
    };
    
    if (Platform.OS === 'web') {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }

    const url = `${API_ENDPOINTS.documents}/photos`;
    const response = await requestWithTimeout(
      fetch(url, fetchOptions),
      API_TIMEOUT_MS * 3 // Увеличиваем таймаут для загрузки фото
    );

    if (!response || !response.ok) {
      const error = handleApiError(new Error(response?.status?.toString() || 'REQUEST_FAILED'), response);
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }

    const data = await response.json().catch(() => ({}));
    return data.document || data;
  }, token);
};

/**
 * Удалить документ
 */
export const deleteDocument = async (documentId, token) => {
  return await requestWithTokenRefresh(async (validToken) => {
    const headers = {};
    if (validToken) {
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    const fetchOptions = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    
    if (Platform.OS === 'web') {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }

    const url = `${API_ENDPOINTS.documents}/${documentId}`;
    const response = await requestWithTimeout(
      fetch(url, fetchOptions),
      API_TIMEOUT_MS
    );

    if (!response || !response.ok) {
      const error = handleApiError(new Error(response?.status?.toString() || 'REQUEST_FAILED'), response);
      if (error.status === 401 && onTokenExpired) {
        onTokenExpired();
      }
      throw error;
    }

    // DELETE запрос может не возвращать тело
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true };
    }

    const data = await response.json().catch(() => ({ success: true }));
    return data;
  }, token);
};

/**
 * Получить URL для просмотра документа
 */
export const getDocumentUrl = (documentId, token) => {
  return `${API_ENDPOINTS.documents}/${documentId}/view?token=${token || ''}`;
};




