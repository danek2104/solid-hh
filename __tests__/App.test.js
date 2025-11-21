import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import App from '../App';

// Моки для сервисов, чтобы предотвратить создание реальных соединений
jest.mock('../services/websocketService', () => {
  const mockService = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    onDocumentStatusUpdate: jest.fn(),
    isConnected: false,
  };
  return {
    initWebSocketService: jest.fn(() => mockService),
    getWebSocketService: jest.fn(() => mockService),
    default: jest.fn(),
  };
});

jest.mock('../services/syncService', () => {
  const mockService = {
    start: jest.fn(),
    stop: jest.fn(),
    sync: jest.fn(),
  };
  return {
    initSyncService: jest.fn(() => mockService),
    getSyncService: jest.fn(() => mockService),
    default: jest.fn(),
  };
});

jest.mock('../services/cacheService', () => ({
  migrateCache: jest.fn(() => Promise.resolve()),
  cacheProfile: jest.fn(() => Promise.resolve()),
  getCachedProfile: jest.fn(() => Promise.resolve(null)),
}));

describe('App root screen', () => {
  it('рендерится без ошибок и возвращает структуру', () => {
    let component;
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    act(() => {
      component = renderer.create(
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </SafeAreaProvider>
      );
    });

    expect(component).toBeTruthy();
    act(() => {
      component.unmount();
    });
  });
});

