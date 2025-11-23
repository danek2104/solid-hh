import React, { useContext } from 'react';
import { Redirect } from 'expo-router';
import AuthContext from '../context/AuthContext';
import AuthScreen from '../screens/AuthScreen';

export default function Index() {
    const {
        isAuthenticated,
        authMode,
        setAuthMode,
        authRole,
        setAuthRole,
        authForm,
        handleFormChange,
        handleAuthSubmit,
        isProcessingAuth,
        verificationStatus,
        isSendingVerification,
        handleSendVerification,
        verificationInputs,
        setVerificationInputs,
        handleVerifyCode,
        handleGuestAccess,
    } = useContext(AuthContext);

    const authRoles = [
        { key: 'worker', label: 'Работник', icon: 'person' },
        { key: 'employer', label: 'Работодатель', icon: 'briefcase' },
    ];

    const authBenefits = [
        {
            icon: 'flash',
            title: 'Мгновенные отклики',
            subtitle: 'Сообщаем о горячих подработках за минуту',
        },
        {
            icon: 'shield-checkmark',
            title: 'Проверенные заказчики',
            subtitle: 'Публикуем только подтверждённые смены',
        },
        {
            icon: 'wallet',
            title: 'Контроль выплат',
            subtitle: 'Напоминания о расчётах и долговых обязательствах',
        },
    ];

    if (isAuthenticated) {
        return <Redirect href="/tabs/profile" />;
    }

    return (
        <AuthScreen
            authMode={authMode}
            setAuthMode={setAuthMode}
            authRole={authRole}
            setAuthRole={setAuthRole}
            email={authForm.email}
            phone={authForm.phone}
            password={authForm.password}
            confirmPassword={authForm.confirmPassword}
            handleFormChange={handleFormChange}
            handleAuthSubmit={handleAuthSubmit}
            isProcessingAuth={isProcessingAuth}
            verificationStatus={verificationStatus}
            isSendingVerification={isSendingVerification}
            handleSendVerification={handleSendVerification}
            verificationInputs={verificationInputs}
            setVerificationInputs={setVerificationInputs}
            handleVerifyCode={handleVerifyCode}
            authRoles={authRoles}
            authBenefits={authBenefits}
            handleGuestAccess={handleGuestAccess}
            authForm={authForm}
        />
    );
}