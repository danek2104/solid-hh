/**
 * Хелперы для работы с моками в тестах
 */

/**
 * Создать и настроить стандартные моки для тестов
 */
export const setupCommonMocks = () => {
  const mocks = {
    alertSpy: jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {}),
    randomSpy: jest.spyOn(global.Math, 'random').mockReturnValue(0),
    consoleWarnSpy: jest.spyOn(console, 'warn').mockImplementation(),
    consoleErrorSpy: jest.spyOn(console, 'error').mockImplementation(),
  };
  return mocks;
};

/**
 * Очистить все моки
 * Восстанавливает spy'и, но сохраняет их для дальнейшего использования
 */
export const cleanupMocks = (mocks) => {
  if (!mocks) return;
  
  if (mocks.alertSpy) {
    mocks.alertSpy.mockRestore();
  }
  if (mocks.randomSpy) {
    mocks.randomSpy.mockRestore();
  }
  if (mocks.consoleWarnSpy) {
    mocks.consoleWarnSpy.mockRestore();
  }
  if (mocks.consoleErrorSpy) {
    mocks.consoleErrorSpy.mockRestore();
  }
};

/**
 * Очистить все моки (без восстановления)
 * Очищает вызовы, но сохраняет реализации
 */
export const clearAllMocks = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
};

/**
 * Создать мок для fetch с успешным ответом
 */
export const mockFetchSuccess = (data, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  });
};

/**
 * Создать мок для fetch с ошибкой
 */
export const mockFetchError = (error, status = 500) => {
  if (error instanceof Error) {
    global.fetch = jest.fn().mockRejectedValue(error);
  } else {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status,
      json: jest.fn().mockResolvedValue({ error }),
      text: jest.fn().mockResolvedValue(JSON.stringify({ error })),
    });
  }
};

/**
 * Сбросить все моки fetch
 */
export const resetFetchMock = () => {
  if (global.fetch && typeof global.fetch.mockReset === 'function') {
    global.fetch.mockReset();
  }
};

