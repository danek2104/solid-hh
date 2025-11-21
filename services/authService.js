/**
 * Сервис для управления авторизацией и обработки истечения токена
 * Использует expo-secure-store для безопасного хранения токенов
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const AUTH_ROLE_KEY = 'authRole';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

// Флаг для кэширования результата проверки SecureStore
let secureStoreAvailable = null;
let secureStoreChecked = false;

/**
 * Декодировать JWT токен без проверки подписи (только для получения данных)
 */
const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    // Используем Buffer для декодирования base64 (совместимость с Node.js)
    const decodedStr = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const decoded = JSON.parse(decodedStr);
    return decoded;
  } catch (error) {
    console.warn('Ошибка декодирования JWT:', error);
    return null;
  }
};

/**
 * Проверить, истёк ли токен
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  // Проверяем, истёк ли токен (с запасом в 60 секунд)
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < (currentTime + 60);
};

/**
 * Получить время истечения токена
 */
const getTokenExpiry = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return null;
  return decoded.exp * 1000; // Конвертируем в миллисекунды
};

/**
 * Проверить доступность SecureStore
 * Проверяет не только наличие методов, но и их работоспособность
 * Кэширует результат для оптимизации
 */
const isSecureStoreAvailable = () => {
  // Если уже проверяли, возвращаем кэшированный результат
  if (secureStoreChecked) {
    return secureStoreAvailable;
  }
  
  try {
    // Проверяем базовую доступность
    if (!SecureStore || typeof SecureStore !== 'object') {
      secureStoreAvailable = false;
      secureStoreChecked = true;
      return false;
    }
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Если SecureStore.default существует и имеет getValueWithKeyAsync,
    // это означает, что используется старый API, который не работает
    // В этом случае SecureStore недоступен, даже если новые методы есть
    if (SecureStore.default) {
      // Проверяем, есть ли внутри default старый API
      if (typeof SecureStore.default.getValueWithKeyAsync === 'function' ||
          typeof SecureStore.default.setValueWithKeyAsync === 'function') {
        // Старый API найден - SecureStore не работает
        secureStoreAvailable = false;
        secureStoreChecked = true;
        return false;
      }
    }
    
    // Проверяем наличие новых методов API
    const hasNewAPI = typeof SecureStore.getItemAsync === 'function' &&
                      typeof SecureStore.setItemAsync === 'function' &&
                      typeof SecureStore.deleteItemAsync === 'function';
    
    if (!hasNewAPI) {
      secureStoreAvailable = false;
      secureStoreChecked = true;
      return false;
    }
    
    // Если есть старый API напрямую (но только если нет новых методов)
    // Это не должно происходить, но на всякий случай
    if (typeof SecureStore.getValueWithKeyAsync === 'function' && !hasNewAPI) {
      secureStoreAvailable = false;
      secureStoreChecked = true;
      return false;
    }
    
    secureStoreAvailable = true;
    secureStoreChecked = true;
    return true;
  } catch (error) {
    secureStoreAvailable = false;
    secureStoreChecked = true;
    return false;
  }
};

/**
 * Пометить SecureStore как недоступный (вызывается при ошибке)
 */
const markSecureStoreUnavailable = () => {
  secureStoreAvailable = false;
  secureStoreChecked = true;
};

/**
 * Сбросить кэш проверки SecureStore (для тестов)
 */
export const resetSecureStoreCache = () => {
  secureStoreAvailable = null;
  secureStoreChecked = false;
};

/**
 * Сохранить токен авторизации в безопасном хранилище
 */
export const saveAuthToken = async (token, refreshToken, role) => {
  // Проверяем доступность SecureStore перед использованием
  let useSecureStore = isSecureStoreAvailable() && typeof SecureStore.setItemAsync === 'function';
  
  if (useSecureStore) {
    try {
      // Сохраняем токены в secure store
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      // Если ошибка связана с недоступностью SecureStore, используем AsyncStorage
      if (error.message && (
        error.message.includes('is not a function') ||
        error.message.includes('getValueWithKeyAsync') ||
        error.message.includes('ExpoSecureStore')
      )) {
        // Показываем предупреждение только один раз (при первой ошибке)
        if (secureStoreAvailable !== false || !secureStoreChecked) {
          console.warn('SecureStore недоступен, автоматически используем AsyncStorage');
        }
        markSecureStoreUnavailable();
        useSecureStore = false;
      } else {
        console.warn('Не удалось сохранить токен в SecureStore', error);
        throw error;
      }
    }
  }
  
  // Если SecureStore недоступен, используем AsyncStorage
  if (!useSecureStore) {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.warn('Не удалось сохранить токен в AsyncStorage', error);
      throw error;
    }
  }
  
  // Сохраняем роль в AsyncStorage (не критичные данные)
  try {
    await AsyncStorage.setItem(AUTH_ROLE_KEY, role);
    
    // Сохраняем время истечения токена для быстрой проверки
    const expiry = getTokenExpiry(token);
    if (expiry) {
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
    }
  } catch (error) {
    console.warn('Не удалось сохранить роль или время истечения токена', error);
    // Не бросаем ошибку, так как это не критично
  }
};

