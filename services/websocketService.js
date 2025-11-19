import { cacheDocumentStatuses } from './cacheService';

class WebSocketService {
  constructor(wsUrl, token) {
    this.wsUrl = wsUrl;
    this.token = token;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.statusUpdateCallbacks = new Set();
    this.connectionCallbacks = new Set();
    this.isConnecting = false;
    this.shouldReconnect = true;
  }

  /**
   * Подключиться к WebSocket серверу
   */
  connect = async () => {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      const url = this.token 
        ? `${this.wsUrl}?token=${this.token}`
        : this.wsUrl;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket подключен');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionCallbacks(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.warn('Ошибка при обработке сообщения WebSocket', error);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('Ошибка WebSocket', error);
        this.isConnecting = false;
        this.notifyConnectionCallbacks(false);
      };

      this.ws.onclose = () => {
        console.log('WebSocket отключен');
        this.isConnecting = false;
        this.notifyConnectionCallbacks(false);
        this.ws = null;

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Ошибка при подключении к WebSocket', error);
      this.isConnecting = false;
      this.notifyConnectionCallbacks(false);
    }
  };

  /**
   * Обработать входящее сообщение
   */
  handleMessage = (data) => {
    // Обработка обновлений статусов документов
    if (data.type === 'document_status_update') {
      const update = data.payload;
      this.notifyStatusUpdateCallbacks(update);
      
      // Сохранить в кеш
      cacheDocumentStatuses({ [update.documentId]: update }).catch(
        (error) => console.warn('Не удалось сохранить статус в кеш', error)
      );
    }
  };

  /**
   * Запланировать переподключение
   */
  scheduleReconnect = () => {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  };

  /**
   * Отключиться от WebSocket сервера
   */
  disconnect = () => {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  };

  /**
   * Подписаться на обновления статусов документов
   */
  onDocumentStatusUpdate = (callback) => {
    this.statusUpdateCallbacks.add(callback);
    
    return () => {
      this.statusUpdateCallbacks.delete(callback);
    };
  };

  /**
   * Подписаться на изменения состояния подключения
   */
  onConnectionChange = (callback) => {
    this.connectionCallbacks.add(callback);
    
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  };

  /**
   * Уведомить подписчиков об обновлении статуса
   */
  notifyStatusUpdateCallbacks = (update) => {
    this.statusUpdateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.warn('Ошибка в callback обновления статуса', error);
      }
    });
  };

  /**
   * Уведомить подписчиков об изменении подключения
   */
  notifyConnectionCallbacks = (connected) => {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.warn('Ошибка в callback подключения', error);
      }
    });
  };

  /**
   * Проверить, подключен ли WebSocket
   */
  isConnected = () => {
    return this.ws?.readyState === WebSocket.OPEN;
  };

  /**
   * Обновить токен авторизации
   */
  updateToken = (token) => {
    this.token = token;
    if (this.isConnected()) {
      // Переподключиться с новым токеном
      this.disconnect();
      this.connect();
    }
  };
}

// Singleton instance
let wsServiceInstance = null;

/**
 * Получить экземпляр WebSocket сервиса
 */
export const getWebSocketService = (
  wsUrl = 'wss://api.workmatch.dev/ws',
  token
) => {
  if (!wsServiceInstance) {
    wsServiceInstance = new WebSocketService(wsUrl, token);
  }
  return wsServiceInstance;
};

/**
 * Инициализировать WebSocket сервис
 */
export const initWebSocketService = (
  wsUrl = 'wss://api.workmatch.dev/ws',
  token
) => {
  wsServiceInstance = new WebSocketService(wsUrl, token);
  return wsServiceInstance;
};

export default WebSocketService;

