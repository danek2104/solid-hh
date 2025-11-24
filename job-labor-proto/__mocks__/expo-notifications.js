export const setNotificationHandler = jest.fn();
export const scheduleNotificationAsync = jest.fn();
export const cancelAllScheduledNotificationsAsync = jest.fn();
export const addNotificationReceivedListener = jest.fn(() => ({ remove: jest.fn() }));
export const addNotificationResponseReceivedListener = jest.fn(() => ({ remove: jest.fn() }));
export const removeNotificationSubscription = jest.fn();
export const getDevicePushTokenAsync = jest.fn(() => Promise.resolve({ data: 'test-token' }));
export const getExpoPushTokenAsync = jest.fn(() => Promise.resolve({ data: 'test-expo-token' }));
export const getPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted', granted: true }));
export const requestPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted', granted: true }));
export const setNotificationChannelAsync = jest.fn(() => Promise.resolve());
export const getAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve([]));
export const AndroidImportance = {
  MAX: 5,
  HIGH: 4,
  DEFAULT: 3,
  LOW: 2,
  MIN: 1,
  NONE: 0,
};