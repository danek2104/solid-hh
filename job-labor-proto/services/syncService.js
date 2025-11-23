import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { fetchProfile, fetchDocumentStatuses } from './profileApi';
import { fetchShifts } from './shiftsApi';
import { cacheProfile, getCachedProfile, cacheDocumentStatuses } from './cacheService';

class SyncService {
  constructor(options) {
    this.queryClient = options.queryClient;
    this.token = options.token;
    this.appStateSubscription = null;
    this.netInfoSubscription = null;
    this.isSyncing = false;
    this.syncCallbacks = {
      onSyncStart: options.onSyncStart,
      onSyncComplete: options.onSyncComplete,
      onSyncError: options.onSyncError,
    };
  }

  /**
   * Запустить фоновую синхронизацию
   */
  start = () => {
    // Подписка на изменения состояния приложения
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );

    // Подписка на изменения сетевого подключения
    this.netInfoSubscription = NetInfo.addEventListener(
      this.handleNetInfoChange
    );

    // Начальная синхронизация при запуске
    this.syncIfOnline();
  };

  /**
   * Остановить фоновую синхронизацию
   */
  stop = () => {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.netInfoSubscription) {
      this.netInfoSubscription();
      this.netInfoSubscription = null;
    }
  };

  /**
   * Обработать изменение состояния приложения
   */
  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      // Приложение стало активным - синхронизировать данные
      this.syncIfOnline();
    }
  };

  /**
   * Обработать изменение сетевого подключения
   */
  handleNetInfoChange = (state) => {
    if (state.isConnected && state.isInternetReachable) {
      // Подключение восстановлено - синхронизировать данные
      this.syncIfOnline();
    }
  };

  /**
   * Синхронизировать, если есть интернет
   */
  syncIfOnline = async () => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      this.sync();
    }
  };

  /**
   * Выполнить синхронизацию данных
   */
  sync = async () => {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    this.syncCallbacks.onSyncStart?.();

    try {
      // Синхронизация профиля
      await this.syncProfile();

      // Синхронизация статусов документов
      await this.syncDocumentStatuses();

      // Синхронизация смен
      await this.syncShifts();

      this.syncCallbacks.onSyncComplete?.();
    } catch (error) {
      console.error('Ошибка при синхронизации', error);
      this.syncCallbacks.onSyncError?.(error);
    } finally {
      this.isSyncing = false;
    }
  };

  /**
   * Синхронизировать профиль
   */
  syncProfile = async () => {
    try {
      // Попытаться получить из кеша
      const cachedProfile = await getCachedProfile();
      
      // Обновить кеш в react-query, если есть
      if (cachedProfile) {
        this.queryClient.setQueryData(['profile'], cachedProfile);
      }

      // Загрузить свежие данные с сервера
      const profile = await fetchProfile(this.token);
      
      // Сохранить в кеш
      await cacheProfile(profile);
      
      // Обновить react-query
      this.queryClient.setQueryData(['profile'], profile);
      this.queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.warn('Не удалось синхронизировать профиль', error);
      // Использовать кеш, если загрузка не удалась
      const cachedProfile = await getCachedProfile();
      if (cachedProfile) {
        this.queryClient.setQueryData(['profile'], cachedProfile);
      }
      // Пробрасываем ошибку дальше, чтобы она была обработана в sync()
      throw error;
    }
  };

  /**
   * Синхронизировать статусы документов
   */
  syncDocumentStatuses = async () => {
    try {
      const statuses = await fetchDocumentStatuses(this.token);
      await cacheDocumentStatuses(statuses);
      this.queryClient.setQueryData(['documentStatuses'], statuses);
      this.queryClient.invalidateQueries({ queryKey: ['documentStatuses'] });
    } catch (error) {
      console.warn('Не удалось синхронизировать статусы документов', error);
    }
  };

  /**
   * Синхронизировать смены
   */
  syncShifts = async () => {
    try {
      // Вычисляем даты для текущей недели
      const today = new Date();
      const currentDay = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date.toISOString().split('T')[0]);
      }

      const shifts = await fetchShifts({
        startDate: weekDates[0],
        endDate: weekDates[6],
        page: 1,
        limit: 100,
      }, this.token);

      // Обновить react-query
      this.queryClient.setQueryData(['shifts', {
        startDate: weekDates[0],
        endDate: weekDates[6],
        page: 1,
        limit: 100,
      }, this.token], shifts);
      this.queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.warn('Не удалось синхронизировать смены', error);
    }
  };

  /**
   * Обновить токен авторизации
   */
  updateToken = (token) => {
    this.token = token;
  };
}

// Singleton instance
let syncServiceInstance = null;

/**
 * Получить экземпляр сервиса синхронизации
 */
export const getSyncService = (options) => {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(options);
  }
  return syncServiceInstance;
};

/**
 * Инициализировать сервис синхронизации
 */
export const initSyncService = (options) => {
  syncServiceInstance = new SyncService(options);
  return syncServiceInstance;
};

export default SyncService;

