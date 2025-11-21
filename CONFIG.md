# Конфигурация приложения

Приложение использует централизованную систему конфигурации с поддержкой переменных окружения.

## Структура конфигурации

- `app.config.js` - конфигурация Expo с поддержкой переменных окружения
- `config.js` - централизованный модуль для доступа к конфигурации в приложении
- `.env.example` - пример файла с переменными окружения

## Переменные окружения

Приложение поддерживает следующие переменные окружения:

### `APP_ENV` или `NODE_ENV`
Окружение приложения: `development`, `staging`, `production`
- По умолчанию: `development`

### `EXPO_PUBLIC_API_URL`
URL API сервера (без слеша в конце)
- По умолчанию: `https://api.workmatch.dev`

### `EXPO_PUBLIC_WS_URL`
URL WebSocket сервера
- По умолчанию: `wss://api.workmatch.dev/ws`

### `EXPO_PUBLIC_API_TIMEOUT`
Таймаут API запросов в миллисекундах
- По умолчанию: `1200`

## Использование

### Локальная разработка

1. Создайте файл `.env` в корне проекта (на основе `.env.example`)
2. Заполните необходимые переменные:

```env
APP_ENV=development
EXPO_PUBLIC_API_URL=https://api.workmatch.dev
EXPO_PUBLIC_WS_URL=wss://api.workmatch.dev/ws
EXPO_PUBLIC_API_TIMEOUT=1200
```

3. Перезапустите Expo сервер:
```bash
npm start
```

### В коде приложения

Используйте централизованный модуль `config.js`:

```javascript
import { API_ENDPOINTS, WS_URL, API_TIMEOUT_MS, IS_PRODUCTION } from './config';

// Использование endpoints
const response = await fetch(API_ENDPOINTS.profile, { ... });

// Использование WebSocket URL
const ws = new WebSocket(WS_URL);

// Проверка окружения
if (IS_PRODUCTION) {
  // production код
}
```

### Доступные константы

- `API_ENDPOINTS` - объект с endpoints:
  - `API_ENDPOINTS.verify` - endpoint для верификации
  - `API_ENDPOINTS.auth` - endpoint для авторизации
  - `API_ENDPOINTS.profile` - endpoint для профиля
- `WS_URL` - URL WebSocket сервера
- `API_TIMEOUT_MS` - таймаут API запросов
- `IS_PRODUCTION` - флаг production окружения
- `IS_DEVELOPMENT` - флаг development окружения
- `IS_STAGING` - флаг staging окружения

## Окружения

### Development
Используется для локальной разработки. Значения по умолчанию:
- API: `https://api.workmatch.dev`
- WS: `wss://api.workmatch.dev/ws`

### Staging
Используется для тестирования перед production:
- API: `https://api-staging.workmatch.dev`
- WS: `wss://api-staging.workmatch.dev/ws`

### Production
Используется для production окружения:
- API: `https://api.workmatch.dev`
- WS: `wss://api.workmatch.dev/ws`

## Важные замечания

1. **Переменные окружения должны начинаться с `EXPO_PUBLIC_`** для доступа в клиентском коде
2. После изменения `.env` файла необходимо перезапустить Expo сервер
3. Не коммитьте `.env` файлы в репозиторий (они уже в `.gitignore`)
4. Используйте `.env.example` как шаблон для команды

## Тестирование

В тестах можно переопределить API URL через переменную окружения `TEST_API_URL`:

```bash
TEST_API_URL=http://localhost:3000 npm test
```

