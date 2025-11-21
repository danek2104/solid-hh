const { server } = require('./tests/msw/server');

require('@testing-library/jest-native/extend-expect');

// MSW в Node.js использует свой механизм перехвата
// Для Node.js 18+ встроенный fetch доступен, но может потребоваться полифилл для совместимости
// Загружаем whatwg-fetch после инициализации MSW, чтобы не мешать перехвату
if (typeof global.fetch === 'undefined' || process.env.FORCE_FETCH_POLYFILL === 'true') {
    // Полифилл fetch для совместимости (если нужен)
    require('whatwg-fetch');
}

global.XMLHttpRequest = require('xhr2');

// Полифилл для btoa (используется в тестах для создания JWT токенов)
if (typeof global.btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}

// Полифилл для atob (используется для декодирования JWT токенов)
if (typeof global.atob === 'undefined') {
  global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

jest.mock(
  'expo-constants',
  () => ({
    expoConfig: { extra: {} },
    manifest2: { extra: {} },
  }),
  { virtual: true }
);

jest.mock(
  'expo-web-browser',
  () => ({
    maybeCompleteAuthSession: jest.fn(),
  }),
  { virtual: true }
);

jest.mock('expo-auth-session/providers/google', () => {
  const promptAsyncMock = jest.fn().mockResolvedValue({ type: 'dismiss' });
  return {
    useAuthRequest: () => [null, null, promptAsyncMock],
  };
});

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => {
    const mock = () => ({
        width: 428,
        height: 926,
        scale: 2,
        fontScale: 2,
    });

    mock.default = mock;
    return mock;
});

jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');

    const Ionicons = ({ testID = 'mock-ionicon' }) =>
        React.createElement(Text, { testID }, 'Ionicons');

    return { Ionicons };
});

jest.mock(
    '@react-native-async-storage/async-storage',
    () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
    addEventListener: jest.fn(() => jest.fn()),
}));

// Моки для сервисов убраны из глобального setup
// Они должны мокаться локально в тестах, которые не тестируют сами сервисы
// Интеграционные тесты могут мокать их по необходимости

beforeAll(() => {
    // Настройка MSW для перехвата запросов
    // В Node.js 18+ MSW использует встроенный fetch через undici
    server.listen({ 
        onUnhandledRequest: 'warn',
    });
});

afterEach(() => {
    // Сброс MSW handlers
    server.resetHandlers();
    
    // Очистка всех моков (сохраняет реализации, но очищает вызовы)
    jest.clearAllMocks();
    
    // Очистка только pending таймеров (не переключаем на fake timers, чтобы не сломать тесты)
    // Если есть активные таймеры, они будут очищены при следующем тесте
});

afterAll(() => {
    server.close();
});

