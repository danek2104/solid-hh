import React, { useContext, useState } from 'react';
import { ScrollView, View, Text, Alert, TouchableOpacity } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { styles } from '../AppStyles';

import SettingsScreen from '../screens/SettingsScreen';
import AuthContext from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export default function Settings() {
    const { width } = useWindowDimensions();
    const isCompact = width < 390;
    const router = useRouter();
    const { token, handleLogout, isEmployer, isAuthenticated } = useContext(AuthContext);

    // Notifications Logic
    const {
        settings: notificationSettings,
        updateSetting: updateNotificationSetting,
        permissions: notificationPermissions,
        requestPermissions
    } = useNotifications();

    // General Settings State (Local for prototype, could be persisted)
    const [settingsState, setSettingsState] = useState({
        darkMode: false,
        sound: true,
        locationTracking: true,
        autoAccept: false,
    });

    const handleToggle = (key) => {
        setSettingsState(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const settingsSchema = [
        {
            id: 'app',
            title: 'Приложение',
            items: [
                { key: 'sound', label: 'Звуковые эффекты', icon: 'musical-note-outline' },
                { key: 'darkMode', label: 'Тёмная тема', icon: 'moon-outline' },
            ]
        },
        {
            id: 'privacy',
            title: 'Конфиденциальность',
            items: [
                { key: 'locationTracking', label: 'Геолокация', icon: 'location-outline' },
            ]
        }
    ];

    // Employer specific settings
    if (isEmployer) {
        settingsSchema.push({
            id: 'employer',
            title: 'Настройки работодателя',
            items: [
                { key: 'autoAccept', label: 'Авто-прием откликов', icon: 'flash-outline' },
            ]
        });
    }

    const onLogout = () => {
        Alert.alert(
            'Выход',
            'Вы уверены, что хотите выйти?',
            [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Выйти', style: 'destructive', onPress: handleLogout }
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[
                    styles.contentContainer,
                    isCompact && styles.contentCompact,
                ]}
            >
                <LinearGradient
                    colors={['#C62828', '#8E0000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.hero, isCompact && styles.heroCompact]}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <TouchableOpacity 
                            onPress={() => router.back()}
                            style={{ marginRight: 12 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.heroLabel}>Аккаунт</Text>
                    </View>
                    <View style={styles.heroHeader}>
                        <View style={styles.heroTextBlock}>
                            <Text style={styles.heroTitle}>Настройки</Text>
                            <Text style={styles.heroSubtitle}>Уведомления и безопасность</Text>
                        </View>
                    </View>
                </LinearGradient>
                <SettingsScreen
                    isCompact={isCompact}
                    notificationSettings={notificationSettings}
                    updateNotificationSetting={updateNotificationSetting}
                    notificationPermissions={notificationPermissions}
                    requestPermissions={requestPermissions}
                    settingsSchema={settingsSchema}
                    settingsState={settingsState}
                    handleToggle={handleToggle}
                    isEmployer={isEmployer}
                    token={token}
                    handleLogout={onLogout}
                    isAuthenticated={isAuthenticated}
                />
            </ScrollView>
        </View>
    );
}
