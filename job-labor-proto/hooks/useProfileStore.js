import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    sanitizeProfileValue,
    normalizeProfileDraft,
    validateProfileField,
    reduceProfileErrors,
} from '../utils/profile';

const PROFILE_DRAFT_KEY = 'profileDraft:v1';

const safeCopyObject = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj ? {} : {};
    }
    const result = {};
    try {
        const keys = Object.keys(obj);
        for (const key of keys) {
            if (key === 'focus') {
                continue;
            }
            try {
                const descriptor = Object.getOwnPropertyDescriptor(obj, key);
                if (descriptor) {
                    if (!descriptor.writable && !descriptor.set && descriptor.get) {
                        continue;
                    }
                }
                result[key] = obj[key];
            } catch (e) {
                // ignore
            }
        }
    } catch (e) {
        console.warn('Could not safely copy object:', e.message);
        return {};
    }
    return result;
};

const createProfileState = (initialProfile) => {
    const snapshot = safeCopyObject(initialProfile);
    return {
        snapshot,
        draft: safeCopyObject(snapshot),
        errors: reduceProfileErrors(snapshot),
        isDirty: false,
        isSaving: false,
        modalVisible: false,
        lastError: null,
        lastSavedAt: null,
        isHydrated: false,
        previousSnapshot: safeCopyObject(snapshot),
    };
};

export const formatSavedTime = (timestamp) => {
    if (!timestamp) {
        return null;
    }

    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const profileReducer = (state, action) => {
    switch (action.type) {
        case 'hydrate_base': {
            const snapshot = safeCopyObject(action.payload);
            return {
                ...state,
                snapshot,
                draft: safeCopyObject(snapshot),
                errors: reduceProfileErrors(snapshot),
                isDirty: false,
                isHydrated: true,
                previousSnapshot: safeCopyObject(snapshot),
            };
        }
        case 'hydrate_draft': {
            const sanitizedDraft = normalizeProfileDraft(action.payload);
            const draft = Object.assign({}, safeCopyObject(state.draft), sanitizedDraft);
            return {
                ...state,
                draft,
                errors: reduceProfileErrors(draft),
                isDirty: true,
            };
        }
        case 'update_field': {
            const { field, value } = action.payload;

            if (field === 'focus') {
                return state;
            }

            const sanitized = sanitizeProfileValue(field, value);
            const draft = Object.assign({}, safeCopyObject(state.draft), { [field]: sanitized });
            const nextErrors = { ...state.errors };
            const error = validateProfileField(field, sanitized);
            if (error) {
                nextErrors[field] = error;
            } else {
                delete nextErrors[field];
            }

            return {
                ...state,
                draft,
                errors: nextErrors,
                isDirty: true,
            };
        }
        case 'save_start':
            return {
                ...state,
                isSaving: true,
                lastError: null,
                previousSnapshot: safeCopyObject(state.snapshot),
                snapshot: safeCopyObject(action.payload),
            };
        case 'save_success':
            return {
                ...state,
                isSaving: false,
                isDirty: false,
                lastSavedAt: action.timestamp,
                lastError: null,
                previousSnapshot: { ...state.snapshot },
            };
        case 'save_failure':
            return {
                ...state,
                isSaving: false,
                snapshot: state.previousSnapshot,
                lastError: action.error,
                isDirty: true,
            };
        case 'toggle_modal':
            return {
                ...state,
                modalVisible: action.payload,
            };
        default:
            return state;
    }
};

export const useProfileStore = ({ initialProfile, saveProfileRequest }) => {
    const [state, dispatch] = useReducer(
        profileReducer,
        initialProfile,
        createProfileState
    );

    const prevInitialProfileRef = useRef(null);

    useEffect(() => {
        const prevProfileStr = prevInitialProfileRef.current
            ? JSON.stringify(prevInitialProfileRef.current)
            : null;
        const currentProfileStr = initialProfile
            ? JSON.stringify(initialProfile)
            : null;

        if (prevProfileStr !== currentProfileStr) {
            prevInitialProfileRef.current = initialProfile;
            dispatch({ type: 'hydrate_base', payload: initialProfile });
        }
    }, [initialProfile]);

    useEffect(() => {
        let isMounted = true;
        const restoreDraft = async () => {
            try {
                const stored = await AsyncStorage.getItem(PROFILE_DRAFT_KEY);
                if (stored && isMounted) {
                    dispatch({
                        type: 'hydrate_draft',
                        payload: JSON.parse(stored),
                    });
                }
            } catch (error) {
                console.warn('Failed to restore profile draft', error);
            }
        };

        restoreDraft();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!state.isHydrated) {
            return;
        }

        const timeoutId = setTimeout(() => {
            AsyncStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(state.draft)).catch(
                (error) => console.warn('Failed to save profile draft', error)
            );
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [state.draft, state.isHydrated]);

    const setField = useCallback((field, value) => {
        dispatch({ type: 'update_field', payload: { field, value } });
    }, []);

    const openEditor = useCallback(() => {
        dispatch({ type: 'toggle_modal', payload: true });
    }, []);

    const closeEditor = useCallback(() => {
        dispatch({ type: 'toggle_modal', payload: false });
    }, []);

    const saveProfile = useCallback(async () => {
        if (
            state.isSaving ||
            !state.isDirty ||
            Object.keys(state.errors).length > 0 ||
            !state.isHydrated
        ) {
            return;
        }

        const payload = safeCopyObject(state.draft);
        dispatch({ type: 'save_start', payload });

        try {
            await saveProfileRequest(payload);
            dispatch({ type: 'save_success', timestamp: Date.now() });
            await AsyncStorage.removeItem(PROFILE_DRAFT_KEY);
        } catch (error) {
            dispatch({
                type: 'save_failure',
                error: error?.message || 'Failed to save profile',
            });
        }
    }, [
        saveProfileRequest,
        state.draft,
        state.errors,
        state.isDirty,
        state.isHydrated,
        state.isSaving,
    ]);

    const isValid = useMemo(
        () => Object.keys(state.errors).length === 0,
        [state.errors]
    );

    return {
        draft: state.draft,
        errors: state.errors,
        isDirty: state.isDirty,
        isSaving: state.isSaving,
        isValid,
        modalVisible: state.modalVisible,
        openEditor,
        closeEditor,
        setField,
        saveProfile,
        lastError: state.lastError,
        lastSavedAt: state.lastSavedAt,
        published: state.snapshot,
    };
};

