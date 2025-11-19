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
      throw new Error(response?.status?.toString() || 'REQUEST_FAILED');
    }

    const data = await response.json().catch(() => ({}));
    return data;
  } catch (error) {
    console.warn('API запрос отклонён', error?.message || error);
    throw error;
  }
};

const getJson = async (url, timeout = API_TIMEOUT_MS) => {
  try {
    const response = await requestWithTimeout(
      fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }),
      timeout
    );

    if (!response || !response.ok) {
      throw new Error(response?.status?.toString() || 'REQUEST_FAILED');
    }

    const data = await response.json().catch(() => ({}));
    return data;
  } catch (error) {
    console.warn('API запрос отклонён', error?.message || error);
    throw error;
  }
};

/**
 * Получить профиль пользователя
 */
export const fetchProfile = async (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await requestWithTimeout(
    fetch(API_ENDPOINTS.profile, {
      method: 'GET',
      headers,
    }),
    API_TIMEOUT_MS
  );

  if (!response || !response.ok) {
    throw new Error(response?.status?.toString() || 'PROFILE_FETCH_FAILED');
  }

  const data = await response.json().catch(() => ({}));
  return data.profile || data;
};

/**
 * Обновить профиль пользователя
 */
export const updateProfile = async (profilePayload, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await postJson(
    API_ENDPOINTS.profile,
    { profile: profilePayload },
    API_TIMEOUT_MS
  );

  return response?.profile || response;
};

/**
 * Получить статусы документов
 */
export const fetchDocumentStatuses = async (token) => {
  // Предполагаем, что есть отдельный endpoint для статусов документов
  // Если нет, можно использовать общий profile endpoint с параметром
  const url = `${API_ENDPOINTS.profile}/documents/status`;
  
  try {
    const response = await getJson(url, API_TIMEOUT_MS);
    return response;
  } catch (error) {
    // Если endpoint не существует, возвращаем пустой объект
    console.warn('Не удалось получить статусы документов', error);
    return {};
  }
};

export { API_ENDPOINTS, API_TIMEOUT_MS, postJson, getJson };

