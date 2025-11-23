import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import NotificationService, {
  getNotificationService,
  initNotificationService,
} from '../../services/notificationService';

jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
}));

describe('notificationService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService();
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'expo-push-token-123' });
    Notifications.setNotificationChannelAsync.mockResolvedValue();
    Notifications.scheduleNotificationAsync.mockResolvedValue('notification-id-123');
    Notifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();
    Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
    Notifications.setBadgeCountAsync.mockResolvedValue();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
  });

  describe('initialize', () => {
    it('должен инициализировать сервис уведомлений', async () => {
      const result = await service.initialize();

      expect(result.success).toBe(true);
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    it('должен загрузить настройки при инициализации', async () => {
      const settings = { enabled: true, jobs: true };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(settings));

      await service.initialize();

      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });

    it('должен обработать ошибку инициализации', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      // Мокаем ошибку в loadSettings, которая вызывается в initialize
      AsyncStorage.getItem.mockRejectedValue(new Error('Init failed'));

      const result = await service.initialize();

      // initialize обрабатывает ошибки и все равно возвращает результат
      expect(result).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('requestPermissions', () => {
    it('должен запросить разрешения', async () => {
      // Устанавливаем, что разрешения еще не получены
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });

      const result = await service.requestPermissions();

      expect(result.granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('должен настроить каналы для Android', async () => {
      const Platform = require('react-native').Platform;
      Platform.OS = 'android';

      await service.requestPermissions();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
    });

    it('должен обработать ошибку запроса разрешений', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Permission failed');
      Notifications.getPermissionsAsync.mockRejectedValue(error);

      const result = await service.requestPermissions();

      expect(result.granted).toBe(false);
      expect(result.error).toBe(error);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('registerForPushNotifications', () => {
    it('должен зарегистрироваться для push-уведомлений', async () => {
      const token = await service.registerForPushNotifications();

      expect(token).toBe('expo-push-token-123');
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('должен обработать ошибку регистрации', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      Notifications.getExpoPushTokenAsync.mockRejectedValue(new Error('Token failed'));

      const token = await service.registerForPushNotifications();

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getExpoPushToken', () => {
    it('должен вернуть сохраненный токен', async () => {
      service.expoPushToken = 'saved-token';

      const token = await service.getExpoPushToken();

      expect(token).toBe('saved-token');
    });

    it('должен загрузить токен из хранилища', async () => {
      AsyncStorage.getItem.mockResolvedValue('stored-token');

      const token = await service.getExpoPushToken();

      expect(token).toBe('stored-token');
    });

    it('должен зарегистрироваться заново если токена нет', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const token = await service.getExpoPushToken();

      expect(token).toBe('expo-push-token-123');
    });
  });

  describe('scheduleLocalNotification', () => {
    it('должен показать уведомление', async () => {
      const result = await service.scheduleLocalNotification({
        title: 'Test',
        body: 'Test body',
        data: { type: 'test' },
      });

      expect(result.success).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('должен не показать уведомление если они отключены', async () => {
      await service.loadSettings();
      await service.updateSetting('enabled', false);

      const result = await service.scheduleLocalNotification({
        title: 'Test',
        body: 'Test body',
        data: { type: 'test' },
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('notifications_disabled');
    });

    it('должен не показать уведомление о вакансии если они отключены', async () => {
      await service.loadSettings();
      await service.updateSetting('jobs', false);

      const result = await service.scheduleLocalNotification({
        title: 'Test',
        body: 'Test body',
        data: { type: 'job' },
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('job_notifications_disabled');
    });
  });

  describe('notifyNewJob', () => {
    it('должен показать уведомление о новой вакансии', async () => {
      const job = { id: 1, title: 'New Job' };

      const result = await service.notifyNewJob(job);

      expect(result.success).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('notifyNewMessage', () => {
    it('должен показать уведомление о новом сообщении', async () => {
      const message = { id: 1, text: 'Hello', chatId: 1 };
      const chatInfo = { chatId: 1, senderName: 'John' };

      const result = await service.notifyNewMessage(message, chatInfo);

      expect(result.success).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('notifyShiftUpdate', () => {
    it('должен показать уведомление о смене', async () => {
      const shift = { id: 1, jobTitle: 'Shift 1' };

      const result = await service.notifyShiftUpdate(shift, 'update');

      expect(result.success).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('loadSettings', () => {
    it('должен загрузить настройки из хранилища', async () => {
      const settings = { enabled: true, jobs: true, messages: true };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(settings));

      const result = await service.loadSettings();

      // Настройки объединяются с настройками по умолчанию
      expect(result).toEqual(expect.objectContaining(settings));
      expect(result.enabled).toBe(true);
      expect(result.jobs).toBe(true);
      expect(result.messages).toBe(true);
    });

    it('должен вернуть настройки по умолчанию если хранилище пусто', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await service.loadSettings();

      expect(result.enabled).toBe(true);
    });
  });

  describe('saveSettings', () => {
    it('должен сохранить настройки', async () => {
      const newSettings = { enabled: false, jobs: false };

      const result = await service.saveSettings(newSettings);

      expect(result).toEqual(expect.objectContaining(newSettings));
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updateSetting', () => {
    it('должен обновить настройку', async () => {
      const result = await service.updateSetting('enabled', false);

      expect(result.enabled).toBe(false);
    });
  });

  describe('cancelAllNotifications', () => {
    it('должен отменить все уведомления', async () => {
      const result = await service.cancelAllNotifications();

      expect(result.success).toBe(true);
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('clearBadge', () => {
    it('должен очистить badge', async () => {
      const result = await service.clearBadge();

      expect(result.success).toBe(true);
      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    });
  });

  describe('destroy', () => {
    it('должен очистить слушатели', () => {
      const mockListener = jest.fn();
      service.notificationListener = mockListener;
      service.responseListener = mockListener;

      service.destroy();

      expect(Notifications.removeNotificationSubscription).toHaveBeenCalled();
      expect(service.notificationListener).toBeNull();
      expect(service.responseListener).toBeNull();
    });
  });

  describe('getNotificationService', () => {
    it('должен вернуть singleton экземпляр', () => {
      const service1 = getNotificationService();
      const service2 = getNotificationService();

      expect(service1).toBe(service2);
    });
  });

  describe('initNotificationService', () => {
    it('должен инициализировать сервис', async () => {
      const result = await initNotificationService();

      expect(result.success).toBe(true);
    });
  });
});

