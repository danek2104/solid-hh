import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import * as notificationService from '../../services/notificationService';

jest.mock('../../services/notificationService');

describe('useNotifications', () => {
  let mockService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      initialize: jest.fn(),
      loadSettings: jest.fn(),
      saveSettings: jest.fn(),
      updateSetting: jest.fn(),
      requestPermissions: jest.fn(),
      registerForPushNotifications: jest.fn(),
      getExpoPushToken: jest.fn(),
      notifyNewJob: jest.fn(),
      notifyNewMessage: jest.fn(),
      notifyShiftUpdate: jest.fn(),
      cancelAllNotifications: jest.fn(),
      clearBadge: jest.fn(),
      destroy: jest.fn(),
    };

    notificationService.getNotificationService.mockReturnValue(mockService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('должен инициализировать сервис уведомлений', async () => {
    const settings = { enabled: true, jobs: true, messages: true };
    const permissions = { granted: true, status: 'granted' };
    const pushToken = 'expo-push-token-123';

    mockService.loadSettings.mockResolvedValue(settings);
    mockService.initialize.mockResolvedValue({ success: true, permissions });
    mockService.getExpoPushToken.mockResolvedValue(pushToken);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    }, { timeout: 3000 });

    expect(mockService.initialize).toHaveBeenCalled();
    expect(result.current.permissions).toEqual(permissions);
    expect(result.current.expoPushToken).toBe(pushToken);
    expect(result.current.settings).toEqual(settings);
  });

  it('должен не инициализировать когда enabled=false', () => {
    renderHook(() => useNotifications(false));

    expect(mockService.initialize).not.toHaveBeenCalled();
  });

  it('должен загрузить настройки', async () => {
    const settings = { enabled: true, jobs: true };
    mockService.loadSettings.mockResolvedValue(settings);
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      const loadedSettings = await result.current.loadSettings();
      expect(loadedSettings).toEqual(settings);
    });

    expect(mockService.loadSettings).toHaveBeenCalled();
  });

  it('должен сохранить настройки', async () => {
    const newSettings = { enabled: false, jobs: false };
    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });
    mockService.saveSettings.mockResolvedValue(newSettings);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      const updated = await result.current.saveSettings(newSettings);
      expect(updated).toEqual(newSettings);
    });

    expect(mockService.saveSettings).toHaveBeenCalledWith(newSettings);
    expect(result.current.settings).toEqual(newSettings);
  });

  it('должен обновить настройку', async () => {
    const updatedSettings = { enabled: true, jobs: false };
    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });
    mockService.updateSetting.mockResolvedValue(updatedSettings);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      const updated = await result.current.updateSetting('jobs', false);
      expect(updated).toEqual(updatedSettings);
    });

    expect(mockService.updateSetting).toHaveBeenCalledWith('jobs', false);
  });

  it('должен запросить разрешения', async () => {
    const permissions = { granted: true, status: 'granted' };
    const pushToken = 'expo-push-token-123';
    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });
    mockService.requestPermissions.mockResolvedValue(permissions);
    mockService.registerForPushNotifications.mockResolvedValue(pushToken);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      const resultPermissions = await result.current.requestPermissions();
      expect(resultPermissions).toEqual(permissions);
    });

    expect(mockService.requestPermissions).toHaveBeenCalled();
    expect(result.current.permissions).toEqual(permissions);
    expect(result.current.expoPushToken).toBe(pushToken);
  });

  it('должен показать уведомление о новой вакансии', async () => {
    const job = { id: 1, title: 'New Job' };
    const notificationResult = { success: true, notificationId: '123' };
    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });
    mockService.notifyNewJob.mockResolvedValue(notificationResult);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      const result_notification = await result.current.notifyNewJob(job);
      expect(result_notification).toEqual(notificationResult);
    });

    expect(mockService.notifyNewJob).toHaveBeenCalledWith(job);
  });

  it('должен показать уведомление о новом сообщении', async () => {
    const message = { id: 1, text: 'Hello', chatId: 1 };
    const chatInfo = { chatId: 1, senderName: 'John' };
    const notificationResult = { success: true, notificationId: '123' };
    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });
    mockService.notifyNewMessage.mockResolvedValue(notificationResult);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      const result_notification = await result.current.notifyNewMessage(message, chatInfo);
      expect(result_notification).toEqual(notificationResult);
    });

    expect(mockService.notifyNewMessage).toHaveBeenCalledWith(message, chatInfo);
  });

  it('должен показать уведомление о смене', async () => {
    const shift = { id: 1, jobTitle: 'Shift 1' };
    const notificationResult = { success: true, notificationId: '123' };
    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });
    mockService.notifyShiftUpdate.mockResolvedValue(notificationResult);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      const result_notification = await result.current.notifyShiftUpdate(shift, 'update');
      expect(result_notification).toEqual(notificationResult);
    });

    expect(mockService.notifyShiftUpdate).toHaveBeenCalledWith(shift, 'update');
  });

  it('должен отменить все уведомления', async () => {
    const cancelResult = { success: true };
    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });
    mockService.cancelAllNotifications.mockResolvedValue(cancelResult);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      const result_cancel = await result.current.cancelAllNotifications();
      expect(result_cancel).toEqual(cancelResult);
    });

    expect(mockService.cancelAllNotifications).toHaveBeenCalled();
  });

  it('должен очистить badge', async () => {
    const clearResult = { success: true };
    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });
    mockService.clearBadge.mockResolvedValue(clearResult);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    await act(async () => {
      const result_clear = await result.current.clearBadge();
      expect(result_clear).toEqual(clearResult);
    });

    expect(mockService.clearBadge).toHaveBeenCalled();
  });

  it('должен очистить сервис при размонтировании', () => {
    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockResolvedValue({ success: true, permissions: { granted: false } });

    const { unmount } = renderHook(() => useNotifications(true));

    unmount();

    expect(mockService.destroy).toHaveBeenCalled();
  });

  it('должен обработать ошибку инициализации', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Initialization failed');

    mockService.loadSettings.mockResolvedValue({ enabled: true });
    mockService.initialize.mockRejectedValue(error);

    const { result } = renderHook(() => useNotifications(true));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    }, { timeout: 3000 });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Ошибка при инициализации уведомлений:', error);

    consoleErrorSpy.mockRestore();
  });
});

