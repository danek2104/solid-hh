import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCacheVersion,
  setCacheVersion,
  migrateCache,
  cacheProfile,
  getCachedProfile,
  clearProfileCache,
  cacheDocumentStatuses,
  getCachedDocumentStatuses,
} from '../../services/cacheService';

jest.mock('@react-native-async-storage/async-storage');

describe('cacheService', () => {
  beforeEach(() => {
    // Сбрасываем моки AsyncStorage (очищает вызовы и реализации)
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    AsyncStorage.removeItem.mockReset();
    AsyncStorage.getAllKeys.mockReset();
    
    // Устанавливаем значения по умолчанию
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();
    AsyncStorage.getAllKeys.mockResolvedValue([]);
  });

  describe('getCacheVersion', () => {
    it('должен получить версию кеша', async () => {
      AsyncStorage.getItem.mockResolvedValue('1');

      const result = await getCacheVersion();

      expect(result).toBe(1);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@cache_version');
    });

    it('должен вернуть 0 если версия не установлена', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await getCacheVersion();

      expect(result).toBe(0);
    });

    it('должен обработать ошибку и вернуть 0', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await getCacheVersion();

      expect(result).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('setCacheVersion', () => {
    it('должен установить версию кеша', async () => {
      AsyncStorage.setItem.mockResolvedValue();

      await setCacheVersion(2);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@cache_version', '2');
    });

    it('должен обработать ошибку', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await setCacheVersion(2);

      // Функция не должна выбросить ошибку
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('cacheProfile', () => {
    it('должен сохранить профиль в кеш', async () => {
      const profile = { id: 1, name: 'Test User' };
      AsyncStorage.setItem.mockResolvedValue();

      await cacheProfile(profile);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@cache_profile',
        expect.stringContaining('"data":')
      );
    });

    it('должен обработать ошибку при сохранении', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const profile = { id: 1, name: 'Test User' };
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await cacheProfile(profile);

      // Функция не должна выбросить ошибку
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getCachedProfile', () => {
    it('должен получить профиль из кеша', async () => {
      const profile = { id: 1, name: 'Test User' };
      const cacheData = {
        data: profile,
        timestamp: Date.now(),
        version: 1,
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheData));

      const result = await getCachedProfile();

      expect(result).toEqual(profile);
    });

    it('должен вернуть null если кеш пуст', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await getCachedProfile();

      expect(result).toBeNull();
    });

    it('должен вернуть null если кеш устарел', async () => {
      const profile = { id: 1, name: 'Test User' };
      const cacheData = {
        data: profile,
        timestamp: Date.now() - 3600000, // 1 час назад
        version: 1,
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheData));

      const result = await getCachedProfile(1800000); // maxAge 30 минут

      expect(result).toBeNull();
    });

    it('должен вернуть профиль если кеш не устарел', async () => {
      const profile = { id: 1, name: 'Test User' };
      const cacheData = {
        data: profile,
        timestamp: Date.now() - 600000, // 10 минут назад
        version: 1,
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheData));

      const result = await getCachedProfile(1800000); // maxAge 30 минут

      expect(result).toEqual(profile);
    });

    it('должен обработать ошибку и вернуть null', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await getCachedProfile();

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('clearProfileCache', () => {
    it('должен очистить кеш профиля', async () => {
      AsyncStorage.removeItem.mockResolvedValue();

      await clearProfileCache();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@cache_profile');
    });

    it('должен обработать ошибку', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      AsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));

      await clearProfileCache();

      // Функция не должна выбросить ошибку
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('cacheDocumentStatuses', () => {
    it('должен сохранить статусы документов в кеш', async () => {
      const statuses = { doc1: 'approved', doc2: 'pending' };
      AsyncStorage.setItem.mockResolvedValue();

      await cacheDocumentStatuses(statuses);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@cache_document_statuses',
        expect.stringContaining('"data":')
      );
    });

    it('должен обработать ошибку при сохранении', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const statuses = { doc1: 'approved' };
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await cacheDocumentStatuses(statuses);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getCachedDocumentStatuses', () => {
    it('должен получить статусы документов из кеша', async () => {
      const statuses = { doc1: 'approved', doc2: 'pending' };
      const cacheData = {
        data: statuses,
        timestamp: Date.now(),
        version: 1,
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheData));

      const result = await getCachedDocumentStatuses();

      expect(result).toEqual(statuses);
    });

    it('должен вернуть null если кеш пуст', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await getCachedDocumentStatuses();

      expect(result).toBeNull();
    });

    it('должен вернуть null если кеш устарел', async () => {
      const statuses = { doc1: 'approved' };
      const cacheData = {
        data: statuses,
        timestamp: Date.now() - 3600000,
        version: 1,
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheData));

      const result = await getCachedDocumentStatuses(1800000);

      expect(result).toBeNull();
    });

    it('должен обработать ошибку и вернуть null', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await getCachedDocumentStatuses();

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('migrateCache', () => {
    it('должен пропустить миграцию если версия актуальна', async () => {
      AsyncStorage.getItem.mockResolvedValue('1'); // Текущая версия

      await migrateCache();

      expect(AsyncStorage.getAllKeys).not.toHaveBeenCalled();
    });

    it('должен выполнить миграцию с версии 0 на 1', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce('0') // getCacheVersion
        .mockResolvedValueOnce(null); // getAllKeys
      AsyncStorage.getAllKeys.mockResolvedValue([]);
      AsyncStorage.setItem.mockResolvedValue();

      await migrateCache();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@cache_version', '1');
    });

    it('должен обработать ошибку при миграции', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce('0')
        .mockRejectedValue(new Error('Storage error'));

      await migrateCache();

      // Функция не должна выбросить ошибку
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
  });
});

