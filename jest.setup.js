const { server } = require('./tests/msw/server');

require('@testing-library/jest-native/extend-expect');
require('whatwg-fetch');

global.XMLHttpRequest = require('xhr2');

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

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
});

afterAll(() => {
    server.close();
});

