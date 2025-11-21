import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Создает новый QueryClient для каждого теста
 * Это гарантирует изоляцию между тестами
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Отключаем retry в тестах для более быстрого выполнения
        gcTime: 0, // Не кешируем в тестах (gcTime в v5 вместо cacheTime)
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Обертка для render, которая автоматически добавляет QueryClientProvider
 * @param {React.Component} ui - Компонент для рендеринга
 * @param {Object} options - Опции для render
 * @returns {Object} Результат render с дополнительным полем queryClient для очистки
 */
export function renderWithProviders(ui, { queryClient, ...renderOptions } = {}) {
  const testQueryClient = queryClient || createTestQueryClient();

  const Wrapper = ({ children }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });
  
  // Добавляем queryClient в результат для возможности очистки
  result.queryClient = testQueryClient;
  
  return result;
}

/**
 * Полная очистка QueryClient для предотвращения утечек
 * @param {QueryClient} client - QueryClient для очистки
 */
export function cleanupQueryClient(client) {
  if (client) {
    try {
      // Отменяем все активные запросы
      client.cancelQueries();
      // Удаляем все запросы из кеша
      client.removeQueries();
      // Очищаем весь кеш
      client.clear();
    } catch (error) {
      // Игнорируем ошибки при очистке
    }
  }
}

// Экспортируем также createTestQueryClient для случаев, когда нужен кастомный клиент
export { createTestQueryClient };

