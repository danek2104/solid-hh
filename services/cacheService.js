import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_VERSION_KEY = '@cache_version';
const CURRENT_CACHE_VERSION = 1;

const migrations = [
  {
    version: 1,
    migrate: async (data) => {
      // Миграция версии 1: базовая структура кеша
      return {
        ...data,
        version: 1,
        createdAt: Date.now(),
      };
    },
  },
];

/**
 * Получить текущую версию кеша
 */
export const getCacheVersion = async () => {
  try {
    const version = await AsyncStorage.getItem(CACHE_VERSION_KEY);
    return version ? parseInt(version, 10) : 0;
  } catch (error) {
    console.warn('Не удалось получить версию кеша', error);
    return 0;
  }
};

/**
 * Установить версию кеша
 */
export const setCacheVersion = async (version) => {
  try {
    await AsyncStorage.setItem(CACHE_VERSION_KEY, version.toString());
  } catch (error) {
    console.warn('Не удалось установить версию кеша', error);
  }
};

/**
 * Выполнить миграции кеша
 */
export const migrateCache = async () => {
  try {
    const currentVersion = await getCacheVersion();
    
    if (currentVersion >= CURRENT_CACHE_VERSION) {
      return;
    }

    // Получить все данные из кеша
    const allKeys = await AsyncStorage.getAllKeys();
    const profileKeys = allKeys.filter(key => 
      key.startsWith('@profile') || 
      key.startsWith('@cache_profile')
    );

    const cacheData = {};
    for (const key of profileKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          cacheData[key] = JSON.parse(value);
        }
      } catch (error) {
        console.warn(`Не удалось прочитать ключ ${key}`, error);
      }
    }

    // Применить миграции
    for (let version = currentVersion + 1; version <= CURRENT_CACHE_VERSION; version++) {
      const migration = migrations.find(m => m.version === version);
      if (migration) {
        const migratedData = await migration.migrate(cacheData);
        
        // Сохранить мигрированные данные
        for (const [key, value] of Object.entries(migratedData)) {
          if (key !== 'version' && key !== 'createdAt') {
            await AsyncStorage.setItem(key, JSON.stringify(value));
          }
        }
      }
    }

    await setCacheVersion(CURRENT_CACHE_VERSION);
    console.log('Миграция кеша завершена', { from: currentVersion, to: CURRENT_CACHE_VERSION });
  } catch (error) {
    console.error('Ошибка при миграции кеша', error);
  }
};

/**
 * Сохранить данные профиля в кеш
 */
export const cacheProfile = async (profile) => {
  try {
    const cacheKey = '@cache_profile';
    const cacheData = {
      data: profile,
      timestamp: Date.now(),
      version: CURRENT_CACHE_VERSION,
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Не удалось сохранить профиль в кеш', error);
  }
};

/**
 * Получить профиль из кеша
 */
export const getCachedProfile = async (maxAge) => {
  try {
    const cacheKey = '@cache_profile';
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    if (maxAge && age > maxAge) {
      // Кеш устарел
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.warn('Не удалось получить профиль из кеша', error);
    return null;
  }
};

/**
 * Очистить кеш профиля
 */
export const clearProfileCache = async () => {
  try {
    await AsyncStorage.removeItem('@cache_profile');
  } catch (error) {
    console.warn('Не удалось очистить кеш профиля', error);
  }
};

/**
 * Сохранить статусы документов в кеш
 */
export const cacheDocumentStatuses = async (statuses) => {
  try {
    const cacheKey = '@cache_document_statuses';
    const cacheData = {
      data: statuses,
      timestamp: Date.now(),
      version: CURRENT_CACHE_VERSION,
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Не удалось сохранить статусы документов в кеш', error);
  }
};

/**
 * Получить статусы документов из кеша
 */
export const getCachedDocumentStatuses = async (maxAge) => {
  try {
    const cacheKey = '@cache_document_statuses';
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    if (maxAge && age > maxAge) {
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.warn('Не удалось получить статусы документов из кеша', error);
    return null;
  }
};

