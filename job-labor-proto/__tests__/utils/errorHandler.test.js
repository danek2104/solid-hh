import {
  ApiError,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ForbiddenError,
  handleApiError,
  getErrorMessage,
  isUnauthorizedError,
  isNetworkError,
} from '../../utils/errorHandler';

describe('errorHandler', () => {
  describe('ApiError', () => {
    it('должен создать ошибку API с правильными свойствами', () => {
      const originalError = new Error('Original');
      const error = new ApiError('Test error', 400, 'BAD_REQUEST', originalError);

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('ApiError');
    });
  });

  describe('NetworkError', () => {
    it('должен создать ошибку сети', () => {
      const originalError = new Error('Network failed');
      const error = new NetworkError('Network error', originalError);

      expect(error.message).toBe('Network error');
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('NetworkError');
    });

    it('должен использовать сообщение по умолчанию', () => {
      const error = new NetworkError();

      expect(error.message).toBe('Ошибка сети. Проверьте подключение к интернету.');
    });
  });

  describe('TimeoutError', () => {
    it('должен создать ошибку таймаута', () => {
      const error = new TimeoutError('Request timeout');

      expect(error.message).toBe('Request timeout');
      expect(error.name).toBe('TimeoutError');
    });
  });

  describe('UnauthorizedError', () => {
    it('должен создать ошибку авторизации', () => {
      const error = new UnauthorizedError('Unauthorized');

      expect(error.message).toBe('Unauthorized');
      expect(error.name).toBe('UnauthorizedError');
    });
  });

  describe('ForbiddenError', () => {
    it('должен создать ошибку запрета доступа', () => {
      const error = new ForbiddenError('Forbidden');

      expect(error.message).toBe('Forbidden');
      expect(error.name).toBe('ForbiddenError');
    });
  });

  describe('handleApiError', () => {
    it('должен обработать ошибку таймаута', () => {
      const error = new Error('timeout');
      const result = handleApiError(error, null);

      expect(result).toBeInstanceOf(TimeoutError);
      expect(result.message).toContain('Превышено время ожидания');
    });

    it('должен обработать ошибку сети', () => {
      const error = new Error('Network request failed');
      const result = handleApiError(error, null);

      expect(result).toBeInstanceOf(NetworkError);
      expect(result.message).toContain('интернету');
    });

    it('должен обработать ошибку 401', () => {
      const error = new Error('Unauthorized');
      const response = { status: 401 };
      const result = handleApiError(error, response);

      expect(result).toBeInstanceOf(UnauthorizedError);
      expect(result.message).toContain('Сессия истекла');
    });

    it('должен обработать ошибку 403', () => {
      const error = new Error('Forbidden');
      const response = { status: 403 };
      const result = handleApiError(error, response);

      expect(result).toBeInstanceOf(ForbiddenError);
      expect(result.message).toContain('доступа');
    });

    it('должен обработать ошибку 404', () => {
      const error = new Error('Not found');
      const response = { status: 404 };
      const result = handleApiError(error, response);

      expect(result).toBeInstanceOf(ApiError);
      expect(result.status).toBe(404);
      expect(result.code).toBe('NOT_FOUND');
    });

    it('должен обработать ошибку 422', () => {
      const error = new Error('Validation error');
      const response = { status: 422 };
      const result = handleApiError(error, response);

      expect(result).toBeInstanceOf(ApiError);
      expect(result.status).toBe(422);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('должен обработать ошибку 429', () => {
      const error = new Error('Rate limit');
      const response = { status: 429 };
      const result = handleApiError(error, response);

      expect(result).toBeInstanceOf(ApiError);
      expect(result.status).toBe(429);
      expect(result.code).toBe('RATE_LIMIT');
    });

    it('должен обработать ошибку 500', () => {
      const error = new Error('Server error');
      const response = { status: 500 };
      const result = handleApiError(error, response);

      expect(result).toBeInstanceOf(ApiError);
      expect(result.status).toBe(500);
      expect(result.code).toBe('SERVER_ERROR');
    });

    it('должен вернуть существующую ошибку если она уже обработана', () => {
      const error = new ApiError('Already handled', 400, 'BAD_REQUEST');
      const result = handleApiError(error, null);

      expect(result).toBe(error);
    });

    it('должен обработать неизвестную ошибку', () => {
      const error = new Error('Unknown error');
      const result = handleApiError(error, null);

      expect(result).toBeInstanceOf(ApiError);
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getErrorMessage', () => {
    it('должен вернуть сообщение для UnauthorizedError', () => {
      const error = new UnauthorizedError();
      const message = getErrorMessage(error);

      expect(message).toContain('Сессия истекла');
    });

    it('должен вернуть сообщение для ForbiddenError', () => {
      const error = new ForbiddenError();
      const message = getErrorMessage(error);

      expect(message).toContain('доступа');
    });

    it('должен вернуть сообщение для NetworkError', () => {
      const error = new NetworkError();
      const message = getErrorMessage(error);

      expect(message).toContain('интернету');
    });

    it('должен вернуть сообщение для TimeoutError', () => {
      const error = new TimeoutError();
      const message = getErrorMessage(error);

      expect(message).toContain('Превышено время ожидания');
    });

    it('должен вернуть сообщение для ApiError', () => {
      const error = new ApiError('Custom error', 400, 'BAD_REQUEST');
      const message = getErrorMessage(error);

      expect(message).toBe('Custom error');
    });

    it('должен вернуть сообщение для обычной ошибки', () => {
      const error = new Error('Regular error');
      const message = getErrorMessage(error);

      expect(message).toBe('Regular error');
    });

    it('должен вернуть сообщение по умолчанию для неизвестной ошибки', () => {
      const message = getErrorMessage(null);

      expect(message).toBe('Произошла ошибка. Попробуйте ещё раз.');
    });
  });

  describe('isUnauthorizedError', () => {
    it('должен вернуть true для UnauthorizedError', () => {
      const error = new UnauthorizedError();
      expect(isUnauthorizedError(error)).toBe(true);
    });

    it('должен вернуть true для ApiError со статусом 401', () => {
      const error = new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
      expect(isUnauthorizedError(error)).toBe(true);
    });

    it('должен вернуть false для других ошибок', () => {
      const error = new ApiError('Bad request', 400, 'BAD_REQUEST');
      expect(isUnauthorizedError(error)).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('должен вернуть true для NetworkError', () => {
      const error = new NetworkError();
      expect(isNetworkError(error)).toBe(true);
    });

    it('должен вернуть true для ошибки с сообщением Network request failed', () => {
      const error = { message: 'Network request failed' };
      expect(isNetworkError(error)).toBe(true);
    });

    it('должен вернуть false для других ошибок', () => {
      const error = new ApiError('Server error', 500, 'SERVER_ERROR');
      expect(isNetworkError(error)).toBe(false);
    });
  });
});

