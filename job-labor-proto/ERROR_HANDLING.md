# Обработка ошибок

Приложение использует комплексную систему обработки ошибок для обеспечения стабильности и удобства пользователей.

## Компоненты системы обработки ошибок

### 1. Error Boundary

`components/ErrorBoundary.js` - React компонент для перехвата ошибок рендеринга.

**Использование:**
```javascript
<ErrorBoundary showDetails={__DEV__} onLogout={handleLogout}>
  <App />
</ErrorBoundary>
```

**Функции:**
- Перехватывает ошибки React компонентов
- Отображает понятный UI вместо краша приложения
- Предоставляет возможность перезапуска
- В dev режиме показывает детали ошибки

### 2. Утилиты обработки ошибок

`utils/errorHandler.js` - утилиты для обработки ошибок API.

**Классы ошибок:**
- `ApiError` - общая ошибка API
- `NetworkError` - ошибка сети
- `TimeoutError` - превышено время ожидания
- `UnauthorizedError` - ошибка авторизации (401)
- `ForbiddenError` - ошибка доступа (403)

**Функции:**
- `handleApiError(error, response)` - обрабатывает ошибку и возвращает соответствующий класс
- `getErrorMessage(error)` - возвращает понятное сообщение для пользователя
- `isUnauthorizedError(error)` - проверяет, является ли ошибка ошибкой авторизации
- `isNetworkError(error)` - проверяет, является ли ошибка ошибкой сети

### 3. Компоненты отображения ошибок

`components/ErrorDisplay.js` - компоненты для отображения ошибок пользователю.

**Компоненты:**
- `ErrorDisplay` - полноэкранный компонент для отображения ошибок
- `InlineError` - inline компонент для отображения ошибок в формах

**Использование:**
```javascript
<ErrorDisplay
  error={error}
  title="Ошибка загрузки"
  message="Не удалось загрузить данные"
  onRetry={() => refetch()}
  onDismiss={() => navigate('home')}
/>
```

### 4. Обработка истечения токена

Автоматическая обработка истечения токена (401 ошибка):

1. **В API сервисах** (`services/profileApi.js`):
   - При получении 401 ошибки вызывается callback `onTokenExpired`
   - Callback устанавливается через `setTokenExpiredHandler()`

2. **В App.js**:
   - `handleTokenExpired()` показывает Alert и вызывает `handleLogout()`
   - Автоматически очищает токен и возвращает пользователя на экран входа

**Настройка:**
```javascript
useEffect(() => {
  setTokenExpiredHandler(handleTokenExpired);
  return () => {
    setTokenExpiredHandler(null);
  };
}, [handleTokenExpired]);
```

## Обработка различных типов ошибок

### HTTP ошибки

- **401 Unauthorized** - автоматический logout
- **403 Forbidden** - сообщение "Доступ запрещён"
- **404 Not Found** - сообщение "Ресурс не найден"
- **422 Validation Error** - сообщение "Данные неверны"
- **429 Rate Limit** - сообщение "Слишком много запросов"
- **500-503 Server Error** - сообщение "Ошибка сервера"

### Ошибки сети

- **Network Error** - сообщение "Нет подключения к интернету"
- **Timeout Error** - сообщение "Превышено время ожидания"

### Ошибки React

- Перехватываются Error Boundary
- Отображается fallback UI с возможностью перезапуска

## Интеграция в компоненты

### Обработка ошибок в хуках React Query

```javascript
const { data, error, isLoading } = useQuery({
  queryKey: ['profile'],
  queryFn: fetchProfile,
});

if (error) {
  const errorMessage = getErrorMessage(error);
  if (isUnauthorizedError(error)) {
    handleTokenExpired();
  }
  return <ErrorDisplay error={error} message={errorMessage} />;
}
```

### Обработка ошибок в формах

```javascript
<TextInput
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
/>
<InlineError error={errors.email} />
```

### Обработка ошибок в мутациях

```javascript
const mutation = useMutation({
  mutationFn: updateProfile,
  onError: (error) => {
    const errorMessage = getErrorMessage(error);
    Alert.alert('Ошибка', errorMessage);
  },
});
```

## Best Practices

1. **Всегда обрабатывайте ошибки** - не оставляйте необработанные промисы
2. **Используйте понятные сообщения** - пользователь должен понимать, что произошло
3. **Предоставляйте действия** - кнопки "Попробовать снова", "Закрыть" и т.д.
4. **Логируйте ошибки** - для отладки и мониторинга
5. **Обрабатывайте истечение токена** - автоматический logout при 401

## Мониторинг ошибок

Для production рекомендуется интегрировать сервисы мониторинга:

- **Sentry** - для отслеживания ошибок
- **Bugsnag** - альтернатива Sentry
- **Firebase Crashlytics** - для нативных приложений

Пример интеграции в ErrorBoundary:
```javascript
componentDidCatch(error, errorInfo) {
  // Отправить в Sentry
  Sentry.captureException(error, { extra: errorInfo });
}
```

