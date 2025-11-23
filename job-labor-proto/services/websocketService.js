import NetInfo from '@react-native-community/netinfo';
import { cacheDocumentStatuses } from './cacheService';
import { WS_URL } from '../config';

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
    this.messageCallbacks = new Set();
    this.jobCallbacks = new Set();
    this.isConnecting = false;
    this.shouldReconnect = true;
    this.netInfoSubscription = null;
  }

  /**
   * Подключиться к WebSocket серверу
   */
  connect = async () => {
    if (this.isConnected() || this.isConnecting) {
      return;
    }

    // Проверить, не является ли токен мок-токеном (для тестирования/разработки)
    // Если это мок-токен, пропускаем подключение WebSocket
    if (this.token && this.token.startsWith('msw-token-')) {
      console.log('WebSocket: пропущено подключение для мок-токена (разработка/тестирование)');
      this.isConnecting = false;
      return;
    }

    // Проверить наличие сети перед подключением
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      console.warn('WebSocket: нет подключения к интернету, подключение отложено');
      this.isConnecting = false;
      // Попробуем переподключиться позже
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      const url = this.token 
        ? `${this.wsUrl}?token=${this.token}`
        : this.wsUrl;

      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        console.log('WebSocket подключен');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionCallbacks(true);
        // Подписаться на изменения сети после успешного подключения
        this.subscribeToNetworkChanges();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.warn('Ошибка при обработке сообщения WebSocket', error);
        }
      };

      ws.onerror = (error) => {
        // Логируем только важную информацию, а не весь объект события
        const errorInfo = {
          url: this.ws?.url || this.wsUrl,
          readyState: this.ws?.readyState,
          reconnectAttempt: this.reconnectAttempts,
        };
        
        // Проверяем, является ли ошибка ошибкой разрешения DNS/хостнейма
        const errorMessage = error?.message || error?.toString() || '';
        const isHostError = errorMessage.includes('NS_ERROR_UNKNOWN_HOST') || 
                           errorMessage.includes('Failed to construct') ||
                           errorMessage.includes('getaddrinfo ENOTFOUND');
        
        if (isHostError) {
          console.warn('WebSocket: не удалось разрешить хостнейм. Возможно, сервер недоступен или используется мок-сервер:', errorInfo.url);
          // Не пытаемся переподключаться при ошибке DNS
          this.shouldReconnect = false;
          this.reconnectAttempts = this.maxReconnectAttempts;
        } else {
          console.warn('Ошибка WebSocket:', errorInfo);
        }
        
        this.isConnecting = false;
        this.notifyConnectionCallbacks(false);
      };

      ws.onclose = (event) => {
        const closeInfo = {
          code: event.code,
          reason: event.reason || 'Неизвестная причина',
          wasClean: event.wasClean,
          reconnectAttempt: this.reconnectAttempts,
        };
        
        // Код 1006 обычно означает, что соединение было закрыто ненормально
        // (например, из-за ошибки DNS или сетевой проблемы)
        if (event.code === 1006) {
          console.warn('WebSocket: соединение закрыто ненормально (возможно, хостнейм недоступен):', closeInfo);
          // Не пытаемся переподключаться при ошибке соединения
          this.shouldReconnect = false;
          this.reconnectAttempts = this.maxReconnectAttempts;
        } else if (event.code === 1000) {
          console.log('WebSocket отключен нормально', closeInfo);
        } else {
          console.warn('WebSocket отключен с ошибкой:', closeInfo);
        }
        
        this.isConnecting = false;
        this.notifyConnectionCallbacks(false);
        const wasReconnecting = this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts;
        this.ws = null;

        if (wasReconnecting) {
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn('Достигнуто максимальное количество попыток переподключения WebSocket');
        }
      };
    } catch (error) {
      // Обработка ошибок при создании WebSocket (например, неверный URL)
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('NS_ERROR_UNKNOWN_HOST') || 
          errorMessage.includes('Failed to construct') ||
          errorMessage.includes('getaddrinfo ENOTFOUND')) {
        console.warn('WebSocket: не удалось создать соединение. Хостнейм недоступен:', this.wsUrl);
        this.shouldReconnect = false;
        this.reconnectAttempts = this.maxReconnectAttempts;
      } else {
        console.error('Ошибка при подключении к WebSocket', error);
      }
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
    
    // Обработка сообщений чата
    if (data.type === 'chat_message' || data.type === 'new_message') {
      const message = data.payload || data.message;
      if (message) {
        this.notifyMessageCallbacks(message);
      }
    }

    // Обработка новых вакансий
    if (data.type === 'new_job' || data.type === 'job_created') {
      const job = data.payload || data.job;
      if (job) {
        this.notifyJobCallbacks(job);
      }
    }
  };

  /**
   * Запланировать переподключение
   */
  scheduleReconnect = () => {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Попытка переподключения WebSocket через ${delay}ms (попытка ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  };

  /**
   * Подписаться на изменения сетевого подключения
   */
  subscribeToNetworkChanges = () => {
    if (this.netInfoSubscription) {
      return; // Уже подписаны
    }

    this.netInfoSubscription = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        // Сеть восстановилась - попробовать переподключиться, если не подключены
        if (!this.isConnected() && !this.isConnecting && this.shouldReconnect) {
          console.log('WebSocket: сеть восстановлена, попытка переподключения');
          this.reconnectAttempts = 0; // Сбросить счетчик при восстановлении сети
          this.connect();
        }
      } else if (this.isConnected()) {
        // Сеть пропала - отключиться
        console.warn('WebSocket: потеряно подключение к сети');
        if (this.ws) {
          this.ws.close();
        }
      }
    });
  };

  /**
   * Отключиться от WebSocket сервера
   */
  disconnect = () => {
    this.shouldReconnect = false;
    
    // Отписаться от изменений сети
    if (this.netInfoSubscription) {
      this.netInfoSubscription();
      this.netInfoSubscription = null;
    }
    
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
   * Подписаться на новые сообщения чата
   */
  onChatMessage = (callback) => {
    this.messageCallbacks.add(callback);
    
    return () => {
      this.messageCallbacks.delete(callback);
    };
  };

  /**
   * Подписаться на новые вакансии
   */
  onNewJob = (callback) => {
    this.jobCallbacks.add(callback);
    
    return () => {
      this.jobCallbacks.delete(callback);
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
   * Уведомить подписчиков о новом сообщении
   */
  notifyMessageCallbacks = (message) => {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.warn('Ошибка в callback сообщения', error);
      }
    });
  };

  /**
   * Уведомить подписчиков о новой вакансии
   */
  notifyJobCallbacks = (job) => {
    this.jobCallbacks.forEach(callback => {
      try {
        callback(job);
      } catch (error) {
        console.warn('Ошибка в callback вакансии', error);
      }
    });
  };

  /**
   * Проверить, подключен ли WebSocket
   */
  isConnected = () => {
    if (!this.ws) return false;
    return this.ws.readyState === WebSocket.OPEN || this.ws.readyState === 1;
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

  /**
   * Отправить сообщение через WebSocket
   */
  sendMessage = (message) => {
    if (!this.isConnected()) {
      console.warn('WebSocket не подключен, невозможно отправить сообщение');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Ошибка при отправке сообщения через WebSocket', error);
      return false;
    }
  };
}

// Singleton instance
let wsServiceInstance = null;

/**
 * Получить экземпляр WebSocket сервиса
 */
export const getWebSocketService = (
  wsUrl = WS_URL,
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
  wsUrl = WS_URL,
  token
) => {
  wsServiceInstance = new WebSocketService(wsUrl, token);
  return wsServiceInstance;
};

export default WebSocketService;

