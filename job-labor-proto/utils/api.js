import { Platform } from 'react-native';
import {
    NetworkError,
    TimeoutError,
    ApiError,
    UnauthorizedError,
    ForbiddenError,
    CorsError,
    handleApiError
} from './errorHandler';
import { API_TIMEOUT_MS } from '../config';

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

export const postJson = async (url, payload, timeout = API_TIMEOUT_MS) => {
    let response;
    let responseData = {};
    try {
        const fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        };

        if (Platform.OS === 'web') {
            fetchOptions.mode = 'cors';
            fetchOptions.credentials = 'omit';
        }

        response = await requestWithTimeout(
            fetch(url, fetchOptions),
            timeout
        );

        if (!response) {
            throw new NetworkError('Не удалось получить ответ от сервера');
        }

        try {
            responseData = await response.json();
        } catch (e) {
            responseData = {};
        }

        if (!response.ok) {
            const errorMessage = responseData?.message ||
                responseData?.error ||
                `Ошибка запроса: ${response.status}`;

            const apiError = new Error(errorMessage);
            apiError.responseData = responseData;

            const error = handleApiError(apiError, response);

            if (responseData?.message && error instanceof ApiError) {
                error.message = responseData.message;
            }

            throw error;
        }

        return responseData;
    } catch (error) {
        if (error instanceof NetworkError ||
            error instanceof TimeoutError ||
            error instanceof ApiError ||
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof CorsError) {
            throw error;
        }

        const processedError = handleApiError(error, response);

        if (responseData?.message && processedError instanceof ApiError) {
            processedError.message = responseData.message;
        }

        throw processedError;
    }
};
