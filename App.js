import { StatusBar } from 'expo-status-bar';
import {
  ScrollView,
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Switch,
  TextInput,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState, useCallback, useEffect, useReducer, useRef, memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
// import { useAuthRequest as useGoogleAuthRequest } from 'expo-auth-session/providers/google';
import { useQueryClient } from '@tanstack/react-query';
import { useProfileQuery, useUpdateProfile, useDocumentStatusesQuery } from './hooks/useProfile';
import { useJobsQuery, useJobQuery, useApplyToJob, useApplicationsQuery } from './hooks/useJobs';
import {
  useChatsQuery,
  useMessagesSimpleQuery,
  useSendMessage,
  useMarkMessagesAsRead
} from './hooks/useChats';
import { useShiftsQuery, useAcceptShift, useRejectShift } from './hooks/useShifts';
import { useNotifications } from './hooks/useNotifications';
import {
  useDocumentsQuery,
  useDocumentQuery,
  useUploadDocument,
  useUploadDocumentPhoto,
  useDeleteDocument
} from './hooks/useDocuments';
import { useReviewsQuery, useCreateReview } from './hooks/useReviews';
import { initSyncService } from './services/syncService';
import { initWebSocketService } from './services/websocketService';
import { markMessagesAsRead } from './services/chatsApi';
import { migrateCache, cacheChatMessages } from './services/cacheService';
import { API_ENDPOINTS, API_TIMEOUT_MS, WS_URL } from './config';
import { setTokenExpiredHandler } from './services/profileApi';
import { setTokenExpiredHandler as setJobsTokenExpiredHandler } from './services/jobsApi';
import { setTokenExpiredHandler as setShiftsTokenExpiredHandler } from './services/shiftsApi';
import { setTokenExpiredHandler as setDocumentsTokenExpiredHandler } from './services/documentsApi';
import { setTokenExpiredHandler as setReviewsTokenExpiredHandler } from './services/reviewsApi';
import { clearAuthToken, saveAuthToken, getValidToken, getAuthRole } from './services/authService';
import {
  getErrorMessage,
  isUnauthorizedError,
  isNetworkError,
  NetworkError,
  TimeoutError,
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  CorsError,
  handleApiError
} from './utils/errorHandler';
import ErrorBoundary from './components/ErrorBoundary';
import { ErrorDisplay } from './components/ErrorDisplay';
import { theme, styles } from './AppStyles';

// WebBrowser.maybeCompleteAuthSession();

const skillLevelLabels = {
  1: 'Новичок',
  2: 'Стажёр',
  3: 'Уверенно',
  4: 'Эксперт',
  5: 'Наставник',
};

const skillCategoriesPreset = [
  {
    key: 'finishing',
    title: 'Отделка и покраска',
    meta: 'Самые частые запросы',
    skills: [
      {
        key: 'painting',
        label: 'Покраска фасадов',
        tags: ['фасады', 'интерьер'],
        usages: ['Красил забор', 'Красил дом', 'Красил металлоконструкции'],
        level: 4,
        wantToGrow: false,
      },
      {
        key: 'plaster',
        label: 'Шпаклёвка и финиш',
        tags: ['шпаклёвка', 'финиш'],
        usages: ['Сборка опалубки', 'Монтаж настила', 'Установка дверей'],
        level: 3,
        wantToGrow: true,
      },
    ],
  },
  {
    key: 'hardwork',
    title: 'Грубые работы',
    meta: 'Для складов и стройки',
    skills: [
      {
        key: 'welder',
        label: 'Сварка конструкций',
        tags: ['каркас', 'трубы'],
        usages: ['Сварка ворот', 'Сварка труб', 'Сварка каркасов'],
        level: 4,
        wantToGrow: false,
      },
      {
        key: 'loader',
        label: 'Погрузка / разгрузка',
        tags: ['склады', 'переезды'],
        usages: ['Переезды', 'Склад', 'Стройка'],
        level: 5,
        wantToGrow: false,
      },
    ],
  },
  {
    key: 'extra',
    title: 'Дополнительные услуги',
    meta: 'Для гибридных смен',
    skills: [
      {
        key: 'carpentry',
        label: 'Плотницкие работы',
        tags: ['опалубка', 'монтаж'],
        usages: ['Сборка опалубки', 'Монтаж настила', 'Установка дверей'],
        level: 3,
        wantToGrow: false,
      },
      {
        key: 'mentoring',
        label: 'Наставничество',
        tags: ['бригада', 'обучение'],
        usages: ['Обучение стажёров', 'Контроль ТБ', 'Сдача смены'],
        level: 2,
        wantToGrow: true,
      },
    ],
  },
];

const shiftCalendarDays = [
  {
    key: 'mon',
    dayLabel: 'Пн',
    dateLabel: '18 ноя',
    status: 'booked',
    title: 'Покраска ЖК Avlon',
    hours: '08:00 — 17:00',
  },
  {
    key: 'tue',
    dayLabel: 'Вт',
    dateLabel: '19 ноя',
    status: 'open',
    title: 'Свободен',
    hours: 'Можно взять смену',
  },
  {
    key: 'wed',
    dayLabel: 'Ср',
    dateLabel: '20 ноя',
    status: 'booked',
    title: 'Склад Mega',
    hours: '22:00 — 06:00',
  },
  {
    key: 'thu',
    dayLabel: 'Чт',
    dateLabel: '21 ноя',
    status: 'rest',
    title: 'День восстановления',
    hours: 'Без смен',
  },
  {
    key: 'fri',
    dayLabel: 'Пт',
    dateLabel: '22 ноя',
    status: 'open',
    title: 'Любой формат',
    hours: 'Готов выйти',
  },
];

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const availabilityMatrixRows = [
  {
    key: 'morning',
    label: 'Утро',
    hours: '06:00 — 12:00',
    defaultActiveDays: ['Пн', 'Вт', 'Ср', 'Чт'],
  },
  {
    key: 'day',
    label: 'День',
    hours: '12:00 — 18:00',
    defaultActiveDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
  },
  {
    key: 'evening',
    label: 'Вечер',
    hours: '18:00 — 22:00',
    defaultActiveDays: ['Пт', 'Сб'],
  },
  {
    key: 'night',
    label: 'Ночь',
    hours: '22:00 — 06:00',
    defaultActiveDays: ['Пн', 'Вт'],
  },
];

const quickAvailabilityTemplates = [
  {
    key: 'night',
    label: 'Работаю ночами',
    description: '22:00 — 06:00 ежедневно',
    config: {
      morning: [],
      day: [],
      evening: [],
      night: weekDays,
    },
  },
  {
    key: 'weekend',
    label: 'Только выходные',
    description: 'Сб—Вс, дневные смены',
    config: {
      morning: ['Сб', 'Вс'],
      day: ['Сб', 'Вс'],
      evening: ['Сб'],
      night: [],
    },
  },
  {
    key: 'express',
    label: 'Экспресс-выход',
    description: 'Пн—Ср, утро и день',
    config: {
      morning: ['Пн', 'Вт', 'Ср'],
      day: ['Пн', 'Вт', 'Ср'],
      evening: [],
      night: [],
    },
  },
];

const defaultMatrixConfig = availabilityMatrixRows.reduce((acc, row) => {
  acc[row.key] = row.defaultActiveDays;
  return acc;
}, {});

const createWeekMatrix = (config = defaultMatrixConfig) =>
  availabilityMatrixRows.map((row) => ({
    ...row,
    days: weekDays.reduce((acc, day) => {
      const activeDays = config[row.key] ?? row.defaultActiveDays;
      acc[day] = activeDays.includes(day);
      return acc;
    }, {}),
  }));

const cloneSkillCategories = () =>
  skillCategoriesPreset.map((category) => ({
    ...category,
    skills: category.skills.map((skill) => ({ ...skill })),
  }));

const timezones = ['GMT+5 (Ташкент)', 'GMT+3 (Москва)', 'GMT+6 (Алматы)'];

const interests = [
  'Маляр',
  'Стройка',
  'Разнорабочий',
  'Монтажник',
  'Демонтаж',
];

const travelPreferences = [
  { label: 'По всей области', value: 'region' },
  { label: 'Только город', value: 'city' },
  { label: 'Без выездов', value: 'none' },
];

const PROFILE_DRAFT_KEY = 'profileDraft:v1';

const defaultProfileForm = {
  fullName: 'Санжар Каримов',
  experience: '6 лет, стройка и отделка',
  documentsNote: 'Паспорт, медкнижка, сертификат ТБ',
  readyToTravel: 'region',
  passport: 'AA1234567',
  inn: '301234567',
  phone: '+79824167606',
  telegram: '@hard_worker',
  whatsapp: '+998 97 987 65 43',
  email: 'worker@example.com',
  startWindow: 'Готов выйти в течение 2 дней',
  timezone: 'GMT+5 (Ташкент)',
  minRate: '6 000 000 сум',
  desiredRate: '9 500 000 сум',
};

const vacancies = [
  {
    title: 'Бригада на отделку',
    company: 'СтройГрад',
    salary: '8 000 000 сум/мес',
    tags: ['Оплата каждую неделю', 'Проезд оплачивается'],
  },
  {
    title: 'Срочно: покраска фасада',
    company: 'Частный заказчик',
    salary: '700 000 сум/день',
    tags: ['3 дня', 'Инструменты на месте'],
  },
  {
    title: 'Грузчики на склад',
    company: 'LogiFast',
    salary: '55 000 сум/час',
    tags: ['Смены по 6 часов', 'Питание'],
  },
];

const readinessChecklist = [
  'Справка о медосмотре обновлена',
  'Средства защиты в комплекте',
  'Инструменты заряжены и проверены',
];

const normalizeDigits = (value = '') => value.replace(/\D/g, '');

const formatRussianPhone = (value = '') => {
  // Убираем все нецифровые символы, кроме возможного + в начале
  let cleaned = value.trim();

  // Если начинается с +7, оставляем только цифры после +
  if (cleaned.startsWith('+7')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('+')) {
    // Если начинается с +, но не +7, убираем +
    cleaned = cleaned.slice(1);
  }

  // Оставляем только цифры
  let digits = normalizeDigits(cleaned);

  // Убираем 7 или 8 в начале, если они есть (код страны уже обработан выше)
  if (digits.startsWith('7')) {
    digits = digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = digits.slice(1);
  }

  // Ограничиваем до 10 цифр (без кода страны)
  digits = digits.slice(0, 10);

  // Форматируем в +7XXXXXXXXXX
  if (digits.length === 10) {
    return `+7${digits}`;
  } else if (digits.length > 0) {
    return `+7${digits}`;
  }

  return '+7';
};

const sanitizeProfileValue = (field, value) => {
  if (field === 'passport') {
    return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 9);
  }

  if (field === 'inn') {
    return normalizeDigits(value).slice(0, 9);
  }

  if (field === 'phone' || field === 'whatsapp') {
    return formatRussianPhone(value);
  }

  return value;
};

const normalizeProfileDraft = (payload = {}) => {
  const normalized = {};
  Object.keys(payload).forEach((key) => {
    normalized[key] = sanitizeProfileValue(key, payload[key]);
  });
  return normalized;
};

const validateProfileField = (field, value) => {
  if (field === 'fullName' && value.trim().length < 6) {
    return 'ФИО должно содержать минимум 6 символов';
  }

  if (field === 'passport' && !/^[A-ZА-Я]{2}\d{7}$/.test(value)) {
    return 'Паспорт: 2 буквы и 7 цифр';
  }

  if (field === 'inn' && normalizeDigits(value).length !== 9) {
    return 'ИНН должен состоять из 9 цифр';
  }

  if (
    (field === 'phone' || field === 'whatsapp') &&
    !/^\+7\d{10}$/.test(value)
  ) {
    return 'Введите телефон в формате +79824167606';
  }

  if (field === 'email' && value && !/.+@.+\..+/.test(value)) {
    return 'Введите корректный email';
  }

  return null;
};

const reduceProfileErrors = (profile) =>
  Object.keys(profile).reduce((acc, key) => {
    const error = validateProfileField(key, profile[key] ?? '');
    if (error) {
      acc[key] = error;
    }
    return acc;
  }, {});

// Безопасное копирование объекта, исключая свойства только для чтения (например, focus)
const safeCopyObject = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj ? {} : {};
  }
  const result = {};
  try {
    // Используем Object.keys для получения только собственных перечисляемых свойств
    const keys = Object.keys(obj);
    for (const key of keys) {
      // Пропускаем свойство 'focus', так как оно может быть только для чтения
      if (key === 'focus') {
        continue;
      }
      try {
        // Пытаемся скопировать свойство
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor) {
          // Пропускаем свойства только для чтения без сеттера
          if (!descriptor.writable && !descriptor.set && descriptor.get) {
            continue;
          }
        }
        result[key] = obj[key];
      } catch (e) {
        // Игнорируем ошибки при копировании свойств только для чтения
        // Тихо пропускаем проблемные свойства
      }
    }
  } catch (e) {
    // Если не удалось скопировать объект, возвращаем пустой объект
    console.warn('Не удалось безопасно скопировать объект:', e.message);
    return {};
  }
  return result;
};

const createProfileState = (initialProfile) => {
  // Используем safeCopyObject для безопасного копирования объекта,
  // чтобы избежать проблем с свойствами только для чтения (например, focus)
  const snapshot = safeCopyObject(initialProfile);
  return {
    snapshot,
    draft: safeCopyObject(snapshot),
    errors: reduceProfileErrors(snapshot),
    isDirty: false,
    isSaving: false,
    modalVisible: false,
    lastError: null,
    lastSavedAt: null,
    isHydrated: false,
    previousSnapshot: safeCopyObject(snapshot),
  };
};

const formatSavedTime = (timestamp) => {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const profileReducer = (state, action) => {
  switch (action.type) {
    case 'hydrate_base': {
      // Используем safeCopyObject для безопасного копирования объекта,
      // чтобы избежать проблем с свойствами только для чтения (например, focus)
      const snapshot = safeCopyObject(action.payload);
      return {
        ...state,
        snapshot,
        draft: safeCopyObject(snapshot),
        errors: reduceProfileErrors(snapshot),
        isDirty: false,
        isHydrated: true,
        previousSnapshot: safeCopyObject(snapshot),
      };
    }
    case 'hydrate_draft': {
      const sanitizedDraft = normalizeProfileDraft(action.payload);
      // Используем safeCopyObject для безопасного копирования объекта,
      // чтобы избежать проблем с свойствами только для чтения (например, focus)
      const draft = Object.assign({}, safeCopyObject(state.draft), sanitizedDraft);
      return {
        ...state,
        draft,
        errors: reduceProfileErrors(draft),
        isDirty: true,
      };
    }
    case 'update_field': {
      const { field, value } = action.payload;

      // Пропускаем попытки установить свойство 'focus', так как оно может быть только для чтения
      if (field === 'focus') {
        console.warn('Попытка установить свойство "focus" проигнорирована, так как оно только для чтения');
        return state;
      }

      const sanitized = sanitizeProfileValue(field, value);
      // Используем safeCopyObject для безопасного копирования объекта,
      // чтобы избежать проблем с свойствами только для чтения (например, focus)
      const draft = Object.assign({}, safeCopyObject(state.draft), { [field]: sanitized });
      const nextErrors = { ...state.errors };
      const error = validateProfileField(field, sanitized);
      if (error) {
        nextErrors[field] = error;
      } else {
        delete nextErrors[field];
      }

      return {
        ...state,
        draft,
        errors: nextErrors,
        isDirty: true,
      };
    }
    case 'save_start':
      return {
        ...state,
        isSaving: true,
        lastError: null,
        previousSnapshot: safeCopyObject(state.snapshot),
        // Используем safeCopyObject для безопасного копирования объекта,
        // чтобы избежать проблем с свойствами только для чтения (например, focus)
        snapshot: safeCopyObject(action.payload),
      };
    case 'save_success':
      return {
        ...state,
        isSaving: false,
        isDirty: false,
        lastSavedAt: action.timestamp,
        lastError: null,
        previousSnapshot: { ...state.snapshot },
      };
    case 'save_failure':
      return {
        ...state,
        isSaving: false,
        snapshot: state.previousSnapshot,
        lastError: action.error,
        isDirty: true,
      };
    case 'toggle_modal':
      return {
        ...state,
        modalVisible: action.payload,
      };
    default:
      return state;
  }
};

const useProfileStore = ({ initialProfile, saveProfileRequest }) => {
  const [state, dispatch] = useReducer(
    profileReducer,
    initialProfile,
    createProfileState
  );

  const prevInitialProfileRef = useRef(null);

  useEffect(() => {
    // Сравниваем предыдущее и текущее значение через JSON.stringify
    // чтобы избежать бесконечных обновлений при изменении ссылки объекта
    const prevProfileStr = prevInitialProfileRef.current
      ? JSON.stringify(prevInitialProfileRef.current)
      : null;
    const currentProfileStr = initialProfile
      ? JSON.stringify(initialProfile)
      : null;

    // Вызываем dispatch только если данные действительно изменились
    if (prevProfileStr !== currentProfileStr) {
      prevInitialProfileRef.current = initialProfile;
      dispatch({ type: 'hydrate_base', payload: initialProfile });
    }
  }, [initialProfile]);

  useEffect(() => {
    let isMounted = true;
    const restoreDraft = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_DRAFT_KEY);
        if (stored && isMounted) {
          dispatch({
            type: 'hydrate_draft',
            payload: JSON.parse(stored),
          });
        }
      } catch (error) {
        console.warn('Не удалось восстановить черновик профиля', error);
      }
    };

    restoreDraft();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isHydrated) {
      return;
    }

    const timeoutId = setTimeout(() => {
      AsyncStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(state.draft)).catch(
        (error) => console.warn('Не удалось сохранить черновик профиля', error)
      );
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [state.draft, state.isHydrated]);

  const setField = useCallback((field, value) => {
    dispatch({ type: 'update_field', payload: { field, value } });
  }, []);

  const openEditor = useCallback(() => {
    dispatch({ type: 'toggle_modal', payload: true });
  }, []);

  const closeEditor = useCallback(() => {
    dispatch({ type: 'toggle_modal', payload: false });
  }, []);

  const saveProfile = useCallback(async () => {
    if (
      state.isSaving ||
      !state.isDirty ||
      Object.keys(state.errors).length > 0 ||
      !state.isHydrated
    ) {
      return;
    }

    // Используем safeCopyObject для безопасного копирования объекта,
    // чтобы избежать проблем с свойствами только для чтения (например, focus)
    const payload = safeCopyObject(state.draft);
    dispatch({ type: 'save_start', payload });

    try {
      await saveProfileRequest(payload);
      dispatch({ type: 'save_success', timestamp: Date.now() });
      await AsyncStorage.removeItem(PROFILE_DRAFT_KEY);
    } catch (error) {
      dispatch({
        type: 'save_failure',
        error: error?.message || 'Не удалось сохранить профиль',
      });
    }
  }, [
    saveProfileRequest,
    state.draft,
    state.errors,
    state.isDirty,
    state.isHydrated,
    state.isSaving,
  ]);

  const isValid = useMemo(
    () => Object.keys(state.errors).length === 0,
    [state.errors]
  );

  return {
    draft: state.draft,
    errors: state.errors,
    isDirty: state.isDirty,
    isSaving: state.isSaving,
    isValid,
    modalVisible: state.modalVisible,
    openEditor,
    closeEditor,
    setField,
    saveProfile,
    lastError: state.lastError,
    lastSavedAt: state.lastSavedAt,
    published: state.snapshot,
  };
};

