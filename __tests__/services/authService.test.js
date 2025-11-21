import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveAuthToken,
  getAuthToken,
  getRefreshToken,
  getAuthRole,
  validateToken,
  refreshAuthToken,
  clearAuthToken,
  hasAuthToken,
  getValidToken,
  resetSecureStoreCache,
} from '../../services/authService';

// Моки
jest.mock('expo-secure-store');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../config', () => ({
  API_ENDPOINTS: {
    auth: 'https://api.workmatch.dev/auth',
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Сбрасываем кэш SecureStore перед каждым тестом
    resetSecureStoreCache();
  });

  describe('saveAuthToken', () => {
    it('должен сохранить токен, refresh token и роль', async () => {
      const token = 'test-token';
      const refreshToken = 'test-refresh-token';
      const role = 'worker';

      SecureStore.setItemAsync.mockResolvedValue();
      AsyncStorage.setItem.mockResolvedValue();

      // Создаём валидный JWT токен (header.payload.signature)
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      const mockToken = `header.${payload}.signature`;

      await saveAuthToken(mockToken, refreshToken, role);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', mockToken);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', refreshToken);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('authRole', role);
    });

    it('должен обработать ошибку при сохранении', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = new Error('Storage error');
      SecureStore.setItemAsync.mockRejectedValue(error);
      AsyncStorage.setItem.mockResolvedValue();

      // Обычная ошибка должна быть выброшена
      await expect(saveAuthToken('token', 'refresh', 'worker')).rejects.toThrow(error);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('должен использовать AsyncStorage при ошибке SecureStore с "is not a function"', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = new Error('ExpoSecureStore.default.getValueWithKeyAsync is not a function');
      SecureStore.setItemAsync.mockRejectedValue(error);
      AsyncStorage.setItem.mockResolvedValue();

      // При ошибке типа "is not a function" должен использоваться AsyncStorage
      await saveAuthToken('token', 'refresh', 'worker');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getAuthToken', () => {
    it('должен получить токен из SecureStore', async () => {
      const token = 'test-token';
      SecureStore.getItemAsync.mockResolvedValue(token);

      const result = await getAuthToken();

      expect(result).toBe(token);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('authToken');
    });

    it('должен вернуть null при ошибке', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      SecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await getAuthToken();

      expect(result).toBeNull();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getRefreshToken', () => {
    it('должен получить refresh token из SecureStore', async () => {
      const refreshToken = 'test-refresh-token';
      SecureStore.getItemAsync.mockResolvedValue(refreshToken);

      const result = await getRefreshToken();

      expect(result).toBe(refreshToken);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('refreshToken');
    });

    it('должен вернуть null при ошибке', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      SecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await getRefreshToken();

      expect(result).toBeNull();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getAuthRole', () => {
    it('должен получить роль из AsyncStorage', async () => {
      const role = 'worker';
      AsyncStorage.getItem.mockResolvedValue(role);

      const result = await getAuthRole();

      expect(result).toBe(role);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('authRole');
    });

    it('должен вернуть null при ошибке', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await getAuthRole();

      expect(result).toBeNull();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('validateToken', () => {
    it('должен вернуть true для валидного токена', async () => {
      const exp = Math.floor(Date.now() / 1000) + 3600; // Токен действителен 1 час
      const payload = btoa(JSON.stringify({ exp }));
      const token = `header.${payload}.signature`;

      SecureStore.getItemAsync.mockResolvedValue(token);

      const result = await validateToken();

      expect(result).toBe(true);
    });

    it('должен вернуть false для истёкшего токена без refresh token', async () => {
      const exp = Math.floor(Date.now() / 1000) - 3600; // Токен истёк
      const payload = btoa(JSON.stringify({ exp }));
      const token = `header.${payload}.signature`;

      SecureStore.getItemAsync
        .mockResolvedValueOnce(token) // getAuthToken
        .mockResolvedValueOnce(null); // getRefreshToken

      const result = await validateToken();

      expect(result).toBe(false);
    });

    it('должен обновить токен если он истёк и есть refresh token', async () => {
      const exp = Math.floor(Date.now() / 1000) - 3600; // Токен истёк
      const payload = btoa(JSON.stringify({ exp }));
      const oldToken = `header.${payload}.signature`;
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';

      SecureStore.getItemAsync
        .mockResolvedValueOnce(oldToken) // getAuthToken
        .mockResolvedValueOnce(refreshToken) // getRefreshToken
        .mockResolvedValue(); // getAuthRole

      SecureStore.setItemAsync.mockResolvedValue();
      AsyncStorage.setItem.mockResolvedValue();
      AsyncStorage.getItem.mockResolvedValue('worker');

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: newToken, refreshToken }),
      });

      const result = await validateToken();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('refreshAuthToken', () => {
    it('должен обновить токен используя refresh token', async () => {
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      const newRefreshToken = 'new-refresh-token';
      const role = 'worker';

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: newToken, refreshToken: newRefreshToken }),
      });

      SecureStore.setItemAsync.mockResolvedValue();
      AsyncStorage.getItem.mockResolvedValue(role);
      AsyncStorage.setItem.mockResolvedValue();

      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      const tokenWithPayload = `header.${payload}.signature`;

      const result = await refreshAuthToken(refreshToken);

      expect(result).toBe(newToken);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.workmatch.dev/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('должен выбросить ошибку при неудачном обновлении', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const refreshToken = 'refresh-token';

      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(refreshAuthToken(refreshToken)).rejects.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('clearAuthToken', () => {
    it('должен удалить все токены и данные авторизации', async () => {
      SecureStore.deleteItemAsync.mockResolvedValue();
      AsyncStorage.multiRemove.mockResolvedValue();

      await clearAuthToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
      // Теперь AsyncStorage.multiRemove вызывается со всеми ключами
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['authToken', 'refreshToken', 'authRole', 'tokenExpiry']);
    });

    it('должен обработать ошибку при удалении', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = new Error('Delete error');
      SecureStore.deleteItemAsync.mockRejectedValue(error);
      AsyncStorage.multiRemove.mockResolvedValue();

      // Теперь ошибка не выбрасывается, а обрабатывается с fallback на AsyncStorage
      await clearAuthToken();
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('должен использовать AsyncStorage при ошибке SecureStore с "is not a function"', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = new Error('ExpoSecureStore.default.getValueWithKeyAsync is not a function');
      SecureStore.deleteItemAsync.mockRejectedValue(error);
      AsyncStorage.multiRemove.mockResolvedValue();

      // При ошибке типа "is not a function" должен использоваться AsyncStorage
      await clearAuthToken();
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['authToken', 'refreshToken', 'authRole', 'tokenExpiry']);
      consoleWarnSpy.mockRestore();
    });
  });

  describe('hasAuthToken', () => {
    it('должен вернуть true если токен существует', async () => {
      SecureStore.getItemAsync.mockResolvedValue('test-token');

      const result = await hasAuthToken();

      expect(result).toBe(true);
    });

    it('должен вернуть false если токена нет', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await hasAuthToken();

      expect(result).toBe(false);
    });
  });

  describe('getValidToken', () => {
    it('должен вернуть валидный токен', async () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp }));
      const token = `header.${payload}.signature`;

      SecureStore.getItemAsync.mockResolvedValue(token);

      const result = await getValidToken();

      expect(result).toBe(token);
    });

    it('должен обновить истёкший токен', async () => {
      const exp = Math.floor(Date.now() / 1000) - 3600;
      const payload = btoa(JSON.stringify({ exp }));
      const oldToken = `header.${payload}.signature`;
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';

      SecureStore.getItemAsync
        .mockResolvedValueOnce(oldToken) // getAuthToken
        .mockResolvedValueOnce(refreshToken) // getRefreshToken
        .mockResolvedValue(); // saveAuthToken

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: newToken, refreshToken }),
      });

      AsyncStorage.getItem.mockResolvedValue('worker');
      AsyncStorage.setItem.mockResolvedValue();

      const newExp = Math.floor(Date.now() / 1000) + 3600;
      const newPayload = btoa(JSON.stringify({ exp: newExp }));
      const newTokenWithPayload = `header.${newPayload}.signature`;

      SecureStore.getItemAsync.mockResolvedValueOnce(newTokenWithPayload);

      const result = await getValidToken();

      expect(result).toBe(newToken);
    });

    it('должен вернуть null если токен истёк и нет refresh token', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Создаем токен, который точно истек (больше чем 60 секунд назад)
      const exp = Math.floor(Date.now() / 1000) - 7200; // 2 часа назад
      const payload = btoa(JSON.stringify({ exp }));
      const token = `header.${payload}.signature`;

      // Проверяем, что токен действительно истек
      const parts = token.split('.');
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const currentTime = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeLessThan(currentTime + 60);

      // Очищаем моки перед настройкой - используем mockReset для полного сброса
      SecureStore.getItemAsync.mockReset();
      SecureStore.deleteItemAsync.mockReset();
      AsyncStorage.multiRemove.mockReset();

      SecureStore.getItemAsync
        .mockResolvedValueOnce(token) // getAuthToken
        .mockResolvedValueOnce(null); // getRefreshToken

      SecureStore.deleteItemAsync.mockResolvedValue();
      AsyncStorage.multiRemove.mockResolvedValue();

      const result = await getValidToken();

      expect(result).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});