/**
 * Получить сохранённый токен из безопасного хранилища
 */
export const getAuthToken = async () => {
  // Проверяем доступность SecureStore перед использованием
  if (!isSecureStoreAvailable()) {
    console.warn('SecureStore.getItemAsync недоступен, используем AsyncStorage');
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (fallbackError) {
      console.warn('Не удалось получить токен из AsyncStorage', fallbackError);
      return null;
    }
  }

  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    // Если ошибка связана с недоступностью SecureStore, используем AsyncStorage
    if (error.message && (
      error.message.includes('is not a function') ||
      error.message.includes('getValueWithKeyAsync') ||
      error.message.includes('ExpoSecureStore')
    )) {
      // Показываем предупреждение только один раз (при первой ошибке)
      if (secureStoreAvailable !== false || !secureStoreChecked) {
        console.warn('SecureStore недоступен, автоматически используем AsyncStorage');
      }
      markSecureStoreUnavailable();
      try {
        return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      } catch (fallbackError) {
        console.warn('Не удалось получить токен из AsyncStorage', fallbackError);
        return null;
      }
    }
    console.warn('Не удалось получить токен', error);
    // Fallback на AsyncStorage при ошибке
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (fallbackError) {
      console.warn('Не удалось получить токен из AsyncStorage', fallbackError);
      return null;
    }
  }
};

/**
 * Получить refresh token
 */
export const getRefreshToken = async () => {
  // Проверяем доступность SecureStore перед использованием
  if (!isSecureStoreAvailable()) {
    console.warn('SecureStore.getItemAsync недоступен, используем AsyncStorage');
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (fallbackError) {
      console.warn('Не удалось получить refresh token из AsyncStorage', fallbackError);
      return null;
    }
  }

  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return refreshToken;
  } catch (error) {
    // Если ошибка связана с недоступностью SecureStore, используем AsyncStorage
    if (error.message && (
      error.message.includes('is not a function') ||
      error.message.includes('getValueWithKeyAsync') ||
      error.message.includes('ExpoSecureStore')
    )) {
      // Показываем предупреждение только один раз (при первой ошибке)
      if (secureStoreAvailable !== false || !secureStoreChecked) {
        console.warn('SecureStore недоступен, автоматически используем AsyncStorage');
      }
      markSecureStoreUnavailable();
      try {
        return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      } catch (fallbackError) {
        console.warn('Не удалось получить refresh token из AsyncStorage', fallbackError);
        return null;
      }
    }
    console.warn('Не удалось получить refresh token', error);
    // Fallback на AsyncStorage при ошибке
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (fallbackError) {
      console.warn('Не удалось получить refresh token из AsyncStorage', fallbackError);
      return null;
    }
  }
};

/**
 * Получить роль пользователя
 */
export const getAuthRole = async () => {
  try {
    const role = await AsyncStorage.getItem(AUTH_ROLE_KEY);
    return role;
  } catch (error) {
    console.warn('Не удалось получить роль', error);
    return null;
  }
};

/**
 * Проверить валидность токена перед использованием
 */
export const validateToken = async () => {
  const token = await getAuthToken();
  if (!token) return false;
  
  // Проверяем, не истёк ли токен
  if (isTokenExpired(token)) {
    // Пытаемся обновить токен
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        const newToken = await refreshAuthToken(refreshToken);
        return !!newToken;
      } catch (error) {
        console.warn('Не удалось обновить токен', error);
        return false;
      }
    }
    return false;
  }
  
  return true;
};

/**
 * Обновить токен используя refresh token
 */
