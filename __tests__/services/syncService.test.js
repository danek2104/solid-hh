import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import SyncService, { getSyncService, initSyncService } from '../../services/syncService';
import { fetchProfile, fetchDocumentStatuses } from '../../services/profileApi';
import { getCachedProfile, cacheProfile, cacheDocumentStatuses } from '../../services/cacheService';

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
  },
}));

jest.mock('@react-native-community/netinfo');
jest.mock('../../services/profileApi');
jest.mock('../../services/cacheService');

describe('syncService', () => {
  let mockQueryClient;
  let mockOnSyncStart;
  let mockOnSyncComplete;
  let mockOnSyncError;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueryClient = {
      setQueryData: jest.fn(),
      invalidateQueries: jest.fn(),
    };

    mockOnSyncStart = jest.fn();
    mockOnSyncComplete = jest.fn();
    mockOnSyncError = jest.fn();

    // Сброс singleton
    jest.resetModules();
  });

  describe('SyncService', () => {
    let syncService;

    beforeEach(() => {
      syncService = new SyncService({
        queryClient: mockQueryClient,
        token: 'test-token',
        onSyncStart: mockOnSyncStart,
        onSyncComplete: mockOnSyncComplete,
        onSyncError: mockOnSyncError,
      });
    });

    afterEach(() => {
      syncService.stop();
    });

    describe('start', () => {
      it('должен подписаться на изменения AppState и NetInfo', () => {
        const mockAppStateListener = jest.fn();
        const mockNetInfoListener = jest.fn();

        AppState.addEventListener.mockReturnValue({ remove: jest.fn() });
        NetInfo.addEventListener.mockReturnValue(mockNetInfoListener);
        NetInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });

        syncService.start();

        expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
        expect(NetInfo.addEventListener).toHaveBeenCalled();
      });

      it('должен выполнить начальную синхронизацию', async () => {
        AppState.addEventListener.mockReturnValue({ remove: jest.fn() });
        NetInfo.addEventListener.mockReturnValue(jest.fn());
        NetInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
        fetchProfile.mockResolvedValue({ id: 1, name: 'Test' });
        fetchDocumentStatuses.mockResolvedValue({});
        getCachedProfile.mockResolvedValue(null);

        syncService.start();

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(fetchProfile).toHaveBeenCalled();
      });
    });

    describe('stop', () => {
      it('должен отписаться от всех подписок', () => {
        const mockRemove = jest.fn();
        const mockNetInfoUnsubscribe = jest.fn();

        AppState.addEventListener.mockReturnValue({ remove: mockRemove });
        NetInfo.addEventListener.mockReturnValue(mockNetInfoUnsubscribe);

        syncService.start();
        syncService.stop();

        expect(mockRemove).toHaveBeenCalled();
        expect(mockNetInfoUnsubscribe).toHaveBeenCalled();
      });
    });

    describe('handleAppStateChange', () => {
      it('должен синхронизировать при переходе в active', async () => {
        AppState.addEventListener.mockImplementation((event, handler) => {
          if (event === 'change') {
            setTimeout(() => handler('active'), 10);
          }
          return { remove: jest.fn() };
        });

        NetInfo.addEventListener.mockReturnValue(jest.fn());
        NetInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
        fetchProfile.mockResolvedValue({ id: 1 });
        fetchDocumentStatuses.mockResolvedValue({});
        getCachedProfile.mockResolvedValue(null);

        syncService.start();

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(fetchProfile).toHaveBeenCalled();
      });
    });

    describe('handleNetInfoChange', () => {
      it('должен синхронизировать при восстановлении сети', async () => {
        AppState.addEventListener.mockReturnValue({ remove: jest.fn() });
        NetInfo.addEventListener.mockImplementation((handler) => {
          setTimeout(() => handler({ isConnected: true, isInternetReachable: true }), 10);
          return jest.fn();
        });

        fetchProfile.mockResolvedValue({ id: 1 });
        fetchDocumentStatuses.mockResolvedValue({});
        getCachedProfile.mockResolvedValue(null);

        syncService.start();

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(fetchProfile).toHaveBeenCalled();
      });
    });

    describe('sync', () => {
      it('должен синхронизировать профиль и статусы документов', async () => {
        const profile = { id: 1, name: 'Test User' };
        const statuses = { doc1: 'approved' };

        fetchProfile.mockResolvedValue(profile);
        fetchDocumentStatuses.mockResolvedValue(statuses);
        getCachedProfile.mockResolvedValue(null);

        await syncService.sync();

        expect(mockOnSyncStart).toHaveBeenCalled();
        expect(fetchProfile).toHaveBeenCalledWith('test-token');
        expect(fetchDocumentStatuses).toHaveBeenCalledWith('test-token');
        expect(cacheProfile).toHaveBeenCalledWith(profile);
        expect(cacheDocumentStatuses).toHaveBeenCalledWith(statuses);
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['profile'], profile);
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['documentStatuses'], statuses);
        expect(mockOnSyncComplete).toHaveBeenCalled();
      });

      it('должен использовать кеш при ошибке синхронизации', async () => {
        const cachedProfile = { id: 1, name: 'Cached User' };

        fetchProfile.mockRejectedValue(new Error('Network error'));
        getCachedProfile.mockResolvedValue(cachedProfile);

        await syncService.sync();

        expect(mockOnSyncError).toHaveBeenCalled();
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['profile'], cachedProfile);
      });

      it('не должен синхронизировать если уже идёт синхронизация', async () => {
        fetchProfile.mockImplementation(() => new Promise(() => {})); // Никогда не резолвится

        syncService.sync();
        syncService.sync();

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(fetchProfile).toHaveBeenCalledTimes(1);
      });
    });

    describe('syncProfile', () => {
      it('должен использовать кеш перед загрузкой с сервера', async () => {
        const cachedProfile = { id: 1, name: 'Cached' };
        const freshProfile = { id: 1, name: 'Fresh' };

        getCachedProfile.mockResolvedValue(cachedProfile);
        fetchProfile.mockResolvedValue(freshProfile);

        await syncService.syncProfile();

        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['profile'], cachedProfile);
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['profile'], freshProfile);
      });
    });

    describe('updateToken', () => {
      it('должен обновить токен', () => {
        const newToken = 'new-token';

        syncService.updateToken(newToken);

        expect(syncService.token).toBe(newToken);
      });
    });
  });

  describe('getSyncService', () => {
    it('должен вернуть singleton экземпляр', () => {
      const service1 = getSyncService({
        queryClient: mockQueryClient,
        token: 'token1',
      });

      const service2 = getSyncService({
        queryClient: mockQueryClient,
        token: 'token2',
      });

      expect(service1).toBe(service2);
    });
  });

  describe('initSyncService', () => {
    it('должен создать новый экземпляр', () => {
      const service = initSyncService({
        queryClient: mockQueryClient,
        token: 'token',
      });

      expect(service).toBeInstanceOf(SyncService);
    });
  });
});

