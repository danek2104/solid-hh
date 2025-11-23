export const normalizeDigits = (value = '') => value.replace(/\D/g, '');

export const formatRussianPhone = (value = '') => {
    let cleaned = value.trim();
    if (cleaned.startsWith('+7')) {
        cleaned = cleaned.slice(2);
    } else if (cleaned.startsWith('+')) {
        cleaned = cleaned.slice(1);
    }
    let digits = normalizeDigits(cleaned);
    if (digits.startsWith('7')) {
        digits = digits.slice(1);
    } else if (digits.startsWith('8')) {
        digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);
    if (digits.length === 10) {
        return `+7${digits}`;
    } else if (digits.length > 0) {
        return `+7${digits}`;
    }
    return '+7';
};

export const validateEmail = (emailValue) => {
    if (!emailValue || !emailValue.trim()) {
        return 'Электронная почта обязательна.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
        return 'Введите корректный email адрес.';
    }
    return null;
};

export const validatePhone = (phoneValue) => {
    if (!phoneValue || !phoneValue.trim()) {
        return 'Номер телефона обязателен.';
    }
    const phoneRegex = /^\+7\d{10}$/;
    if (!phoneRegex.test(phoneValue.trim())) {
        return 'Введите телефон в формате +79824167606';
    }
    return null;
};

export const validatePassword = (passwordValue, isRegister = false) => {
    if (!passwordValue) {
        return 'Пароль обязателен.';
    }
    if (isRegister) {
        if (passwordValue.length < 8) {
            return 'Пароль должен содержать минимум 8 символов.';
        }
        if (!/(?=.*[a-zа-я])/i.test(passwordValue)) {
            return 'Пароль должен содержать хотя бы одну букву.';
        }
        if (!/(?=.*\d)/.test(passwordValue)) {
            return 'Пароль должен содержать хотя бы одну цифру.';
        }
    }
    return null;
};

export const generateVerificationCode = () =>
    Math.floor(100000 + Math.random() * 900000).toString();
