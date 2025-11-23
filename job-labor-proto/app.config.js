/**
 * Expo App Configuration
 * Поддерживает переменные окружения через process.env
 * 
 * В Expo переменные окружения с префиксом EXPO_PUBLIC_ автоматически
 * доступны через process.env во время сборки.
 * 
 * Для локальной разработки создайте .env файл в корне проекта
 * с переменными вида EXPO_PUBLIC_API_URL=...
 * 
 * Примечание: dotenv используется только в app.config.js, так как
 * этот файл выполняется в Node.js окружении во время сборки.
 */

// Загружаем переменные окружения из .env файла (только для app.config.js)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv не установлен, продолжаем без него
  // Переменные окружения можно задать напрямую через process.env
}

// Определяем окружение (development, staging, production)
const ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development';

// Значения по умолчанию для каждого окружения
const envConfig = {
  development: {
    apiUrl: 'https://api.workmatch.dev',
    wsUrl: 'wss://api.workmatch.dev/ws',
    apiTimeout: 1200,
  },
  staging: {
    apiUrl: 'https://api-staging.workmatch.dev',
    wsUrl: 'wss://api-staging.workmatch.dev/ws',
    apiTimeout: 1200,
  },
  production: {
    apiUrl: 'https://api.workmatch.dev',
    wsUrl: 'wss://api.workmatch.dev/ws',
    apiTimeout: 1200,
  },
};

// Получаем конфигурацию для текущего окружения
const currentEnvConfig = envConfig[ENV] || envConfig.development;

// Переопределяем значения из переменных окружения, если они заданы
const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || currentEnvConfig.apiUrl,
  wsUrl: process.env.EXPO_PUBLIC_WS_URL || currentEnvConfig.wsUrl,
  apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || currentEnvConfig.apiTimeout, 10),
  env: ENV,
};

export default {
  expo: {
    name: 'job-labor-proto',
    slug: 'job-labor-proto',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-web-browser',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#C62828',
          sounds: ['default'],
        },
      ],
    ],
    scheme: 'job-labor-proto',
    extra: {
      // Передаем конфигурацию в приложение через expo-constants
      apiUrl: config.apiUrl,
      wsUrl: config.wsUrl,
      apiTimeout: config.apiTimeout,
      env: config.env,
    },
  },
};

