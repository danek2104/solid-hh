# Job Labor Proto

Прототип мобильного приложения для поиска работы и найма персонала (React Native / Expo).

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Запуск Mock API Сервера
Так как основной бэкенд (`api.workmatch.dev`) является заглушкой, для разработки необходимо запустить локальный мок-сервер.

```bash
npm run mock-api
```
Сервер будет доступен по адресу `http://localhost:3001`.

### 3. Настройка окружения
Создайте файл `.env` в корне проекта:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_WS_URL=ws://localhost:3001
```

### 4. Запуск приложения
```bash
npm start
```

## 📚 Документация

- [CONFIG.md](./CONFIG.md) — Конфигурация и переменные окружения.
- [TESTING_SUMMARY.md](./TESTING_SUMMARY.md) — Информация о тестах.
- [README_TESTING.md](./README_TESTING.md) — Инструкции по запуску тестов.

## 🧪 Тестирование

Проект имеет обширное покрытие тестами.

```bash
npm test           # Запуск всех тестов
npm run test:unit  # Запуск unit тестов
```
