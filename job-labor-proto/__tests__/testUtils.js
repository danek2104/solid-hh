import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';

// Mock AuthContext and LanguageContext for testing purposes
jest.mock('../context/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useAuth: () => ({ isAuthenticated: true, isEmployer: false, token: 'test-token', handleLogout: jest.fn(), handleLogin: jest.fn() }),
    AuthContext: {
      Consumer: ({ children }) => children({ isAuthenticated: true, isEmployer: false, token: 'test-token', handleLogout: jest.fn(), handleLogin: jest.fn() }),
    },
  };
});

jest.mock('../context/LanguageContext', () => {
  const React = require('react');
  return {
    LanguageProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useLanguage: () => ({ currentLanguage: 'en', changeLanguage: jest.fn(), isLanguageSelected: true, isLoading: false, confirmLanguageSelection: jest.fn() }),
    LanguageContext: {
      Consumer: ({ children }) => children({ currentLanguage: 'en', changeLanguage: jest.fn(), isLanguageSelected: true, isLoading: false, confirmLanguageSelection: jest.fn() }),
    },
  };
});

/**
 * Создает новый QueryClient для каждого теста
 * Это гарантирует изоляцию между тестами
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Отключаем retry в тестах для более быстрого выполнения
        gcTime: Infinity, // Для стабильности тестов, держим кеш постоянно
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Обертка для render, которая автоматически добавляет необходимые провайдеры
 * @param {React.Component} ui - Компонент для рендеринга
 * @param {Object} options - Опции для render
 * @returns {Object} Результат render с дополнительным полем queryClient для очистки
 */
export function renderWithProviders(ui, { queryClient, ...renderOptions } = {}) {
  const testQueryClient = queryClient || createTestQueryClient();

  const Wrapper = ({ children }) => (
    <QueryClientProvider client={testQueryClient}>
      <LanguageProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LanguageProvider>
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


