# Руководство по тестированию

Этот документ описывает структуру тестов и как их запускать.

## Структура тестов

### Unit тесты
Unit тесты находятся в `__tests__/services/` и `__tests__/utils/` и тестируют отдельные функции и модули:

- `__tests__/services/authService.test.js` - тесты для сервиса авторизации
- `__tests__/services/cacheService.test.js` - тесты для сервиса кеширования
- `__tests__/services/profileApi.test.js` - тесты для API профиля
- `__tests__/services/syncService.test.js` - тесты для сервиса синхронизации
- `__tests__/services/websocketService.test.js` - тесты для WebSocket сервиса
- `__tests__/utils/errorHandler.test.js` - тесты для обработки ошибок

### Интеграционные тесты
Интеграционные тесты находятся в `__tests__/auth.integration.test.js` и тестируют взаимодействие между компонентами:

- Регистрация работника
- Вход в систему
- Восстановление пароля
- Валидация форм

### E2E тесты
E2E тесты находятся в `__tests__/e2e/` и тестируют полные пользовательские сценарии:

- `__tests__/e2e/mainFlow.test.js` - основные пользовательские потоки

## Запуск тестов

### Все тесты
```bash
npm test
```

### Только unit тесты
```bash
npm run test:unit
```

### Только интеграционные тесты
```bash
npm run test:integration
```

### Только E2E тесты
```bash
npm run test:e2e
```

### Тесты в режиме watch
```bash
npm run test:watch
```

### Тесты с покрытием кода
```bash
npm run test:coverage
```

### Тесты для CI/CD
```bash
npm run test:ci
```

## Настройка тестов

Тесты используют:
- **Jest** - фреймворк для тестирования
- **React Testing Library** - для тестирования React компонентов
- **MSW (Mock Service Worker)** - для мокирования API запросов

Конфигурация Jest находится в `package.json` в секции `jest`.

Настройки тестов находятся в `jest.setup.js`.

## Покрытие кода

Для просмотра покрытия кода запустите:
```bash
npm run test:coverage
```

Отчет будет сгенерирован в папке `coverage/`.

## CI/CD

Тесты автоматически запускаются при:
- Push в ветки `main`, `develop`, `master`
- Создании Pull Request

CI/CD конфигурация находится в `.github/workflows/`.

## Добавление новых тестов

### Unit тест для сервиса
1. Создайте файл `__tests__/services/yourService.test.js`
2. Импортируйте тестируемый модуль
3. Замокайте зависимости
4. Напишите тесты для всех функций

### Интеграционный тест
1. Добавьте тест в существующий файл или создайте новый в `__tests__/`
2. Используйте `render` из `@testing-library/react-native`
3. Тестируйте взаимодействие между компонентами

### E2E тест
1. Создайте файл в `__tests__/e2e/`
2. Тестируйте полные пользовательские сценарии
3. Используйте реальные данные и моки API


# Все тесты
npm test

# Только unit тесты
npm run test:unit

# Только интеграционные тесты
npm run test:integration

# Только E2E тесты
npm run test:e2e

# С покрытием кода
npm run test:coverage

## Лучшие практики

1. **Изоляция**: Каждый тест должен быть независимым
2. **Чистота**: Очищайте моки после каждого теста
3. **Читаемость**: Используйте понятные имена тестов
4. **Покрытие**: Стремитесь к покрытию критичных функций
5. **Скорость**: Unit тесты должны быть быстрыми

## Отладка тестов

Если тест падает:
1. Проверьте сообщение об ошибке
2. Убедитесь, что все моки настроены правильно
3. Проверьте, что MSW сервер запущен
4. Используйте `console.log` для отладки

## Полезные ссылки

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)

