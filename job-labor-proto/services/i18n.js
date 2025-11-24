import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Dictionaries
const resources = {
  ru: {
    translation: {
      welcome: "Добро пожаловать",
      selectLanguage: "Выберите язык приложения",
      continue: "Продолжить",
      loading: "Загрузка...",
      // Auth
      login: "Войти",
      register: "Регистрация",
      phonePlaceholder: "Телефон",
      // Tabs
      tabProfile: "Профиль",
      tabHistory: "Смены",
      tabReviews: "Отзывы",
      tabJobs: "Вакансии",
      tabChats: "Чаты",
      tabWorkers: "Работники",
      tabSettings: "Настройки",
      // Roles
      worker: "Ищу работу",
      employer: "Ищу сотрудников",
    }
  },
  uz: {
    translation: {
      welcome: "Xush kelibsiz",
      selectLanguage: "Ilova tilini tanlang",
      continue: "Davom etish",
      loading: "Yuklanmoqda...",
      // Auth
      login: "Kirish",
      register: "Ro'yxatdan o'tish",
      phonePlaceholder: "Telefon",
      // Tabs
      tabProfile: "Profil",
      tabHistory: "Smenalar",
      tabReviews: "Sharhlar",
      tabJobs: "Ishlar",
      tabChats: "Chatlar",
      tabWorkers: "Ishchilar",
      tabSettings: "Sozlamalar",
      // Roles
      worker: "Ish qidiryapman",
      employer: "Xodim qidiryapman",
    }
  },
  tj: {
    translation: {
      welcome: "Хуш омадед",
      selectLanguage: "Забони барномаро интихоб кунед",
      continue: "Идома додан",
      loading: "Боргирӣ...",
      // Auth
      login: "Ворид шудан",
      register: "Бақайдгирӣ",
      phonePlaceholder: "Телефон",
      // Tabs
      tabProfile: "Профил",
      tabHistory: "Бастҳо",
      tabReviews: "Тафсирҳо",
      tabJobs: "Ҷойҳои корӣ",
      tabChats: "Чатҳо",
      tabWorkers: "Коргарон",
      tabSettings: "Танзимот",
      // Roles
      worker: "Кор меҷӯям",
      employer: "Коргаронро меҷӯям",
    }
  },
  kg: {
    translation: {
      welcome: "Кош келиңиз",
      selectLanguage: "Тиркеменин тилин тандаңыз",
      continue: "Улантуу",
      loading: "Жүктөлүүдө...",
      // Auth
      login: "Кирүү",
      register: "Каттоо",
      phonePlaceholder: "Телефон",
      // Tabs
      tabProfile: "Профиль",
      tabHistory: "Сменалар",
      tabReviews: "Пикирлер",
      tabJobs: "Жумуштар",
      tabChats: "Чаттар",
      tabWorkers: "Жумушчулар",
      tabSettings: "Тууралоолор",
      // Roles
      worker: "Жумуш издеп жатам",
      employer: "Кызматкер издеп жатам",
    }
  },
  kz: {
    translation: {
      welcome: "Қош келдіңіз",
      selectLanguage: "Қолданба тілін таңдаңыз",
      continue: "Жалғастыру",
      loading: "Жүктелуде...",
      // Auth
      login: "Кіру",
      register: "Тіркелу",
      phonePlaceholder: "Телефон",
      // Tabs
      tabProfile: "Профиль",
      tabHistory: "Ауысымдар",
      tabReviews: "Пікірлер",
      tabJobs: "Жұмыстар",
      tabChats: "Чаттар",
      tabWorkers: "Жұмысшылар",
      tabSettings: "Баптаулар",
      // Roles
      worker: "Жұмыс іздеудемін",
      employer: "Қызметкер іздеудемін",
    }
  },
  en: {
    translation: {
      welcome: "Welcome",
      selectLanguage: "Select App Language",
      continue: "Continue",
      loading: "Loading...",
      // Auth
      login: "Log In",
      register: "Sign Up",
      phonePlaceholder: "Phone",
      // Tabs
      tabProfile: "Profile",
      tabHistory: "Shifts",
      tabReviews: "Reviews",
      tabJobs: "Jobs",
      tabChats: "Chats",
      tabWorkers: "Workers",
      tabSettings: "Settings",
      // Roles
      worker: "Looking for work",
      employer: "Looking for staff",
    }
  }
};

const LANGUAGE_KEY = 'user-language-v1';

// Language detector
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // 1. Check local storage
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (storedLanguage) {
        return callback(storedLanguage);
      }
      
      // 2. Check device locale
      const deviceLocale = Localization.getLocales()[0]?.languageCode;
      if (deviceLocale && ['ru', 'uz', 'tj', 'kg', 'kz', 'en'].includes(deviceLocale)) {
        return callback(deviceLocale);
      }
      
      // 3. Default
      return callback('ru');
    } catch (error) {
      console.log('Error reading language', error);
      callback('ru');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false, // not needed for react
    },
    react: {
      useSuspense: false, // fix for react native
    },
  });

export default i18n;
