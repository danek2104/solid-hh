/**
 * Простой прокси-сервер для локальной разработки
 * Решает проблему CORS при работе с веб-версией приложения
 * 
 * Использование:
 * 1. Установите зависимости: npm install express http-proxy-middleware
 * 2. Запустите сервер: node proxy-server.js
 * 3. В файле .env установите: EXPO_PUBLIC_API_URL=http://localhost:3001/api
 * 4. Перезапустите Expo сервер
 * 
 * Переменные окружения:
 * - PROXY_TARGET_API: URL целевого API (по умолчанию: https://api.workmatch.dev)
 * - PROXY_PORT: Порт прокси-сервера (по умолчанию: 3001)
 */

require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PROXY_PORT || 3001;
const TARGET_API = process.env.PROXY_TARGET_API || 'https://api.workmatch.dev';

// Middleware для парсинга JSON тела запроса (для логирования)
app.use(express.json());

// Настройка CORS для прокси-сервера
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Прокси для API запросов
app.use('/api', createProxyMiddleware({
  target: TARGET_API,
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/api': '', // Убираем /api из пути
  },
  onProxyReq: (proxyReq, req, res) => {
    const targetUrl = `${TARGET_API}${req.url.replace('/api', '')}`;
    console.log(`[PROXY] ${req.method} ${req.url} -> ${targetUrl}`);
    
    // Логируем тело запроса для POST/PUT запросов
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const body = req.body;
        if (body && Object.keys(body).length > 0) {
          // Не логируем пароль в открытом виде
          const safeBody = { ...body };
          if (safeBody.password) {
            safeBody.password = '***';
          }
          console.log(`[PROXY] Request body:`, JSON.stringify(safeBody, null, 2));
        }
      } catch (e) {
        // Игнорируем ошибки парсинга тела
      }
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    const statusCode = proxyRes.statusCode;
    const statusMessage = proxyRes.statusMessage || '';
    console.log(`[PROXY] Response: ${statusCode} ${statusMessage} for ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY ERROR]', {
      message: err.message,
      code: err.code,
      method: req.method,
      url: req.url,
      target: TARGET_API,
    });
    
    // Более информативные сообщения об ошибках
    let errorMessage = err.message;
    let statusCode = 500;
    
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      errorMessage = `Не удалось подключиться к API: ${TARGET_API}. Проверьте доступность сервера и настройки DNS.`;
      statusCode = 502; // Bad Gateway
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = `Соединение отклонено сервером: ${TARGET_API}`;
      statusCode = 502;
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = `Превышено время ожидания ответа от сервера: ${TARGET_API}`;
      statusCode = 504; // Gateway Timeout
    }
    
    res.status(statusCode).json({ 
      error: 'Proxy error', 
      message: errorMessage,
      code: err.code,
      target: TARGET_API,
    });
  },
}));

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Прокси-сервер запущен!');
  console.log(`Порт: ${PORT}`);
  console.log(`Целевой API: ${TARGET_API}`);
  console.log(`URL прокси: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
  console.log('\nДля использования:');
  console.log('1. В файле .env установите: EXPO_PUBLIC_API_URL=http://localhost:3001/api');
  console.log('2. Перезапустите Expo сервер: npm start');
  console.log('\nНастройка целевого API:');
  console.log('  - Через переменную окружения: PROXY_TARGET_API=https://your-api.com');
  console.log('  - Или измените TARGET_API в proxy-server.js');
  console.log('\nИли используйте расширение браузера для обхода CORS (см. CORS_SOLUTION.md)');
  console.log('\n⚠️  Внимание: Убедитесь, что целевой API доступен!');
});

