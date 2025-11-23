import { normalizeDigits, formatRussianPhone } from './auth';

export const sanitizeProfileValue = (field, value) => {
    if (field === 'passport') {
        return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 9);
    }

    if (field === 'inn') {
        return normalizeDigits(value).slice(0, 9);
    }

    if (field === 'phone' || field === 'whatsapp') {
        return formatRussianPhone(value);
    }

    return value;
};

export const normalizeProfileDraft = (payload = {}) => {
    const normalized = {};
    Object.keys(payload).forEach((key) => {
        normalized[key] = sanitizeProfileValue(key, payload[key]);
    });
    return normalized;
};

export const validateProfileField = (field, value) => {
    if (field === 'fullName' && value.trim().length < 6) {
        return 'ФИО должно содержать минимум 6 символов';
    }

    if (field === 'passport' && !/^[A-ZА-Я]{2}\d{7}$/.test(value)) {
        return 'Паспорт: 2 буквы и 7 цифр';
    }

    if (field === 'inn' && normalizeDigits(value).length !== 9) {
        return 'ИНН должен состоять из 9 цифр';
    }

    if (
        (field === 'phone' || field === 'whatsapp') &&
        !/^\+7\d{10}$/.test(value)
    ) {
        return 'Введите телефон в формате +79824167606';
    }

    if (field === 'email' && value && !/.+@.+\..+/.test(value)) {
        return 'Введите корректный email';
    }

    return null;
};

export const reduceProfileErrors = (profile) =>
    Object.keys(profile).reduce((acc, key) => {
        const error = validateProfileField(key, profile[key] ?? '');
        if (error) {
            acc[key] = error;
        }
        return acc;
    }, {});