// const googleProfileEndpoint = 'https://www.googleapis.com/oauth2/v3/userinfo';

// const fetchGoogleProfile = async (token) => {
//   try {
//     const response = await fetch(googleProfileEndpoint, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     if (!response.ok) {
//       throw new Error('profile_request_failed');
//     }

//     return response.json();
//   } catch (error) {
//     console.warn(
//       'Не удалось получить профиль Google',
//       error?.message || error
//     );
//     throw error;
//   }
// };

// const resolveGoogleAuthConfig = () => {
//   const extra =
//     Constants?.expoConfig?.extra?.googleAuth ??
//     Constants?.manifest2?.extra?.googleAuth ??
//     {};

//   return {
//     expoClientId: extra.expoClientId ?? 'GOOGLE_EXPO_CLIENT_ID',
//     iosClientId: extra.iosClientId ?? extra.clientId ?? 'GOOGLE_IOS_CLIENT_ID',
//     androidClientId: extra.androidClientId ?? 'GOOGLE_ANDROID_CLIENT_ID',
//     webClientId: extra.webClientId ?? extra.clientId ?? 'GOOGLE_WEB_CLIENT_ID',
//   };
// };

// const googleAuthConfig = resolveGoogleAuthConfig();

const requestWithTimeout = (promise, timeout) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeout);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

const postJson = async (url, payload, timeout = API_TIMEOUT_MS) => {
  let response;
  let responseData = {};
  try {
    // Для веб-версии добавляем режим CORS явно
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };

    // В веб-браузере добавляем режим CORS
    if (Platform.OS === 'web') {
      fetchOptions.mode = 'cors';
      fetchOptions.credentials = 'omit';
    }

    response = await requestWithTimeout(
      fetch(url, fetchOptions),
      timeout
    );

    if (!response) {
      throw new NetworkError('Не удалось получить ответ от сервера');
    }

    // Пытаемся извлечь данные из ответа (даже если это ошибка)
    try {
      responseData = await response.json();
    } catch (e) {
      // Если не удалось распарсить JSON, оставляем пустой объект
      responseData = {};
    }

    if (!response.ok) {
      // Используем сообщение из ответа API, если оно есть
      const errorMessage = responseData?.message ||
        responseData?.error ||
        `Ошибка запроса: ${response.status}`;

      // Создаем ошибку с сообщением из API
      const apiError = new Error(errorMessage);
      apiError.responseData = responseData;

      // Обрабатываем ошибки API с помощью errorHandler
      const error = handleApiError(apiError, response);

      // Если в ответе есть более конкретное сообщение, используем его
      if (responseData?.message && error instanceof ApiError) {
        error.message = responseData.message;
      }

      throw error;
    }

    return responseData;
  } catch (error) {
    // Если это уже обработанная ошибка, пробрасываем её дальше
    if (error instanceof NetworkError ||
      error instanceof TimeoutError ||
      error instanceof ApiError ||
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof CorsError) {
      throw error;
    }

    // Обрабатываем другие ошибки
    const processedError = handleApiError(error, response);

    // Если есть данные из ответа, добавляем их к ошибке
    if (responseData?.message && processedError instanceof ApiError) {
      processedError.message = responseData.message;
    }

    throw processedError;
  }
};

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const initialAuthFormState = {
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  workerSkill: '',
  workerAvailability: '',
  employerCompany: '',
  employerContact: '',
};

const authBenefits = [
  {
    icon: 'flash',
    title: 'Мгновенные отклики',
    subtitle: 'Сообщаем о горячих подработках за минуту',
  },
  {
    icon: 'shield-checkmark',
    title: 'Проверенные заказчики',
    subtitle: 'Публикуем только подтверждённые смены',
  },
  {
    icon: 'wallet',
    title: 'Контроль выплат',
    subtitle: 'Напоминания о расчётах и долговых обязательствах',
  },
];

const jobFilterTags = [
  'Сегодня',
  'На завтра',
  'С жильём',
  'По оплате',
  'Удалённо',
];

const workerFilters = [
  'Все',
  'Маляр',
  'Сварщик',
  'Разнорабочий',
  'Грузчик',
];

const jobCollections = [
  {
    title: 'Малярные работы',
    count: 8,
    shift: 'Старт сегодня',
    rate: 'от 600 000 сум',
  },
  {
    title: 'Сборка и монтаж',
    count: 5,
    shift: 'Смена 12 часов',
    rate: 'от 9 000 сум/час',
  },
  {
    title: 'Грузчики и логистика',
    count: 11,
    shift: 'Ночные смены',
    rate: 'от 70 000 сум/смена',
  },
];

const chatThreads = [
  {
    name: 'СтройГрад',
    snippet: 'Готовы подтвердить выход на 19:00?',
    time: '09:12',
    unread: 2,
    status: 'Новая заявка',
  },
  {
    name: 'LogiFast HR',
    snippet: 'Не забудьте пропуск, охрана строгая.',
    time: 'Вчера',
    unread: 0,
    status: 'Смены каждую неделю',
  },
  {
    name: 'Частный заказчик',
    snippet: 'Спасибо за покраску фасада!',
    time: 'Пн',
    unread: 0,
    status: 'Отзыв получен',
  },
];

const settingsSchema = [
  {
    key: 'notifications',
    label: 'Уведомления о сменах',
    subtitle: 'Заявки, подтверждения и напоминания',
  },
  {
    key: 'autoApply',
    label: 'Автоотклики',
    subtitle: 'Откликаться на подходящие вакансии',
  },
  {
    key: 'nightMode',
    label: 'Ночные напоминания',
    subtitle: 'Сообщать только о срочных задачах',
  },
];

const authRoles = [
  { key: 'worker', label: 'Работник', icon: 'person' },
  { key: 'employer', label: 'Работодатель', icon: 'briefcase' },
];

const timelineMilestones = [
  { title: 'Последняя смена', meta: '3 дня назад · склад', status: 'done' },
  { title: 'Предстоящая смена', meta: 'Завтра · покраска', status: 'upcoming' },
  { title: 'Медосмотр', meta: 'Напоминание через 10 дней', status: 'alert' },
];

const closedShifts = [
  {
    title: 'Отделка подъезда',
    date: '14 ноября',
    payout: '850 000 сум',
    location: 'Ташкент, Чиланзар',
    rating: 5,
    feedback:
      'Работник доволен предоставленными условиями и отмечает, что заказчик обеспечил все материалы.',
  },
  {
    title: 'Погрузка на складе',
    date: '11 ноября',
    payout: '65 000 сум/смена',
    location: 'Ташкент, Сергили',
    rating: 4,
    feedback:
      'Исполнитель сообщил, что смена прошла комфортно, условия на складе соответствовали договорённостям.',
  },
  {
    title: 'Покраска фасада',
    date: '8 ноября',
    payout: '2 100 000 сум',
    location: 'Чирчик',
    rating: 5,
    feedback:
      'Работник отметил поддержку заказчика и доволен предоставленным жильём и питанием.',
  },
];

const reviewsList = [
  {
    employer: 'СтройГрад',
    shift: 'Полная отделка подъезда',
    rating: 5,
    text: 'Работник отметил, что компания держала слово, выплатила аванс вовремя и предоставила комфортные бытовые условия.',
    date: '14 ноября',
  },
  {
    employer: 'LogiFast',
    shift: 'Погрузка на складе',
    rating: 4,
    text: 'Исполнитель доволен отношением бригадира и оплатой, но советует улучшить связь между сменами.',
    date: '11 ноября',
  },
  {
    employer: 'Частный заказчик',
    shift: 'Покраска фасада дачи',
    rating: 5,
    text: 'Работник благодарен за помощь с инструментом и жильём, отмечает дружелюбную атмосферу на объекте.',
    date: '8 ноября',
  },
];

const bottomNav = [
  { key: 'profile', icon: 'person-circle', label: 'Профиль' },
  { key: 'history', icon: 'time', label: 'Смены' },
  { key: 'reviews', icon: 'star', label: 'Отзывы' },
  { key: 'jobs', icon: 'briefcase', label: 'Вакансии' },
  { key: 'chats', icon: 'chatbubble-ellipses', label: 'Чаты' },
  { key: 'settings', icon: 'settings', label: 'Настройки' },
];

const employerBottomNav = [
  { key: 'workers', icon: 'people', label: 'Работники' },
  { key: 'history', icon: 'time', label: 'Смены' },
  { key: 'reviews', icon: 'star', label: 'Отзывы' },
  { key: 'chats', icon: 'chatbubble-ellipses', label: 'Чаты' },
  { key: 'settings', icon: 'settings', label: 'Настройки' },
];

const fabConfig = {
  profile: { label: 'Срочная смена', icon: 'flash' },
  history: { label: 'Поделиться отзывом', icon: 'star' },
  reviews: { label: 'Запросить отзыв', icon: 'sparkles' },
  workers: { label: 'Пригласить работника', icon: 'mail' },
  jobs: { label: 'Создать вакансию', icon: 'add-circle' },
  chats: { label: 'Новое сообщение', icon: 'chatbubble' },
  settings: { label: 'Связаться с поддержкой', icon: 'call' },
};

const workersPool = [
  {
    name: 'Алишер Юсупов',
    role: 'Маляр',
    rating: 4.9,
    experience: '6 лет',
    rate: '700 000 сум/день',
    availability: 'Готов завтра, ночные смены',
    badges: ['Свой инструмент', 'Есть авто'],
    skills: ['Покраска фасадов', 'Декоративная штукатурка'],
  },
  {
    name: 'Мурат Камолов',
    role: 'Сварщик',
    rating: 4.7,
    experience: '8 лет',
    rate: '90 000 сум/час',
    availability: 'Свободен по вечерам',
    badges: ['Разрешение на работы', 'Работа на высоте'],
    skills: ['Сварка труб', 'Сборка каркасов'],
  },
  {
    name: 'Ильяс Рахмонов',
    role: 'Разнорабочий',
    rating: 4.8,
    experience: '5 лет',
    rate: '550 000 сум/смена',
    availability: 'В течение 3 часов',
    badges: ['Паспорт', 'Медкнижка'],
    skills: ['Погрузка', 'Демонтаж', 'Опалубка'],
  },
];

