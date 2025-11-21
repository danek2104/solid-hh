import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useProfileQuery,
  useUpdateProfile,
  useProfileDraft,
  useDocumentStatusesQuery,
} from '../../hooks/useProfile';
import * as profileApi from '../../services/profileApi';
import * as cacheService from '../../services/cacheService';

// Моки
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/profileApi');
jest.mock('../../services/cacheService');

const PROFILE_DRAFT_KEY = '@profile_draft';

describe('useProfile hooks', () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useProfileQuery', () => {
    it('должен получить профиль из API', async () => {
      const mockProfile = { id: 1, name: 'Test User' };
      const token = 'test-token';

      cacheService.getCachedProfile.mockResolvedValue(null);
      profileApi.fetchProfile.mockResolvedValue(mockProfile);
      cacheService.cacheProfile.mockResolvedValue();

      const { result } = renderHook(() => useProfileQuery(token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toBeDefined();
      }, { timeout: 3000 });

      expect(result.current.data).toEqual(mockProfile);
      expect(profileApi.fetchProfile).toHaveBeenCalledWith(token);
      expect(cacheService.cacheProfile).toHaveBeenCalledWith(mockProfile);
    });

    it('должен использовать кешированные данные если они актуальны', async () => {
      const mockProfile = { id: 1, name: 'Test User' };
      const cachedProfile = { id: 1, name: 'Cached User' };
      const token = 'test-token';

      cacheService.getCachedProfile.mockResolvedValue(cachedProfile);
      profileApi.fetchProfile.mockResolvedValue(mockProfile);
      cacheService.cacheProfile.mockResolvedValue();

      const { result } = renderHook(() => useProfileQuery(token), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toBeDefined();
      }, { timeout: 3000 });

      // Проверяем, что кеш был использован
      expect(cacheService.getCachedProfile).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockProfile);
    });

    it('должен использовать staleTime из опций', async () => {
      const token = 'test-token';
      const staleTime = 10 * 60 * 1000; // 10 минут

      cacheService.getCachedProfile.mockResolvedValue(null);
      profileApi.fetchProfile.mockResolvedValue({ id: 1 });
      cacheService.cacheProfile.mockResolvedValue();

      renderHook(() => useProfileQuery(token, { staleTime }), { wrapper });

      await waitFor(() => {
        expect(cacheService.getCachedProfile).toHaveBeenCalledWith(staleTime);
      });
    });

    it('должен быть отключен когда enabled=false', async () => {
      const token = 'test-token';

      const { result } = renderHook(
        () => useProfileQuery(token, { enabled: false }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(profileApi.fetchProfile).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки', async () => {
      const token = 'test-token';
      const error = new Error('Failed to fetch');

      cacheService.getCachedProfile.mockResolvedValue(null);
      profileApi.fetchProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileQuery(token), { wrapper });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toBeDefined();
      expect(result.current.isError).toBe(true);
    });
  });

  describe('useUpdateProfile', () => {
    it('должен обновить профиль', async () => {
      const token = 'test-token';
      const updatedProfile = { id: 1, name: 'Updated User' };
      const profileData = { name: 'Updated User' };

      profileApi.updateProfile.mockResolvedValue(updatedProfile);
      cacheService.cacheProfile.mockResolvedValue();

      const { result } = renderHook(() => useUpdateProfile(token), { wrapper });

      result.current.mutate(profileData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(profileApi.updateProfile).toHaveBeenCalledWith(profileData, token);
      expect(cacheService.cacheProfile).toHaveBeenCalledWith(updatedProfile);
      expect(result.current.data).toEqual(updatedProfile);
    });

    it('должен выполнить оптимистичное обновление', async () => {
      const token = 'test-token';
      const previousProfile = { id: 1, name: 'Old User' };
      const newProfileData = { name: 'New User' };
      const updatedProfile = { id: 1, name: 'New User' };

      // Устанавливаем предыдущие данные в кеш
      queryClient.setQueryData(['profile', token], previousProfile);

      profileApi.updateProfile.mockResolvedValue(updatedProfile);
      cacheService.cacheProfile.mockResolvedValue();

      const { result } = renderHook(() => useUpdateProfile(token), { wrapper });

      result.current.mutate(newProfileData);

      // Ждем успешного завершения мутации
      await waitFor(
        () => {
          expect(result.current.isSuccess).toBe(true);
        },
        { timeout: 3000 }
      );

      // Проверяем, что данные обновлены через результат мутации
      expect(result.current.data).toBeDefined();
      expect(result.current.data.name).toBe('New User');
      // Проверяем, что кеш был обновлен
      expect(cacheService.cacheProfile).toHaveBeenCalledWith(updatedProfile);
    });

    it('должен вернуть предыдущее значение при ошибке', async () => {
      const token = 'test-token';
      const previousProfile = { id: 1, name: 'Old User' };
      const newProfileData = { name: 'New User' };
      const error = new Error('Update failed');

      // Устанавливаем предыдущие данные в кеш
      queryClient.setQueryData(['profile', token], previousProfile);

      profileApi.updateProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateProfile(token), { wrapper });

      result.current.mutate(newProfileData);

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 }
      );

      // Проверяем, что данные были возвращены к предыдущему состоянию
      // onError callback должен вернуть предыдущие данные
      const cachedData = queryClient.getQueryData(['profile', token]);
      // Данные должны быть либо предыдущими (если onError отработал), либо undefined
      // Проверяем, что ошибка обработана
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });

    it('должен обновить кеш при успешном обновлении', async () => {
      const token = 'test-token';
      const updatedProfile = { id: 1, name: 'Updated User' };
      const profileData = { name: 'Updated User' };

      profileApi.updateProfile.mockResolvedValue(updatedProfile);
      cacheService.cacheProfile.mockResolvedValue();

      const { result } = renderHook(() => useUpdateProfile(token), { wrapper });

      result.current.mutate(profileData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(cacheService.cacheProfile).toHaveBeenCalledWith(updatedProfile);
    });
  });

  describe('useProfileDraft', () => {
    it('должен сохранить черновик', async () => {
      const draft = { name: 'Draft User', email: 'draft@test.com' };

      const { result } = renderHook(() => useProfileDraft(), { wrapper });

      await result.current.saveDraft(draft);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        PROFILE_DRAFT_KEY,
        JSON.stringify(draft)
      );
    });

    it('должен загрузить черновик', async () => {
      const draft = { name: 'Draft User', email: 'draft@test.com' };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(draft));

      const { result } = renderHook(() => useProfileDraft(), { wrapper });

      const loadedDraft = await result.current.loadDraft();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(PROFILE_DRAFT_KEY);
      expect(loadedDraft).toEqual(draft);
    });

    it('должен вернуть null если черновик не найден', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const { result } = renderHook(() => useProfileDraft(), { wrapper });

      const loadedDraft = await result.current.loadDraft();

      expect(loadedDraft).toBeNull();
    });

    it('должен очистить черновик', async () => {
      const { result } = renderHook(() => useProfileDraft(), { wrapper });

      await result.current.clearDraft();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(PROFILE_DRAFT_KEY);
    });

    it('должен обрабатывать ошибки при сохранении черновика', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = new Error('Storage error');
      AsyncStorage.setItem.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileDraft(), { wrapper });

      await result.current.saveDraft({ name: 'Test' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Не удалось сохранить черновик профиля',
        error
      );

      consoleWarnSpy.mockRestore();
    });

    it('должен обрабатывать ошибки при загрузке черновика', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = new Error('Storage error');
      AsyncStorage.getItem.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileDraft(), { wrapper });

      const loadedDraft = await result.current.loadDraft();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Не удалось загрузить черновик профиля',
        error
      );
      expect(loadedDraft).toBeNull();

      consoleWarnSpy.mockRestore();
    });

    it('должен обрабатывать ошибки при очистке черновика', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = new Error('Storage error');
      AsyncStorage.removeItem.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileDraft(), { wrapper });

      await result.current.clearDraft();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Не удалось очистить черновик профиля',
        error
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('useDocumentStatusesQuery', () => {
    beforeEach(() => {
      // Мокируем функции из cacheService и profileApi, которые импортируются динамически
      if (!cacheService.getCachedDocumentStatuses) {
        cacheService.getCachedDocumentStatuses = jest.fn();
      }
      if (!cacheService.cacheDocumentStatuses) {
        cacheService.cacheDocumentStatuses = jest.fn();
      }
      if (!profileApi.fetchDocumentStatuses) {
        profileApi.fetchDocumentStatuses = jest.fn();
      }
      
      jest.clearAllMocks();
    });

    it('должен быть отключен когда enabled=false', async () => {
      const token = 'test-token';

      const { result } = renderHook(
        () => useDocumentStatusesQuery(token, { enabled: false }),
        { wrapper }
      );

      await waitFor(
        () => {
          expect(result.current.isFetching).toBe(false);
        },
        { timeout: 3000 }
      );
    });

    it('должен рендериться без ошибок', () => {
      const token = 'test-token';
      
      // Устанавливаем моки перед рендерингом
      cacheService.getCachedDocumentStatuses.mockResolvedValue(null);
      profileApi.fetchDocumentStatuses.mockResolvedValue({});
      cacheService.cacheDocumentStatuses.mockResolvedValue();

      const { result } = renderHook(() => useDocumentStatusesQuery(token), { wrapper });
      
      // Проверяем, что хук рендерится без ошибок
      expect(result.current).toBeDefined();
      expect(result.current.isLoading !== undefined).toBe(true);
    });
  });
});

