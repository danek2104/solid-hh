/**
 * Централизованная конфигурация приложения
 * Использует expo-constants для доступа к переменным окружения
 */

import Constants from 'expo-constants';

// Получаем конфигурацию из expo-constants
const getConfig = () => {
  const extra = Constants?.expoConfig?.extra ?? Constants?.manifest2?.extra ?? {};

  return {
    apiUrl: extra.apiUrl || 'https://api.workmatch.dev',
    wsUrl: extra.wsUrl || 'wss://api.workmatch.dev/ws',
    apiTimeout: extra.apiTimeout || 1200,
    env: extra.env || 'development',
  };
};

const config = getConfig();

// API Endpoints
export const API_ENDPOINTS = {
  verify: `${config.apiUrl}/verify`,
  auth: `${config.apiUrl}/auth`,
  profile: `${config.apiUrl}/profile`,
  jobs: `${config.apiUrl}/jobs`,
  chats: `${config.apiUrl}/chats`,
  shifts: `${config.apiUrl}/shifts`,
  reviews: `${config.apiUrl}/reviews`,
  workers: `${config.apiUrl}/workers`,
  documents: `${config.apiUrl}/documents`,
};

// WebSocket URL
export const WS_URL = config.wsUrl;

// API Timeout
export const API_TIMEOUT_MS = config.apiTimeout;

// Environment
export const ENV = config.env;

// Проверка, что мы в production
export const IS_PRODUCTION = config.env === 'production';

// Проверка, что мы в development
export const IS_DEVELOPMENT = config.env === 'development';

// Проверка, что мы в staging
export const IS_STAGING = config.env === 'staging';

// Экспортируем всю конфигурацию для удобства
export default {
  ...config,
  API_ENDPOINTS,
  WS_URL,
  API_TIMEOUT_MS,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_STAGING,
};

