/**
 * Утилиты для обработки ошибок API
 */

/**
 * Классы ошибок для разных типов ошибок API
 */
export class ApiError extends Error {
  constructor(message, status, code, originalError) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.originalError = originalError;
  }
}

export class NetworkError extends Error {
  constructor(message, originalError) {
    super(message || 'Ошибка сети. Проверьте подключение к интернету.');
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

export class TimeoutError extends Error {
  constructor(message, originalError) {
    super(message || 'Превышено время ожидания запроса.');
    this.name = 'TimeoutError';
    this.originalError = originalError;
  }
}

export class UnauthorizedError extends Error {
  constructor(message, originalError) {
    super(message || 'Сессия истекла. Необходимо войти заново.');
    this.name = 'UnauthorizedError';
    this.originalError = originalError;
  }
}

export class ForbiddenError extends Error {
  constructor(message, originalError) {
    super(message || 'Доступ запрещён.');
    this.name = 'ForbiddenError';
    this.originalError = originalError;
  }
}

export class CorsError extends Error {
  constructor(message, originalError) {
    super(message || 'Ошибка CORS. Сервер не разрешает запросы с этого источника.');
    this.name = 'CorsError';
    this.originalError = originalError;
  }
}

/**
 * Обработать ошибку API и вернуть соответствующий класс ошибки
 */
export const handleApiError = (error, response) => {
  // Если это уже наша ошибка, вернуть её
  if (error instanceof ApiError || 
      error instanceof NetworkError || 
      error instanceof TimeoutError ||
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof CorsError) {
    return error;
  }

  // Обработка HTTP ошибок (приоритет над проверкой сети)
  if (response) {
    const status = response.status;

    switch (status) {
      case 401:
        return new UnauthorizedError(
          'Сессия истекла. Пожалуйста, войдите заново.',
          error
        );
      case 403:
        return new ForbiddenError(
          'У вас нет доступа к этому ресурсу.',
          error
        );
      case 404:
        return new ApiError(
          'Запрашиваемый ресурс не найден.',
          status,
          'NOT_FOUND',
          error
        );
      case 409:
        return new ApiError(
          'Пользователь с такими данными уже существует. Попробуйте войти или восстановить пароль.',
          status,
          'CONFLICT',
          error
        );
      case 422:
        return new ApiError(
          'Данные неверны. Проверьте введённую информацию.',
          status,
          'VALIDATION_ERROR',
          error
        );
      case 429:
        return new ApiError(
          'Слишком много запросов. Подождите немного и попробуйте снова.',
          status,
          'RATE_LIMIT',
          error
        );
      case 500:
      case 502:
      case 503:
        return new ApiError(
          'Ошибка сервера. Попробуйте позже.',
          status,
          'SERVER_ERROR',
          error
        );
      default:
        return new ApiError(
          `Ошибка запроса (${status}). Попробуйте ещё раз.`,
          status,
          'UNKNOWN_ERROR',
          error
        );
    }
  }

  // Обработка ошибок сети (только если нет response)
  if (error.message === 'timeout' || error.name === 'TimeoutError') {
    return new TimeoutError('Превышено время ожидания запроса. Попробуйте ещё раз.', error);
  }

  // Проверка различных вариантов сообщений об ошибках сети
  const errorMessageLower = error?.message?.toLowerCase() || '';
  const errorNameLower = error?.name?.toLowerCase() || '';
  
  // Проверка на ошибки CORS
  const isCorsError = 
    errorMessageLower.includes('cors') ||
    errorMessageLower.includes('cross-origin') ||
    errorMessageLower.includes('политика одного источника') ||
    errorMessageLower.includes('blocked by cors policy') ||
    errorMessageLower.includes('access-control-allow-origin') ||
    (errorMessageLower.includes('failed to fetch') && errorMessageLower.includes('cors')) ||
    (errorNameLower === 'typeerror' && errorMessageLower.includes('cors'));

  if (isCorsError) {
    return new CorsError(
      'Ошибка CORS: сервер не разрешает запросы с этого источника. Попробуйте использовать приложение на мобильном устройстве или обратитесь к администратору.',
      error
    );
  }
  
  const isNetworkError = 
    error.message === 'Network request failed' ||
    errorMessageLower.includes('networkerror') ||
    errorMessageLower.includes('network error') ||
    errorMessageLower.includes('failed to fetch') ||
    errorMessageLower.includes('fetch resource') ||
    errorMessageLower.includes('networkerror when attempting to fetch') ||
    errorNameLower === 'networkerror' ||
    (errorNameLower === 'typeerror' && errorMessageLower.includes('fetch')) ||
    (navigator?.onLine === false && !response);

  if (isNetworkError) {
    return new NetworkError('Нет подключения к интернету. Проверьте соединение.', error);
  }

  // Для неизвестных ошибок пытаемся извлечь полезную информацию
  let errorMessage = 'Произошла ошибка при загрузке данных. Попробуйте ещё раз.';
  
  // Если у ошибки есть сообщение, пытаемся его использовать
  if (error && typeof error === 'object' && error.message) {
    const msg = String(error.message);
    // Если это не техническое сообщение, используем его
    if (msg && msg !== '[object Object]' && !msg.includes('Error:') || msg.length < 100) {
      errorMessage = msg;
    }
  }
  
  // Если ошибка - строка, используем её как сообщение
  if (typeof error === 'string') {
    errorMessage = error;
  }
  
  // Если у ошибки есть поле error с сообщением
  if (error && typeof error === 'object' && error.error) {
    if (typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.error && typeof error.error === 'object' && error.error.message) {
      errorMessage = String(error.error.message);
    }
  }
  
  // Если у ошибки есть поле responseText или responseJSON
  if (error && typeof error === 'object') {
    if (error.responseText) {
      try {
        const parsed = JSON.parse(error.responseText);
        if (parsed.message || parsed.error) {
          errorMessage = String(parsed.message || parsed.error);
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }
    if (error.responseJSON && (error.responseJSON.message || error.responseJSON.error)) {
      errorMessage = String(error.responseJSON.message || error.responseJSON.error);
    }
  }

  // Неизвестная ошибка с улучшенным сообщением
  return new ApiError(
    errorMessage,
    null,
    'UNKNOWN_ERROR',
    error
  );
};

/**
 * Получить понятное сообщение об ошибке для пользователя
 */
export const getErrorMessage = (error) => {
  if (error instanceof UnauthorizedError) {
    return 'Сессия истекла. Пожалуйста, войдите заново.';
  }
  
  if (error instanceof ForbiddenError) {
    return 'У вас нет доступа к этому ресурсу.';
  }
  
  if (error instanceof CorsError) {
    return error.message || 'Ошибка CORS: сервер не разрешает запросы с этого источника. Попробуйте использовать приложение на мобильном устройстве.';
  }
  
  if (error instanceof NetworkError) {
    return 'Нет подключения к интернету. Проверьте соединение.';
  }
  
  if (error instanceof TimeoutError) {
    return 'Превышено время ожидания. Попробуйте ещё раз.';
  }
  
  if (error instanceof ApiError) {
    return error.message || 'Произошла ошибка при выполнении запроса.';
  }
  
  // Для обычных ошибок с сообщением
  if (error?.message) {
    const errorMsg = String(error.message);
    const errorMsgLower = errorMsg.toLowerCase();
    
    // Проверка на ошибки сети в сообщении (даже если это не экземпляр NetworkError)
    if (errorMsgLower.includes('networkerror') ||
        errorMsgLower.includes('network error') ||
        errorMsgLower.includes('failed to fetch') ||
        errorMsgLower.includes('fetch resource') ||
        errorMsgLower.includes('networkerror when attempting to fetch') ||
        (errorMsgLower.includes('fetch') && errorMsgLower.includes('network'))) {
      return 'Нет подключения к интернету. Проверьте соединение.';
    }
    
    // Проверка на таймаут в сообщении
    if (errorMsgLower.includes('timeout') || errorMsgLower.includes('time out')) {
      return 'Превышено время ожидания. Попробуйте ещё раз.';
    }
    
    // Если это ошибка из API с полем status, формируем более понятное сообщение
    if (error.status) {
      if (error.status === 401) {
        return 'Сессия истекла. Пожалуйста, войдите заново.';
      }
      if (error.status === 403) {
        return 'У вас нет доступа к этому ресурсу.';
      }
      if (error.status === 404) {
        return 'Запрашиваемый ресурс не найден.';
      }
      if (error.status === 422) {
        return 'Данные неверны. Проверьте введённую информацию.';
      }
      if (error.status === 500 || error.status === 502 || error.status === 503) {
        return 'Ошибка сервера. Попробуйте позже.';
      }
      return `Ошибка запроса (${error.status}). ${error.message || 'Попробуйте ещё раз.'}`;
    }
    
    // Если сообщение содержит технические детали, заменяем на понятное
    if (errorMsgLower.includes('networkerror when attempting to fetch resource')) {
      return 'Нет подключения к интернету. Проверьте соединение.';
    }
    
    return error.message;
  }
  
  // Если ошибка - строка
  if (typeof error === 'string') {
    return error;
  }
  
  // Если ошибка - объект без message, но с другими полями
  if (error && typeof error === 'object') {
    // Пытаемся найти полезную информацию
    if (error.statusText) {
      return error.statusText;
    }
    if (error.error) {
      return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }
    if (error.toString && error.toString() !== '[object Object]') {
      return error.toString();
    }
  }
  
  return 'Произошла ошибка. Попробуйте ещё раз.';
};

/**
 * Проверить, является ли ошибка ошибкой авторизации (401)
 */
export const isUnauthorizedError = (error) => {
  return error instanceof UnauthorizedError || 
         (error instanceof ApiError && error.status === 401);
};

/**
 * Проверить, является ли ошибка ошибкой сети
 */
export const isNetworkError = (error) => {
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (!error?.message) {
    return false;
  }
  
  const errorMsg = String(error.message).toLowerCase();
  return errorMsg === 'network request failed' ||
         errorMsg.includes('networkerror') ||
         errorMsg.includes('network error') ||
         errorMsg.includes('failed to fetch') ||
         errorMsg.includes('fetch resource') ||
         errorMsg.includes('networkerror when attempting to fetch') ||
         (errorMsg.includes('fetch') && errorMsg.includes('network'));
};