export default function App() {
  const [skillMatrix, setSkillMatrix] = useState(() => cloneSkillCategories());
  const [weekAvailability, setWeekAvailability] = useState(() => createWeekMatrix());
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [vacationWindow, setVacationWindow] = useState({
    active: false,
    from: '25 ноя',
    to: '02 дек',
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [isEmployer, setIsEmployer] = useState(false);
  const [settingsState, setSettingsState] = useState({
    notifications: true,
    autoApply: false,
    nightMode: false,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authRole, setAuthRole] = useState('worker');
  const [authForm, setAuthForm] = useState(() => ({ ...initialAuthFormState }));
  const [authMode, setAuthMode] = useState('login');
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [verificationCodes, setVerificationCodes] = useState({
    email: '',
    phone: '',
  });
  const [verificationInputs, setVerificationInputs] = useState({
    email: '',
    phone: '',
  });
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false,
  });
  const [isSendingVerification, setIsSendingVerification] = useState({
    email: false,
    phone: false,
  });
  const [token, setToken] = useState(null);
  // const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  // Состояние для вакансий
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobFilters, setJobFilters] = useState({
    location: '',
    skill: '',
    minSalary: '',
    maxSalary: '',
    availability: '',
  });
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobApplicationModalVisible, setJobApplicationModalVisible] = useState(false);
  const [applicationsView, setApplicationsView] = useState(false); // true - просмотр откликов, false - список вакансий
  const [applicationMessage, setApplicationMessage] = useState('');
  // Состояние для чатов
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  // Состояние для документов
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [documentViewModalVisible, setDocumentViewModalVisible] = useState(false);
  // Состояние для отзывов
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    userId: '',
    jobId: '',
    rating: 5,
    comment: '',
  });
  const { email, phone, password, confirmPassword, workerSkill, employerCompany } =
    authForm;
  // const [googleRequest, googleResponse, promptGoogleAuth] = useGoogleAuthRequest(
  //   googleAuthConfig
  // );

  const queryClientInstance = useQueryClient();

  // Использование новых хуков для работы с профилем
  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useProfileQuery(
    token,
    { enabled: isAuthenticated && !!token }
  );

  const updateProfileMutation = useUpdateProfile(token);

  // Хук для статусов документов
  const { data: documentStatuses } = useDocumentStatusesQuery(
    token,
    { enabled: isAuthenticated && !!token }
  );

  // Хуки для работы с документами
  const {
    data: documentsData,
    isLoading: isDocumentsLoading,
    error: documentsError,
    refetch: refetchDocuments
  } = useDocumentsQuery(
    token,
    { enabled: isAuthenticated && !!token }
  );

  const uploadDocumentMutation = useUploadDocument(token);
  const uploadDocumentPhotoMutation = useUploadDocumentPhoto(token);
  const deleteDocumentMutation = useDeleteDocument(token);

  const { data: selectedDocument } = useDocumentQuery(
    selectedDocumentId,
    token,
    { enabled: !!selectedDocumentId && documentViewModalVisible }
  );

  // Хуки для работы с вакансиями
  const jobsParams = useMemo(() => ({
    search: jobSearchQuery || undefined,
    location: jobFilters.location || undefined,
    skill: jobFilters.skill || undefined,
    minSalary: jobFilters.minSalary || undefined,
    maxSalary: jobFilters.maxSalary || undefined,
    availability: jobFilters.availability || undefined,
    page: 1,
    limit: 50,
  }), [jobSearchQuery, jobFilters]);

  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError,
    refetch: refetchJobs
  } = useJobsQuery(
    jobsParams,
    token,
    { enabled: isAuthenticated && !!token && !applicationsView }
  );

  const {
    data: jobDetails,
    isLoading: isJobDetailsLoading
  } = useJobQuery(
    selectedJobId,
    token,
    { enabled: isAuthenticated && !!token && !!selectedJobId }
  );

  const applyToJobMutation = useApplyToJob(token);

  const {
    data: applicationsData,
    isLoading: isApplicationsLoading,
    error: applicationsError
  } = useApplicationsQuery(
    { page: 1, limit: 50 },
    token,
    { enabled: isAuthenticated && !!token && applicationsView }
  );

  // Хуки для работы с чатами
  const {
    data: chatsData,
    isLoading: isChatsLoading,
    error: chatsError,
    refetch: refetchChats
  } = useChatsQuery(
    { page: 1, limit: 50 },
    token,
    { enabled: isAuthenticated && !!token && activeTab === 'chats' }
  );

  const messagesParams = useMemo(() => ({ limit: 100 }), []);

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    error: messagesError,
    refetch: refetchMessages
  } = useMessagesSimpleQuery(
    selectedChatId,
    messagesParams,
    token,
    {
      enabled: isAuthenticated && !!token && !!selectedChatId && chatModalVisible,
      refetchInterval: 5 * 1000 // Обновление каждые 5 секунд
    }
  );

  const sendMessageMutation = useSendMessage(selectedChatId, token, messagesParams);
  const markAsReadMutation = useMarkMessagesAsRead(selectedChatId, token);

  // Мемоизация обработки и сортировки сообщений
  const sortedMessages = useMemo(() => {
    if (!messagesData) return [];
    const messages = Array.isArray(messagesData)
      ? messagesData
      : messagesData?.messages
        ? messagesData.messages
        : messagesData?.data
          ? messagesData.data
          : [];
    return [...messages].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });
  }, [messagesData]);

  // Хук для работы с уведомлениями
  const {
    isInitialized: notificationsInitialized,
    permissions: notificationPermissions,
    settings: notificationSettings,
    updateSetting: updateNotificationSetting,
    requestPermissions,
    notifyNewJob,
    notifyNewMessage,
    notifyShiftUpdate,
  } = useNotifications(isAuthenticated);

  // Хуки для работы со сменами
  // Вычисляем даты для текущей недели
  const getWeekDates = useCallback(() => {
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
    return { startDate: weekDates[0], endDate: weekDates[6] };
  }, []);

  const weekDates = useMemo(() => getWeekDates(), [getWeekDates]);

  const shiftsParams = useMemo(() => ({
    startDate: weekDates.startDate,
    endDate: weekDates.endDate,
    page: 1,
    limit: 100,
  }), [weekDates]);

  const {
    data: shiftsData,
    isLoading: isShiftsLoading,
    error: shiftsError,
    refetch: refetchShifts
  } = useShiftsQuery(
    shiftsParams,
    token,
    {
      enabled: isAuthenticated && !!token && activeTab === 'profile',
      refetchInterval: 30 * 1000, // Обновление каждые 30 секунд
      staleTime: 30 * 1000,
    }
  );

  const acceptShiftMutation = useAcceptShift(token);
  const rejectShiftMutation = useRejectShift(token);

  // Хуки для работы с отзывами
  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    error: reviewsError,
    refetch: refetchReviews
  } = useReviewsQuery(
    { page: 1, limit: 50 },
    token,
    { enabled: isAuthenticated && !!token && activeTab === 'reviews' }
  );

  const createReviewMutation = useCreateReview(token);

  // Функция для преобразования смен в формат календаря
  const transformShiftsToCalendar = useCallback((shifts = []) => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    const calendarDays = [];
    const weekDaysLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Найти смены на этот день
      const dayShifts = shifts.filter(shift => {
        try {
          const shiftDate = new Date(shift.date || shift.startDate);
          if (isNaN(shiftDate.getTime())) return false;
          return shiftDate.toISOString().split('T')[0] === dateStr;
        } catch (e) {
          return false;
        }
      });

      let status = 'open';
      let title = 'Свободен';
      let hours = 'Можно взять смену';

      if (dayShifts.length > 0) {
        const acceptedShift = dayShifts.find(s => s.status === 'accepted' || s.status === 'confirmed');
        const availableShift = dayShifts.find(s => s.status === 'available' || s.status === 'pending');

        if (acceptedShift) {
          status = 'booked';
          title = acceptedShift.title || acceptedShift.jobTitle || 'Смена';
          const startTime = acceptedShift.startTime || '08:00';
          const endTime = acceptedShift.endTime || '17:00';
          hours = `${startTime} — ${endTime}`;
        } else if (availableShift) {
          status = 'open';
          title = availableShift.title || availableShift.jobTitle || 'Доступная смена';
          const startTime = availableShift.startTime || '08:00';
          const endTime = availableShift.endTime || '17:00';
          hours = `${startTime} — ${endTime}`;
        }
      }

      const dayLabel = weekDaysLabels[i];
      const dateLabel = `${date.getDate()} ${monthNames[date.getMonth()]}`;

      calendarDays.push({
        key: `day_${i}`,
        dayLabel,
        dateLabel,
        status,
        title,
        hours,
        date: dateStr,
        shifts: dayShifts,
      });
    }

    return calendarDays;
  }, []);

  // Вычисляем календарь смен из данных API
  const calendarDays = useMemo(() => {
    if (shiftsData) {
      // Обрабатываем случай, когда данные могут быть массивом или объектом с полем shifts
      const shifts = Array.isArray(shiftsData) ? shiftsData : (shiftsData.shifts || []);
      return transformShiftsToCalendar(shifts);
    }
    // Fallback на статические данные, если API не вернул данные
    return shiftCalendarDays;
  }, [shiftsData, transformShiftsToCalendar]);

  // Обработчики для принятия/отклонения смен
  const handleAcceptShift = useCallback(async (shiftId) => {
    try {
      await acceptShiftMutation.mutateAsync({
        shiftId,
        acceptData: {},
      });
      Alert.alert('Успешно', 'Смена принята');
      refetchShifts();
    } catch (error) {
      Alert.alert('Ошибка', getErrorMessage(error) || 'Не удалось принять смену');
    }
  }, [acceptShiftMutation, refetchShifts]);

  const handleRejectShift = useCallback(async (shiftId) => {
    try {
      await rejectShiftMutation.mutateAsync({
        shiftId,
        rejectData: {},
      });
      Alert.alert('Успешно', 'Смена отклонена');
      refetchShifts();
    } catch (error) {
      Alert.alert('Ошибка', getErrorMessage(error) || 'Не удалось отклонить смену');
    }
  }, [rejectShiftMutation, refetchShifts]);

  // Функции для работы с аутентификацией (объявлены здесь для использования в useEffect ниже)
  const resetVerificationState = useCallback(() => {
    setVerificationInputs({ email: '', phone: '' });
    setVerificationCodes({ email: '', phone: '' });
    setVerificationStatus({ email: false, phone: false });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await clearAuthToken();
    } catch (error) {
      console.warn('Не удалось удалить токен', error);
    } finally {
      setIsAuthenticated(false);
      setToken(null);
      setIsEmployer(false);
      setAuthRole('worker');
      setActiveTab('profile');
      setAuthMode('login');
      setAuthForm(() => ({ ...initialAuthFormState }));
      resetVerificationState();
    }
  }, [resetVerificationState]);

  // Обработка истечения токена
  const handleTokenExpired = useCallback(async () => {
    Alert.alert(
      'Сессия истекла',
      'Ваша сессия истекла. Пожалуйста, войдите заново.',
      [
        {
          text: 'OK',
          onPress: () => handleLogout(),
        },
      ]
    );
  }, [handleLogout]);

  // Инициализация сервисов
  const syncServiceRef = useRef(null);
  const wsServiceRef = useRef(null);
  const selectedChatIdRef = useRef(selectedChatId);
  const profileDataRef = useRef(profileData);
  const chatScrollViewRef = useRef(null);

  // Обновляем refs при изменении значений
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    profileDataRef.current = profileData;
  }, [profileData]);

  // Настройка обработчика истечения токена
  useEffect(() => {
    setTokenExpiredHandler(handleTokenExpired);
    setJobsTokenExpiredHandler(handleTokenExpired);
    setShiftsTokenExpiredHandler(handleTokenExpired);
    setDocumentsTokenExpiredHandler(handleTokenExpired);
    setReviewsTokenExpiredHandler(handleTokenExpired);
    return () => {
      setTokenExpiredHandler(null);
      setJobsTokenExpiredHandler(null);
      setShiftsTokenExpiredHandler(null);
      setDocumentsTokenExpiredHandler(null);
      setReviewsTokenExpiredHandler(null);
    };
  }, [handleTokenExpired]);

  // Инициализация миграций кеша и сервисов
  useEffect(() => {
    const initServices = async () => {
      // Выполнить миграции кеша
      await migrateCache();

      // Инициализировать сервис синхронизации
      if (isAuthenticated && token) {
        syncServiceRef.current = initSyncService({
          queryClient: queryClientInstance,
          token,
          onSyncStart: () => {
            console.log('Синхронизация начата');
          },
          onSyncComplete: () => {
            console.log('Синхронизация завершена');
          },
          onSyncError: (error) => {
            console.error('Ошибка синхронизации', error);
          },
        });
        syncServiceRef.current.start();

        // Инициализировать WebSocket сервис
        wsServiceRef.current = initWebSocketService(WS_URL, token);
        wsServiceRef.current.connect();

        // Подписаться на обновления статусов документов через WebSocket
        wsServiceRef.current.onDocumentStatusUpdate((update) => {
          // Обновить кеш react-query
          queryClientInstance.setQueryData(['documentStatuses', token], (old) => ({
            ...old,
            [update.documentId]: update,
          }));
        });

        // Подписаться на новые сообщения чата через WebSocket
        const unsubscribeChatMessages = wsServiceRef.current.onChatMessage((message) => {
          // Получить текущий выбранный чат из ref (всегда актуальное значение)
          const currentSelectedChatId = selectedChatIdRef.current;
          const currentProfileData = profileDataRef.current;

          // Обновить кеш сообщений для любого чата, откуда пришло сообщение
          if (message.chatId) {
            const chatId = message.chatId;
            const messagesQueryKey = ['messages', chatId, { limit: 100 }, token];

            queryClientInstance.setQueryData(messagesQueryKey, (old) => {
              let updated;
              if (Array.isArray(old)) {
                // Проверяем, нет ли уже такого сообщения
                const exists = old.some(m => m.id === message.id || (m.tempId && m.tempId === message.tempId));
                if (!exists) {
                  updated = [...old, message];
                } else {
                  updated = old;
                }
              } else if (old?.messages && Array.isArray(old.messages)) {
                const exists = old.messages.some(m => m.id === message.id || (m.tempId && m.tempId === message.tempId));
                if (!exists) {
                  updated = { ...old, messages: [...old.messages, message] };
                } else {
                  updated = old;
                }
              } else {
                updated = [message];
              }

              // Сохраняем обновленную историю в AsyncStorage
              const messagesToCache = Array.isArray(updated) ? updated : (updated?.messages || []);
              cacheChatMessages(chatId, messagesToCache).catch(err => {
                console.warn('Не удалось сохранить новое сообщение в кеш', err);
              });

              return updated;
            });

            // Пометить сообщение как прочитанное, если оно не от текущего пользователя
            if (message.senderId && currentProfileData?.id && message.senderId !== currentProfileData.id && chatId === currentSelectedChatId) {
              // Используем прямой вызов API для пометки сообщения как прочитанного
              markMessagesAsRead(chatId, [message.id], token).catch(err => {
                console.warn('Не удалось пометить сообщение как прочитанное', err);
              });
            }
          }

          // Инвалидировать список чатов для обновления последнего сообщения
          queryClientInstance.invalidateQueries({ queryKey: ['chats'] });

          // Показать push-уведомление о новом сообщении, если чат не открыт
          if (message.chatId !== currentSelectedChatId && message.senderId !== currentProfileData?.id) {
            // Получить информацию о чате для уведомления из кеша react-query
            const chatsQueryData = queryClientInstance.getQueryData(['chats', { page: 1, limit: 50 }, token]);
            let chatInfo = null;

            if (chatsQueryData) {
              const chats = Array.isArray(chatsQueryData)
                ? chatsQueryData
                : chatsQueryData?.chats || chatsQueryData?.data || [];
              chatInfo = Array.isArray(chats)
                ? chats.find(c => (c.id || c._id) === message.chatId)
                : null;
            }

            const senderName = chatInfo?.employerName || chatInfo?.workerName || chatInfo?.name ||
              message.senderName || message.sender?.name || 'Новое сообщение';

            notifyNewMessage(message, {
              chatId: message.chatId,
              senderName,
            });
          }
        });

        // Подписаться на новые вакансии через WebSocket
        const unsubscribeNewJobs = wsServiceRef.current.onNewJob((job) => {
          // Инвалидировать список вакансий
          queryClientInstance.invalidateQueries({ queryKey: ['jobs'] });

          // Показать push-уведомление о новой вакансии
          notifyNewJob(job);
        });

        // Сохранить функции отписки для очистки
        wsServiceRef.current._unsubscribeChatMessages = unsubscribeChatMessages;
        wsServiceRef.current._unsubscribeNewJobs = unsubscribeNewJobs;
      }
    };

    initServices();

    return () => {
      // Очистка при размонтировании
      if (syncServiceRef.current) {
        syncServiceRef.current.stop();
      }
      if (wsServiceRef.current) {
        // Отписаться от сообщений чата
        if (wsServiceRef.current._unsubscribeChatMessages) {
          wsServiceRef.current._unsubscribeChatMessages();
          wsServiceRef.current._unsubscribeChatMessages = null;
        }
        // Отписаться от новых вакансий
        if (wsServiceRef.current._unsubscribeNewJobs) {
          wsServiceRef.current._unsubscribeNewJobs();
          wsServiceRef.current._unsubscribeNewJobs = null;
        }
        wsServiceRef.current.disconnect();
      }
    };
  }, [isAuthenticated, token, queryClientInstance]);

  // Обновить токены в сервисах при изменении токена
  useEffect(() => {
    if (syncServiceRef.current && token) {
      syncServiceRef.current.updateToken(token);
    }
    if (wsServiceRef.current && token) {
      wsServiceRef.current.updateToken(token);
    }
  }, [token]);

  // Сохранить старую логику для обратной совместимости
  const sendProfileUpdate = useCallback(
    (profilePayload) => {
      return updateProfileMutation.mutateAsync(profilePayload);
    },
    [updateProfileMutation]
  );

  // Использовать данные из react-query или fallback на defaultProfileForm
  // Используем useMemo, чтобы избежать создания нового объекта при каждом рендере
  const currentProfile = useMemo(
    () => profileData || defaultProfileForm,
    [profileData]
  );

  const profileStore = useProfileStore({
    initialProfile: currentProfile,
    saveProfileRequest: sendProfileUpdate,
  });

  // Валидация email
  const validateEmail = useCallback((emailValue) => {
    if (!emailValue || !emailValue.trim()) {
      return 'Электронная почта обязательна.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
      return 'Введите корректный email адрес.';
    }
    return null;
  }, []);

  // Валидация телефона
  const validatePhone = useCallback((phoneValue) => {
    if (!phoneValue || !phoneValue.trim()) {
      return 'Номер телефона обязателен.';
    }
    const phoneRegex = /^\+7\d{10}$/;
    if (!phoneRegex.test(phoneValue.trim())) {
      return 'Введите телефон в формате +79824167606';
    }
    return null;
  }, []);

  // Валидация пароля
  const validatePassword = useCallback((passwordValue, isRegister = false) => {
    if (!passwordValue) {
      return 'Пароль обязателен.';
    }
    if (isRegister) {
      if (passwordValue.length < 8) {
        return 'Пароль должен содержать минимум 8 символов.';
      }
      if (!/(?=.*[a-zа-я])/i.test(passwordValue)) {
        return 'Пароль должен содержать хотя бы одну букву.';
      }
      if (!/(?=.*\d)/.test(passwordValue)) {
        return 'Пароль должен содержать хотя бы одну цифру.';
      }
    }
    return null;
  }, []);

  const sendVerificationPayload = useCallback(
    async (target, contact) => {
      if (!contact) {
        throw new Error('Контакт не указан');
      }

      // Валидация контакта перед отправкой
      if (target === 'email') {
        const emailError = validateEmail(contact);
        if (emailError) {
          throw new Error(emailError);
        }
      } else if (target === 'phone') {
        const phoneError = validatePhone(contact);
        if (phoneError) {
          throw new Error(phoneError);
        }
      }

      return postJson(API_ENDPOINTS.verify, {
        target,
        contact,
        role: authRole,
      });
    },
    [authRole, validateEmail, validatePhone]
  );

  const submitAuthPayload = useCallback(
    (payload) =>
      postJson(API_ENDPOINTS.auth, {
        ...payload,
        role: payload.role ?? authRole,
      }),
    [authRole]
  );

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Получаем валидный токен (автоматически обновляется при необходимости)
        const storedToken = await getValidToken();
        const storedRole = await getAuthRole();

        // Временно отключено автоматическое восстановление сессии
        // Раскомментируйте код ниже, чтобы включить автоматический вход
        /*
        if (storedToken) {
          const resolvedRole = storedRole || 'worker';
          setToken(storedToken);
          setAuthRole(resolvedRole);
          setIsEmployer(resolvedRole === 'employer');
          setActiveTab(resolvedRole === 'employer' ? 'workers' : 'profile');
          setIsAuthenticated(true);
        }
        */
      } catch (error) {
        console.warn('Не удалось восстановить сессию', error);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const allowedTabs = (isEmployer ? employerBottomNav : bottomNav).map(
      (item) => item.key
    );

    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [activeTab, isEmployer]);

  useEffect(() => {
    if (authMode !== 'register') {
      resetVerificationState();
    }

    if (authMode === 'recover') {
      setAuthForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    }
  }, [authMode, resetVerificationState]);

  const completeAuth = useCallback(
    async ({ role, token: providedToken, refreshToken, persist = true } = {}) => {
      if (!providedToken) {
        throw new Error('Токен авторизации обязателен');
      }

      const resolvedRole = role ?? authRole;
      const employerRole = resolvedRole === 'employer';

      // Обновляем состояние синхронно - React автоматически батчит обновления
      console.log('[completeAuth] Обновление состояния аутентификации');
      setIsAuthenticated(true);
      setIsEmployer(employerRole);
      setActiveTab(employerRole ? 'workers' : 'profile');
      setAuthRole(resolvedRole);
      setToken(providedToken);
      console.log('[completeAuth] Состояние обновлено, isAuthenticated установлен в true');

      // Сохраняем токены асинхронно, не блокируя обновление UI
      if (persist) {
        // Сохраняем токены в фоне, не ждем завершения
        saveAuthToken(providedToken, refreshToken || undefined, resolvedRole).catch((error) => {
          console.warn('Не удалось сохранить сессию', error);
          // Не прерываем процесс авторизации, если не удалось сохранить токен
          // Пользователь всё равно будет авторизован в текущей сессии
        });
      }
    },
    [authRole]
  );

  const handleFormChange = (field, value) => {
    // Автоформатирование номера телефона
    if (field === 'phone') {
      const formatted = formatRussianPhone(value);
      setAuthForm((prev) => ({ ...prev, [field]: formatted }));
    } else {
      setAuthForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSendVerification = useCallback(
    async (target) => {
      const contact = (target === 'email' ? email : phone).trim();

      if (!contact) {
        Alert.alert(
          'Проверьте данные',
          `Укажите ${target === 'email' ? 'электронную почту' : 'номер телефона'
          }, чтобы получить код.`
        );
        return;
      }

      setIsSendingVerification((prev) => ({ ...prev, [target]: true }));

      try {
        const result = await sendVerificationPayload(target, contact);

        if (!result) {
          Alert.alert(
            'Ошибка отправки',
            `Не удалось отправить код на ${target === 'email' ? 'email' : 'телефон'}. Проверьте подключение к интернету и попробуйте снова.`
          );
          return;
        }

        // Код должен приходить с сервера, но для обратной совместимости
        // генерируем его на клиенте, если сервер не вернул код
        const code = result?.code || generateVerificationCode();
        setVerificationCodes((prev) => ({ ...prev, [target]: code }));
        setVerificationStatus((prev) => ({ ...prev, [target]: false }));

        // Логируем код в консоль для отладки
        console.log(`Код подтверждения для ${target === 'email' ? 'email' : 'телефона'}: ${code}`);

        Alert.alert(
          'Код отправлен',
          result?.code
            ? `Код подтверждения отправлен на ${target === 'email' ? 'email' : 'телефон'}. Проверьте сообщения.`
            : `Используйте код ${code} для подтверждения ${target === 'email' ? 'email' : 'телефона'}.`
        );
      } catch (error) {
        console.warn('Ошибка отправки кода подтверждения:', error);

        // Если это ошибка сети, генерируем код на клиенте для разработки
        if (error instanceof NetworkError || isNetworkError(error)) {
          console.log('⚠️ Сервер недоступен, генерируем код на клиенте для разработки');
          const code = generateVerificationCode();
          setVerificationCodes((prev) => ({ ...prev, [target]: code }));
          setVerificationStatus((prev) => ({ ...prev, [target]: false }));

          // Логируем код в консоль для отладки
          console.log(`Код подтверждения для ${target === 'email' ? 'email' : 'телефона'}: ${code}`);

          Alert.alert(
            'Код отправлен (офлайн режим)',
            `Используйте код ${code} для подтверждения ${target === 'email' ? 'email' : 'телефона'}. Сервер недоступен, код сгенерирован локально.`
          );
          return;
        }

        // Для других ошибок показываем стандартное сообщение
        const errorMessage = getErrorMessage(error);
        Alert.alert(
          'Ошибка отправки',
          errorMessage || `Не удалось отправить код на ${target === 'email' ? 'email' : 'телефон'}. Попробуйте снова.`
        );
      } finally {
        setIsSendingVerification((prev) => ({ ...prev, [target]: false }));
      }
    },
    [email, phone, sendVerificationPayload]
  );

  const handleVerifyCode = useCallback(
    (target) => {
      if (!verificationCodes[target]) {
        Alert.alert('Запросите код', 'Мы ещё не отправили код для этого контакта.');
        return;
      }

      if (verificationInputs[target].trim() !== verificationCodes[target]) {
        Alert.alert('Неверный код', 'Сравните код и попробуйте ещё раз.');
        return;
      }

      setVerificationStatus((prev) => ({ ...prev, [target]: true }));
      Alert.alert(
        'Готово',
        `${target === 'email' ? 'Электронная почта' : 'Телефон'
        } подтверждён.`
      );
    },
    [verificationCodes, verificationInputs]
  );

  const handleAuthSubmit = useCallback(async () => {
    if (isProcessingAuth) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (authMode === 'recover') {
      if (!trimmedEmail && !trimmedPhone) {
        Alert.alert(
          'Укажите контакт',
          'Нужен email или телефон, чтобы отправить ссылку для восстановления.'
        );
        return;
      }

      // Валидация контакта для восстановления
      if (trimmedEmail) {
        const emailError = validateEmail(trimmedEmail);
        if (emailError) {
          Alert.alert('Проверьте email', emailError);
          return;
        }
      }
      if (trimmedPhone) {
        const phoneError = validatePhone(trimmedPhone);
        if (phoneError) {
          Alert.alert('Проверьте телефон', phoneError);
          return;
        }
      }

      setIsProcessingAuth(true);

      try {
        // Отправляем запрос на восстановление пароля
        const recoverPayload = {
          mode: 'recover',
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined,
        };
        await submitAuthPayload(recoverPayload);

        Alert.alert(
          'Ссылка отправлена',
          trimmedEmail
            ? `Письмо отправлено на ${trimmedEmail}. Проверьте почту.`
            : `SMS отправлено на ${trimmedPhone}. Проверьте сообщения.`
        );
        setAuthMode('login');
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        Alert.alert(
          'Ошибка восстановления',
          errorMessage || 'Не удалось отправить ссылку для восстановления. Попробуйте снова.'
        );
      } finally {
        setIsProcessingAuth(false);
      }

      return;
    }

    // Валидация email
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      Alert.alert('Проверьте email', emailError);
      return;
    }

    // Валидация пароля
    const passwordError = validatePassword(password, authMode === 'register');
    if (passwordError) {
      Alert.alert('Проверьте пароль', passwordError);
      return;
    }

    if (authMode === 'register') {
      // Валидация телефона при регистрации
      const phoneError = validatePhone(trimmedPhone);
      if (phoneError) {
        Alert.alert('Проверьте телефон', phoneError);
        return;
      }

      if (!confirmPassword || confirmPassword !== password) {
        Alert.alert('Проверьте пароль', 'Пароли должны совпадать.');
        return;
      }

      if (!verificationStatus.email || !verificationStatus.phone) {
        Alert.alert(
          'Подтвердите контакты',
          'Нужно подтвердить и email, и телефон.'
        );
        return;
      }
    }

    setIsProcessingAuth(true);

    try {
      const apiPayload = {
        mode: authMode,
        role: authRole,
        email: trimmedEmail,
        password: password,
        phone: trimmedPhone || undefined,
        workerSkill: workerSkill || undefined,
        employerCompany: employerCompany || undefined,
        // Отправляем коды подтверждения при регистрации, если они были подтверждены
        ...(authMode === 'register' && verificationStatus.email && verificationStatus.phone && {
          emailVerificationCode: verificationInputs.email.trim() || undefined,
          phoneVerificationCode: verificationInputs.phone.trim() || undefined,
        }),
      };

      // Логируем отправляемые данные для отладки (без пароля)
      if (authMode === 'register') {
        console.log('Отправка данных регистрации:', {
          ...apiPayload,
          password: '***',
        });
      }

      const apiResult = await submitAuthPayload(apiPayload);

      if (!apiResult) {
        throw new ApiError('Не удалось получить ответ от сервера');
      }

      // Логируем полный ответ сервера для отладки
      console.log('Ответ сервера:', apiResult);

      // Проверяем различные возможные форматы ответа от сервера
      const issuedToken = apiResult?.token || apiResult?.data?.token || apiResult?.accessToken || apiResult?.access_token;
      const refreshToken = apiResult?.refreshToken || apiResult?.data?.refreshToken || apiResult?.refresh_token;

      if (!issuedToken) {
        // Логируем ответ для отладки
        console.warn('Токен не найден в ответе сервера. Полный ответ:', JSON.stringify(apiResult, null, 2));
        throw new ApiError('Токен авторизации не получен. Попробуйте снова.');
      }

      // Вызываем completeAuth - состояние обновится синхронно
      console.log('[handleAuthSubmit] Вызов completeAuth с токеном:', issuedToken?.substring(0, 20) + '...');
      await completeAuth({ role: authRole, token: issuedToken, refreshToken });
      console.log('[handleAuthSubmit] completeAuth вызван');

      // Сбрасываем флаг обработки после успешной авторизации
      setIsProcessingAuth(false);

      // Показываем Alert после обновления состояния
      // Используем setTimeout, чтобы Alert не блокировал обновление UI
      setTimeout(() => {
        if (authMode === 'register') {
          Alert.alert(
            'Регистрация завершена',
            'Профиль создан и контакты подтверждены. Добро пожаловать!'
          );
        } else {
          Alert.alert(
            'Готово',
            'С возвращением!'
          );
        }
      }, 0);
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      // Если это ошибка о существующем пользователе (409), предлагаем войти
      if (authMode === 'register' && error instanceof ApiError && error.status === 409) {
        Alert.alert(
          'Пользователь уже существует',
          errorMessage || 'Пользователь с такими данными уже зарегистрирован.',
          [
            {
              text: 'Отмена',
              style: 'cancel'
            },
            {
              text: 'Войти',
              onPress: () => {
                setAuthMode('login');
                // Оставляем email и phone для входа
                setAuthForm((prev) => ({
                  ...prev,
                  password: '',
                  confirmPassword: '',
                  workerSkill: '',
                  workerAvailability: '',
                  employerCompany: '',
                  employerContact: '',
                }));
                resetVerificationState();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          authMode === 'register' ? 'Ошибка регистрации' : 'Ошибка при входе в приложение',
          errorMessage || 'Не удалось выполнить вход. Проверьте данные и попробуйте снова.'
        );
      }
    } finally {
      setIsProcessingAuth(false);
    }
  }, [
    authMode,
    authRole,
    completeAuth,
    confirmPassword,
    email,
    employerCompany,
    isProcessingAuth,
    password,
    phone,
    submitAuthPayload,
    validateEmail,
    validatePhone,
    validatePassword,
    verificationStatus.email,
    verificationStatus.phone,
    verificationInputs.email,
    verificationInputs.phone,
    resetVerificationState,
    workerSkill,
  ]);

  // const handleGoogleResponse = useCallback(
  //   async (googleAuth) => {
  //     const accessToken = googleAuth?.accessToken ?? googleAuth?.idToken ?? null;

  //     if (!accessToken) {
  //       Alert.alert('Ошибка Google', 'Не удалось получить токен авторизации.');
  //       return;
  //     }

  //     try {
  //       const profile = await fetchGoogleProfile(accessToken);
  //       await submitAuthPayload({
  //         mode: 'login',
  //         provider: 'google',
  //         email: profile?.email ?? email.trim(),
  //         googleId: profile?.sub,
  //         displayName: profile?.name,
  //         avatar: profile?.picture,
  //       });
  //       await completeAuth({
  //         role: authRole,
  //         token: `google-${profile?.sub ?? accessToken}`,
  //       });
  //       Alert.alert('Готово', 'Вход через Google выполнен.');
  //     } catch (error) {
  //       Alert.alert('Ошибка Google', 'Не удалось завершить вход через Google.');
  //     }
  //   },
  //   [authRole, completeAuth, email, submitAuthPayload]
  // );

  // useEffect(() => {
  //   if (!googleResponse) {
  //     return;
  //   }

  //   const processGoogleResponse = async () => {
  //     try {
  //       if (googleResponse.type === 'success') {
  //         await handleGoogleResponse(googleResponse.authentication);
  //       } else if (googleResponse.type === 'error') {
  //         Alert.alert(
  //           'Ошибка Google',
  //           googleResponse.error?.message ??
  //           'Не удалось авторизоваться через Google.'
  //         );
  //       }
  //     } finally {
  //       setIsGoogleLoading(false);
  //     }
  //   };

  //   processGoogleResponse();
  // }, [googleResponse, handleGoogleResponse]);

  // const handleGoogleSignIn = useCallback(async () => {
  //   if (!googleRequest) {
  //     Alert.alert(
  //       'Google недоступен',
  //       'Пожалуйста, попробуйте ещё раз через минуту.'
  //     );
  //     return;
  //   }

  //   setIsGoogleLoading(true);
  //   try {
  //     await promptGoogleAuth({
  //       useProxy: Platform.OS !== 'web',
  //       showInRecents: true,
  //     });
  //   } catch (error) {
  //     setIsGoogleLoading(false);
  //     Alert.alert(
  //       'Ошибка Google',
  //       'Не удалось открыть окно авторизации. Попробуйте снова.'
  //     );
  //   }
  // }, [googleRequest, promptGoogleAuth]);

  const handleGuestAccess = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'authRole']);
    } catch (error) {
      console.warn('Не удалось очистить гостевую сессию', error);
    }

    setIsAuthenticated(true);
    setIsEmployer(false);
    setAuthRole('worker');
    setActiveTab('profile');
    setToken(null);
    setAuthMode('login');
    setAuthForm(() => ({ ...initialAuthFormState }));
    resetVerificationState();
  }, [resetVerificationState]);

  const {
    draft: profileForm,
    errors: profileErrors,
    isDirty: isProfileDirty,
    isSaving: isProfileSaving,
    isValid: isProfileValid,
    modalVisible: isProfileModalVisible,
    openEditor: openProfileEditor,
    closeEditor: closeProfileEditor,
    setField: setProfileField,
    saveProfile: handleProfileSave,
    lastError: profileSaveError,
    lastSavedAt: profileSavedAt,
    published: publishedProfile,
  } = profileStore;

  const handleProfileFieldChange = useCallback(
    (field, value) => {
      // Автоформатирование номеров телефона
      if (field === 'phone' || field === 'whatsapp') {
        const formatted = formatRussianPhone(value);
        setProfileField(field, formatted);
      } else {
        setProfileField(field, value);
      }
    },
    [setProfileField]
  );

  const handleSkillLevelChange = useCallback(
    (categoryKey, skillKey, level) => {
      const normalizedLevel = Math.round(level);
      setSkillMatrix((prev) =>
        prev.map((category) =>
          category.key === categoryKey
            ? {
              ...category,
              skills: category.skills.map((skill) =>
                skill.key === skillKey ? { ...skill, level: normalizedLevel } : skill
              ),
            }
            : category
        )
      );
    },
    [setSkillMatrix]
  );

  const handleSkillFocusToggle = useCallback(
    (categoryKey, skillKey) => {
      setSkillMatrix((prev) =>
        prev.map((category) =>
          category.key === categoryKey
            ? {
              ...category,
              skills: category.skills.map((skill) =>
                skill.key === skillKey
                  ? { ...skill, wantToGrow: !skill.wantToGrow }
                  : skill
              ),
            }
            : category
        )
      );
    },
    [setSkillMatrix]
  );

  const handleToggleMatrixSlot = useCallback(
    (rowKey, day) => {
      setWeekAvailability((prev) =>
        prev.map((row) =>
          row.key === rowKey
            ? {
              ...row,
              days: {
                ...row.days,
                [day]: !row.days[day],
              },
            }
            : row
        )
      );
      setActiveTemplate(null);
    },
    [setWeekAvailability, setActiveTemplate]
  );

  const handleApplyTemplate = useCallback(
    (templateKey) => {
      const template = quickAvailabilityTemplates.find(
        (item) => item.key === templateKey
      );

      if (!template) {
        return;
      }

      setWeekAvailability(createWeekMatrix(template.config));
      setActiveTemplate(templateKey);
    },
    [setWeekAvailability]
  );

  const handleToggleVacation = useCallback(() => {
    setVacationWindow((prev) => ({ ...prev, active: !prev.active }));
  }, [setVacationWindow]);

  const currentNav = useMemo(
    () => (isEmployer ? employerBottomNav : bottomNav),
    [isEmployer]
  );
  const fabPreset = fabConfig[activeTab] ?? fabConfig.profile;
  const handleToggle = (key) =>
    setSettingsState((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleDeleteDocument = useCallback(async (documentId) => {
    if (!documentId) {
      Alert.alert('Ошибка', 'ID документа не указан');
      return;
    }

    Alert.alert(
      'Удаление документа',
      'Вы уверены, что хотите удалить этот документ?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              // Преобразуем ID в строку для единообразия
              const idToDelete = String(documentId);
              await deleteDocumentMutation.mutateAsync(idToDelete);
              // Дождаться обновления кеша через onSuccess/onSettled хука
              await refetchDocuments();
              Alert.alert('Успешно', 'Документ удалён');
            } catch (error) {
              Alert.alert('Ошибка', getErrorMessage(error) || 'Не удалось удалить документ');
            }
          },
        },
      ]
    );
  }, [deleteDocumentMutation, refetchDocuments]);

  const renderProfile = () => {
    const publishedContacts = [
      { label: 'Телефон', value: publishedProfile.phone, preferred: true },
      { label: 'Telegram', value: publishedProfile.telegram },
      { label: 'WhatsApp', value: publishedProfile.whatsapp },
      { label: 'Email', value: publishedProfile.email },
    ];

    return (
      <>
        <Section title="1. Профиль" compact={isCompact}>
          <View style={styles.profileHeaderRow}>
            <TouchableOpacity
              onPress={openProfileEditor}
              style={styles.editProfileButton}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={16} color={theme.primary} />
              <Text style={styles.editProfileButtonText}>Редактировать профиль</Text>
            </TouchableOpacity>
            {isProfileDirty && (
              <View style={styles.unsavedBadge}>
                <Ionicons name="warning" size={14} color="#FFF8E1" />
                <Text style={styles.unsavedBadgeText}>Черновик не сохранён</Text>
              </View>
            )}
          </View>

          <ProfileFormFields
            form={profileForm}
            errors={profileErrors}
            onFieldChange={handleProfileFieldChange}
          />

          <InlineSelect
            label="Часовой пояс"
            value={profileForm.timezone}
            options={timezones.map((zone) => ({ label: zone, value: zone }))}
            onSelect={(zone) => handleProfileFieldChange('timezone', zone)}
          />

          <View style={styles.profileStatusRow}>
            {profileSaveError ? (
              <Text style={styles.profileStatusError}>{profileSaveError}</Text>
            ) : profileSavedAt ? (
              <Text style={styles.profileStatusText}>
                Последнее сохранение в {formatSavedTime(profileSavedAt)}
              </Text>
            ) : null}
          </View>

          <Text style={styles.blockTitle}>Навыки и уровни</Text>
          <SkillEditor
            categories={skillMatrix}
            onLevelChange={handleSkillLevelChange}
            onToggleGrow={handleSkillFocusToggle}
          />
        </Section>

        <Section title="2. Документы" compact={isCompact}>
          <View style={styles.documentsActionsGrid}>
            <TouchableOpacity
              style={[styles.documentActionCard, uploadDocumentPhotoMutation.isPending && styles.documentActionCardDisabled]}
              onPress={() => handleFileSelect(null, true)}
              disabled={uploadDocumentPhotoMutation.isPending}
              activeOpacity={0.7}
            >
              <View style={styles.documentActionIconContainer}>
                <Ionicons name="camera-outline" size={28} color={theme.primary} />
              </View>
              <Text style={styles.documentActionCardTitle}>
                {uploadDocumentPhotoMutation.isPending ? 'Загрузка...' : 'Загрузить паспорт'}
              </Text>
              <Text style={styles.documentActionCardSubtitle}>JPG, PNG</Text>
            </TouchableOpacity>
          </View>

          {isDocumentsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.loadingText}>Загрузка документов...</Text>
            </View>
          ) : documentsError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {getErrorMessage(documentsError) || 'Не удалось загрузить документы'}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => refetchDocuments()}
              >
                <Text style={styles.retryButtonText}>Повторить</Text>
              </TouchableOpacity>
            </View>
          ) : documentsData && documentsData.length > 0 ? (
            <View style={styles.documentsList}>
              {documentsData.slice(0, 3).map((doc) => (
                <View key={doc.id || doc._id} style={styles.documentCard}>
                  <View style={styles.documentCardHeader}>
                    <View style={styles.documentCardIconContainer}>
                      <Ionicons
                        name={doc.type === 'photo' ? 'image-outline' : 'document-text-outline'}
                        size={24}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.documentCardInfo}>
                      <Text style={styles.documentCardTitle} numberOfLines={1}>
                        {doc.title || doc.name || 'Документ'}
                      </Text>
                      {doc.description && (
                        <Text style={styles.documentCardDescription} numberOfLines={1}>
                          {doc.description}
                        </Text>
                      )}
                      {doc.uploadedAt && (
                        <Text style={styles.documentCardDate}>
                          {new Date(doc.uploadedAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                      )}
                    </View>
                    {doc.status && (
                      <View style={[
                        styles.documentStatusBadge,
                        { backgroundColor: doc.status === 'verified' ? '#66BB6A' : doc.status === 'pending' ? '#FFA726' : '#EF5350' }
                      ]}>
                        <Text style={styles.documentStatusText}>
                          {doc.status === 'verified' ? 'Проверен' : doc.status === 'pending' ? 'На проверке' : 'Отклонён'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.documentCardActions}>
                    <TouchableOpacity
                      style={styles.documentCardButton}
                      onPress={() => handleViewDocument(doc.id || doc._id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="eye-outline" size={18} color={theme.primary} />
                      <Text style={styles.documentCardButtonText}>Просмотр</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.documentCardButton, styles.documentCardButtonDanger]}
                      onPress={(e) => {
                        e?.preventDefault?.();
                        e?.stopPropagation?.();
                        const docId = doc.id || doc._id;
                        if (docId) {
                          handleDeleteDocument(docId);
                        } else {
                          Alert.alert('Ошибка', 'Не удалось определить ID документа');
                        }
                      }}
                      disabled={deleteDocumentMutation.isPending}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Удалить документ"
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF5350" />
                      <Text style={[styles.documentCardButtonText, styles.documentCardButtonTextDanger]}>Удалить</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {documentsData.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setDocumentsModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward-outline" size={18} color={theme.primary} />
                  <Text style={styles.viewAllButtonText}>
                    Показать все документы ({documentsData.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={theme.muted} />
              <Text style={styles.emptyText}>Документы не загружены</Text>
              <Text style={styles.emptySubtext}>
                Загрузите документы для подтверждения вашей квалификации
              </Text>
            </View>
          )}
        </Section>

        <Section title="Трекер смен" compact={isCompact}>
          {timelineMilestones.map((item) => (
            <TimelineItem key={item.title} compact={isCompact} {...item} />
          ))}
        </Section>

        <Section title="Новая идея: проверка готовности" compact={isCompact}>
          <Text style={styles.sectionSubtitle}>
            Перед каждым выходом на работу приложение напоминает, что взять
            и что нужно подтвердить.
          </Text>
          {readinessChecklist.map((item) => (
            <View key={item} style={styles.checkItem}>
              <View style={styles.checkBullet} />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Запланировать проверку</Text>
          </TouchableOpacity>
        </Section>
      </>
    );
  };

  // Обработчики для вакансий
  const handleJobFilterChange = useCallback((key, value) => {
    setJobFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleJobSelect = useCallback((jobId) => {
    setSelectedJobId(jobId);
    setJobApplicationModalVisible(true);
  }, []);

  const handleJobApply = useCallback(async () => {
    if (!selectedJobId) return;

    try {
      await applyToJobMutation.mutateAsync({
        jobId: selectedJobId,
        applicationData: {
          message: applicationMessage,
        },
      });

      Alert.alert(
        'Успешно',
        'Ваш отклик отправлен. Работодатель свяжется с вами в ближайшее время.',
        [
          {
            text: 'OK',
            onPress: () => {
              setJobApplicationModalVisible(false);
              setSelectedJobId(null);
              setApplicationMessage('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Ошибка',
        getErrorMessage(error) || 'Не удалось отправить отклик. Попробуйте позже.'
      );
    }
  }, [selectedJobId, applicationMessage, applyToJobMutation]);

  const handleCloseJobModal = useCallback(() => {
    setJobApplicationModalVisible(false);
    setSelectedJobId(null);
    setApplicationMessage('');
  }, []);

  // Обработчик создания отзыва
  const handleCreateReview = useCallback(async () => {
    if (!reviewForm.comment.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите комментарий');
      return;
    }

    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите рейтинг от 1 до 5');
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        userId: reviewForm.userId || undefined,
        jobId: reviewForm.jobId || undefined,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });

      Alert.alert(
        'Успешно',
        'Отзыв успешно создан',
        [
          {
            text: 'OK',
            onPress: () => {
              setReviewModalVisible(false);
              setReviewForm({
                userId: '',
                jobId: '',
                rating: 5,
                comment: '',
              });
              refetchReviews();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Ошибка при создании отзыва', error);
      Alert.alert(
        'Ошибка',
        getErrorMessage(error) || 'Не удалось создать отзыв. Попробуйте еще раз.'
      );
    }
  }, [reviewForm, createReviewMutation, refetchReviews]);

  const handleCloseReviewModal = useCallback(() => {
    setReviewModalVisible(false);
    setReviewForm({
      userId: '',
      jobId: '',
      rating: 5,
      comment: '',
    });
  }, []);

  const getApplicationStatusLabel = useCallback((status) => {
    const statusMap = {
      pending: 'На рассмотрении',
      accepted: 'Принят',
      rejected: 'Отклонён',
      cancelled: 'Отменён',
    };
    return statusMap[status] || status;
  }, []);

  const getApplicationStatusColor = useCallback((status) => {
    const colorMap = {
      pending: '#FFA726',
      accepted: '#66BB6A',
      rejected: '#EF5350',
      cancelled: '#9E9E9E',
    };
    return colorMap[status] || '#9E9E9E';
  }, []);

  // Обработчики для документов
  const handleUploadDocument = useCallback(async (file, documentType, metadata = {}) => {
    try {
      await uploadDocumentMutation.mutateAsync({
        file,
        documentType,
        metadata,
      });
      Alert.alert('Успешно', 'Документ успешно загружен');
      refetchDocuments();
    } catch (error) {
      Alert.alert('Ошибка', getErrorMessage(error) || 'Не удалось загрузить документ');
    }
  }, [uploadDocumentMutation, refetchDocuments]);

  const handleUploadDocumentPhoto = useCallback(async (photo, documentType, metadata = {}) => {
    try {
      await uploadDocumentPhotoMutation.mutateAsync({
        photo,
        documentType,
        metadata,
      });
      Alert.alert('Успешно', 'Фото документа успешно загружено');
      refetchDocuments();
    } catch (error) {
      Alert.alert('Ошибка', getErrorMessage(error) || 'Не удалось загрузить фото документа');
    }
  }, [uploadDocumentPhotoMutation, refetchDocuments]);

  const handleViewDocument = useCallback((documentId) => {
    setSelectedDocumentId(documentId);
    setDocumentViewModalVisible(true);
  }, []);

  const handleCloseDocumentView = useCallback(() => {
    setDocumentViewModalVisible(false);
    setSelectedDocumentId(null);
  }, []);

  // Функция для выбора файла (веб-версия)
  const handleFileSelect = useCallback((event, isPhoto = false) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = isPhoto ? 'file' : 'file';
      input.accept = isPhoto ? 'image/*' : '.pdf,.doc,.docx';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          if (isPhoto) {
            handleUploadDocumentPhoto(file, 'photo', { title: file.name });
          } else {
            handleUploadDocument(file, 'document', { title: file.name });
          }
        }
      };
      input.click();
    } else {
      // Для мобильных версий можно использовать expo-document-picker или expo-image-picker
      Alert.alert(
        'Загрузка файла',
        'Для загрузки файлов на мобильных устройствах необходимо установить expo-document-picker и expo-image-picker',
        [{ text: 'OK' }]
      );
    }
  }, [handleUploadDocument, handleUploadDocumentPhoto]);

  // Мемоизация обработки данных вакансий и откликов
  const jobs = useMemo(() => {
    if (!jobsData) return [];
    return Array.isArray(jobsData)
      ? jobsData
      : jobsData?.jobs
        ? jobsData.jobs
        : jobsData?.data
          ? jobsData.data
          : [];
  }, [jobsData]);

  const applications = useMemo(() => {
    if (!applicationsData) return [];
    return Array.isArray(applicationsData)
      ? applicationsData
      : applicationsData?.applications
        ? applicationsData.applications
        : applicationsData?.data
          ? applicationsData.data
          : [];
  }, [applicationsData]);

  const renderJobs = () => {

    return (
      <>
        {/* Переключатель между вакансиями и откликами */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              !applicationsView && styles.viewToggleButtonActive,
            ]}
            onPress={() => setApplicationsView(false)}
          >
            <Text
              style={[
                styles.viewToggleText,
                !applicationsView && styles.viewToggleTextActive,
              ]}
            >
              Вакансии
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              applicationsView && styles.viewToggleButtonActive,
            ]}
            onPress={() => setApplicationsView(true)}
          >
            <Text
              style={[
                styles.viewToggleText,
                applicationsView && styles.viewToggleTextActive,
              ]}
            >
              Мои отклики
            </Text>
          </TouchableOpacity>
        </View>

        {applicationsView ? (
          /* Просмотр откликов */
          <Section title="Мои отклики" compact={isCompact}>
            {isApplicationsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Загрузка откликов...</Text>
              </View>
            ) : applicationsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {getErrorMessage(applicationsError) || 'Не удалось загрузить отклики'}
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => refetchJobs()}
                >
                  <Text style={styles.retryButtonText}>Повторить</Text>
                </TouchableOpacity>
              </View>
            ) : applications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color={theme.muted} />
                <Text style={styles.emptyText}>У вас пока нет откликов</Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setApplicationsView(false)}
                >
                  <Text style={styles.secondaryButtonText}>Найти вакансии</Text>
                </TouchableOpacity>
              </View>
            ) : (
              applications.map((application) => (
                <View
                  key={application.id || application._id}
                  style={[styles.applicationCard, isCompact && styles.applicationCardCompact]}
                >
                  <View style={styles.applicationHeader}>
                    <Text style={styles.applicationJobTitle}>
                      {application.job?.title || 'Вакансия'}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getApplicationStatusColor(application.status) },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {getApplicationStatusLabel(application.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.applicationCompany}>
                    {application.job?.company || 'Компания'}
                  </Text>
                  {application.createdAt && (
                    <Text style={styles.applicationDate}>
                      Отправлено: {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                    </Text>
                  )}
                  {application.message && (
                    <Text style={styles.applicationMessage}>{application.message}</Text>
                  )}
                </View>
              ))
            )}
          </Section>
        ) : (
          /* Список вакансий */
          <>
            {/* Поиск */}
            <Section title="Поиск вакансий" compact={isCompact}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.muted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Поиск по названию, компании, навыкам..."
                  placeholderTextColor={theme.muted}
                  value={jobSearchQuery}
                  onChangeText={setJobSearchQuery}
                />
                {jobSearchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setJobSearchQuery('')}
                    style={styles.searchClearButton}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </Section>

            {/* Фильтры */}
            <Section title="Фильтры" compact={isCompact}>
              <View style={[styles.chipsRow, isCompact && styles.chipsRowCompact]}>
                {jobFilterTags.map((filter) => (
                  <Chip key={filter} label={filter} />
                ))}
              </View>
              <View style={styles.filterRow}>
                <View style={styles.filterInputContainer}>
                  <Ionicons name="location-outline" size={18} color={theme.muted} style={styles.filterInputIcon} />
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Город"
                    placeholderTextColor={theme.muted}
                    value={jobFilters.location}
                    onChangeText={(value) => handleJobFilterChange('location', value)}
                  />
                </View>
                <View style={styles.filterInputContainer}>
                  <Ionicons name="construct-outline" size={18} color={theme.muted} style={styles.filterInputIcon} />
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Навык"
                    placeholderTextColor={theme.muted}
                    value={jobFilters.skill}
                    onChangeText={(value) => handleJobFilterChange('skill', value)}
                  />
                </View>
              </View>
              <View style={styles.filterRow}>
                <View style={styles.filterInputContainer}>
                  <Ionicons name="cash-outline" size={18} color={theme.muted} style={styles.filterInputIcon} />
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Мин. зарплата"
                    placeholderTextColor={theme.muted}
                    value={jobFilters.minSalary}
                    onChangeText={(value) => handleJobFilterChange('minSalary', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.filterInputContainer}>
                  <Ionicons name="cash-outline" size={18} color={theme.muted} style={styles.filterInputIcon} />
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Макс. зарплата"
                    placeholderTextColor={theme.muted}
                    value={jobFilters.maxSalary}
                    onChangeText={(value) => handleJobFilterChange('maxSalary', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </Section>

            {/* Список вакансий */}
            <Section title="Свободные вакансии" compact={isCompact}>
              {isJobsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles.loadingText}>Загрузка вакансий...</Text>
                </View>
              ) : jobsError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {getErrorMessage(jobsError) || 'Не удалось загрузить вакансии'}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => refetchJobs()}
                  >
                    <Text style={styles.retryButtonText}>Повторить</Text>
                  </TouchableOpacity>
                </View>
              ) : jobs.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="briefcase-outline" size={48} color={theme.muted} />
                  <Text style={styles.emptyText}>Вакансии не найдены</Text>
                  <Text style={styles.emptySubtext}>
                    Попробуйте изменить параметры поиска или фильтры
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={jobs}
                  keyExtractor={(item) => String(item.id || item._id)}
                  renderItem={({ item }) => (
                    <JobCardItem
                      item={item}
                      isCompact={isCompact}
                      onPress={handleJobSelect}
                    />
                  )}
                  scrollEnabled={false}
                  removeClippedSubviews={true}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  getItemLayout={(data, index) => ({
                    length: 200, // Примерная высота карточки
                    offset: 200 * index,
                    index,
                  })}
                />
              )}
            </Section>
          </>
        )}

        {/* Модальное окно деталей вакансии и отклика */}
        <Modal
          visible={jobApplicationModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseJobModal}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Детали вакансии</Text>
              <TouchableOpacity onPress={handleCloseJobModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {isJobDetailsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles.loadingText}>Загрузка деталей...</Text>
                </View>
              ) : jobDetails ? (
                <>
                  <Text style={styles.jobDetailTitle}>{jobDetails.title}</Text>
                  <Text style={styles.jobDetailCompany}>
                    {jobDetails.company || jobDetails.employer?.name || 'Компания'}
                  </Text>
                  {jobDetails.salary && (
                    <Text style={styles.jobDetailSalary}>
                      {typeof jobDetails.salary === 'object'
                        ? (jobDetails.salary.min || jobDetails.salary.max
                          ? `${jobDetails.salary.min || ''} - ${jobDetails.salary.max || ''} ${jobDetails.salary.currency || 'сум'}`
                          : `${jobDetails.salary.currency || 'сум'}`)
                        : jobDetails.salary}
                    </Text>
                  )}
                  {jobDetails.location && (
                    <View style={styles.jobDetailLocation}>
                      <Ionicons name="location-outline" size={18} color={theme.muted} />
                      <Text style={styles.jobDetailLocationText}>{jobDetails.location}</Text>
                    </View>
                  )}
                  {jobDetails.description && (
                    <View style={styles.jobDetailSection}>
                      <Text style={styles.jobDetailSectionTitle}>Описание</Text>
                      <Text style={styles.jobDetailDescription}>{jobDetails.description}</Text>
                    </View>
                  )}
                  {jobDetails.requirements && jobDetails.requirements.length > 0 && (
                    <View style={styles.jobDetailSection}>
                      <Text style={styles.jobDetailSectionTitle}>Требования</Text>
                      {jobDetails.requirements.map((req, index) => (
                        <View key={index} style={styles.checkItem}>
                          <View style={styles.checkBullet} />
                          <Text style={styles.checkText}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {jobDetails.skills && jobDetails.skills.length > 0 && (
                    <View style={styles.jobDetailSection}>
                      <Text style={styles.jobDetailSectionTitle}>Навыки</Text>
                      <View style={styles.tagsRow}>
                        {jobDetails.skills.map((skill, index) => (
                          <Tag
                            key={index}
                            label={typeof skill === 'string' ? (skill && skill !== '.' ? skill : '') : (skill.name && skill.name !== '.' ? skill.name : '')}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                  <View style={styles.jobDetailSection}>
                    <Text style={styles.jobDetailSectionTitle}>Сообщение работодателю (необязательно)</Text>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Расскажите о себе, почему вы подходите на эту вакансию..."
                      placeholderTextColor={theme.muted}
                      value={applicationMessage}
                      onChangeText={setApplicationMessage}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      applyToJobMutation.isPending && styles.primaryButtonDisabled,
                    ]}
                    onPress={handleJobApply}
                    disabled={applyToJobMutation.isPending}
                  >
                    {applyToJobMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Откликнуться</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Не удалось загрузить детали вакансии</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </>
    );
  };

  // Обработчик открытия чата
  const handleOpenChat = useCallback((chatId) => {
    if (!chatId) {
      console.error('[Chats] Chat ID is missing');
      return;
    }

    console.log('[Chats] Opening chat:', chatId);
    setSelectedChatId(chatId);
    setChatModalVisible(true);
    // Пометить сообщения как прочитанные при открытии чата
    if (chatId) {
      setTimeout(() => {
        markAsReadMutation.mutate([]); // Пометить все сообщения как прочитанные
      }, 500);
    }
  }, [markAsReadMutation]);

  // Обработчик закрытия чата
  const handleCloseChat = useCallback(() => {
    setChatModalVisible(false);
    setSelectedChatId(null);
    setNewMessageText('');
  }, []);

  // Обработчик отправки сообщения
  const handleSendMessage = useCallback(async () => {
    if (!newMessageText.trim() || !selectedChatId) return;

    const messageText = newMessageText.trim();
    setNewMessageText('');

    try {
      // Отправить сообщение через API
      await sendMessageMutation.mutateAsync({
        text: messageText,
      });

      // Прокрутить вниз после отправки
      setTimeout(() => {
        if (chatScrollViewRef.current) {
          chatScrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

      // Также попытаться отправить через WebSocket, если доступно (опционально, для быстрой доставки)
      if (wsServiceRef.current?.isConnected()) {
        try {
          wsServiceRef.current.sendMessage({
            type: 'send_message',
            chatId: selectedChatId,
            text: messageText,
          });
        } catch (wsError) {
          console.warn('Не удалось отправить через WebSocket', wsError);
          // Продолжаем, так как сообщение уже отправлено через API
        }
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение. Попробуйте еще раз.');
      setNewMessageText(messageText); // Восстановить текст при ошибке
    }
  }, [newMessageText, selectedChatId, sendMessageMutation]);

  // Мемоизация обработки данных чатов
  const chats = useMemo(() => {
    if (!chatsData) return [];
    return Array.isArray(chatsData)
      ? chatsData
      : chatsData?.chats
        ? chatsData.chats
        : chatsData?.data
          ? chatsData.data
          : [];
  }, [chatsData]);

  const renderChats = () => {

    return (
      <>
        <Section title="Диалоги" compact={isCompact}>
          {isChatsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>Загрузка чатов...</Text>
            </View>
          ) : chatsError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {getErrorMessage(chatsError) || 'Не удалось загрузить чаты'}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => refetchChats()}
              >
                <Text style={styles.retryButtonText}>Повторить</Text>
              </TouchableOpacity>
            </View>
          ) : chats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.muted} />
              <Text style={styles.emptyText}>У вас пока нет чатов</Text>
            </View>
          ) : (
            <FlatList
              data={chats}
              keyExtractor={(item) => String(item.id || item._id)}
              renderItem={({ item: chat }) => (
                <TouchableOpacity
                  onPress={() => handleOpenChat(chat.id || chat._id)}
                  activeOpacity={0.7}
                >
                  <ChatCard
                    compact={isCompact}
                    name={chat.participant?.name || chat.name || 'Пользователь'}
                    snippet={chat.lastMessage?.text || chat.snippet || 'Нет сообщений'}
                    time={chat.lastMessage?.createdAt
                      ? new Date(chat.lastMessage.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : (chat.time && chat.time.trim() ? chat.time : null)}
                    unread={chat.unreadCount || chat.unread || 0}
                    status={chat.status && chat.status.trim() ? chat.status : null}
                  />
                </TouchableOpacity>
              )}
              scrollEnabled={false}
              removeClippedSubviews={true}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          )}
        </Section>

        <Section title="Напоминания" compact={isCompact}>
          {readinessChecklist.map((item) => (
            <View key={item} style={styles.checkItem}>
              <View style={styles.checkBullet} />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Создать шаблон сообщения</Text>
          </TouchableOpacity>
        </Section>

        {/* Модальное окно чата */}
        <Modal
          visible={chatModalVisible}
          animationType="slide"
          onRequestClose={handleCloseChat}
        >
          <SafeAreaView style={styles.safeArea}>
            <StatusBar style="light" />
            <View style={[styles.chatModal, { maxWidth: Math.min(width, 400) }]}>
              {/* Заголовок чата */}
              <View style={styles.chatModalHeader}>
                <TouchableOpacity
                  style={styles.chatModalBackButton}
                  onPress={handleCloseChat}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.chatModalHeaderInfo}>
                  <Text style={styles.chatModalTitle}>
                    {chats.find(c => (c.id || c._id) === selectedChatId)?.participant?.name ||
                      chats.find(c => (c.id || c._id) === selectedChatId)?.name ||
                      'Чат'}
                  </Text>
                </View>
              </View>

              {/* Сообщения */}
              <ScrollView
                ref={chatScrollViewRef}
                style={styles.chatMessages}
                contentContainerStyle={styles.chatMessagesContent}
                onContentSizeChange={() => {
                  if (chatScrollViewRef.current) {
                    chatScrollViewRef.current.scrollToEnd({ animated: true });
                  }
                }}
              >
                {isMessagesLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>Загрузка сообщений...</Text>
                  </View>
                ) : messagesError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      {getErrorMessage(messagesError) || 'Не удалось загрузить сообщения'}
                    </Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => refetchMessages()}
                    >
                      <Text style={styles.retryButtonText}>Повторить</Text>
                    </TouchableOpacity>
                  </View>
                ) : (() => {
                  if (sortedMessages.length === 0) {
                    return (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubble-outline" size={48} color={theme.muted} />
                        <Text style={styles.emptyText}>Начните разговор</Text>
                      </View>
                    );
                  }

                  if (sortedMessages.length === 0) {
                    return (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubble-outline" size={48} color={theme.muted} />
                        <Text style={styles.emptyText}>Начните разговор</Text>
                      </View>
                    );
                  }

                  return (
                    <FlatList
                      data={sortedMessages}
                      keyExtractor={(item) => String(item.id || item._id || `msg-${item.createdAt}-${Date.now()}`)}
                      renderItem={({ item: message }) => (
                        <ChatMessageItem message={message} profileData={profileData} />
                      )}
                      inverted={false}
                      removeClippedSubviews={true}
                      initialNumToRender={15}
                      maxToRenderPerBatch={10}
                      windowSize={10}
                      onContentSizeChange={() => {
                        if (chatScrollViewRef.current) {
                          chatScrollViewRef.current.scrollToEnd({ animated: true });
                        }
                      }}
                    />
                  );
                })()}
              </ScrollView>

              {/* Поле ввода сообщения */}
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Введите сообщение..."
                  placeholderTextColor={theme.muted}
                  value={newMessageText}
                  onChangeText={setNewMessageText}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  style={[
                    styles.chatSendButton,
                    (!newMessageText.trim() || sendMessageMutation.isPending) &&
                    styles.chatSendButtonDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!newMessageText.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </>
    );
  };

  const renderSettings = () => {
    // Синхронизировать настройки уведомлений
    const notificationSettingsData = notificationSettings || {};

    return (
      <>
        <Section title="Push-уведомления" compact={isCompact}>
          <SettingToggle
            compact={isCompact}
            value={notificationSettingsData.enabled !== false}
            onToggle={async () => {
              const newValue = !(notificationSettingsData.enabled !== false);
              await updateNotificationSetting('enabled', newValue);
              if (!newValue && notificationPermissions.granted) {
                Alert.alert(
                  'Уведомления отключены',
                  'Вы больше не будете получать push-уведомления о новых вакансиях и сообщениях.'
                );
              }
            }}
            key="push_enabled"
            label="Включить уведомления"
            subtitle="Получать push-уведомления на устройство"
          />
          {notificationPermissions && !notificationPermissions.granted && (
            <TouchableOpacity
              style={styles.requestPermissionButton}
              onPress={async () => {
                const result = await requestPermissions();
                if (result.granted) {
                  Alert.alert('Разрешение предоставлено', 'Теперь вы будете получать уведомления.');
                } else {
                  Alert.alert(
                    'Разрешение не предоставлено',
                    'Для получения уведомлений необходимо предоставить разрешение в настройках устройства.'
                  );
                }
              }}
            >
              <Text style={styles.requestPermissionButtonText}>
                Запросить разрешение на уведомления
              </Text>
            </TouchableOpacity>
          )}
          {notificationSettingsData.enabled !== false && (
            <>
              <SettingToggle
                compact={isCompact}
                value={notificationSettingsData.jobs !== false}
                onToggle={async () => {
                  await updateNotificationSetting('jobs', !(notificationSettingsData.jobs !== false));
                }}
                key="push_jobs"
                label="Уведомления о вакансиях"
                subtitle="Новые вакансии и обновления"
              />
              <SettingToggle
                compact={isCompact}
                value={notificationSettingsData.messages !== false}
                onToggle={async () => {
                  await updateNotificationSetting('messages', !(notificationSettingsData.messages !== false));
                }}
                key="push_messages"
                label="Уведомления о сообщениях"
                subtitle="Новые сообщения в чатах"
              />
              <SettingToggle
                compact={isCompact}
                value={notificationSettingsData.shifts !== false}
                onToggle={async () => {
                  await updateNotificationSetting('shifts', !(notificationSettingsData.shifts !== false));
                }}
                key="push_shifts"
                label="Уведомления о сменах"
                subtitle="Обновления статусов смен"
              />
              <SettingToggle
                compact={isCompact}
                value={notificationSettingsData.sound !== false}
                onToggle={async () => {
                  await updateNotificationSetting('sound', !(notificationSettingsData.sound !== false));
                }}
                key="push_sound"
                label="Звук уведомлений"
                subtitle="Воспроизводить звук при получении"
              />
              <SettingToggle
                compact={isCompact}
                value={notificationSettingsData.badge !== false}
                onToggle={async () => {
                  await updateNotificationSetting('badge', !(notificationSettingsData.badge !== false));
                }}
                key="push_badge"
                label="Счетчик уведомлений"
                subtitle="Показывать badge на иконке приложения"
              />
            </>
          )}
        </Section>

        <Section title="Уведомления" compact={isCompact}>
          {settingsSchema.map((setting) => (
            <SettingToggle
              key={setting.key}
              compact={isCompact}
              value={settingsState[setting.key]}
              onToggle={() => handleToggle(setting.key)}
              {...setting}
            />
          ))}
        </Section>

        <Section title="Быстрые действия" compact={isCompact}>
          <View style={styles.shortcutRow}>
            <ShortcutCard
              title="Документы"
              subtitle="Обновить медкнижку"
              icon="document-text"
            />
            <ShortcutCard
              title="История"
              subtitle="Посмотреть отзывы"
              icon="time"
            />
          </View>
        </Section>

        <Section title="Доступ и безопасность" compact={isCompact}>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Роль</Text>
            <Text style={styles.sessionValue}>
              {isEmployer ? 'Работодатель' : 'Работник'}
            </Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Токен</Text>
            <Text style={[styles.sessionValue, styles.sessionToken]} numberOfLines={1}>
              {token ?? 'Нет активного токена'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              !isAuthenticated && styles.logoutButtonDisabled,
            ]}
            onPress={handleLogout}
            disabled={!isAuthenticated}
          >
            <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        </Section>
      </>
    );
  };

  const renderWorkers = () => (
    <>
      <Section title="Фильтр исполнителей" compact={isCompact}>
        <View style={[styles.chipsRow, isCompact && styles.chipsRowCompact]}>
          {workerFilters.map((filter) => (
            <Chip key={filter} label={filter} />
          ))}
        </View>
      </Section>
      <Section title="Доступные работники" compact={isCompact}>
        <FlatList
          data={workersPool}
          keyExtractor={(item, index) => String(item.name || index)}
          renderItem={({ item: worker }) => (
            <WorkerCard {...worker} />
          )}
          scrollEnabled={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </Section>
    </>
  );

  // Преобразование данных отзывов из API в формат для ReviewCard
  const formattedReviews = useMemo(() => {
    if (!reviewsData) return [];
    const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.reviews || []);

    return reviews.map((review) => {
      const date = review.createdAt
        ? new Date(review.createdAt).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
        })
        : '';

      return {
        employer: review.userName || review.employer || 'Заказчик',
        shift: review.jobTitle || review.shift || (review.jobId ? `Работа #${review.jobId}` : 'Смена'),
        rating: review.rating || 5,
        text: review.comment || review.text || '',
        date: date,
        id: review.id,
      };
    });
  }, [reviewsData]);

  const renderReviews = () => (
    <>
      <Section title="Отзывы заказчиков" compact={isCompact}>
        <View style={styles.sectionActionHeader}>
          <TouchableOpacity
            onPress={() => setReviewModalVisible(true)}
            style={styles.addButton}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
            <Text style={styles.addButtonText}>Создать отзыв</Text>
          </TouchableOpacity>
        </View>
        {isReviewsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Загрузка отзывов...</Text>
          </View>
        ) : reviewsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {getErrorMessage(reviewsError) || 'Не удалось загрузить отзывы'}
            </Text>
            <TouchableOpacity
              onPress={() => refetchReviews()}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        ) : formattedReviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={48} color={theme.muted} />
            <Text style={styles.emptyText}>Отзывов пока нет</Text>
            <Text style={styles.emptySubtext}>
              Создайте отзыв, чтобы поделиться своим опытом
            </Text>
          </View>
        ) : (
          <FlatList
            data={formattedReviews}
            keyExtractor={(item, index) => String(item.id || `${item.employer}-${item.date}` || index)}
            renderItem={({ item: review }) => (
              <ReviewCard {...review} />
            )}
            scrollEnabled={false}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </Section>
      <Section title="Как улучшить рейтинг" compact={isCompact}>
        <Text style={styles.sectionSubtitle}>
          Поддерживайте связь после смены, отправляйте фото отчёты и напоминайте
          заказчику оставить отзыв — так рейтинг 4.9 станет 5.0.
        </Text>
        {readinessChecklist.map((item) => (
          <View key={`review-${item}`} style={styles.checkItem}>
            <View style={styles.checkBullet} />
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </Section>
    </>
  );


  const renderHistory = () => (
    <>
      <Section title="Закрытые смены" compact={isCompact}>
        <FlatList
          data={closedShifts}
          keyExtractor={(item, index) => String(item.title || index)}
          renderItem={({ item: shift }) => (
            <ClosedShiftCard {...shift} />
          )}
          scrollEnabled={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </Section>

      <Section title="Рекомендации" compact={isCompact}>
        <Text style={styles.sectionSubtitle}>
          Закрытые смены влияют на рейтинг. Добавьте отзывы, чтобы удерживать
          статус «Top Performer».
        </Text>
        {timelineMilestones.map((item) => (
          <TimelineItem
            key={`${item.title}-history`}
            compact={isCompact}
            {...item}
          />
        ))}
      </Section>
    </>
  );

  const renderRoleSpecificFields = () =>
    authRole === 'worker' ? (
      <>
        <Text style={styles.authSubLabel}>Профиль работника</Text>
        <TextInput
          placeholder="Основной навык (маляр, сварщик и т.д.)"
          placeholderTextColor="#BDBDBD"
          style={styles.authInput}
          value={authForm.workerSkill}
          onChangeText={(text) => handleFormChange('workerSkill', text)}
        />
        <TextInput
          placeholder="Когда можете работать? (например, ночные смены)"
          placeholderTextColor="#BDBDBD"
          style={styles.authInput}
          value={authForm.workerAvailability}
          onChangeText={(text) => handleFormChange('workerAvailability', text)}
        />
      </>
    ) : (
      <>
        <Text style={styles.authSubLabel}>Данные работодателя</Text>
        <TextInput
          placeholder="Название компании / объекта"
          placeholderTextColor="#BDBDBD"
          style={styles.authInput}
          value={authForm.employerCompany}
          onChangeText={(text) => handleFormChange('employerCompany', text)}
        />
        <TextInput
          placeholder="Контакт для связи (телеграм, телефон)"
          placeholderTextColor="#BDBDBD"
          style={styles.authInput}
          value={authForm.employerContact}
          onChangeText={(text) => handleFormChange('employerContact', text)}
        />
      </>
    );

  const renderAuthScreen = () => {
    const authCopy = {
      login: {
        title: 'Войти в аккаунт',
        subtitle: 'Получайте смены быстрее и контролируйте выплаты',
      },
      register: {
        title: 'Создать аккаунт',
        subtitle: 'Поделитесь опытом, подтвердите контакты и начните работу',
      },
      recover: {
        title: 'Восстановление доступа',
        subtitle: 'Отправим ссылку или код для сброса пароля',
      },
    };
    const primaryLabel =
      authMode === 'login'
        ? 'Войти'
        : authMode === 'register'
          ? 'Зарегистрироваться'
          : 'Отправить ссылку';

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#C62828', '#8E0000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.authHero}
        >
          <Text style={styles.authBadge}>workmatch</Text>
          <Text style={styles.authTitle}>Подберём смену уже сегодня</Text>
          <Text style={styles.authSubtitle}>
            Рабочий профиль, подтверждённый опыт и прозрачный график
          </Text>
        </LinearGradient>
        <ScrollView contentContainerStyle={styles.authContent}>
          <View style={styles.authCard}>
            <View style={styles.authModeTabs}>
              {[
                { key: 'login', label: 'Вход' },
                { key: 'register', label: 'Регистрация' },
                { key: 'recover', label: 'Восстановление' },
              ].map((mode) => (
                <TouchableOpacity
                  key={mode.key}
                  style={[
                    styles.authModeButton,
                    authMode === mode.key && styles.authModeButtonActive,
                  ]}
                  onPress={() => setAuthMode(mode.key)}
                  activeOpacity={0.9}
                >
                  <Text
                    style={[
                      styles.authModeButtonText,
                      authMode === mode.key && styles.authModeButtonTextActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.authCardTitle}>{authCopy[authMode].title}</Text>
            <Text style={styles.authCardSubtitle}>
              {authCopy[authMode].subtitle}
            </Text>
            {authMode !== 'recover' && (
              <>
                <View style={styles.roleSwitcher}>
                  {authRoles.map((role) => (
                    <TouchableOpacity
                      key={role.key}
                      style={[
                        styles.roleButton,
                        authRole === role.key && styles.roleButtonActive,
                      ]}
                      onPress={() => setAuthRole(role.key)}
                      activeOpacity={0.9}
                    >
                      <Ionicons
                        name={role.icon}
                        size={18}
                        color={authRole === role.key ? '#fff' : '#C62828'}
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          authRole === role.key && styles.roleButtonTextActive,
                        ]}
                      >
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.roleHint}>
                  {authRole === 'worker'
                    ? 'Получайте смены, отслеживайте выплаты и подтверждайте навыки.'
                    : 'Публикуйте подработки, собирайте отклики и управляйте сменами.'}
                </Text>
              </>
            )}
            <TextInput
              placeholder="Электронная почта"
              placeholderTextColor="#BDBDBD"
              style={styles.authInput}
              value={email}
              autoCapitalize="none"
              onChangeText={(text) => handleFormChange('email', text)}
              keyboardType="email-address"
            />
            {(authMode === 'register' || authMode === 'recover') && (
              <TextInput
                placeholder={
                  authMode === 'register'
                    ? 'Номер телефона (например: +79824167606)'
                    : 'Телефон (если нет доступа к почте), например: +79824167606'
                }
                placeholderTextColor="#BDBDBD"
                style={styles.authInput}
                value={phone}
                onChangeText={(text) => handleFormChange('phone', text)}
                keyboardType="phone-pad"
              />
            )}
            {authMode !== 'recover' && (
              <TextInput
                placeholder="Пароль"
                placeholderTextColor="#BDBDBD"
                style={styles.authInput}
                value={password}
                onChangeText={(text) => handleFormChange('password', text)}
                secureTextEntry
              />
            )}
            {authMode === 'register' && (
              <TextInput
                placeholder="Повторите пароль"
                placeholderTextColor="#BDBDBD"
                style={styles.authInput}
                value={confirmPassword}
                onChangeText={(text) => handleFormChange('confirmPassword', text)}
                secureTextEntry
              />
            )}
            {authMode === 'register' && renderRoleSpecificFields()}
            {authMode === 'register' && (
              <>
                <Text style={styles.authSubLabel}>Подтверждение контактов</Text>
                <View style={styles.verificationBlock}>
                  <View style={styles.verificationHeader}>
                    <Text style={styles.verificationLabel}>Email</Text>
                    {verificationStatus.email && (
                      <Text style={styles.verificationStatusSuccess}>Подтверждён</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.verificationAction,
                      (!email.trim() || isSendingVerification.email) && styles.verificationActionDisabled,
                    ]}
                    onPress={() => handleSendVerification('email')}
                    disabled={!email.trim() || isSendingVerification.email}
                  >
                    {isSendingVerification.email ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.verificationActionText}>Отправить код</Text>
                    )}
                  </TouchableOpacity>
                  <TextInput
                    placeholder="Код из email"
                    placeholderTextColor="#BDBDBD"
                    style={styles.authInput}
                    keyboardType="number-pad"
                    value={verificationInputs.email}
                    onChangeText={(text) =>
                      setVerificationInputs((prev) => ({ ...prev, email: text }))
                    }
                  />
                  <TouchableOpacity
                    style={[
                      styles.verificationAction,
                      !verificationInputs.email && styles.verificationActionDisabled,
                    ]}
                    onPress={() => handleVerifyCode('email')}
                    disabled={!verificationInputs.email}
                  >
                    <Text style={styles.verificationActionText}>
                      {verificationStatus.email
                        ? 'Email подтверждён'
                        : 'Подтвердить email'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.verificationBlock}>
                  <View style={styles.verificationHeader}>
                    <Text style={styles.verificationLabel}>Телефон</Text>
                    {verificationStatus.phone && (
                      <Text style={styles.verificationStatusSuccess}>Подтверждён</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.verificationAction,
                      (!phone.trim() || isSendingVerification.phone) && styles.verificationActionDisabled,
                    ]}
                    onPress={() => handleSendVerification('phone')}
                    disabled={!phone.trim() || isSendingVerification.phone}
                  >
                    {isSendingVerification.phone ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.verificationActionText}>Отправить SMS-код</Text>
                    )}
                  </TouchableOpacity>
                  <TextInput
                    placeholder="Код из SMS"
                    placeholderTextColor="#BDBDBD"
                    style={styles.authInput}
                    keyboardType="number-pad"
                    value={verificationInputs.phone}
                    onChangeText={(text) =>
                      setVerificationInputs((prev) => ({ ...prev, phone: text }))
                    }
                  />
                  <TouchableOpacity
                    style={[
                      styles.verificationAction,
                      !verificationInputs.phone && styles.verificationActionDisabled,
                    ]}
                    onPress={() => handleVerifyCode('phone')}
                    disabled={!verificationInputs.phone}
                  >
                    <Text style={styles.verificationActionText}>
                      {verificationStatus.phone
                        ? 'Телефон подтверждён'
                        : 'Подтвердить телефон'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <TouchableOpacity
              style={[
                styles.authPrimaryBtn,
                isProcessingAuth && styles.authPrimaryBtnDisabled,
              ]}
              onPress={handleAuthSubmit}
              disabled={isProcessingAuth}
            >
              <Text style={styles.authPrimaryText}>{primaryLabel}</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              style={[
                styles.googleButton,
                (!googleRequest || isGoogleLoading) && styles.googleButtonDisabled,
              ]}
              onPress={handleGoogleSignIn}
              disabled={!googleRequest || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color="#C62828" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#C62828" />
                  <Text style={styles.googleButtonText}>Войти через Google</Text>
                </>
              )}
            </TouchableOpacity> */}
            <View style={styles.authLinksRow}>
              {authMode !== 'login' && (
                <TouchableOpacity onPress={() => setAuthMode('login')}>
                  <Text style={styles.authLink}>У меня есть аккаунт</Text>
                </TouchableOpacity>
              )}
              {authMode !== 'register' && (
                <TouchableOpacity onPress={() => setAuthMode('register')}>
                  <Text style={styles.authLink}>Регистрация</Text>
                </TouchableOpacity>
              )}
              {authMode !== 'recover' && (
                <TouchableOpacity onPress={() => setAuthMode('recover')}>
                  <Text style={styles.authLink}>Забыли пароль?</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.authBenefits}>
            {authBenefits.map((benefit) => (
              <AuthBenefit key={benefit.title} {...benefit} />
            ))}
          </View>
          <TouchableOpacity onPress={handleGuestAccess}>
            <Text style={styles.authSkip}>Продолжить как гость</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Логируем состояние аутентификации для отладки
  if (__DEV__) {
    console.log('[App render] isAuthenticated:', isAuthenticated, 'token:', token ? token.substring(0, 20) + '...' : 'null');
  }

  if (!isAuthenticated) {
    return renderAuthScreen();
  }

  // Обработка ошибок загрузки профиля
  // Не показываем ошибки сети - они обрабатываются через кеш
  // Показываем экран ошибки только для критичных ошибок, если нет данных профиля
  if (profileError && !isProfileLoading && !profileData) {
    // Если ошибка авторизации, автоматически разлогинить
    if (isUnauthorizedError(profileError)) {
      handleTokenExpired();
      return null;
    }

    // Не показываем ошибки сети - они обрабатываются через кеш в useProfile
    const isNetworkError = profileError instanceof NetworkError ||
      (profileError && typeof profileError === 'object' &&
        (profileError.name === 'NetworkError' ||
          (profileError.message && (
            profileError.message.toLowerCase().includes('network') ||
            profileError.message.toLowerCase().includes('нет подключения') ||
            profileError.message.toLowerCase().includes('failed to fetch')
          ))));

    // Для ошибок сети не показываем экран ошибки - профиль загрузится из кеша
    if (!isNetworkError) {
      // Для других критичных ошибок показываем экран ошибки только если нет данных
      const errorMessage = getErrorMessage(profileError);
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="light" />
          <View style={[styles.pageWrapper, { maxWidth: Math.min(width, 400) }]}>
            <ErrorDisplay
              error={profileError}
              title="Ошибка загрузки профиля"
              message={errorMessage}
              onRetry={() => {
                // Перезагрузить профиль
                queryClientInstance.invalidateQueries({ queryKey: ['profile', token] });
              }}
              onDismiss={handleLogout}
            />
          </View>
        </SafeAreaView>
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={[styles.backgroundGlow, { maxWidth: Math.min(width, 0) }]} />
      <View style={[styles.pageWrapper, { maxWidth: Math.min(width, 400) }]}>
        <LinearGradient
          colors={['#C62828', '#8E0000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, isCompact && styles.heroCompact]}
        >
          <View style={[styles.heroHeader, isCompact && styles.heroHeaderCompact]}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroLabel}>Профиль работника</Text>
              <Text style={styles.heroTitle}>Поиск физической работы</Text>
              <Text style={styles.heroSubtitle}>
                Быстрая подача заявки, прозрачные условия и готовность к сменам
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={18} color="#C62828" />
              <Text style={styles.heroBadgeText}>Top Performer</Text>
            </View>
          </View>
        </LinearGradient>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.contentContainer,
            isCompact && styles.contentCompact,
          ]}
        >
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'reviews' && renderReviews()}
          {activeTab === 'workers' && renderWorkers()}
          {activeTab === 'jobs' && renderJobs()}
          {activeTab === 'chats' && renderChats()}
          {activeTab === 'settings' && renderSettings()}
        </ScrollView>

        <ProfileEditModal
          visible={isProfileModalVisible}
          form={profileForm}
          errors={profileErrors}
          onFieldChange={handleProfileFieldChange}
          onClose={closeProfileEditor}
          onSave={handleProfileSave}
          isDirty={isProfileDirty}
          isValid={isProfileValid}
          isSaving={isProfileSaving}
        />

        {/* Модальное окно для списка документов */}
        <Modal
          visible={documentsModalVisible}
          animationType="slide"
          onRequestClose={() => setDocumentsModalVisible(false)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Мои документы</Text>
              <TouchableOpacity
                onPress={() => setDocumentsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {isDocumentsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles.loadingText}>Загрузка документов...</Text>
                </View>
              ) : documentsError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {getErrorMessage(documentsError) || 'Не удалось загрузить документы'}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => refetchDocuments()}
                  >
                    <Text style={styles.retryButtonText}>Повторить</Text>
                  </TouchableOpacity>
                </View>
              ) : documentsData && documentsData.length > 0 ? (
                <FlatList
                  data={documentsData}
                  keyExtractor={(item) => String(item.id || item._id)}
                  renderItem={({ item: doc }) => (
                    <DocumentCardItem
                      item={doc}
                      onView={(id) => {
                        setDocumentsModalVisible(false);
                        handleViewDocument(id);
                      }}
                      onDelete={handleDeleteDocument}
                      isDeleting={deleteDocumentMutation.isPending}
                    />
                  )}
                  scrollEnabled={false}
                  removeClippedSubviews={true}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={64} color={theme.muted} />
                  <Text style={styles.emptyText}>Документы не загружены</Text>
                  <Text style={styles.emptySubtext}>
                    Загрузите документы для подтверждения вашей квалификации
                  </Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.documentActionButton}
                onPress={() => {
                  setDocumentsModalVisible(false);
                  handleFileSelect(null, false);
                }}
                disabled={uploadDocumentMutation.isPending}
              >
                <Ionicons name="document-attach-outline" size={20} color={theme.primary} />
                <Text style={styles.documentActionButtonText}>
                  {uploadDocumentMutation.isPending ? 'Загрузка...' : 'Загрузить документ'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.documentActionButton}
                onPress={() => {
                  setDocumentsModalVisible(false);
                  handleFileSelect(null, true);
                }}
                disabled={uploadDocumentPhotoMutation.isPending}
              >
                <Ionicons name="camera-outline" size={20} color={theme.primary} />
                <Text style={styles.documentActionButtonText}>
                  {uploadDocumentPhotoMutation.isPending ? 'Загрузка...' : 'Загрузить фото'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Модальное окно для просмотра документа */}
        <Modal
          visible={documentViewModalVisible}
          animationType="slide"
          onRequestClose={handleCloseDocumentView}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDocument?.title || selectedDocument?.name || 'Просмотр документа'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseDocumentView}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {selectedDocument ? (
                <>
                  {selectedDocument.status && (
                    <View style={[
                      styles.documentStatusBadge,
                      { backgroundColor: selectedDocument.status === 'verified' ? '#66BB6A' : selectedDocument.status === 'pending' ? '#FFA726' : '#EF5350' }
                    ]}>
                      <Text style={styles.documentStatusText}>
                        {selectedDocument.status === 'verified' ? 'Проверен' : selectedDocument.status === 'pending' ? 'На проверке' : 'Отклонён'}
                      </Text>
                    </View>
                  )}
                  {selectedDocument.description && (
                    <Text style={styles.documentDescription}>
                      {selectedDocument.description}
                    </Text>
                  )}
                  {selectedDocument.uploadedAt && (
                    <Text style={styles.documentDate}>
                      Загружен: {new Date(selectedDocument.uploadedAt).toLocaleDateString('ru-RU')}
                    </Text>
                  )}
                  {selectedDocument.url || selectedDocument.fileUrl ? (
                    <View style={styles.documentViewer}>
                      {selectedDocument.type === 'photo' || selectedDocument.mimeType?.startsWith('image/') ? (
                        <View style={styles.documentImageContainer}>
                          <LazyImage
                            source={{ uri: selectedDocument.url || selectedDocument.fileUrl }}
                            style={styles.documentImage}
                            resizeMode="contain"
                          />
                          <Text style={styles.documentViewerLink} onPress={() => {
                            if (Platform.OS === 'web') {
                              window.open(selectedDocument.url || selectedDocument.fileUrl, '_blank');
                            } else {
                              Alert.alert('Просмотр', 'Для просмотра изображения откройте его в браузере');
                            }
                          }}>
                            Открыть в браузере
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.documentViewerContainer}>
                          <Ionicons name="document-text-outline" size={64} color={theme.muted} />
                          <Text style={styles.documentViewerText}>
                            Документ готов к просмотру
                          </Text>
                          <TouchableOpacity
                            style={styles.documentViewerButton}
                            onPress={() => {
                              if (Platform.OS === 'web') {
                                window.open(selectedDocument.url || selectedDocument.fileUrl, '_blank');
                              } else {
                                Alert.alert('Просмотр', 'Для просмотра документа откройте его в браузере');
                              }
                            }}
                          >
                            <Text style={styles.documentViewerButtonText}>Открыть документ</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.documentViewerContainer}>
                      <Ionicons name="document-text-outline" size={64} color={theme.muted} />
                      <Text style={styles.documentViewerText}>
                        Документ загружен, но URL недоступен
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles.loadingText}>Загрузка документа...</Text>
                </View>
              )}
            </ScrollView>
            {selectedDocument && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.documentActionButton, styles.documentActionButtonDanger]}
                  onPress={async () => {
                    const docId = selectedDocument.id || selectedDocument._id;
                    handleCloseDocumentView();
                    try {
                      await deleteDocumentMutation.mutateAsync(docId);
                      await refetchDocuments();
                      Alert.alert('Успешно', 'Документ удалён');
                    } catch (error) {
                      Alert.alert('Ошибка', getErrorMessage(error) || 'Не удалось удалить документ');
                    }
                  }}
                  disabled={deleteDocumentMutation.isPending}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF5350" />
                  <Text style={[styles.documentActionButtonText, styles.documentActionButtonTextDanger]}>
                    {deleteDocumentMutation.isPending ? 'Удаление...' : 'Удалить документ'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Modal>

        {/* Модальное окно для создания отзыва */}
        <Modal
          visible={reviewModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseReviewModal}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Создать отзыв</Text>
              <TouchableOpacity onPress={handleCloseReviewModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.reviewFormContainer}>
                <View style={styles.profileField}>
                  <Text style={styles.profileLabel}>Рейтинг</Text>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                        style={styles.starButton}
                      >
                        <Ionicons
                          name={star <= reviewForm.rating ? 'star' : 'star-outline'}
                          size={32}
                          color="#FFCA28"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.ratingHint}>
                    {reviewForm.rating === 1 ? 'Очень плохо' :
                      reviewForm.rating === 2 ? 'Плохо' :
                        reviewForm.rating === 3 ? 'Удовлетворительно' :
                          reviewForm.rating === 4 ? 'Хорошо' :
                            reviewForm.rating === 5 ? 'Отлично' : ''}
                  </Text>
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.profileLabel}>ID пользователя (опционально)</Text>
                  <TextInput
                    style={styles.profileInput}
                    placeholder="Оставьте пустым для общего отзыва"
                    placeholderTextColor={theme.muted}
                    value={reviewForm.userId}
                    onChangeText={(text) => setReviewForm((prev) => ({ ...prev, userId: text }))}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.profileLabel}>ID работы (опционально)</Text>
                  <TextInput
                    style={styles.profileInput}
                    placeholder="Оставьте пустым для общего отзыва"
                    placeholderTextColor={theme.muted}
                    value={reviewForm.jobId}
                    onChangeText={(text) => setReviewForm((prev) => ({ ...prev, jobId: text }))}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.profileLabel}>Комментарий *</Text>
                  <TextInput
                    style={[styles.profileInput, styles.profileInputMultiline]}
                    placeholder="Расскажите о своем опыте..."
                    placeholderTextColor={theme.muted}
                    value={reviewForm.comment}
                    onChangeText={(text) => setReviewForm((prev) => ({ ...prev, comment: text }))}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  <Text style={styles.characterCount}>
                    {reviewForm.comment.length} символов
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (!reviewForm.comment.trim() || createReviewMutation.isPending) && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleCreateReview}
                  disabled={!reviewForm.comment.trim() || createReviewMutation.isPending}
                >
                  {createReviewMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Создать отзыв</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <FloatingCTA compact={isCompact} {...fabPreset} />
      </View>
      <BottomNavigation
        compact={isCompact}
        activeTab={activeTab}
        onSelect={setActiveTab}
        items={currentNav}
      />
    </SafeAreaView>
  );
}

const Section = ({ title, children, compact }) => (
  <View style={[styles.section, compact && styles.sectionCompact]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const ProfileFormFields = ({ form, errors, onFieldChange }) => (
  <>
    <ProfileFieldInput
      label="ФИО"
      value={form.fullName}
      onChangeText={(value) => onFieldChange('fullName', value)}
      placeholder="Введите полное имя"
      error={errors.fullName}
      autoCapitalize="words"
    />
    <ProfileFieldInput
      label="Опыт работы"
      value={form.experience}
      onChangeText={(value) => onFieldChange('experience', value)}
      placeholder="Например: 6 лет, стройка и отделка"
      multiline
    />
    <ProfileFieldInput
      label="Документы"
      value={form.documentsNote}
      onChangeText={(value) => onFieldChange('documentsNote', value)}
      placeholder="Перечислите документы"
      multiline
    />
    <InlineSelect
      label="Готов к выездам"
      value={form.readyToTravel}
      options={travelPreferences}
      onSelect={(value) => onFieldChange('readyToTravel', value)}
    />
    <ProfileFieldInput
      label="Паспорт"
      value={form.passport}
      onChangeText={(value) => onFieldChange('passport', value)}
      placeholder="AA1234567"
      autoCapitalize="characters"
      error={errors.passport}
    />
    <ProfileFieldInput
      label="ИНН"
      value={form.inn}
      onChangeText={(value) => onFieldChange('inn', value)}
      placeholder="9 цифр"
      keyboardType="number-pad"
      error={errors.inn}
    />
    <ProfileFieldInput
      label="Телефон"
      value={form.phone}
      onChangeText={(value) => onFieldChange('phone', value)}
      placeholder="+79824167606"
      keyboardType="phone-pad"
      error={errors.phone}
    />
    <ProfileFieldInput
      label="WhatsApp"
      value={form.whatsapp}
      onChangeText={(value) => onFieldChange('whatsapp', value)}
      placeholder="+79824167606"
      keyboardType="phone-pad"
      error={errors.whatsapp}
    />
    <ProfileFieldInput
      label="Telegram"
      value={form.telegram}
      onChangeText={(value) => onFieldChange('telegram', value)}
      placeholder="@username"
    />
    <ProfileFieldInput
      label="Email"
      value={form.email}
      onChangeText={(value) => onFieldChange('email', value)}
      placeholder="worker@example.com"
      keyboardType="email-address"
      autoCapitalize="none"
      error={errors.email}
    />
  </>
);

const ProfileFieldInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  error,
  autoCapitalize = 'none',
}) => (
  <View style={styles.profileField}>
    <Text style={styles.profileLabel}>{label}</Text>
    <TextInput
      value={value ?? ''}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.muted}
      style={[
        styles.profileInput,
        multiline && styles.profileInputMultiline,
        error && styles.profileInputError,
      ]}
      keyboardType={keyboardType}
      multiline={multiline}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
    />
    {!!error && <Text style={styles.profileStatusError}>{error}</Text>}
  </View>
);

const InlineSelect = ({ label, value, options, onSelect }) => (
  <View style={styles.profileField}>
    <Text style={styles.profileLabel}>{label}</Text>
    <View style={styles.inlineSelectRow}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.inlineSelectOption,
              isActive && styles.inlineSelectOptionActive,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.inlineSelectText,
                isActive && styles.inlineSelectTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const ProfileEditModal = ({
  visible,
  form,
  errors,
  onFieldChange,
  onClose,
  onSave,
  isDirty,
  isValid,
  isSaving,
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.profileModalOverlay}>
      <View style={styles.profileModalContent}>
        <View style={styles.profileModalHeader}>
          <Text style={styles.profileModalTitle}>Редактировать профиль</Text>
          <TouchableOpacity onPress={onClose} style={styles.profileModalClose}>
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.profileModalBody}
          showsVerticalScrollIndicator={false}
        >
          <ProfileFormFields
            form={form}
            errors={errors}
            onFieldChange={onFieldChange}
          />
          <ProfileFieldInput
            label="Старт"
            value={form.startWindow}
            onChangeText={(value) => onFieldChange('startWindow', value)}
          />
          <ProfileFieldInput
            label="Минимальная ставка"
            value={form.minRate}
            onChangeText={(value) => onFieldChange('minRate', value)}
          />
          <ProfileFieldInput
            label="Желаемая ставка"
            value={form.desiredRate}
            onChangeText={(value) => onFieldChange('desiredRate', value)}
          />
        </ScrollView>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalSecondaryButton} onPress={onClose}>
            <Text style={styles.modalSecondaryButtonText}>Отменить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalPrimaryButton,
              (!isDirty || !isValid || isSaving) && styles.buttonDisabled,
            ]}
            onPress={onSave}
            disabled={!isDirty || !isValid || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.modalPrimaryButtonText}>Сохранить</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// Компонент для lazy loading изображений
const LazyImage = memo(({ source, style, placeholder, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (Platform.OS === 'web') {
    return (
      <Image
        source={source}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
    );
  }

  return (
    <View style={style}>
      {isLoading && !hasError && (
        <View style={[style, { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
          {placeholder || <ActivityIndicator size="small" color={theme.primary} />}
        </View>
      )}
      {!hasError && (
        <Image
          source={source}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      {hasError && (
        <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
          <Ionicons name="image-outline" size={24} color={theme.muted} />
        </View>
      )}
    </View>
  );
});

LazyImage.displayName = 'LazyImage';

// Мемоизированный компонент карточки вакансии для FlatList
const JobCardItem = memo(({ item, isCompact, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item.id || item._id);
  }, [item.id, item._id, onPress]);

  return (
    <TouchableOpacity
      style={[styles.jobCard, isCompact && styles.jobCardCompact]}
      onPress={handlePress}
    >
      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.jobCompany}>{item.company || item.employer?.name || 'Компания'}</Text>
      {item.salary && (
        <Text style={styles.jobSalary}>
          {typeof item.salary === 'object'
            ? (item.salary.min || item.salary.max
              ? `${item.salary.min || ''} - ${item.salary.max || ''} ${item.salary.currency || 'сум'}`
              : `${item.salary.currency || 'сум'}`)
            : item.salary}
        </Text>
      )}
      {item.location && (
        <View style={styles.jobLocation}>
          <Ionicons name="location-outline" size={16} color={theme.muted} />
          <Text style={styles.jobLocationText}>{item.location}</Text>
        </View>
      )}
      {item.skills && item.skills.length > 0 && (
        <View style={styles.tagsRow}>
          {item.skills.slice(0, 3).map((skill, index) => (
            <Tag key={index} label={typeof skill === 'string' ? (skill && skill !== '.' ? skill : '') : (skill.name && skill.name !== '.' ? skill.name : '')} />
          ))}
        </View>
      )}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.map((tag, index) => (
            <Tag key={index} label={tag} />
          ))}
        </View>
      )}
      <TouchableOpacity
        style={styles.applyButton}
        onPress={handlePress}
      >
        <Text style={styles.applyButtonText}>Откликнуться</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

JobCardItem.displayName = 'JobCardItem';

// Мемоизированный компонент карточки документа для FlatList
const DocumentCardItem = memo(({ item, onView, onDelete, isDeleting }) => (
  <View style={styles.documentCard}>
    <View style={styles.documentCardHeader}>
      <Ionicons
        name={item.type === 'photo' ? 'image-outline' : 'document-text-outline'}
        size={32}
        color={theme.primary}
      />
      <View style={styles.documentCardInfo}>
        <Text style={styles.documentCardTitle}>
          {item.title || item.name || 'Документ'}
        </Text>
        {item.description && (
          <Text style={styles.documentCardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.uploadedAt && (
          <Text style={styles.documentCardDate}>
            Загружен: {new Date(item.uploadedAt).toLocaleDateString('ru-RU')}
          </Text>
        )}
      </View>
    </View>
    {item.status && (
      <View style={[
        styles.documentStatusBadge,
        { backgroundColor: item.status === 'verified' ? '#66BB6A' : item.status === 'pending' ? '#FFA726' : '#EF5350' }
      ]}>
        <Text style={styles.documentStatusText}>
          {item.status === 'verified' ? 'Проверен' : item.status === 'pending' ? 'На проверке' : 'Отклонён'}
        </Text>
      </View>
    )}
    <View style={styles.documentCardActions}>
      <TouchableOpacity
        style={styles.documentCardButton}
        onPress={() => onView(item.id || item._id)}
      >
        <Ionicons name="eye-outline" size={18} color={theme.primary} />
        <Text style={styles.documentCardButtonText}>Просмотр</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.documentCardButton, styles.documentCardButtonDanger]}
        onPress={() => onDelete(item.id || item._id)}
        disabled={isDeleting}
      >
        <Ionicons name="trash-outline" size={18} color="#EF5350" />
        <Text style={[styles.documentCardButtonText, styles.documentCardButtonTextDanger]}>Удалить</Text>
      </TouchableOpacity>
    </View>
  </View>
));

DocumentCardItem.displayName = 'DocumentCardItem';

const Chip = memo(({ label, onPress, variant = 'solid' }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.chip,
      variant === 'outline' && styles.chipOutline,
    ]}
  >
    <Text
      style={[
        styles.chipText,
        variant === 'outline' && styles.chipTextOutline,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
));

Chip.displayName = 'Chip';

const Tag = memo(({ label }) => {
  if (!label || label === '') {
    return null;
  }
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
});

Tag.displayName = 'Tag';

const WorkerCard = memo(({
  name,
  role,
  rating,
  experience,
  rate,
  availability,
  badges,
  skills,
}) => (
  <View style={styles.workerCard}>
    <View style={styles.workerHeader}>
      <View>
        <Text style={styles.workerName}>{name}</Text>
        <Text style={styles.workerRole}>{role}</Text>
      </View>
      <View style={styles.workerRating}>
        <Ionicons name="star" size={16} color="#FFCA28" />
        <Text style={styles.workerRatingText}>{rating}</Text>
      </View>
    </View>
    <Text style={styles.workerMeta}>
      {[experience && experience !== '.' ? experience : null, rate && rate !== '.' ? rate : null].filter(Boolean).join(' · ') || ''}
    </Text>
    <Text style={styles.workerAvailability}>{availability}</Text>
    <View style={styles.badgeRow}>
      {badges.map((badge) => (
        <View key={badge} style={styles.badgePill}>
          <Text style={styles.badgePillText}>{badge}</Text>
        </View>
      ))}
    </View>
    <Text style={styles.workerSkills}>
      Навыки: {skills.join(', ')}
    </Text>
    <TouchableOpacity style={styles.workerButton}>
      <Text style={styles.workerButtonText}>Пригласить</Text>
    </TouchableOpacity>
  </View>
));

WorkerCard.displayName = 'WorkerCard';

const ClosedShiftCard = memo(({
  title,
  date,
  payout,
  location,
  rating,
  feedback,
}) => (
  <View style={styles.closedCard}>
    <View style={styles.closedHeader}>
      <Text style={styles.closedTitle}>{title}</Text>
      <Text style={styles.closedDate}>{date}</Text>
    </View>
    <Text style={styles.closedMeta}>{location}</Text>
    <Text style={styles.closedPay}>{payout}</Text>
    <View style={styles.closedRating}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Ionicons
          key={idx}
          name={idx < rating ? 'star' : 'star-outline'}
          size={14}
          color="#FFCA28"
        />
      ))}
    </View>
    <Text style={styles.closedFeedback}>{feedback}</Text>
  </View>
));

ClosedShiftCard.displayName = 'ClosedShiftCard';

const JobCollectionCard = ({ title, count, shift, rate, compact }) => (
  <View style={[styles.collectionCard, compact && styles.collectionCardCompact]}>
    <View style={styles.collectionHeader}>
      <Text style={styles.collectionTitle}>{title}</Text>
      <View style={styles.collectionBadge}>
        <Text style={styles.collectionBadgeText}>{count} смен</Text>
      </View>
    </View>
    <Text style={styles.collectionShift}>{shift}</Text>
    <Text style={styles.collectionRate}>{rate}</Text>
  </View>
);

const ChatCard = memo(({ name, snippet, time, unread, status, compact }) => (
  <View style={[styles.chatCard, compact && styles.chatCardCompact]}>
    <View style={styles.chatAvatar}>
      <Text style={styles.chatAvatarText}>{name[0]}</Text>
    </View>
    <View style={styles.chatBody}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatName}>{name}</Text>
        {time ? <Text style={styles.chatTime}>{time}</Text> : null}
      </View>
      {snippet ? <Text style={styles.chatSnippet}>{snippet}</Text> : null}
      {status && status.trim() ? <Text style={styles.chatStatus}>{status}</Text> : null}
    </View>
    {unread > 0 && (
      <View style={styles.chatUnread}>
        <Text style={styles.chatUnreadText}>{unread}</Text>
      </View>
    )}
  </View>
));

ChatCard.displayName = 'ChatCard';

// Мемоизированный компонент сообщения для FlatList
const ChatMessageItem = memo(({ message, profileData }) => {
  const isMyMessage =
    message.senderId === profileData?.id ||
    message.sender?.id === profileData?.id ||
    message.senderId === 1 ||
    message.sender?.id === 1 ||
    message.id?.toString().startsWith('temp-');

  return (
    <View
      style={[
        styles.chatMessage,
        isMyMessage ? styles.chatMessageMy : styles.chatMessageOther,
      ]}
    >
      <View
        style={[
          styles.chatMessageBubble,
          isMyMessage ? styles.chatMessageBubbleMy : styles.chatMessageBubbleOther,
        ]}
      >
        <Text
          style={[
            styles.chatMessageText,
            isMyMessage ? styles.chatMessageTextMy : styles.chatMessageTextOther,
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.chatMessageTime,
            isMyMessage ? styles.chatMessageTimeMy : styles.chatMessageTimeOther,
          ]}
        >
          {message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
            : null}
        </Text>
      </View>
      {message.status === 'sending' && (
        <ActivityIndicator size="small" color={theme.muted} style={{ marginLeft: 8 }} />
      )}
    </View>
  );
});

ChatMessageItem.displayName = 'ChatMessageItem';

const SettingToggle = ({
  label,
  subtitle,
  value,
  onToggle,
  compact,
}) => (
  <View style={[styles.settingRow, compact && styles.settingRowCompact]}>
    <View style={styles.settingBody}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingSubtitle}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      thumbColor={value ? '#fff' : '#f4f4f4'}
      trackColor={{ false: '#E0E0E0', true: '#C62828' }}
    />
  </View>
);

const ShortcutCard = ({ title, subtitle, icon }) => (
  <View style={styles.shortcutCard}>
    <Ionicons name={icon} size={20} color="#C62828" />
    <Text style={styles.shortcutTitle}>{title}</Text>
    <Text style={styles.shortcutSubtitle}>{subtitle}</Text>
  </View>
);

const SkillEditor = ({ categories, onLevelChange, onToggleGrow }) => (
  <View style={styles.skillEditor}>
    {categories.map((category) => (
      <View key={category.key} style={styles.skillCategoryCard}>
        <View style={styles.skillCategoryHeader}>
          <View>
            <Text style={styles.skillCategoryTitle}>{category.title}</Text>
            <Text style={styles.skillCategoryMeta}>{category.meta}</Text>
          </View>
          <View style={styles.skillCategoryBadge}>
            <Ionicons name="sparkles" size={14} color={theme.primary} />
            <Text style={styles.skillCategoryBadgeText}>
              {category.skills.length} навыка
            </Text>
          </View>
        </View>
        {category.skills.map((skill) => (
          <SkillRow
            key={skill.key}
            categoryKey={category.key}
            skill={skill}
            onLevelChange={onLevelChange}
            onToggleGrow={onToggleGrow}
          />
        ))}
      </View>
    ))}
  </View>
);

const SkillRow = ({ categoryKey, skill, onLevelChange, onToggleGrow }) => (
  <View style={styles.skillRow}>
    <View style={styles.skillRowHeader}>
      <Text style={styles.skillName}>{skill.label}</Text>
      <View style={styles.skillRatingBadge}>
        <Ionicons name="star" size={14} color="#FFB300" />
        <Text style={styles.skillRatingValue}>{skill.level}/5</Text>
      </View>
    </View>
    <View style={styles.skillTagsRow}>
      {skill.tags.map((tag) => (
        <View key={tag} style={styles.skillTag}>
          <Text style={styles.skillTagText}>{tag}</Text>
        </View>
      ))}
    </View>
    <Slider
      minimumValue={1}
      maximumValue={5}
      step={1}
      value={skill.level}
      minimumTrackTintColor={theme.primary}
      maximumTrackTintColor="#FFE0E0"
      thumbTintColor={theme.primary}
      onValueChange={(value) => onLevelChange(categoryKey, skill.key, value)}
      style={styles.skillSlider}
    />
    <Text style={styles.skillLevelHint}>{skillLevelLabels[skill.level]}</Text>
    {skill.usages?.length > 0 && (
      <View style={styles.skillUsageRow}>
        {skill.usages.map((usage) => (
          <View key={usage} style={styles.skillUsagePill}>
            <Text style={styles.skillUsageText}>{usage}</Text>
          </View>
        ))}
      </View>
    )}
    <TouchableOpacity
      style={[
        styles.skillGrowButton,
        skill.wantToGrow && styles.skillGrowButtonActive,
      ]}
      onPress={() => onToggleGrow(categoryKey, skill.key)}
      accessibilityRole="button"
      accessibilityState={{ selected: skill.wantToGrow }}
    >
      <Ionicons
        name={skill.wantToGrow ? 'trending-up' : 'add-circle-outline'}
        size={16}
        color={theme.primary}
      />
      <Text style={styles.skillGrowButtonText}>
        {skill.wantToGrow ? 'Отмечен для работы' : 'Хочу работать'}
      </Text>
    </TouchableOpacity>
  </View>
);

const AvailabilityPlanner = ({
  calendar,
  matrix,
  onToggleSlot,
  quickTemplates,
  onApplyTemplate,
  activeTemplate,
  vacation,
  onToggleVacation,
  compact,
  onAcceptShift,
  onRejectShift,
  isLoadingShifts,
}) => (
  <View
    style={[styles.availabilityPlanner, compact && styles.availabilityPlannerCompact]}
  >
    <Text style={styles.blockTitle}>Календарь смен</Text>
    {isLoadingShifts ? (
      <View style={styles.shiftCalendarLoading}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={styles.shiftCalendarLoadingText}>Загрузка смен...</Text>
      </View>
    ) : (
      <ShiftCalendar
        days={calendar}
        onAcceptShift={onAcceptShift}
        onRejectShift={onRejectShift}
      />
    )}
    <Text style={styles.blockTitle}>Недельная матрица часов</Text>
    <WeeklyHoursMatrix matrix={matrix} onToggleSlot={onToggleSlot} />
    <Text style={styles.blockTitle}>Быстрые шаблоны</Text>
    <View style={styles.templatesRow}>
      {quickTemplates.map((template) => (
        <QuickTemplateButton
          key={template.key}
          template={template}
          onPress={() => onApplyTemplate(template.key)}
          active={activeTemplate === template.key}
        />
      ))}
    </View>
    <VacationBanner
      active={vacation.active}
      from={vacation.from}
      to={vacation.to}
      onToggle={onToggleVacation}
    />
  </View>
);

const ShiftCalendar = ({ days, onAcceptShift, onRejectShift }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.shiftCalendarRow}
  >
    {days.map((day) => {
      const hasAvailableShift = day.shifts && day.shifts.some(s =>
        s.status === 'available' || s.status === 'pending'
      );
      const hasAcceptedShift = day.shifts && day.shifts.some(s =>
        s.status === 'accepted' || s.status === 'confirmed'
      );
      const availableShift = day.shifts?.find(s =>
        s.status === 'available' || s.status === 'pending'
      );

      return (
        <TouchableOpacity
          key={day.key}
          style={[
            styles.shiftCalendarItem,
            styles[`shiftCalendarItem_${day.status}`],
          ]}
          onPress={() => {
            if (hasAvailableShift && availableShift && onAcceptShift) {
              Alert.alert(
                'Принять смену?',
                `Принять смену "${day.title}" на ${day.dateLabel}?`,
                [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Принять',
                    onPress: () => onAcceptShift(availableShift.id),
                    style: 'default'
                  },
                ]
              );
            } else if (hasAcceptedShift && onRejectShift) {
              const acceptedShift = day.shifts.find(s =>
                s.status === 'accepted' || s.status === 'confirmed'
              );
              if (acceptedShift) {
                Alert.alert(
                  'Отклонить смену?',
                  `Отклонить смену "${day.title}" на ${day.dateLabel}?`,
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Отклонить',
                      onPress: () => onRejectShift(acceptedShift.id),
                      style: 'destructive'
                    },
                  ]
                );
              }
            }
          }}
          disabled={!hasAvailableShift && !hasAcceptedShift}
        >
          <Text style={styles.shiftCalendarDay}>{day.dayLabel}</Text>
          <Text style={styles.shiftCalendarDate}>{day.dateLabel}</Text>
          <Text style={styles.shiftCalendarTitle}>{day.title}</Text>
          <Text style={styles.shiftCalendarHours}>{day.hours}</Text>
          {hasAvailableShift && (
            <View style={styles.shiftCalendarActionBadge}>
              <Ionicons name="add-circle" size={16} color={theme.primary} />
              <Text style={styles.shiftCalendarActionText}>Нажмите для принятия</Text>
            </View>
          )}
          {hasAcceptedShift && (
            <View style={styles.shiftCalendarActionBadge}>
              <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
              <Text style={styles.shiftCalendarActionText}>Нажмите для отмены</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const WeeklyHoursMatrix = ({ matrix, onToggleSlot }) => (
  <View style={styles.weekMatrixWrapper}>
    <View style={styles.weekMatrixHeader}>
      <View style={styles.weekMatrixCornerCell}>
        <Text style={styles.weekMatrixLegend}>Слоты</Text>
      </View>
      {weekDays.map((day) => (
        <View key={day} style={styles.weekMatrixHeaderCell}>
          <Text style={styles.weekMatrixHeaderText}>{day}</Text>
        </View>
      ))}
    </View>
    {matrix.map((row) => (
      <View key={row.key} style={styles.weekMatrixRow}>
        <View style={styles.weekMatrixLabelCell}>
          <Text style={styles.weekMatrixLabel}>{row.label}</Text>
          <Text style={styles.weekMatrixHours}>{row.hours}</Text>
        </View>
        {weekDays.map((day) => {
          const active = row.days[day];
          return (
            <TouchableOpacity
              key={`${row.key}-${day}`}
              style={[
                styles.weekMatrixCell,
                active && styles.weekMatrixCellActive,
              ]}
              onPress={() => onToggleSlot(row.key, day)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              {active && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </View>
    ))}
  </View>
);

const QuickTemplateButton = ({ template, active, onPress }) => (
  <TouchableOpacity
    style={[styles.templateButton, active && styles.templateButtonActive]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
  >
    <Text style={styles.templateButtonLabel}>{template.label}</Text>
    <Text style={styles.templateButtonHint}>{template.description}</Text>
  </TouchableOpacity>
);

const VacationBanner = ({ active, from, to, onToggle }) => (
  <TouchableOpacity
    style={[styles.vacationBanner, active && styles.vacationBannerActive]}
    onPress={onToggle}
    accessibilityRole="button"
    accessibilityState={{ pressed: active }}
  >
    <View style={styles.vacationBannerBody}>
      <Ionicons name="airplane" size={18} color={theme.primary} />
      <View>
        <Text style={styles.vacationBannerTitle}>
          {active ? 'В отпуске' : 'Запланировать отпуск'}
        </Text>
        <Text style={styles.vacationBannerDates}>
          {(from && from !== '.' ? from : '')} — {(to && to !== '.' ? to : '')}
        </Text>
      </View>
    </View>
    <Text style={styles.vacationBannerAction}>
      {active ? 'Отменить' : 'Зафиксировать'}
    </Text>
  </TouchableOpacity>
);

const AuthBenefit = ({ icon, title, subtitle }) => (
  <View style={styles.authBenefit}>
    <View style={styles.authBenefitIcon}>
      <Ionicons name={icon} size={18} color="#C62828" />
    </View>
    <View style={styles.authBenefitBody}>
      <Text style={styles.authBenefitTitle}>{title}</Text>
      <Text style={styles.authBenefitSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

const ReviewCard = memo(({ employer, shift, rating, text, date }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <Text style={styles.reviewEmployer}>{employer}</Text>
      <Text style={styles.reviewDate}>{date}</Text>
    </View>
    <Text style={styles.reviewShift}>{shift}</Text>
    <View style={styles.reviewRating}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Ionicons
          key={idx}
          name={idx < rating ? 'star' : 'star-outline'}
          size={16}
          color="#FFCA28"
        />
      ))}
    </View>
    <Text style={styles.reviewText}>{text}</Text>
  </View>
));

ReviewCard.displayName = 'ReviewCard';

const TimelineItem = memo(({ title, meta, status, compact }) => (
  <View style={[styles.timelineItem, compact && styles.timelineItemCompact]}>
    <View style={[styles.timelineDot, styles[`timelineDot_${status}`]]} />
    <View style={styles.timelineContent}>
      <Text style={styles.timelineTitle}>{title}</Text>
      <Text style={styles.timelineMeta}>{meta}</Text>
    </View>
    {status === 'upcoming' && (
      <TouchableOpacity
        style={[
          styles.timelineAction,
          compact && styles.timelineActionCompact,
        ]}
      >
        <Ionicons name="notifications" size={18} color="#C62828" />
        <Text style={styles.timelineActionText}>Напомнить</Text>
      </TouchableOpacity>
    )}
  </View>
));

TimelineItem.displayName = 'TimelineItem';

const FloatingCTA = ({ compact, label, icon }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    style={[styles.fab, compact && styles.fabCompact]}
  >
    <LinearGradient
      colors={['#FF7043', '#C62828']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fabInner}
    >
      <Ionicons name={icon} size={20} color="#fff" />
      <Text style={styles.fabText}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const BottomNavigation = ({ compact, activeTab, onSelect, items }) => (
  <View style={[styles.bottomNav, compact && styles.bottomNavCompact]}>
    {items.map((item) => (
      <TouchableOpacity
        key={item.label}
        style={styles.bottomNavItem}
        onPress={() => onSelect(item.key)}
        activeOpacity={0.9}
      >
        <Ionicons
          name={item.icon}
          size={22}
          color={item.key === activeTab ? '#C62828' : '#A0A0A0'}
        />
        <Text
          style={[
            styles.bottomNavLabel,
            item.key === activeTab && styles.bottomNavLabelActive,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);
