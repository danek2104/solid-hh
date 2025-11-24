// Polyfill localStorage/sessionStorage before MSW initialization
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = mockStorage;
global.sessionStorage = mockStorage;

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

jest.mock('react-native', () => {
  const React = require('react');
  
  // Mock components as functional components to support children rendering
  const View = ({ children, ...props }) => React.createElement('View', props, children);
  const Text = ({ children, ...props }) => React.createElement('Text', props, children);
  const TouchableOpacity = ({ children, ...props }) => React.createElement('TouchableOpacity', props, children);
  const ScrollView = ({ children, ...props }) => React.createElement('ScrollView', props, children);
  const FlatList = ({ renderItem, data, ...props }) => React.createElement('FlatList', { data, renderItem, ...props });
  const TextInput = ({ ...props }) => React.createElement('TextInput', props);
  const Modal = ({ children, ...props }) => React.createElement('Modal', props, children);
  const Image = ({ ...props }) => React.createElement('Image', props);
  const KeyboardAvoidingView = ({ children, ...props }) => React.createElement('KeyboardAvoidingView', props, children);
  const ActivityIndicator = ({ ...props }) => React.createElement('ActivityIndicator', props);
  const SafeAreaView = ({ children, ...props }) => React.createElement('SafeAreaView', props, children);

  return {
    Platform: {
      OS: 'android',
      select: jest.fn((options) => options.android),
    },
    Alert: {
      alert: jest.fn(),
    },
    StyleSheet: {
      create: (styles) => styles,
      flatten: jest.fn((style) => style),
      absoluteFill: {},
      hairlineWidth: 1,
    },
    AppState: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      currentState: 'active',
    },
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
    NativeModules: {
      DevMenu: {
        show: jest.fn(),
        hide: jest.fn(),
      },
      UIManager: {
        createView: jest.fn(),
        setNativeProps: jest.fn(),
      },
      RNScreens: {
        screensEnabled: jest.fn(),
      },
      ExpoPushTokenManager: {
        getDevicePushTokenAsync: jest.fn(),
      },
      PlatformConstants: {
        forceTouchAvailable: false,
      },
    },
    TurboModuleRegistry: {
      getEnforcing: jest.fn((name) => {
        if (name === 'DevMenu') {
          return { show: jest.fn(), hide: jest.fn() };
        }
        return { __esModule: true, default: jest.fn() };
      }),
      get: jest.fn((name) => null),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 428, height: 926 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Linking: {
        openURL: jest.fn(),
        canOpenURL: jest.fn(() => Promise.resolve(true)),
        getInitialURL: jest.fn(() => Promise.resolve(null)),
        addEventListener: jest.fn(),
    },
    // Components
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    TextInput,
    Modal,
    Image,
    KeyboardAvoidingView,
    ActivityIndicator,
    SafeAreaView,
    // Add InteractionManager if needed
    InteractionManager: {
        runAfterInteractions: jest.fn((callback) => {
            callback();
            return { cancel: jest.fn() };
        }),
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => React.createElement('SafeAreaProvider', {}, children),
    SafeAreaView: ({ children }) => React.createElement('SafeAreaView', {}, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    },
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: ({ children, ...props }) => React.createElement('LinearGradient', props, children),
  };
});

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {
    ExpoPushTokenManager: {
      getDevicePushTokenAsync: jest.fn(() => Promise.resolve('test-device-token')),
    },
  },
  EventEmitter: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  getDevicePushTokenAsync: jest.fn(() => Promise.resolve({ data: 'test-token' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'test-expo-token' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true })),
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
    DEFAULT: 3,
    LOW: 2,
    MIN: 1,
    NONE: 0,
  },
}));

// Mock internal NativeModulesProxy for expo-notifications if strictly required by deep imports
jest.mock('expo-notifications/src/PushTokenManager.native', () => ({
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  getDevicePushTokenAsync: jest.fn(() => Promise.resolve('test-native-token')),
}));

// Mock the root 'expo' package
jest.mock('expo', () => ({
  // Mock specific problematic exports or provide dummy implementations
  EXDevLauncher: {
    launcher: jest.fn(),
  },
  registerRootComponent: jest.fn(),
  isRunningInExpoGo: jest.fn(() => false), // Add mock for isRunningInExpoGo
  // Add any other top-level exports from 'expo' that might be used
  // e.g., if you use Expo.Linking or other direct exports
  // For now, keep it minimal, adding only what's explicitly breaking tests.
}));

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

