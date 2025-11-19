import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
} from 'react-native';
import { useMemo, useState, useCallback, useEffect, useReducer, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest as useGoogleAuthRequest } from 'expo-auth-session/providers/google';
import { useQueryClient } from '@tanstack/react-query';
import { useProfileQuery, useUpdateProfile, useDocumentStatusesQuery } from './hooks/useProfile';
import { initSyncService } from './services/syncService';
import { initWebSocketService } from './services/websocketService';
import { migrateCache } from './services/cacheService';

WebBrowser.maybeCompleteAuthSession();

const theme = {
  primary: '#C62828',
  background: '#FFF5F5',
  text: '#1C1C1C',
  muted: '#7A7A7A',
  card: '#FFFFFF',
  accent: '#FF7043',
  border: '#FFD1D1',
};

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
  phone: '+998 90 123 45 67',
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

const formatUzbekPhone = (value = '') => {
  let digits = normalizeDigits(value);

  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  digits = digits.slice(0, 9);
  const parts = [];
  if (digits.length > 0) {
    parts.push(digits.slice(0, 2));
  }
  if (digits.length > 2) {
    parts.push(digits.slice(2, 5));
  }
  if (digits.length > 5) {
    parts.push(digits.slice(5, 7));
  }
  if (digits.length > 7) {
    parts.push(digits.slice(7, 9));
  }

  return ['+998', ...parts.filter(Boolean)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const sanitizeProfileValue = (field, value) => {
  if (field === 'passport') {
    return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 9);
  }

  if (field === 'inn') {
    return normalizeDigits(value).slice(0, 9);
  }

  if (field === 'phone' || field === 'whatsapp') {
    return formatUzbekPhone(value);
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
    !/^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(value)
  ) {
    return 'Введите телефон в формате +998 90 123 45 67';
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

const createProfileState = (initialProfile) => {
  const snapshot = { ...initialProfile };
  return {
    snapshot,
    draft: { ...snapshot },
    errors: reduceProfileErrors(snapshot),
    isDirty: false,
    isSaving: false,
    modalVisible: false,
    lastError: null,
    lastSavedAt: null,
    isHydrated: false,
    previousSnapshot: { ...snapshot },
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
      const snapshot = { ...action.payload };
      return {
        ...state,
        snapshot,
        draft: { ...snapshot },
        errors: reduceProfileErrors(snapshot),
        isDirty: false,
        isHydrated: true,
        previousSnapshot: { ...snapshot },
      };
    }
    case 'hydrate_draft': {
      const sanitizedDraft = normalizeProfileDraft(action.payload);
      const draft = { ...state.draft, ...sanitizedDraft };
      return {
        ...state,
        draft,
        errors: reduceProfileErrors(draft),
        isDirty: true,
      };
    }
    case 'update_field': {
      const { field, value } = action.payload;
      const sanitized = sanitizeProfileValue(field, value);
      const draft = {
        ...state.draft,
        [field]: sanitized,
      };
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
        previousSnapshot: { ...state.snapshot },
        snapshot: { ...action.payload },
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
    createProfileState(initialProfile)
  );

  useEffect(() => {
    dispatch({ type: 'hydrate_base', payload: initialProfile });
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

    const payload = { ...state.draft };
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

const googleProfileEndpoint = 'https://www.googleapis.com/oauth2/v3/userinfo';

const fetchGoogleProfile = async (token) => {
  try {
    const response = await fetch(googleProfileEndpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('profile_request_failed');
    }

    return response.json();
  } catch (error) {
    console.warn(
      'Не удалось получить профиль Google',
      error?.message || error
    );
    throw error;
  }
};

const resolveGoogleAuthConfig = () => {
  const extra =
    Constants?.expoConfig?.extra?.googleAuth ??
    Constants?.manifest2?.extra?.googleAuth ??
    {};

  return {
    expoClientId: extra.expoClientId ?? 'GOOGLE_EXPO_CLIENT_ID',
    iosClientId: extra.iosClientId ?? extra.clientId ?? 'GOOGLE_IOS_CLIENT_ID',
    androidClientId: extra.androidClientId ?? 'GOOGLE_ANDROID_CLIENT_ID',
    webClientId: extra.webClientId ?? extra.clientId ?? 'GOOGLE_WEB_CLIENT_ID',
  };
};

const googleAuthConfig = resolveGoogleAuthConfig();

const API_ENDPOINTS = {
  verify: 'https://api.workmatch.dev/verify',
  auth: 'https://api.workmatch.dev/auth',
  profile: 'https://api.workmatch.dev/profile',
};

const API_TIMEOUT_MS = 1200;

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
  try {
    const response = await requestWithTimeout(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      timeout
    );

    if (!response || !response.ok) {
      throw new Error(response?.status || 'REQUEST_FAILED');
    }

    const data = await response.json().catch(() => ({}));
    return data;
  } catch (error) {
    console.warn('API запрос отклонён', error?.message || error);
    return null;
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

const jobFilters = [
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

const statHighlights = [
  {
    key: 'closed',
    label: 'Смен закрыто',
    value: '128',
    delta: '+12 за месяц',
    icon: 'checkmark-circle',
    colors: ['#FF8A65', '#FF5252'],
    actionTab: 'history',
  },
  {
    key: 'rating',
    label: 'Репутация',
    value: '4.9',
    delta: '23 отзыва',
    icon: 'star',
    colors: ['#FFCA28', '#FF8F00'],
    actionTab: 'reviews',
  },
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
  const [token, setToken] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const { email, phone, password, confirmPassword, workerSkill, employerCompany } =
    authForm;
  const [googleRequest, googleResponse, promptGoogleAuth] = useGoogleAuthRequest(
    googleAuthConfig
  );

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

  // Инициализация сервисов
  const syncServiceRef = useRef(null);
  const wsServiceRef = useRef(null);

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
        wsServiceRef.current = initWebSocketService('wss://api.workmatch.dev/ws', token);
        wsServiceRef.current.connect();

        // Подписаться на обновления статусов документов через WebSocket
        wsServiceRef.current.onDocumentStatusUpdate((update) => {
          // Обновить кеш react-query
          queryClientInstance.setQueryData(['documentStatuses', token], (old) => ({
            ...old,
            [update.documentId]: update,
          }));
        });
      }
    };

    initServices();

    return () => {
      // Очистка при размонтировании
      if (syncServiceRef.current) {
        syncServiceRef.current.stop();
      }
      if (wsServiceRef.current) {
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
  const currentProfile = profileData || defaultProfileForm;

  const profileStore = useProfileStore({
    initialProfile: currentProfile,
    saveProfileRequest: sendProfileUpdate,
  });

  const sendVerificationPayload = useCallback(
    (target, contact) => {
      if (!contact) {
        return null;
      }

      return postJson(API_ENDPOINTS.verify, {
        target,
        contact,
        role: authRole,
      });
    },
    [authRole]
  );

  const submitAuthPayload = useCallback(
    (payload) =>
      postJson(API_ENDPOINTS.auth, {
        ...payload,
        role: payload.role ?? authRole,
      }),
    [authRole]
  );

  const resetVerificationState = useCallback(() => {
    setVerificationInputs({ email: '', phone: '' });
    setVerificationCodes({ email: '', phone: '' });
    setVerificationStatus({ email: false, phone: false });
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedRole] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('authRole'),
        ]);

        if (storedToken) {
          const resolvedRole = storedRole || 'worker';
          setToken(storedToken);
          setAuthRole(resolvedRole);
          setIsEmployer(resolvedRole === 'employer');
          setActiveTab(resolvedRole === 'employer' ? 'workers' : 'profile');
          setIsAuthenticated(true);
        }
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
    async ({ role, token: providedToken, persist = true } = {}) => {
      const resolvedRole = role ?? authRole;
      const employerRole = resolvedRole === 'employer';
      const sessionToken =
        providedToken ??
        `token-${resolvedRole}-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 6)}`;

      setIsAuthenticated(true);
      setIsEmployer(employerRole);
      setActiveTab(employerRole ? 'workers' : 'profile');
      setAuthRole(resolvedRole);
      setToken(sessionToken);

      if (persist) {
        try {
          await AsyncStorage.multiSet([
            ['authToken', sessionToken],
            ['authRole', resolvedRole],
          ]);
        } catch (error) {
          console.warn('Не удалось сохранить сессию', error);
        }
      }
    },
    [authRole]
  );

  const handleFormChange = (field, value) =>
    setAuthForm((prev) => ({ ...prev, [field]: value }));

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

      await sendVerificationPayload(target, contact);

      const code = generateVerificationCode();
      setVerificationCodes((prev) => ({ ...prev, [target]: code }));
      setVerificationStatus((prev) => ({ ...prev, [target]: false }));
      Alert.alert(
        'Код отправлен',
        `Используйте код ${code} для подтверждения ${target === 'email' ? 'email' : 'телефона'
        }.`
      );
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

      setIsProcessingAuth(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        Alert.alert(
          'Ссылка отправлена',
          trimmedEmail
            ? `Письмо отправлено на ${trimmedEmail}.`
            : `SMS отправлено на ${trimmedPhone}.`
        );
        setAuthMode('login');
      } finally {
        setIsProcessingAuth(false);
      }

      return;
    }

    if (!trimmedEmail) {
      Alert.alert('Введите email', 'Электронная почта обязательна.');
      return;
    }

    if (!password) {
      Alert.alert('Введите пароль', 'Пароль обязателен.');
      return;
    }

    if (authMode === 'register') {
      if (!trimmedPhone) {
        Alert.alert('Введите телефон', 'Нужен номер для подтверждения.');
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
        phone: trimmedPhone || undefined,
        workerSkill: workerSkill || undefined,
        employerCompany: employerCompany || undefined,
      };

      const apiResult = await submitAuthPayload(apiPayload);
      const issuedToken = apiResult?.token ?? undefined;

      await completeAuth({ role: authRole, token: issuedToken });
      Alert.alert(
        authMode === 'register' ? 'Регистрация завершена' : 'Готово',
        authMode === 'register'
          ? 'Профиль создан и контакты подтверждены.'
          : 'С возвращением!'
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось завершить авторизацию. Попробуйте ещё раз.');
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
    verificationStatus.email,
    verificationStatus.phone,
    workerSkill,
  ]);

  const handleGoogleResponse = useCallback(
    async (googleAuth) => {
      const accessToken = googleAuth?.accessToken ?? googleAuth?.idToken ?? null;

      if (!accessToken) {
        Alert.alert('Ошибка Google', 'Не удалось получить токен авторизации.');
        return;
      }

      try {
        const profile = await fetchGoogleProfile(accessToken);
        await submitAuthPayload({
          mode: 'login',
          provider: 'google',
          email: profile?.email ?? email.trim(),
          googleId: profile?.sub,
          displayName: profile?.name,
          avatar: profile?.picture,
        });
        await completeAuth({
          role: authRole,
          token: `google-${profile?.sub ?? accessToken}`,
        });
        Alert.alert('Готово', 'Вход через Google выполнен.');
      } catch (error) {
        Alert.alert('Ошибка Google', 'Не удалось завершить вход через Google.');
      }
    },
    [authRole, completeAuth, email, submitAuthPayload]
  );

  useEffect(() => {
    if (!googleResponse) {
      return;
    }

    const processGoogleResponse = async () => {
      try {
        if (googleResponse.type === 'success') {
          await handleGoogleResponse(googleResponse.authentication);
        } else if (googleResponse.type === 'error') {
          Alert.alert(
            'Ошибка Google',
            googleResponse.error?.message ??
            'Не удалось авторизоваться через Google.'
          );
        }
      } finally {
        setIsGoogleLoading(false);
      }
    };

    processGoogleResponse();
  }, [googleResponse, handleGoogleResponse]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!googleRequest) {
      Alert.alert(
        'Google недоступен',
        'Пожалуйста, попробуйте ещё раз через минуту.'
      );
      return;
    }

    setIsGoogleLoading(true);
    try {
      await promptGoogleAuth({
        useProxy: Platform.OS !== 'web',
        showInRecents: true,
      });
    } catch (error) {
      setIsGoogleLoading(false);
      Alert.alert(
        'Ошибка Google',
        'Не удалось открыть окно авторизации. Попробуйте снова.'
      );
    }
  }, [googleRequest, promptGoogleAuth]);

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

  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'authRole']);
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
      setProfileField(field, value);
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

          <View style={styles.profileActions}>
            <TouchableOpacity
              style={[
                styles.profileSaveButton,
                (!isProfileDirty || !isProfileValid || isProfileSaving) &&
                styles.buttonDisabled,
              ]}
              onPress={handleProfileSave}
              disabled={!isProfileDirty || !isProfileValid || isProfileSaving}
            >
              {isProfileSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.profileSaveButtonText}>Сохранить изменения</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={openProfileEditor}
            >
              <Text style={styles.secondaryButtonText}>Открыть модалку</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileStatusRow}>
            {profileSaveError ? (
              <Text style={styles.profileStatusError}>{profileSaveError}</Text>
            ) : (
              profileSavedAt && (
                <Text style={styles.profileStatusText}>
                  Последнее сохранение в {formatSavedTime(profileSavedAt)}
                </Text>
              )
            )}
          </View>

          <Text style={styles.blockTitle}>Навыки и уровни</Text>
          <SkillEditor
            categories={skillMatrix}
            onLevelChange={handleSkillLevelChange}
            onToggleGrow={handleSkillFocusToggle}
          />
        </Section>

        <Section title="2. Удалённая работа" compact={isCompact}>
          <AvailabilityPlanner
            calendar={shiftCalendarDays}
            matrix={weekAvailability}
            onToggleSlot={handleToggleMatrixSlot}
            quickTemplates={quickAvailabilityTemplates}
            onApplyTemplate={handleApplyTemplate}
            activeTemplate={activeTemplate}
            vacation={vacationWindow}
            onToggleVacation={handleToggleVacation}
            compact={isCompact}
          />

          <ProfileFieldInput
            label="Старт"
            value={profileForm.startWindow}
            onChangeText={(value) => handleProfileFieldChange('startWindow', value)}
          />

          <InlineSelect
            label="Часовой пояс"
            value={profileForm.timezone}
            options={timezones.map((zone) => ({ label: zone, value: zone }))}
            onSelect={(zone) => handleProfileFieldChange('timezone', zone)}
          />
        </Section>

        <Section title="3. Интересы" compact={isCompact}>
          <ProfileFieldInput
            label="Минимальная ставка"
            value={profileForm.minRate}
            onChangeText={(value) => handleProfileFieldChange('minRate', value)}
          />
          <ProfileFieldInput
            label="Желаемая ставка"
            value={profileForm.desiredRate}
            onChangeText={(value) => handleProfileFieldChange('desiredRate', value)}
          />

          <Text style={styles.blockTitle}>Сферы</Text>
          <View style={[styles.chipsRow, isCompact && styles.chipsRowCompact]}>
            {interests.map((interest) => (
              <Chip key={interest} label={interest} />
            ))}
          </View>
        </Section>

        <Section title="4. Связь" compact={isCompact}>
          {publishedContacts.map((contact) => (
            <View
              key={contact.label}
              style={[
                styles.contactCard,
                contact.preferred && styles.contactPreferred,
                isCompact && styles.contactCardCompact,
              ]}
            >
              <Text style={styles.contactLabel}>{contact.label}</Text>
              <Text style={styles.contactValue}>{contact.value}</Text>
              {contact.preferred && (
                <Text style={styles.contactBadge}>основной</Text>
              )}
            </View>
          ))}
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

  const renderJobs = () => (
    <>
      <Section title="Фильтры" compact={isCompact}>
        <View style={[styles.chipsRow, isCompact && styles.chipsRowCompact]}>
          {jobFilters.map((filter) => (
            <Chip key={filter} label={filter} />
          ))}
        </View>
      </Section>

      <Section title="Подборки смен" compact={isCompact}>
        {jobCollections.map((collection) => (
          <JobCollectionCard
            key={collection.title}
            compact={isCompact}
            {...collection}
          />
        ))}
      </Section>

      <Section title="Свободные вакансии" compact={isCompact}>
        {vacancies.map((job) => (
          <View
            key={job.title}
            style={[styles.jobCard, isCompact && styles.jobCardCompact]}
          >
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobCompany}>{job.company}</Text>
            <Text style={styles.jobSalary}>{job.salary}</Text>
            <View style={styles.tagsRow}>
              {job.tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </View>
            <TouchableOpacity style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Откликнуться</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Section>
    </>
  );

  const renderChats = () => (
    <>
      <Section title="Диалоги" compact={isCompact}>
        {chatThreads.map((thread) => (
          <ChatCard key={thread.name} compact={isCompact} {...thread} />
        ))}
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
    </>
  );

  const renderSettings = () => (
    <>
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
        {workersPool.map((worker) => (
          <WorkerCard key={worker.name} {...worker} />
        ))}
      </Section>
    </>
  );

  const renderReviews = () => (
    <>
      <Section title="Отзывы заказчиков" compact={isCompact}>
        {reviewsList.map((review) => (
          <ReviewCard key={`${review.employer}-${review.date}`} {...review} />
        ))}
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

  const handleStatPress = useCallback(
    (stat) => {
      if (stat.actionTab) {
        setActiveTab(stat.actionTab);
      }
    },
    [setActiveTab]
  );

  const renderHistory = () => (
    <>
      <Section title="Закрытые смены" compact={isCompact}>
        {closedShifts.map((shift) => (
          <ClosedShiftCard key={shift.title} {...shift} />
        ))}
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
                  {[
                    { key: 'worker', label: 'Я работник', icon: 'person' },
                    { key: 'employer', label: 'Я работодатель', icon: 'briefcase' },
                  ].map((role) => (
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
                    ? 'Номер телефона'
                    : 'Телефон (если нет доступа к почте)'
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
                      !email.trim() && styles.verificationActionDisabled,
                    ]}
                    onPress={() => handleSendVerification('email')}
                    disabled={!email.trim()}
                  >
                    <Text style={styles.verificationActionText}>Отправить код</Text>
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
                      !phone.trim() && styles.verificationActionDisabled,
                    ]}
                    onPress={() => handleSendVerification('phone')}
                    disabled={!phone.trim()}
                  >
                    <Text style={styles.verificationActionText}>Отправить SMS-код</Text>
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
            <TouchableOpacity
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
            </TouchableOpacity>
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

  if (!isAuthenticated) {
    return renderAuthScreen();
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
          <View style={[styles.statsRow, isCompact && styles.statsRowCompact]}>
            {statHighlights.map((stat) => (
              <StatCard
                key={stat.label}
                compact={isCompact}
                onPress={() => handleStatPress(stat)}
                {...stat}
              />
            ))}
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
      placeholder="+998 90 123 45 67"
      keyboardType="phone-pad"
      error={errors.phone}
    />
    <ProfileFieldInput
      label="WhatsApp"
      value={form.whatsapp}
      onChangeText={(value) => onFieldChange('whatsapp', value)}
      placeholder="+998 97 987 65 43"
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

const Chip = ({ label, onPress, variant = 'solid' }) => (
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
);

const Tag = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const WorkerCard = ({
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
      {experience} · {rate}
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
);

const ClosedShiftCard = ({
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
);

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

const ChatCard = ({ name, snippet, time, unread, status, compact }) => (
  <View style={[styles.chatCard, compact && styles.chatCardCompact]}>
    <View style={styles.chatAvatar}>
      <Text style={styles.chatAvatarText}>{name[0]}</Text>
    </View>
    <View style={styles.chatBody}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatName}>{name}</Text>
        <Text style={styles.chatTime}>{time}</Text>
      </View>
      <Text style={styles.chatSnippet}>{snippet}</Text>
      <Text style={styles.chatStatus}>{status}</Text>
    </View>
    {unread > 0 && (
      <View style={styles.chatUnread}>
        <Text style={styles.chatUnreadText}>{unread}</Text>
      </View>
    )}
  </View>
);

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
        {skill.wantToGrow ? 'Отмечен для развития' : 'Хочу развивать'}
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
}) => (
  <View
    style={[styles.availabilityPlanner, compact && styles.availabilityPlannerCompact]}
  >
    <Text style={styles.blockTitle}>Календарь смен</Text>
    <ShiftCalendar days={calendar} />
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

const ShiftCalendar = ({ days }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.shiftCalendarRow}
  >
    {days.map((day) => (
      <View
        key={day.key}
        style={[
          styles.shiftCalendarItem,
          styles[`shiftCalendarItem_${day.status}`],
        ]}
      >
        <Text style={styles.shiftCalendarDay}>{day.dayLabel}</Text>
        <Text style={styles.shiftCalendarDate}>{day.dateLabel}</Text>
        <Text style={styles.shiftCalendarTitle}>{day.title}</Text>
        <Text style={styles.shiftCalendarHours}>{day.hours}</Text>
      </View>
    ))}
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
          {from} — {to}
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

const ReviewCard = ({ employer, shift, rating, text, date }) => (
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
);

const StatCard = ({ label, value, delta, icon, colors, compact, onPress }) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.9 : 1}
    onPress={onPress}
    disabled={!onPress}
    style={[styles.statCardWrapper, compact && styles.statCardWrapperCompact]}
  >
    <LinearGradient
      colors={colors}
      style={[styles.statCard, compact && styles.statCardCompact]}
    >
      <Ionicons name={icon} size={28} color="#fff" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statDelta}>{delta}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const TimelineItem = ({ title, meta, status, compact }) => (
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
);

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',

  },
  pageWrapper: {
    flex: 1,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  backgroundGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FFCDD2',
    top: -80,
    right: -40,
    opacity: 0.35,
    alignSelf: 'center',
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#C62828',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  heroCompact: {
    paddingHorizontal: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
    width: '100%',
  },
  heroHeaderCompact: {
    flexDirection: 'column',
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  heroLabel: {
    color: '#FFDADA',
    fontSize: 14,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#FFECEC',
    fontSize: 14,
  },
  heroBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    color: '#C62828',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  statsRowCompact: {
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  contentCompact: {
    paddingHorizontal: 16,
    gap: 12,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionCompact: {
    borderRadius: 16,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: theme.muted,
    marginBottom: 12,
  },
  profileLabel: {
    color: theme.muted,
    fontSize: 13,
    marginBottom: 2,
  },
  profileField: {
    marginBottom: 14,
  },
  profileInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.text,
    backgroundColor: '#FFFFFF',
  },
  profileInputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  profileInputError: {
    borderColor: '#E53935',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  editProfileButtonText: {
    color: theme.primary,
    fontWeight: '600',
  },
  unsavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F57C00',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unsavedBadgeText: {
    color: '#FFF8E1',
    fontWeight: '600',
  },
  profileActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  profileSaveButton: {
    flexGrow: 1,
    backgroundColor: theme.primary,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
    minWidth: 160,
  },
  profileSaveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  profileStatusRow: {
    marginTop: 10,
  },
  profileStatusText: {
    color: theme.muted,
    fontSize: 13,
  },
  profileStatusError: {
    color: '#D32F2F',
    fontSize: 13,
    marginTop: 4,
  },
  inlineSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineSelectOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inlineSelectOptionActive: {
    borderColor: theme.primary,
    backgroundColor: '#FFE3E3',
  },
  inlineSelectText: {
    color: theme.text,
    fontWeight: '500',
  },
  inlineSelectTextActive: {
    color: theme.primary,
    fontWeight: '700',
  },
  blockTitle: {
    marginTop: 16,
    marginBottom: 10,
    color: theme.text,
    fontWeight: '600',
  },
  skillEditor: {
    gap: 12,
  },
  skillCategoryCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#fff',
    gap: 12,
  },
  skillCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  skillCategoryMeta: {
    color: theme.muted,
    marginTop: 2,
  },
  skillCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFECEC',
  },
  skillCategoryBadgeText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  skillRow: {
    borderWidth: 1,
    borderColor: '#FFE0E0',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  skillRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillName: {
    fontWeight: '600',
    color: theme.text,
  },
  skillRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF8E1',
  },
  skillRatingValue: {
    fontWeight: '700',
    color: '#FF8F00',
  },
  skillTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
  },
  skillTagText: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  skillSlider: {
    width: '100%',
  },
  skillLevelHint: {
    fontSize: 12,
    color: theme.muted,
  },
  skillUsageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillUsagePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF5F5',
  },
  skillUsageText: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  skillGrowButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  skillGrowButtonActive: {
    backgroundColor: '#FFE3E3',
  },
  skillGrowButtonText: {
    color: theme.primary,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipsRowCompact: {
    gap: 6,
  },
  chip: {
    backgroundColor: theme.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  chipOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  chipText: {
    color: '#fff',
    fontWeight: '600',
  },
  chipTextOutline: {
    color: theme.primary,
  },
  contactCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  contactCardCompact: {
    padding: 12,
  },
  contactPreferred: {
    borderColor: theme.primary,
    backgroundColor: '#FFE3E3',
  },
  contactLabel: {
    color: theme.muted,
    fontSize: 13,
  },
  contactValue: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  contactBadge: {
    marginTop: 6,
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
  jobCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  jobCardCompact: {
    padding: 14,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
  },
  jobCompany: {
    color: theme.muted,
    marginTop: 4,
  },
  jobSalary: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#FFECEC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  availabilityPlanner: {
    gap: 16,
  },
  availabilityPlannerCompact: {
    gap: 12,
  },
  shiftCalendarRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 4,
  },
  shiftCalendarItem: {
    width: 150,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  shiftCalendarItem_booked: {
    backgroundColor: '#FFE3E3',
    borderColor: '#FFC1C1',
  },
  shiftCalendarItem_open: {
    backgroundColor: '#F1F8E9',
    borderColor: '#C5E1A5',
  },
  shiftCalendarItem_rest: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  shiftCalendarDay: {
    fontWeight: '700',
    color: theme.text,
  },
  shiftCalendarDate: {
    color: theme.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  shiftCalendarTitle: {
    color: theme.text,
    fontWeight: '600',
  },
  shiftCalendarHours: {
    color: theme.primary,
    fontWeight: '600',
  },
  weekMatrixWrapper: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    overflow: 'hidden',
  },
  weekMatrixHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F0',
  },
  weekMatrixCornerCell: {
    width: 90,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: theme.border,
    justifyContent: 'center',
  },
  weekMatrixLegend: {
    fontSize: 12,
    color: theme.muted,
  },
  weekMatrixHeaderCell: {
    flex: 1,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekMatrixHeaderText: {
    fontWeight: '600',
    color: theme.text,
  },
  weekMatrixRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  weekMatrixLabelCell: {
    width: 90,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: theme.border,
  },
  weekMatrixLabel: {
    fontWeight: '600',
    color: theme.text,
  },
  weekMatrixHours: {
    fontSize: 12,
    color: theme.muted,
  },
  weekMatrixCell: {
    flex: 1,
    aspectRatio: 1.2,
    borderRightWidth: 1,
    borderRightColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekMatrixCellActive: {
    backgroundColor: '#C62828',
  },
  templatesRow: {
    gap: 10,
  },
  templateButton: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fff',
  },
  templateButtonActive: {
    borderColor: theme.primary,
    backgroundColor: '#FFECEC',
  },
  templateButtonLabel: {
    fontWeight: '600',
    color: theme.text,
  },
  templateButtonHint: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 2,
  },
  vacationBanner: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  vacationBannerActive: {
    borderColor: '#80CBC4',
    backgroundColor: '#E0F2F1',
  },
  vacationBannerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vacationBannerTitle: {
    fontWeight: '700',
    color: theme.text,
  },
  vacationBannerDates: {
    color: theme.muted,
    fontSize: 12,
  },
  vacationBannerAction: {
    color: theme.primary,
    fontWeight: '700',
  },
  workerCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerName: {
    fontWeight: '700',
    color: theme.text,
    fontSize: 17,
  },
  workerRole: {
    color: theme.muted,
  },
  workerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workerRatingText: {
    color: theme.primary,
    fontWeight: '700',
  },
  workerMeta: {
    color: theme.text,
    fontWeight: '600',
  },
  workerAvailability: {
    color: theme.muted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFECEC',
  },
  badgePillText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  workerSkills: {
    color: theme.text,
  },
  workerButton: {
    marginTop: 6,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  workerButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  closedCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    gap: 6,
  },
  closedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  closedTitle: {
    color: theme.text,
    fontWeight: '700',
    flex: 1,
  },
  closedDate: {
    color: theme.muted,
    fontSize: 12,
  },
  closedMeta: {
    color: theme.muted,
  },
  closedPay: {
    color: theme.primary,
    fontWeight: '700',
  },
  closedRating: {
    flexDirection: 'row',
    gap: 2,
  },
  closedFeedback: {
    color: theme.text,
    lineHeight: 18,
  },
  collectionCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFDFC',
  },
  collectionCardCompact: {
    padding: 14,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionTitle: {
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    marginRight: 12,
  },
  collectionBadge: {
    backgroundColor: '#FFE3E3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  collectionBadgeText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  collectionShift: {
    marginTop: 10,
    color: theme.muted,
    fontSize: 13,
  },
  collectionRate: {
    marginTop: 4,
    color: theme.primary,
    fontWeight: '700',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  statCardWrapper: {
    flex: 1,
  },
  statCardWrapperCompact: {
    width: '100%',
  },
  statCardCompact: {
    width: '100%',
  },
  statValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    color: '#FFEFEF',
    marginTop: 4,
    fontWeight: '600',
  },
  statDelta: {
    color: '#FFE082',
    marginTop: 6,
    fontSize: 12,
  },
  applyButton: {
    backgroundColor: theme.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.accent,
    marginRight: 10,
  },
  checkText: {
    color: theme.text,
    flex: 1,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.primary,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.primary,
    fontWeight: '600',
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  profileModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingBottom: 16,
    maxHeight: '90%',
    width: '100%',
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  profileModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  profileModalClose: {
    padding: 6,
  },
  profileModalBody: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: theme.primary,
    fontWeight: '600',
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 18,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.primary,
  },
  modalSubtitle: {
    color: theme.muted,
    marginTop: 8,
    marginBottom: 12,
  },
  modalUsage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
    marginRight: 10,
  },
  modalUsageText: {
    color: theme.text,
    fontSize: 15,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  timelineItemCompact: {
    alignItems: 'flex-start',
    gap: 10,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  timelineDot_done: {
    backgroundColor: '#4CAF50',
  },
  timelineDot_upcoming: {
    backgroundColor: theme.primary,
  },
  timelineDot_alert: {
    backgroundColor: '#FF7043',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontWeight: '700',
    color: theme.text,
  },
  timelineMeta: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 2,
  },
  timelineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  timelineActionCompact: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  timelineActionText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  chatCardCompact: {
    alignItems: 'flex-start',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFE3E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    color: theme.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  chatBody: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontWeight: '700',
    color: theme.text,
  },
  chatTime: {
    color: theme.muted,
    fontSize: 12,
  },
  chatSnippet: {
    color: theme.text,
    marginTop: 4,
  },
  chatStatus: {
    marginTop: 6,
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  chatUnread: {
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chatUnreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  settingRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  settingBody: {
    flex: 1,
  },
  settingLabel: {
    fontWeight: '600',
    color: theme.text,
  },
  settingSubtitle: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 2,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  shortcutCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFDFC',
    gap: 6,
    minWidth: 150,
  },
  shortcutTitle: {
    fontWeight: '700',
    color: theme.text,
  },
  shortcutSubtitle: {
    color: theme.muted,
    fontSize: 12,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sessionLabel: {
    color: theme.muted,
    fontSize: 13,
  },
  sessionValue: {
    color: theme.text,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  sessionToken: {
    fontSize: 12,
    color: theme.muted,
  },
  logoutButton: {
    marginTop: 12,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    gap: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewEmployer: {
    fontWeight: '700',
    color: theme.text,
  },
  reviewDate: {
    color: theme.muted,
    fontSize: 12,
  },
  reviewShift: {
    color: theme.muted,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewText: {
    color: theme.text,
    marginTop: 4,
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    borderRadius: 999,
    shadowColor: '#C62828',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  fabCompact: {
    right: 16,
    left: 16,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    width: '100%',
    alignSelf: 'stretch',
  },
  bottomNavCompact: {
    paddingHorizontal: 12,
  },
  bottomNavItem: {
    alignItems: 'center',
    gap: 4,
  },
  bottomNavLabel: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomNavLabelActive: {
    color: '#C62828',
  },
  authHero: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 10,
  },
  authBadge: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFDADA',
    fontWeight: '700',
  },
  authTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  authSubtitle: {
    color: '#FFECEC',
    fontSize: 14,
    lineHeight: 20,
  },
  authContent: {
    padding: 24,
    gap: 16,
    width: '100%',
  },
  authScroll: {
    width: '100%',
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#FFE8E8',
  },
  authCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  authCardSubtitle: {
    color: theme.muted,
    marginBottom: 4,
  },
  authModeTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  authModeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  authModeButtonActive: {
    backgroundColor: '#FFE3E3',
    borderColor: theme.primary,
  },
  authModeButtonText: {
    color: theme.muted,
    fontWeight: '600',
  },
  authModeButtonTextActive: {
    color: theme.primary,
  },
  authInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.text,
  },
  authSubLabel: {
    marginTop: 6,
    marginBottom: 2,
    fontSize: 13,
    fontWeight: '600',
    color: theme.muted,
  },
  authPrimaryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  authPrimaryBtnDisabled: {
    opacity: 0.5,
  },
  authPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleButtonText: {
    color: theme.primary,
    fontWeight: '600',
  },
  authLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  authLink: {
    textAlign: 'center',
    color: theme.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  verificationBlock: {
    borderWidth: 1,
    borderColor: '#FFE0E0',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    marginTop: 6,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verificationLabel: {
    fontWeight: '600',
    color: theme.text,
  },
  verificationStatusSuccess: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  verificationAction: {
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  verificationActionDisabled: {
    borderColor: theme.border,
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  verificationActionText: {
    color: theme.primary,
    fontWeight: '600',
  },
  authBenefits: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFE8E8',
    gap: 12,
  },
  roleSwitcher: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: theme.primary,
  },
  roleButtonText: {
    color: theme.primary,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  roleHint: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 4,
  },
  authBenefit: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  authBenefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFE3E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authBenefitBody: {
    flex: 1,
  },
  authBenefitTitle: {
    fontWeight: '700',
    color: theme.text,
  },
  authBenefitSubtitle: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 2,
  },
  authSkip: {
    textAlign: 'center',
    color: theme.muted,
    fontWeight: '600',
    marginTop: 6,
  },
});
