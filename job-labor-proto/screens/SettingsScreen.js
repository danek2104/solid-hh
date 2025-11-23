import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { styles, theme } from '../AppStyles';
import Section from '../components/Section';
import SettingToggle from '../components/SettingToggle';
import ShortcutCard from '../components/ShortcutCard';

const SettingsScreen = ({
    isCompact,
    notificationSettings,
    updateNotificationSetting,
    notificationPermissions,
    requestPermissions,
    settingsSchema,
    settingsState,
    handleToggle,
    isEmployer,
    token,
    handleLogout,
    isAuthenticated,
}) => {
    const notificationSettingsData = notificationSettings || {};
    return (
        <>
            <Section title="Push-уведомления" compact={isCompact}>
                <SettingToggle
                    compact={isCompact}
                    value={notificationSettingsData.enabled !== false}
                    onToggle={async () => {
                        const newValue = !(notificationSettingsData.enabled !== false);
                        await updateNotificationSetting('enabled', newValue);
                        if (!newValue && notificationPermissions.granted) {
                            Alert.alert(
                                'Уведомления отключены',
                                'Вы больше не будете получать push-уведомления о новых вакансиях и сообщениях.'
                            );
                        }
                    }}
                    key="push_enabled"
                    label="Включить уведомления"
                    subtitle="Получать push-уведомления на устройство"
                />
                {notificationPermissions && !notificationPermissions.granted && (
                    <TouchableOpacity
                        style={styles.requestPermissionButton}
                        onPress={async () => {
                            const result = await requestPermissions();
                            if (result.granted) {
                                Alert.alert('Разрешение предоставлено', 'Теперь вы будете получать уведомления.');
                            } else {
                                Alert.alert(
                                    'Разрешение не предоставлено',
                                    'Для получения уведомлений необходимо предоставить разрешение в настройках устройства.'
                                );
                            }
                        }}
                    >
                        <Text style={styles.requestPermissionButtonText}>
                            Запросить разрешение на уведомления
                        </Text>
                    </TouchableOpacity>
                )}
                {notificationSettingsData.enabled !== false && (
                    <>
                        <SettingToggle
                            compact={isCompact}
                            value={notificationSettingsData.jobs !== false}
                            onToggle={async () => {
                                await updateNotificationSetting('jobs', !(notificationSettingsData.jobs !== false));
                            }}
                            key="push_jobs"
                            label="Уведомления о вакансиях"
                            subtitle="Новые вакансии и обновления"
                        />
                        <SettingToggle
                            compact={isCompact}
                            value={notificationSettingsData.messages !== false}
                            onToggle={async () => {
                                await updateNotificationSetting('messages', !(notificationSettingsData.messages !== false));
                            }}
                            key="push_messages"
                            label="Уведомления о сообщениях"
                            subtitle="Новые сообщения в чатах"
                        />
                        <SettingToggle
                            compact={isCompact}
                            value={notificationSettingsData.shifts !== false}
                            onToggle={async () => {
                                await updateNotificationSetting('shifts', !(notificationSettingsData.shifts !== false));
                            }}
                            key="push_shifts"
                            label="Уведомления о сменах"
                            subtitle="Обновления статусов смен"
                        />
                        <SettingToggle
                            compact={isCompact}
                            value={notificationSettingsData.sound !== false}
                            onToggle={async () => {
                                await updateNotificationSetting('sound', !(notificationSettingsData.sound !== false));
                            }}
                            key="push_sound"
                            label="Звук уведомлений"
                            subtitle="Воспроизводить звук при получении"
                        />
                        <SettingToggle
                            compact={isCompact}
                            value={notificationSettingsData.badge !== false}
                            onToggle={async () => {
                                await updateNotificationSetting('badge', !(notificationSettingsData.badge !== false));
                            }}
                            key="push_badge"
                            label="Счетчик уведомлений"
                            subtitle="Показывать badge на иконке приложения"
                        />
                    </>
                )}
            </Section>

            <Section title="Уведомления" compact={isCompact}>
                {settingsSchema.map((group) => (
                    <View key={group.id} style={{ marginBottom: 16 }}>
                        <Text style={styles.blockTitle}>{group.title}</Text>
                        {group.items.map((setting) => (
                            <SettingToggle
                                key={setting.key}
                                compact={isCompact}
                                value={settingsState[setting.key]}
                                onToggle={() => handleToggle(setting.key)}
                                label={setting.label}
                                subtitle={setting.subtitle} // Ensure subtitle is passed if available
                            />
                        ))}
                    </View>
                ))}
            </Section>

            <Section title="Быстрые действия" compact={isCompact}>
                <View style={styles.shortcutRow}>
                    <ShortcutCard
                        title="Документы"
                        subtitle="Обновить медкнижку"
                        icon="document-text"
                    />
                    <ShortcutCard
                        title="История"
                        subtitle="Посмотреть отзывы"
                        icon="time"
                    />
                </View>
            </Section>

            <Section title="Доступ и безопасность" compact={isCompact}>
                <View style={styles.sessionRow}>
                    <Text style={styles.sessionLabel}>Роль</Text>
                    <Text style={styles.sessionValue}>
                        {isEmployer ? 'Работодатель' : 'Работник'}
                    </Text>
                </View>
                <View style={styles.sessionRow}>
                    <Text style={styles.sessionLabel}>Токен</Text>
                    <Text style={[styles.sessionValue, styles.sessionToken]} numberOfLines={1}>
                        {token ?? 'Нет активного токена'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.logoutButton,
                        !isAuthenticated && styles.logoutButtonDisabled,
                    ]}
                    onPress={handleLogout}
                    disabled={!isAuthenticated}
                >
                    <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
                </TouchableOpacity>
            </Section>
        </>
    );
}

export default SettingsScreen;
