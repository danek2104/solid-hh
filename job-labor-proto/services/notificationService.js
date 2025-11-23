import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Конфигурация уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const EXPO_PUSH_TOKEN_KEY = '@expo_push_token';

/**
 * Настройки уведомлений по умолчанию
 */
const defaultSettings = {
  enabled: true,
  jobs: true,
  messages: true,
  shifts: true,
  sound: true,
  badge: true,
};

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.settings = { ...defaultSettings };
  }

  /**
   * Инициализировать сервис уведомлений
   */
  async initialize() {
    try {
      // Загрузить настройки из хранилища
      await this.loadSettings();

      // Запросить разрешения
      const permissions = await this.requestPermissions();

      if (permissions.granted) {
        // Получить Expo Push Token
        await this.registerForPushNotifications();
      }

      // Настроить обработчики уведомлений
      this.setupNotificationHandlers();

      return { success: true, permissions };
    } catch (error) {
      console.error('Ошибка при инициализации уведомлений:', error);
      return { success: false, error };
    }
  }

  /**
   * Запросить разрешения на уведомления
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('jobs', {
          name: 'Новые вакансии',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Сообщения',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('shifts', {
          name: 'Смены',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      return { granted: finalStatus === 'granted', status: finalStatus };
    } catch (error) {
      console.error('Ошибка при запросе разрешений:', error);
      return { granted: false, error };
    }
  }

  /**
   * Зарегистрироваться для push-уведомлений
   */
  async registerForPushNotifications() {
    try {
      // Получить projectId из Constants
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                       Constants?.manifest?.extra?.eas?.projectId;

      if (!projectId) {
        console.log('ProjectId не найден (EAS не настроен). Push-уведомления отключены.');
        return null;
      }

      const tokenOptions = { projectId };
      const tokenData = await Notifications.getExpoPushTokenAsync(tokenOptions);
      
      this.expoPushToken = tokenData.data;
      
      // Сохранить токен
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, this.expoPushToken);
      
      console.log('Expo Push Token:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('Ошибка при регистрации push-токена:', error);
      return null;
    }
  }

  /**
   * Получить Expo Push Token
   */
  async getExpoPushToken() {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    // Попробовать загрузить из хранилища
    const storedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    if (storedToken) {
      this.expoPushToken = storedToken;
      return storedToken;
    }

    // Зарегистрироваться заново
    return await this.registerForPushNotifications();
  }

  /**
   * Настроить обработчики уведомлений
   */
  setupNotificationHandlers() {
    // Обработчик получения уведомления (когда приложение открыто)
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Уведомление получено:', notification);
    });

    // Обработчик нажатия на уведомление
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Нажато на уведомление:', response);
      const data = response.notification.request.content.data;
      
      // Можно добавить навигацию на основе данных уведомления
      if (data?.type === 'job' && data?.jobId) {
        // Навигация к вакансии
      } else if (data?.type === 'message' && data?.chatId) {
        // Навигация к чату
      }
    });
  }

  /**
   * Показать локальное уведомление
   */
  async scheduleLocalNotification({
    title,
    body,
    data = {},
    sound = true,
    channelId = 'default',
  }) {
    try {
      // Проверить, включены ли уведомления
      if (!this.settings.enabled) {
        return { success: false, reason: 'notifications_disabled' };
      }

      // Проверить тип уведомления
      if (data.type === 'job' && !this.settings.jobs) {
        return { success: false, reason: 'job_notifications_disabled' };
      }

      if (data.type === 'message' && !this.settings.messages) {
        return { success: false, reason: 'message_notifications_disabled' };
      }

      if (data.type === 'shift' && !this.settings.shifts) {
        return { success: false, reason: 'shift_notifications_disabled' };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: this.settings.sound && sound,
          badge: this.settings.badge ? 1 : undefined,
        },
        trigger: null, // Показать немедленно
      });

      return { success: true, notificationId };
    } catch (error) {
      console.error('Ошибка при показе уведомления:', error);
      return { success: false, error };
    }
  }

  /**
   * Уведомление о новой вакансии
   */
  async notifyNewJob(job) {
    return await this.scheduleLocalNotification({
      title: 'Новая вакансия',
      body: job.title || job.name || 'Появилась новая вакансия для вас',
      data: {
        type: 'job',
        jobId: job.id || job._id,
        ...job,
      },
      channelId: 'jobs',
    });
  }

  /**
   * Уведомление о новом сообщении
   */
  async notifyNewMessage(message, chatInfo = {}) {
    const senderName = chatInfo.senderName || 'Новое сообщение';
    const preview = message.text || message.content || '';
    const previewText = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;

    return await this.scheduleLocalNotification({
      title: senderName,
      body: previewText || 'У вас новое сообщение',
      data: {
        type: 'message',
        messageId: message.id || message._id,
        chatId: chatInfo.chatId || message.chatId,
        ...message,
      },
      channelId: 'messages',
    });
  }

  /**
   * Уведомление о смене
   */
  async notifyShiftUpdate(shift, type = 'update') {
    const titles = {
      update: 'Обновление смены',
      accepted: 'Смена подтверждена',
      rejected: 'Смена отклонена',
      reminder: 'Напоминание о смене',
    };

    return await this.scheduleLocalNotification({
      title: titles[type] || titles.update,
      body: `Смена: ${shift.jobTitle || 'Работа'}`,
      data: {
        type: 'shift',
        shiftId: shift.id || shift._id,
        ...shift,
      },
      channelId: 'shifts',
    });
  }

  /**
   * Загрузить настройки из хранилища
   */
  async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...defaultSettings, ...JSON.parse(stored) };
      }
      return this.settings;
    } catch (error) {
      console.error('Ошибка при загрузке настроек уведомлений:', error);
      this.settings = { ...defaultSettings };
      return this.settings;
    }
  }

  /**
   * Сохранить настройки
   */
  async saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
      return this.settings;
    } catch (error) {
      console.error('Ошибка при сохранении настроек уведомлений:', error);
      return this.settings;
    }
  }

  /**
   * Получить настройки
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Обновить настройку
   */
  async updateSetting(key, value) {
    return await this.saveSettings({ [key]: value });
  }

  /**
   * Отменить все уведомления
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return { success: true };
    } catch (error) {
      console.error('Ошибка при отмене уведомлений:', error);
      return { success: false, error };
    }
  }

  /**
   * Получить все уведомления
   */
  async getAllNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return { success: true, notifications };
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
      return { success: false, error };
    }
  }

  /**
   * Очистить badge (счетчик уведомлений)
   */
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при очистке badge:', error);
      return { success: false, error };
    }
  }

  /**
   * Уничтожить сервис (очистить слушатели)
   */
  destroy() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }
}

// Singleton instance
let notificationServiceInstance = null;

/**
 * Получить экземпляр сервиса уведомлений
 */
export const getNotificationService = () => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
};

/**
 * Инициализировать сервис уведомлений
 */
export const initNotificationService = async () => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return await notificationServiceInstance.initialize();
};

export default NotificationService;

