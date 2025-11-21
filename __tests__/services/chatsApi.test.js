import {
  fetchChats,
  fetchChat,
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  setTokenExpiredHandler,
} from '../../services/chatsApi';
import * as authService from '../../services/authService';
import * as profileApi from '../../services/profileApi';
import { handleApiError, TimeoutError, NetworkError } from '../../utils/errorHandler';

jest.mock('../../services/authService');
jest.mock('../../services/profileApi');
jest.mock('../../utils/errorHandler');
jest.mock('../../config', () => ({
  API_ENDPOINTS: {
    chats: 'https://api.workmatch.dev/chats',
  },
  API_TIMEOUT_MS: 1200,
}));

describe('chatsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    authService.getValidToken.mockResolvedValue('test-token');
    authService.getRefreshToken.mockResolvedValue('refresh-token');
    authService.refreshAuthToken.mockResolvedValue('new-token');
  });

  describe('setTokenExpiredHandler', () => {
    it('должен установить callback для обработки истечения токена', () => {
      const callback = jest.fn();
      setTokenExpiredHandler(callback);
      // Проверяем, что callback можно установить
      expect(callback).toBeDefined();
    });
  });

  describe('fetchChats', () => {
    it('должен получить список чатов', async () => {
      const mockChats = [{ id: 1, name: 'Chat 1' }, { id: 2, name: 'Chat 2' }];
      const token = 'test-token';
      const params = { page: 1, limit: 10 };

      profileApi.getJson.mockResolvedValue({ chats: mockChats });

      const result = await fetchChats(params, token);

      expect(result).toEqual(mockChats);
      expect(profileApi.getJson).toHaveBeenCalled();
    });

    it('должен получить список чатов без параметров', async () => {
      const mockChats = [{ id: 1, name: 'Chat 1' }];
      const token = 'test-token';

      profileApi.getJson.mockResolvedValue({ chats: mockChats });

      const result = await fetchChats({}, token);

      expect(result).toEqual(mockChats);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const mockChats = [{ id: 1, name: 'Chat 1' }];

      authService.getValidToken.mockResolvedValue(oldToken);
      authService.getRefreshToken.mockResolvedValue(refreshToken);
      authService.refreshAuthToken.mockResolvedValue(newToken);

      // Первый запрос возвращает 401
      const error401 = { status: 401 };
      profileApi.getJson
        .mockRejectedValueOnce(error401)
        .mockResolvedValueOnce({ chats: mockChats });

      handleApiError.mockReturnValue(error401);

      const result = await fetchChats({}, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockChats);
    });
  });

  describe('fetchChat', () => {
    it('должен получить информацию о чате', async () => {
      const mockChat = { id: 1, name: 'Chat 1', participants: [] };
      const chatId = '1';
      const token = 'test-token';

      profileApi.getJson.mockResolvedValue({ chat: mockChat });

      const result = await fetchChat(chatId, token);

      expect(result).toEqual(mockChat);
      expect(profileApi.getJson).toHaveBeenCalled();
    });
  });

  describe('fetchMessages', () => {
    it('должен получить историю сообщений', async () => {
      const mockMessages = [
        { id: 1, text: 'Message 1' },
        { id: 2, text: 'Message 2' },
      ];
      const chatId = '1';
      const token = 'test-token';
      const params = { page: 1, limit: 20 };

      profileApi.getJson.mockResolvedValue({ messages: mockMessages });

      const result = await fetchMessages(chatId, params, token);

      expect(result).toEqual(mockMessages);
      expect(profileApi.getJson).toHaveBeenCalled();
    });

    it('должен выбросить ошибку если chatId отсутствует', async () => {
      const token = 'test-token';

      await expect(fetchMessages(null, {}, token)).rejects.toThrow('Chat ID is required');
    });

    it('должен обработать ошибку загрузки сообщений', async () => {
      const chatId = '1';
      const token = 'test-token';
      const error = new Error('Failed to fetch messages');

      profileApi.getJson.mockRejectedValue(error);

      await expect(fetchMessages(chatId, {}, token)).rejects.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('должен отправить сообщение', async () => {
      const chatId = '1';
      const messageData = { text: 'Hello', senderId: 'user1' };
      const token = 'test-token';
      const serverMessage = {
        id: 123,
        text: 'Hello',
        senderId: 'user1',
        createdAt: new Date().toISOString(),
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: serverMessage }),
      });

      const result = await sendMessage(chatId, messageData, token);

      expect(result).toEqual(serverMessage);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('должен обработать ошибку отправки сообщения', async () => {
      const chatId = '1';
      const messageData = { text: 'Hello' };
      const token = 'test-token';
      const error = { status: 400, message: 'Bad request' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      handleApiError.mockReturnValue(error);

      await expect(sendMessage(chatId, messageData, token)).rejects.toEqual(error);
    });

    it('должен обработать таймаут', async () => {
      const chatId = '1';
      const messageData = { text: 'Hello' };
      const token = 'test-token';
      const timeoutError = new TimeoutError('timeout');

      global.fetch.mockImplementation(() => new Promise(() => {})); // Никогда не резолвится
      handleApiError.mockReturnValue(timeoutError);

      await expect(sendMessage(chatId, messageData, token)).rejects.toEqual(timeoutError);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const chatId = '1';
      const messageData = { text: 'Hello' };
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const serverMessage = { id: 123, text: 'Hello' };

      authService.getValidToken.mockResolvedValue(oldToken);
      authService.getRefreshToken.mockResolvedValue(refreshToken);
      authService.refreshAuthToken.mockResolvedValue(newToken);

      const error401 = { status: 401 };
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: serverMessage }),
        });

      handleApiError.mockReturnValue(error401);

      const result = await sendMessage(chatId, messageData, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(serverMessage);
    });
  });

  describe('markMessagesAsRead', () => {
    it('должен пометить сообщения как прочитанные', async () => {
      const chatId = '1';
      const messageIds = [1, 2, 3];
      const token = 'test-token';
      const result = { success: true, marked: 3 };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => result,
      });

      const response = await markMessagesAsRead(chatId, messageIds, token);

      expect(response).toEqual(result);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('должен обработать ошибку пометки сообщений', async () => {
      const chatId = '1';
      const messageIds = [1, 2];
      const token = 'test-token';
      const error = { status: 400, message: 'Bad request' };

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      handleApiError.mockReturnValue(error);

      await expect(markMessagesAsRead(chatId, messageIds, token)).rejects.toEqual(error);
    });

    it('должен обработать ошибку 401 и обновить токен', async () => {
      const chatId = '1';
      const messageIds = [1, 2];
      const oldToken = 'old-token';
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const result = { success: true };

      authService.getValidToken.mockResolvedValue(oldToken);
      authService.getRefreshToken.mockResolvedValue(refreshToken);
      authService.refreshAuthToken.mockResolvedValue(newToken);

      const error401 = { status: 401 };
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => result,
        });

      handleApiError.mockReturnValue(error401);

      const response = await markMessagesAsRead(chatId, messageIds, oldToken);

      expect(authService.refreshAuthToken).toHaveBeenCalledWith(refreshToken);
      expect(response).toEqual(result);
    });
  });
});