export const refreshAuthToken = async (refreshToken) => {
  try {
    if (!refreshToken) {
      throw new Error('Refresh token не предоставлен');
    }

    const { API_ENDPOINTS } = require('../config');
    
    const response = await fetch(`${API_ENDPOINTS.auth}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    // Пытаемся извлечь данные из ответа даже при ошибке
    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      // Если не удалось распарсить JSON, продолжаем с пустым объектом
    }
    
    if (!response.ok) {
      // Если это 401 или 403, refresh token недействителен
      if (response.status === 401 || response.status === 403) {
        // Очищаем токены при недействительном refresh token
        await clearAuthToken();
        throw new Error('Сессия истекла. Необходимо войти заново.');
      }
      const errorMessage = data?.message || `Ошибка обновления токена: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const { token: newToken, refreshToken: newRefreshToken } = data;
    
    if (!newToken) {
      throw new Error('Не получен новый токен в ответе сервера');
    }
    
    // Проверяем, что новый токен не пустой
    if (typeof newToken !== 'string' || newToken.trim().length === 0) {
      throw new Error('Получен недействительный токен от сервера');
    }
    
    // Сохраняем новый токен и refresh token (если предоставлен)
    // Используем новый refresh token, если он есть, иначе сохраняем старый
    const role = await getAuthRole();
    const finalRefreshToken = newRefreshToken || refreshToken;
    await saveAuthToken(newToken, finalRefreshToken, role);
    return newToken;
  } catch (error) {
    console.warn('Ошибка обновления токена:', error);
    // Если это ошибка авторизации, очищаем токены
    if (error.message.includes('Сессия истекла') || error.message.includes('401') || error.message.includes('403')) {
      try {
        await clearAuthToken();
      } catch (clearError) {
        console.warn('Не удалось очистить токены при ошибке обновления', clearError);
      }
    }
    throw error;
  }
};

/**
 * Удалить токен авторизации (logout)
 */
export const clearAuthToken = async () => {
  // Проверяем доступность SecureStore перед использованием
  let useSecureStore = isSecureStoreAvailable() && typeof SecureStore.deleteItemAsync === 'function';
  
  if (useSecureStore) {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      // Если ошибка связана с недоступностью SecureStore, используем AsyncStorage
      if (error.message && (
        error.message.includes('is not a function') ||
        error.message.includes('getValueWithKeyAsync') ||
        error.message.includes('ExpoSecureStore')
      )) {
        // Показываем предупреждение только один раз (при первой ошибке)
        if (secureStoreAvailable !== false || !secureStoreChecked) {
          console.warn('SecureStore недоступен, автоматически используем AsyncStorage');
        }
        markSecureStoreUnavailable();
        useSecureStore = false;
      } else {
        console.warn('Ошибка при удалении из SecureStore, используем AsyncStorage:', error);
        useSecureStore = false;
      }
    }
  }
  
  // Удаляем из AsyncStorage (всегда, так как токены могут быть там)
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, AUTH_ROLE_KEY, TOKEN_EXPIRY_KEY]);
  } catch (error) {
    console.warn('Не удалось удалить токен из AsyncStorage', error);
    // Не бросаем ошибку, так как это не критично для logout
  }
};

/**
 * Проверить, есть ли сохранённый токен
 */
export const hasAuthToken = async () => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Получить валидный токен (обновляет при необходимости)
 */
export const getValidToken = async () => {
  let token = await getAuthToken();
  
  if (!token) {
    return null;
  }
  
  // Если токен истёк, пытаемся обновить
  if (isTokenExpired(token)) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        const newToken = await refreshAuthToken(refreshToken);
        // Проверяем, что новый токен получен
        if (!newToken) {
          await clearAuthToken();
          return null;
        }
        // Проверяем, истек ли новый токен (только если это валидный JWT с полем exp)
        // Если токен не является валидным JWT, считаем его валидным (для обратной совместимости)
        const parts = newToken.split('.');
        if (parts.length === 3) {
          // Это JWT токен, проверяем срок действия
          if (isTokenExpired(newToken)) {
            await clearAuthToken();
            return null;
          }
        }
        // Если это не JWT токен, считаем его валидным
        return newToken;
      } catch (error) {
        console.warn('Не удалось обновить токен', error);
        // Если не удалось обновить, очищаем токены
        await clearAuthToken();
        return null;
      }
    } else {
      // Нет refresh token, очищаем токены
      await clearAuthToken();
      return null;
    }
  }
  
  // Токен валиден (не истек), возвращаем его
  return token;
};

