import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { getValidToken, saveAuthToken, clearAuthToken, getAuthRole } from '../services/authService';
import { API_ENDPOINTS } from '../config';
import {
    getErrorMessage,
    isUnauthorizedError,
    isNetworkError,
    NetworkError,
    TimeoutError,
    ApiError,
    UnauthorizedError,
    ForbiddenError,
    CorsError,
    handleApiError
} from '../utils/errorHandler';
import { postJson } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authRole, setAuthRole] = useState('worker');
    const [isEmployer, setIsEmployer] = useState(false);
    const [token, setToken] = useState(null);
    const [authForm, setAuthForm] = useState({ email: '', phone: '', password: '', confirmPassword: '', workerSkill: '', employerCompany: '' });
    const [authMode, setAuthMode] = useState('login');
    const [isProcessingAuth, setIsProcessingAuth] = useState(false);
    const [verificationCodes, setVerificationCodes] = useState({ email: '', phone: '' });
    const [verificationInputs, setVerificationInputs] = useState({ email: '', phone: '' });
    const [verificationStatus, setVerificationStatus] = useState({ email: false, phone: false });
    const [isSendingVerification, setIsSendingVerification] = useState({ email: false, phone: false });

    const { email, phone, password, confirmPassword, workerSkill, employerCompany } = authForm;

    const normalizeDigits = (value = '') => value.replace(/\D/g, '');

    const formatRussianPhone = (value = '') => {
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

    const validateEmail = useCallback((emailValue) => {
        if (!emailValue || !emailValue.trim()) {
            return 'Электронная почта обязательна.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue.trim())) {
            return 'Введите корректный email адрес.';
        }
        return null;
    }, []);

    const validatePhone = useCallback((phoneValue) => {
        if (!phoneValue || !phoneValue.trim()) {
            return 'Номер телефона обязателен.';
        }
        const phoneRegex = /^\+7\d{10}$/;
        if (!phoneRegex.test(phoneValue.trim())) {
            return 'Введите телефон в формате +79824167606';
        }
        return null;
    }, []);

    const validatePassword = useCallback((passwordValue, isRegister = false) => {
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
    }, []);

    const sendVerificationPayload = useCallback(
        async (target, contact) => {
            if (!contact) {
                throw new Error('Контакт не указан');
            }
            if (target === 'email') {
                const emailError = validateEmail(contact);
                if (emailError) {
                    throw new Error(emailError);
                }
            } else if (target === 'phone') {
                const phoneError = validatePhone(contact);
                if (phoneError) {
                    throw new Error(phoneError);
                }
            }
            return postJson(API_ENDPOINTS.verify, {
                target,
                contact,
                role: authRole,
            });
        },
        [authRole, validateEmail, validatePhone]
    );

    const submitAuthPayload = useCallback(
        (payload) =>
            postJson(API_ENDPOINTS.auth, {
                ...payload,
                role: payload.role ?? authRole,
            }),
        [authRole]
    );

    const resetVerificationState = useCallback(() => {
        setVerificationInputs({ email: '', phone: '' });
        setVerificationCodes({ email: '', phone: '' });
        setVerificationStatus({ email: false, phone: false });
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await clearAuthToken();
        } catch (error) {
            console.warn('Не удалось удалить токен', error);
        } finally {
            setIsAuthenticated(false);
            setToken(null);
            setIsEmployer(false);
            setAuthRole('worker');
            setAuthMode('login');
            setAuthForm({ email: '', phone: '', password: '', confirmPassword: '', workerSkill: '', employerCompany: '' });
            resetVerificationState();
        }
    }, [resetVerificationState]);

    const completeAuth = useCallback(
        async ({ role, token: providedToken, refreshToken, persist = true } = {}) => {
            if (!providedToken) {
                throw new Error('Токен авторизации обязателен');
            }
            const resolvedRole = role ?? authRole;
            const employerRole = resolvedRole === 'employer';
            setIsAuthenticated(true);
            setIsEmployer(employerRole);
            setAuthRole(resolvedRole);
            setToken(providedToken);
            if (persist) {
                saveAuthToken(providedToken, refreshToken || undefined, resolvedRole).catch((error) => {
                    console.warn('Не удалось сохранить сессию', error);
                });
            }
        },
        [authRole]
    );

    const handleFormChange = (field, value) => {
        if (field === 'phone') {
            const formatted = formatRussianPhone(value);
            setAuthForm((prev) => ({ ...prev, [field]: formatted }));
        } else {
            setAuthForm((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleSendVerification = useCallback(
        async (target) => {
            const contact = (target === 'email' ? email : phone).trim();
            if (!contact) {
                Alert.alert('Проверьте данные', `Укажите ${target === 'email' ? 'электронную почту' : 'номер телефона'}, чтобы получить код.`);
                return;
            }
            setIsSendingVerification((prev) => ({ ...prev, [target]: true }));
            try {
                const result = await sendVerificationPayload(target, contact);
                const code = result?.code || Math.floor(100000 + Math.random() * 900000).toString();
                setVerificationCodes((prev) => ({ ...prev, [target]: code }));
                setVerificationStatus((prev) => ({ ...prev, [target]: false }));
                console.log(`Код подтверждения для ${target === 'email' ? 'email' : 'телефона'}: ${code}`);
                Alert.alert('Код отправлен', result?.code ? `Код подтверждения отправлен на ${target === 'email' ? 'email' : 'телефон'}.` : `Используйте код ${code} для подтверждения.`);
            } catch (error) {
                const errorMessage = getErrorMessage(error);
                Alert.alert('Ошибка отправки', errorMessage || `Не удалось отправить код.`);
            } finally {
                setIsSendingVerification((prev) => ({ ...prev, [target]: false }));
            }
        },
        [email, phone, sendVerificationPayload]
    );

    const handleVerifyCode = useCallback(
        (target) => {
            if (!verificationCodes[target]) {
                Alert.alert('Запросите код', 'Мы ещё не отправили код для этого контакта.');
                return;
            }
            if (verificationInputs[target].trim() !== verificationCodes[target]) {
                Alert.alert('Неверный код', 'Сравните код и попробуйте ещё раз.');
                return;
            }
            setVerificationStatus((prev) => ({ ...prev, [target]: true }));
            Alert.alert('Готово', `${target === 'email' ? 'Электронная почта' : 'Телефон'} подтверждён.`);
        },
        [verificationCodes, verificationInputs]
    );

    const handleAuthSubmit = useCallback(async () => {
        if (isProcessingAuth) {
            return;
        }
        const trimmedEmail = email.trim();
        const trimmedPhone = phone.trim();
        if (authMode === 'recover') {
            if (!trimmedEmail && !trimmedPhone) {
                Alert.alert('Укажите контакт', 'Нужен email или телефон для восстановления.');
                return;
            }
            setIsProcessingAuth(true);
            try {
                await submitAuthPayload({ mode: 'recover', email: trimmedEmail || undefined, phone: trimmedPhone || undefined });
                Alert.alert('Ссылка отправлена', trimmedEmail ? `Письмо отправлено на ${trimmedEmail}.` : `SMS отправлено на ${trimmedPhone}.`);
                setAuthMode('login');
            } catch (error) {
                const errorMessage = getErrorMessage(error);
                Alert.alert('Ошибка восстановления', errorMessage || 'Не удалось отправить ссылку.');
            } finally {
                setIsProcessingAuth(false);
            }
            return;
        }
        const emailError = validateEmail(trimmedEmail);
        if (emailError) {
            Alert.alert('Проверьте email', emailError);
            return;
        }
        const passwordError = validatePassword(password, authMode === 'register');
        if (passwordError) {
            Alert.alert('Проверьте пароль', passwordError);
            return;
        }
        if (authMode === 'register') {
            const phoneError = validatePhone(trimmedPhone);
            if (phoneError) {
                Alert.alert('Проверьте телефон', phoneError);
                return;
            }
            if (!confirmPassword || confirmPassword !== password) {
                Alert.alert('Проверьте пароль', 'Пароли должны совпадать.');
                return;
            }
            if (!verificationStatus.email || !verificationStatus.phone) {
                Alert.alert('Подтвердите контакты', 'Нужно подтвердить и email, и телефон.');
                return;
            }
        }
        setIsProcessingAuth(true);
        try {
            const apiPayload = {
                mode: authMode,
                role: authRole,
                email: trimmedEmail,
                password: password,
                phone: trimmedPhone || undefined,
                workerSkill: workerSkill || undefined,
                employerCompany: employerCompany || undefined,
                ...(authMode === 'register' && verificationStatus.email && verificationStatus.phone && {
                    emailVerificationCode: verificationInputs.email.trim() || undefined,
                    phoneVerificationCode: verificationInputs.phone.trim() || undefined,
                }),
            };
            const apiResult = await submitAuthPayload(apiPayload);
            const issuedToken = apiResult?.token || apiResult?.data?.token;
            const refreshToken = apiResult?.refreshToken || apiResult?.data?.refreshToken;
            if (!issuedToken) {
                throw new ApiError('Токен авторизации не получен.');
            }
            await completeAuth({ role: authRole, token: issuedToken, refreshToken });
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            if (authMode === 'register' && error instanceof ApiError && error.status === 409) {
                Alert.alert('Пользователь уже существует', errorMessage || 'Пользователь с такими данными уже зарегистрирован.',
                    [{ text: 'Войти', onPress: () => setAuthMode('login') }, { text: 'Отмена', style: 'cancel' }]);
            } else {
                Alert.alert(authMode === 'register' ? 'Ошибка регистрации' : 'Ошибка входа', errorMessage || 'Проверьте данные и попробуйте снова.');
            }
        } finally {
            setIsProcessingAuth(false);
        }
    }, [authMode, authRole, completeAuth, confirmPassword, email, employerCompany, isProcessingAuth, password, phone, submitAuthPayload, validateEmail, validatePhone, validatePassword, verificationStatus.email, verificationStatus.phone, verificationInputs.email, verificationInputs.phone, resetVerificationState, workerSkill]);

    const handleGuestAccess = useCallback(async () => {
        try {
            await AsyncStorage.multiRemove(['authToken', 'authRole']);
        } catch (error) {
            console.warn('Не удалось очистить гостевую сессию', error);
        }
        setIsAuthenticated(true);
        setIsEmployer(false);
        setAuthRole('worker');
        setToken(null);
        setAuthMode('login');
        setAuthForm({ email: '', phone: '', password: '', confirmPassword: '', workerSkill: '', employerCompany: '' });
        resetVerificationState();
    }, [resetVerificationState]);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const storedToken = await getValidToken();
                const storedRole = await getAuthRole();
                if (storedToken) {
                    const resolvedRole = storedRole || 'worker';
                    setToken(storedToken);
                    setAuthRole(resolvedRole);
                    setIsEmployer(resolvedRole === 'employer');
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.warn('Не удалось восстановить сессию', error);
            }
        };
        restoreSession();
    }, []);

    const authContextValue = {
        isAuthenticated,
        authRole,
        isEmployer,
        token,
        authForm,
        authMode,
        isProcessingAuth,
        verificationCodes,
        verificationInputs,
        verificationStatus,
        isSendingVerification,
        setAuthMode,
        setAuthRole,
        handleFormChange,
        handleAuthSubmit,
        handleSendVerification,
        handleVerifyCode,
        handleLogout,
        handleGuestAccess,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
