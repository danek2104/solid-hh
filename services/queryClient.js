import { QueryClient } from '@tanstack/react-query';

// Создать QueryClient с настройками по умолчанию
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 10 * 60 * 1000, // 10 минут (в v5 это gcTime вместо cacheTime)
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});





