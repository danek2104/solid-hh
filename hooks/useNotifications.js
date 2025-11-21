import { useEffect, useState, useCallback, useRef } from 'react';
import { getNotificationService } from '../services/notificationService';

/**
 * Хук для работы с уведомлениями
 */
export const useNotifications = (enabled = true) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissions, setPermissions] = useState({ granted: false });
  const [settings, setSettings] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const serviceRef = useRef(null);

  // Инициализация сервиса уведомлений
  useEffect(() => {
    if (!enabled) return;

    const init = async () => {
      try {
        const service = getNotificationService();
        serviceRef.current = service;

        // Загрузить настройки
        const loadedSettings = await service.loadSettings();
        setSettings(loadedSettings);

        // Инициализировать сервис
        const result = await service.initialize();
        
        if (result.success) {
          setPermissions(result.permissions);
          
          // Получить push token
          const token = await service.getExpoPushToken();
          if (token) {
            setExpoPushToken(token);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Ошибка при инициализации уведомлений:', error);
        setIsInitialized(true);
      }
    };

    init();

    // Очистка при размонтировании
    return () => {
      if (serviceRef.current) {
        serviceRef.current.destroy();
      }
    };
  }, [enabled]);

  // Загрузить настройки
  const loadSettings = useCallback(async () => {
    if (!serviceRef.current) return null;
    
    const loadedSettings = await serviceRef.current.loadSettings();
    setSettings(loadedSettings);
    return loadedSettings;
  }, []);

  // Сохранить настройки
  const saveSettings = useCallback(async (newSettings) => {
    if (!serviceRef.current) return null;
    
    const updatedSettings = await serviceRef.current.saveSettings(newSettings);
    setSettings(updatedSettings);
    return updatedSettings;
  }, []);

  // Обновить настройку
  const updateSetting = useCallback(async (key, value) => {
    if (!serviceRef.current) return null;
    
    const updatedSettings = await serviceRef.current.updateSetting(key, value);
    setSettings(updatedSettings);
    return updatedSettings;
  }, []);

  // Запросить разрешения
  const requestPermissions = useCallback(async () => {
    if (!serviceRef.current) return { granted: false };
    
    const result = await serviceRef.current.requestPermissions();
    setPermissions(result);
    
    if (result.granted) {
      // Зарегистрироваться для push-уведомлений
      const token = await serviceRef.current.registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
      }
    }
    
    return result;
  }, []);

  // Показать уведомление о новой вакансии
  const notifyNewJob = useCallback(async (job) => {
    if (!serviceRef.current) return { success: false };
    return await serviceRef.current.notifyNewJob(job);
  }, []);

  // Показать уведомление о новом сообщении
  const notifyNewMessage = useCallback(async (message, chatInfo) => {
    if (!serviceRef.current) return { success: false };
    return await serviceRef.current.notifyNewMessage(message, chatInfo);
  }, []);

  // Показать уведомление о смене
  const notifyShiftUpdate = useCallback(async (shift, type) => {
    if (!serviceRef.current) return { success: false };
    return await serviceRef.current.notifyShiftUpdate(shift, type);
  }, []);

  // Отменить все уведомления
  const cancelAllNotifications = useCallback(async () => {
    if (!serviceRef.current) return { success: false };
    return await serviceRef.current.cancelAllNotifications();
  }, []);

  // Очистить badge
  const clearBadge = useCallback(async () => {
    if (!serviceRef.current) return { success: false };
    return await serviceRef.current.clearBadge();
  }, []);

  return {
    isInitialized,
    permissions,
    settings,
    expoPushToken,
    loadSettings,
    saveSettings,
    updateSetting,
    requestPermissions,
    notifyNewJob,
    notifyNewMessage,
    notifyShiftUpdate,
    cancelAllNotifications,
    clearBadge,
  };
};




