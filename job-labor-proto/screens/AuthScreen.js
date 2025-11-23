import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';
import AuthBenefit from '../components/AuthBenefit';

import RoleSpecificFields from '../components/RoleSpecificFields';

const AuthScreen = ({
  authMode,
  setAuthMode,
  authRole,
  setAuthRole,
  email,
  phone,
  password,
  confirmPassword,
  handleFormChange,
  handleAuthSubmit,
  isProcessingAuth,
  verificationStatus,
  isSendingVerification,
  handleSendVerification,
  verificationInputs,
  setVerificationInputs,
  handleVerifyCode,
  authRoles,
  authBenefits,
  handleGuestAccess,
  authForm,
}) => {
  const authCopy = {
    login: {
      title: 'Войти в аккаунт',
      subtitle: 'Получайте смены быстрее и контролируйте выплаты',
    },
    register: {
      title: 'Создать аккаунт',
      subtitle: 'Поделитесь опытом, подтвердите контакты и начните работу',
    },
    recover: {
      title: 'Восстановление доступа',
      subtitle: 'Отправим ссылку или код для сброса пароля',
    },
  };
  const primaryLabel =
    authMode === 'login'
      ? 'Войти'
      : authMode === 'register'
        ? 'Зарегистрироваться'
        : 'Отправить ссылку';

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#C62828', '#8E0000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.authHero}
      >
        <Text style={styles.authBadge}>workmatch</Text>
        <Text style={styles.authTitle}>Подберём смену уже сегодня</Text>
        <Text style={styles.authSubtitle}>
          Рабочий профиль, подтверждённый опыт и прозрачный график
        </Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.authContent}>
        <View style={styles.authCard}>
          <View style={styles.authModeTabs}>
            {[
              { key: 'login', label: 'Вход' },
              { key: 'register', label: 'Регистрация' },
              { key: 'recover', label: 'Восстановление' },
            ].map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.authModeButton,
                  authMode === mode.key && styles.authModeButtonActive,
                ]}
                onPress={() => setAuthMode(mode.key)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.authModeButtonText,
                    authMode === mode.key && styles.authModeButtonTextActive,
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.authCardTitle}>{authCopy[authMode].title}</Text>
          <Text style={styles.authCardSubtitle}>
            {authCopy[authMode].subtitle}
          </Text>
          {authMode !== 'recover' && (
            <>
              <View style={styles.roleSwitcher}>
                {authRoles.map((role) => (
                  <TouchableOpacity
                    key={role.key}
                    style={[
                      styles.roleButton,
                      authRole === role.key && styles.roleButtonActive,
                    ]}
                    onPress={() => setAuthRole(role.key)}
                    activeOpacity={0.9}
                  >
                    <Ionicons
                      name={role.icon}
                      size={18}
                      color={authRole === role.key ? '#fff' : '#C62828'}
                    />
                    <Text
                      style={[
                        styles.roleButtonText,
                        authRole === role.key && styles.roleButtonTextActive,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.roleHint}>
                {authRole === 'worker'
                  ? 'Получайте смены, отслеживайте выплаты и подтверждайте навыки.'
                  : 'Публикуйте подработки, собирайте отклики и управляйте сменами.'}
              </Text>
            </>
          )}
          <TextInput
            placeholder="Электронная почта"
            placeholderTextColor="#BDBDBD"
            style={styles.authInput}
            value={email}
            autoCapitalize="none"
            onChangeText={(text) => handleFormChange('email', text)}
            keyboardType="email-address"
          />
          {(authMode === 'register' || authMode === 'recover') && (
            <TextInput
              placeholder={
                authMode === 'register'
                  ? 'Номер телефона (например: +79824167606)'
                  : 'Телефон (если нет доступа к почте), например: +79824167606'
              }
              placeholderTextColor="#BDBDBD"
              style={styles.authInput}
              value={phone}
              onChangeText={(text) => handleFormChange('phone', text)}
              keyboardType="phone-pad"
            />
          )}
          {authMode !== 'recover' && (
            <TextInput
              placeholder="Пароль"
              placeholderTextColor="#BDBDBD"
              style={styles.authInput}
              value={password}
              onChangeText={(text) => handleFormChange('password', text)}
              secureTextEntry
            />
          )}
          {authMode === 'register' && (
            <TextInput
              placeholder="Повторите пароль"
              placeholderTextColor="#BDBDBD"
              style={styles.authInput}
              value={confirmPassword}
              onChangeText={(text) => handleFormChange('confirmPassword', text)}
              secureTextEntry
            />
          )}
          {authMode === 'register' && <RoleSpecificFields authRole={authRole} authForm={authForm} handleFormChange={handleFormChange} />}
          {authMode === 'register' && (
            <>
              <Text style={styles.authSubLabel}>Подтверждение контактов</Text>
              <View style={styles.verificationBlock}>
                <View style={styles.verificationHeader}>
                  <Text style={styles.verificationLabel}>Email</Text>
                  {verificationStatus.email && (
                    <Text style={styles.verificationStatusSuccess}>Подтверждён</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.verificationAction,
                    (!email.trim() || isSendingVerification.email) && styles.verificationActionDisabled,
                  ]}
                  onPress={() => handleSendVerification('email')}
                  disabled={!email.trim() || isSendingVerification.email}
                >
                  {isSendingVerification.email ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verificationActionText}>Отправить код</Text>
                  )}
                </TouchableOpacity>
                <TextInput
                  placeholder="Код из email"
                  placeholderTextColor="#BDBDBD"
                  style={styles.authInput}
                  keyboardType="number-pad"
                  value={verificationInputs.email}
                  onChangeText={(text) =>
                    setVerificationInputs((prev) => ({ ...prev, email: text }))
                  }
                />
                <TouchableOpacity
                  style={[
                    styles.verificationAction,
                    !verificationInputs.email && styles.verificationActionDisabled,
                  ]}
                  onPress={() => handleVerifyCode('email')}
                  disabled={!verificationInputs.email}
                >
                  <Text style={styles.verificationActionText}>
                    {verificationStatus.email
                      ? 'Email подтверждён'
                      : 'Подтвердить email'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.verificationBlock}>
                <View style={styles.verificationHeader}>
                  <Text style={styles.verificationLabel}>Телефон</Text>
                  {verificationStatus.phone && (
                    <Text style={styles.verificationStatusSuccess}>Подтверждён</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.verificationAction,
                    (!phone.trim() || isSendingVerification.phone) && styles.verificationActionDisabled,
                  ]}
                  onPress={() => handleSendVerification('phone')}
                  disabled={!phone.trim() || isSendingVerification.phone}
                >
                  {isSendingVerification.phone ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verificationActionText}>Отправить SMS-код</Text>
                  )}
                </TouchableOpacity>
                <TextInput
                  placeholder="Код из SMS"
                  placeholderTextColor="#BDBDBD"
                  style={styles.authInput}
                  keyboardType="number-pad"
                  value={verificationInputs.phone}
                  onChangeText={(text) =>
                    setVerificationInputs((prev) => ({ ...prev, phone: text }))
                  }
                />
                <TouchableOpacity
                  style={[
                    styles.verificationAction,
                    !verificationInputs.phone && styles.verificationActionDisabled,
                  ]}
                  onPress={() => handleVerifyCode('phone')}
                  disabled={!verificationInputs.phone}
                >
                  <Text style={styles.verificationActionText}>
                    {verificationStatus.phone
                      ? 'Телефон подтверждён'
                      : 'Подтвердить телефон'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          <TouchableOpacity
            style={[
              styles.authPrimaryBtn,
              isProcessingAuth && styles.authPrimaryBtnDisabled,
            ]}
            onPress={handleAuthSubmit}
            disabled={isProcessingAuth}
          >
            <Text style={styles.authPrimaryText}>{primaryLabel}</Text>
          </TouchableOpacity>
          <View style={styles.authLinksRow}>
            {authMode !== 'login' && (
              <TouchableOpacity onPress={() => setAuthMode('login')}>
                <Text style={styles.authLink}>У меня есть аккаунт</Text>
              </TouchableOpacity>
            )}
            {authMode !== 'register' && (
              <TouchableOpacity onPress={() => setAuthMode('register')}>
                <Text style={styles.authLink}>Регистрация</Text>
              </TouchableOpacity>
            )}
            {authMode !== 'recover' && (
              <TouchableOpacity onPress={() => setAuthMode('recover')}>
                <Text style={styles.authLink}>Забыли пароль?</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.authBenefits}>
          {authBenefits.map((benefit) => (
            <AuthBenefit key={benefit.title} {...benefit} />
          ))}
        </View>
        <TouchableOpacity onPress={handleGuestAccess}>
          <Text style={styles.authSkip}>Продолжить как гость</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuthScreen;
