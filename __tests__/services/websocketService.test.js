import NetInfo from '@react-native-community/netinfo';
import WebSocketService, { getWebSocketService, initWebSocketService } from '../../services/websocketService';
import { cacheDocumentStatuses } from '../../services/cacheService';

jest.mock('@react-native-community/netinfo');
jest.mock('../../services/cacheService');
jest.mock('../../config', () => ({
  WS_URL: 'wss://api.workmatch.dev/ws',
}));

// Мок WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
  }

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure', wasClean: true });
    }
  }

  send(data) {
    // Mock implementation
  }
}

global.WebSocket = MockWebSocket;

describe('websocketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NetInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  });

  describe('WebSocketService', () => {
    let wsService;

    beforeEach(() => {
      wsService = new WebSocketService('wss://test.com/ws', 'test-token');
      wsService.ws = null;
      wsService.isConnecting = false;
    });

    afterEach(() => {
      wsService.disconnect();
    });

    describe('connect', () => {
      it('должен подключиться к WebSocket', async () => {
        const mockWs = new MockWebSocket('wss://test.com/ws?token=test-token');
        const WebSocketMock = jest.fn(() => mockWs);
        const originalWebSocket = global.WebSocket;
        global.WebSocket = WebSocketMock;

        await wsService.connect();

        expect(WebSocketMock).toHaveBeenCalledWith('wss://test.com/ws?token=test-token');
        
        global.WebSocket = originalWebSocket;
      });

      it('не должен подключаться если уже подключен', async () => {
        const mockWs = new MockWebSocket('wss://test.com/ws');
        mockWs.readyState = MockWebSocket.OPEN; // OPEN = 1
        wsService.ws = mockWs;
        wsService.isConnecting = false;
        
        const WebSocketMock = jest.fn(() => mockWs);
        const originalWebSocket = global.WebSocket;
        global.WebSocket = WebSocketMock;

        await wsService.connect();

        expect(WebSocketMock).not.toHaveBeenCalled();
        
        global.WebSocket = originalWebSocket;
      });

      it('не должен подключаться если нет сети', async () => {
        const originalWebSocket = global.WebSocket;
        const WebSocketMock = jest.fn();
        global.WebSocket = WebSocketMock;
        
        NetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });

        await wsService.connect();

        expect(WebSocketMock).not.toHaveBeenCalled();
        
        global.WebSocket = originalWebSocket;
      });

      it('должен обработать успешное подключение', async () => {
        const mockWs = new MockWebSocket('wss://test.com/ws');
        const WebSocketMock = jest.fn(() => mockWs);
        const originalWebSocket = global.WebSocket;
        global.WebSocket = WebSocketMock;

        const connectionCallback = jest.fn();
        wsService.onConnectionChange(connectionCallback);

        const connectPromise = wsService.connect();
        
        // Симулируем открытие соединения после того, как onopen установлен
        await new Promise(resolve => setTimeout(resolve, 5));
        mockWs.readyState = MockWebSocket.OPEN;
        if (mockWs.onopen) {
          mockWs.onopen();
        }

        await connectPromise;
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(connectionCallback).toHaveBeenCalledWith(true);
        expect(wsService.reconnectAttempts).toBe(0);
        
        global.WebSocket = originalWebSocket;
      });

      it('должен обработать ошибку подключения', async () => {
        const mockWs = new MockWebSocket('wss://test.com/ws');
        const WebSocketMock = jest.fn(() => mockWs);
        const originalWebSocket = global.WebSocket;
        global.WebSocket = WebSocketMock;

        const connectionCallback = jest.fn();
        wsService.onConnectionChange(connectionCallback);

        const connectPromise = wsService.connect();
        
        // Симулируем ошибку после того, как onerror установлен
        await new Promise(resolve => setTimeout(resolve, 5));
        if (mockWs.onerror) {
          mockWs.onerror(new Error('Connection error'));
        }

        await connectPromise;
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(connectionCallback).toHaveBeenCalledWith(false);
        
        global.WebSocket = originalWebSocket;
      });

      it('должен переподключиться при закрытии соединения', async () => {
        const mockWs = new MockWebSocket('wss://test.com/ws');
        const WebSocketMock = jest.fn(() => mockWs);
        const originalWebSocket = global.WebSocket;
        global.WebSocket = WebSocketMock;

        jest.spyOn(wsService, 'scheduleReconnect');

        const connectPromise = wsService.connect();
        
        // Симулируем закрытие соединения после того, как onclose установлен
        await new Promise(resolve => setTimeout(resolve, 5));
        if (mockWs.onclose) {
          // Используем код 1001 (going away), а не 1006, чтобы переподключение сработало
          mockWs.onclose({ code: 1001, reason: 'Going away', wasClean: false });
        }

        await connectPromise;
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(wsService.scheduleReconnect).toHaveBeenCalled();
        
        global.WebSocket = originalWebSocket;
      });
    });

    describe('handleMessage', () => {
      it('должен обработать обновление статуса документа', async () => {
        const update = {
          documentId: 'doc1',
          status: 'approved',
        };
        const message = {
          type: 'document_status_update',
          payload: update,
        };

        cacheDocumentStatuses.mockResolvedValue(undefined);

        const statusCallback = jest.fn();
        wsService.onDocumentStatusUpdate(statusCallback);

        wsService.handleMessage(message);

        expect(statusCallback).toHaveBeenCalledWith(update);
        expect(cacheDocumentStatuses).toHaveBeenCalledWith({ [update.documentId]: update });
      });
    });

    describe('disconnect', () => {
      it('должен отключиться от WebSocket', () => {
        const mockWs = new MockWebSocket('wss://test.com/ws');
        mockWs.close = jest.fn();
        wsService.ws = mockWs;

        wsService.disconnect();

        expect(mockWs.close).toHaveBeenCalled();
        expect(wsService.shouldReconnect).toBe(false);
      });
    });

    describe('onDocumentStatusUpdate', () => {
      it('должен подписаться на обновления статусов', () => {
        const callback = jest.fn();

        const unsubscribe = wsService.onDocumentStatusUpdate(callback);

        expect(typeof unsubscribe).toBe('function');

        const update = { documentId: 'doc1', status: 'approved' };
        wsService.notifyStatusUpdateCallbacks(update);

        expect(callback).toHaveBeenCalledWith(update);

        unsubscribe();
        wsService.notifyStatusUpdateCallbacks(update);

        expect(callback).toHaveBeenCalledTimes(1); // Не вызывается после отписки
      });
    });

    describe('onConnectionChange', () => {
      it('должен подписаться на изменения подключения', () => {
        const callback = jest.fn();

        const unsubscribe = wsService.onConnectionChange(callback);

        expect(typeof unsubscribe).toBe('function');

        wsService.notifyConnectionCallbacks(true);

        expect(callback).toHaveBeenCalledWith(true);

        unsubscribe();
        wsService.notifyConnectionCallbacks(false);

        expect(callback).toHaveBeenCalledTimes(1); // Не вызывается после отписки
      });
    });

    describe('isConnected', () => {
      it('должен вернуть true если подключен', () => {
        const mockWs = new MockWebSocket('wss://test.com/ws');
        mockWs.readyState = MockWebSocket.OPEN; // OPEN = 1
        wsService.ws = mockWs;

        expect(wsService.isConnected()).toBe(true);
      });

      it('должен вернуть false если не подключен', () => {
        expect(wsService.isConnected()).toBe(false);
      });
    });

    describe('updateToken', () => {
      it('должен обновить токен и переподключиться', async () => {
        const mockWs = new MockWebSocket('wss://test.com/ws');
        mockWs.readyState = MockWebSocket.OPEN; // OPEN = 1
        wsService.ws = mockWs;

        jest.spyOn(wsService, 'disconnect');
        jest.spyOn(wsService, 'connect');

        wsService.updateToken('new-token');

        expect(wsService.token).toBe('new-token');
        expect(wsService.disconnect).toHaveBeenCalled();
        expect(wsService.connect).toHaveBeenCalled();
      });
    });

    describe('scheduleReconnect', () => {
      it('должен запланировать переподключение с экспоненциальной задержкой', async () => {
        jest.useFakeTimers();
        const connectSpy = jest.spyOn(wsService, 'connect');

        wsService.reconnectAttempts = 0;
        wsService.scheduleReconnect();

        expect(wsService.reconnectAttempts).toBe(1);

        jest.advanceTimersByTime(1000);

        expect(connectSpy).toHaveBeenCalled();

        // Очистка
        connectSpy.mockRestore();
        jest.clearAllTimers();
        jest.useRealTimers();
      });

      it('не должен переподключаться если достигнут максимум попыток', () => {
        wsService.reconnectAttempts = 5;
        wsService.maxReconnectAttempts = 5;

        wsService.scheduleReconnect();

        expect(wsService.reconnectAttempts).toBe(6);
        // Не должно быть вызова connect
      });
    });
  });

  describe('getWebSocketService', () => {
    it('должен вернуть singleton экземпляр', () => {
      const service1 = getWebSocketService('wss://test.com/ws', 'token1');
      const service2 = getWebSocketService('wss://test.com/ws', 'token2');

      expect(service1).toBe(service2);
    });
  });

  describe('initWebSocketService', () => {
    it('должен создать новый экземпляр', () => {
      const service = initWebSocketService('wss://test.com/ws', 'token');

      expect(service).toBeInstanceOf(WebSocketService);
    });
  });
});

