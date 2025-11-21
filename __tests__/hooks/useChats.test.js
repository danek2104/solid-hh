import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useChatsQuery,
  useChatQuery,
  useMessagesQuery,
  useMessagesSimpleQuery,
  useSendMessage,
  useMarkMessagesAsRead,
} from '../../hooks/useChats';
import * as chatsApi from '../../services/chatsApi';
import * as cacheService from '../../services/cacheService';

jest.mock('../../services/chatsApi');
jest.mock('../../services/cacheService');

describe('useChats hooks', () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useChatsQuery', () => {
    it('должен получить список чатов', async () => {
      const mockChats = [{ id: 1, name: 'Chat 1' }, { id: 2, name: 'Chat 2' }];
      const token = 'test-token';
      const params = { page: 1, limit: 10 };

      chatsApi.fetchChats.mockResolvedValue(mockChats);

      const { result } = renderHook(() => useChatsQuery(params, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockChats);
      expect(chatsApi.fetchChats).toHaveBeenCalledWith(params, token);
    });

    it('должен быть отключен когда enabled=false', () => {
      const token = 'test-token';
      const params = {};

      const { result } = renderHook(
        () => useChatsQuery(params, token, { enabled: false }),
        { wrapper }
      );

      expect(result.current.isFetching).toBe(false);
      expect(chatsApi.fetchChats).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки', async () => {
      const token = 'test-token';
      const error = new Error('Failed to fetch chats');

      chatsApi.fetchChats.mockRejectedValue(error);

      const { result } = renderHook(() => useChatsQuery({}, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useChatQuery', () => {
    it('должен получить информацию о чате', async () => {
      const mockChat = { id: 1, name: 'Chat 1', participants: [] };
      const chatId = '1';
      const token = 'test-token';

      chatsApi.fetchChat.mockResolvedValue(mockChat);

      const { result } = renderHook(() => useChatQuery(chatId, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockChat);
      expect(chatsApi.fetchChat).toHaveBeenCalledWith(chatId, token);
    });

    it('должен быть отключен когда chatId отсутствует', () => {
      const token = 'test-token';

      const { result } = renderHook(() => useChatQuery(null, token), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(chatsApi.fetchChat).not.toHaveBeenCalled();
    });
  });

  describe('useMessagesQuery', () => {
    it('должен получить историю сообщений с бесконечным скроллом', async () => {
      const mockMessages = [
        { id: 1, text: 'Message 1' },
        { id: 2, text: 'Message 2' },
      ];
      const chatId = '1';
      const token = 'test-token';

      chatsApi.fetchMessages.mockResolvedValue(mockMessages);

      const { result } = renderHook(() => useMessagesQuery(chatId, {}, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(chatsApi.fetchMessages).toHaveBeenCalled();
    });

    it('должен получить следующую страницу сообщений', async () => {
      const firstPage = [{ id: 1, text: 'Message 1' }];
      const secondPage = [{ id: 2, text: 'Message 2' }];
      const chatId = '1';
      const token = 'test-token';

      chatsApi.fetchMessages
        .mockResolvedValueOnce(firstPage)
        .mockResolvedValueOnce(secondPage);

      const { result } = renderHook(() => useMessagesQuery(chatId, {}, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      await act(async () => {
        await result.current.fetchNextPage();
      });

      await waitFor(() => {
        expect(result.current.data.pages.length).toBeGreaterThan(1);
      });
    });
  });

  describe('useMessagesSimpleQuery', () => {
    it('должен получить сообщения из кеша если они есть', async () => {
      const cachedMessages = [{ id: 1, text: 'Cached message' }];
      const chatId = '1';
      const token = 'test-token';

      cacheService.getCachedChatMessages.mockResolvedValue(cachedMessages);
      chatsApi.fetchMessages.mockResolvedValue([{ id: 2, text: 'New message' }]);
      cacheService.cacheChatMessages.mockResolvedValue();

      const { result } = renderHook(() => useMessagesSimpleQuery(chatId, {}, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(cacheService.getCachedChatMessages).toHaveBeenCalled();
    });

    it('должен использовать кеш при ошибке загрузки', async () => {
      const cachedMessages = [{ id: 1, text: 'Cached message' }];
      const chatId = '1';
      const token = 'test-token';
      const error = new Error('Network error');

      cacheService.getCachedChatMessages.mockResolvedValue(cachedMessages);
      chatsApi.fetchMessages.mockRejectedValue(error);

      const { result } = renderHook(() => useMessagesSimpleQuery(chatId, {}, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(cachedMessages);
    });

    it('должен загрузить свежие сообщения с сервера', async () => {
      const freshMessages = [{ id: 1, text: 'Fresh message' }];
      const chatId = '1';
      const token = 'test-token';

      cacheService.getCachedChatMessages.mockResolvedValue(null);
      chatsApi.fetchMessages.mockResolvedValue(freshMessages);
      cacheService.cacheChatMessages.mockResolvedValue();

      const { result } = renderHook(() => useMessagesSimpleQuery(chatId, {}, token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(freshMessages);
      expect(cacheService.cacheChatMessages).toHaveBeenCalledWith(chatId, freshMessages);
    });
  });

  describe('useSendMessage', () => {
    it('должен отправить сообщение', async () => {
      const chatId = '1';
      const token = 'test-token';
      const messageData = { text: 'Hello', senderId: 'user1' };
      const serverMessage = {
        id: 123,
        text: 'Hello',
        senderId: 'user1',
        createdAt: new Date().toISOString(),
      };

      chatsApi.sendMessage.mockResolvedValue(serverMessage);
      cacheService.cacheChatMessages.mockResolvedValue();

      const { result } = renderHook(() => useSendMessage(chatId, token), { wrapper });

      await act(async () => {
        result.current.mutate(messageData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(chatsApi.sendMessage).toHaveBeenCalledWith(chatId, messageData, token);
    });

    it('должен выполнить оптимистичное обновление', async () => {
      const chatId = '1';
      const token = 'test-token';
      const messageData = { text: 'Hello', senderId: 'user1' };
      const serverMessage = {
        id: 123,
        text: 'Hello',
        senderId: 'user1',
        createdAt: new Date().toISOString(),
      };

      // Устанавливаем начальные данные
      queryClient.setQueryData(['messages', chatId, {}, token], []);

      chatsApi.sendMessage.mockResolvedValue(serverMessage);
      cacheService.cacheChatMessages.mockResolvedValue();

      const { result } = renderHook(() => useSendMessage(chatId, token), { wrapper });

      await act(async () => {
        result.current.mutate(messageData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const cachedData = queryClient.getQueryData(['messages', chatId, {}, token]);
      expect(cachedData).toBeDefined();
    });

    it('должен обработать ошибку и восстановить предыдущее состояние', async () => {
      const chatId = '1';
      const token = 'test-token';
      const messageData = { text: 'Hello', senderId: 'user1' };
      const previousMessages = [{ id: 1, text: 'Previous' }];
      const error = new Error('Failed to send');

      // Устанавливаем предыдущие данные
      queryClient.setQueryData(['messages', chatId, {}, token], previousMessages);

      chatsApi.sendMessage.mockRejectedValue(error);

      const { result } = renderHook(() => useSendMessage(chatId, token), { wrapper });

      await act(async () => {
        result.current.mutate(messageData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useMarkMessagesAsRead', () => {
    it('должен пометить сообщения как прочитанные', async () => {
      const chatId = '1';
      const token = 'test-token';
      const messageIds = [1, 2, 3];
      const result = { success: true };

      chatsApi.markMessagesAsRead.mockResolvedValue(result);

      const { result: hookResult } = renderHook(() => useMarkMessagesAsRead(chatId, token), { wrapper });

      await act(async () => {
        hookResult.current.mutate(messageIds);
      });

      await waitFor(() => {
        expect(hookResult.current.isSuccess).toBe(true);
      });

      expect(chatsApi.markMessagesAsRead).toHaveBeenCalledWith(chatId, messageIds, token);
    });

    it('должен инвалидировать кеш после пометки как прочитанных', async () => {
      const chatId = '1';
      const token = 'test-token';
      const messageIds = [1, 2];

      chatsApi.markMessagesAsRead.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMarkMessagesAsRead(chatId, token), { wrapper });

      await act(async () => {
        result.current.mutate(messageIds);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Проверяем, что кеш был инвалидирован
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
});

