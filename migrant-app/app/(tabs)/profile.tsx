import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useUserStore } from '../../store/userStore';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import Card from '@/components/Card';
import { useColorScheme } from '@/components/useColorScheme';

const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
  { code: 'tj', label: 'Тоҷикӣ', flag: '🇹🇯' },
];

export default function ProfileTab() {
  const { user, updateProfile, logout, reset } = useUserStore();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const safeUser = user || {
      firstName: 'Guest',
      lastName: '',
      passportSeries: '',
      passportNumber: '',
      citizenship: '',
      languages: []
  };

  const [isEditing, setIsEditing] = useState(false);
  const [tempUser, setTempUser] = useState(safeUser);
  const { t, i18n } = useTranslation();

  const handleSave = () => {
    updateProfile(tempUser);
    setIsEditing(false);
  };

  const handleReset = async () => {
      if (!user?.id) {
          reset();
          router.replace('/');
          return;
      }
      
      setResetting(true);
      try {
          await api.post(`/users/${user.id}/reset`);
          reset();
          router.replace('/');
      } catch (error) {
          console.error("Reset failed", error);
          alert("Reset failed");
      } finally {
          setResetting(false);
      }
  };

  const handleLogout = () => {
      logout();
      router.replace('/'); 
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>{safeUser.firstName[0] || 'G'}</Text>
            </View>
            <View style={styles.headerText}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.text }}>{safeUser.firstName} {safeUser.lastName}</Text>
                <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>{safeUser.citizenship || 'Citizenship not set'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: theme.secondary }]}>
                <Ionicons name="log-out-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
        </Animated.View>

        <Card 
            entering={FadeInDown.delay(300)} 
            layout={Layout.springify()}
            style={styles.card}
        >
            <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.text }}>{t('personalInfo')}</Text>
                <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(!isEditing)}>
                    <Text style={{ color: theme.primary, fontWeight: '600' }}>
                        {isEditing ? t('save') : t('change')}
                    </Text>
                </TouchableOpacity>
            </View>

            <CustomInput
                label={t('lastName')}
                value={isEditing ? tempUser.lastName : safeUser.lastName}
                onChangeText={t => setTempUser({...tempUser, lastName: t})}
                editable={isEditing}
                style={{ marginBottom: 12 }}
            />
                <CustomInput
                label={t('firstName')}
                value={isEditing ? tempUser.firstName : safeUser.firstName}
                onChangeText={t => setTempUser({...tempUser, firstName: t})}
                editable={isEditing}
                style={{ marginBottom: 12 }}
            />
                <CustomInput
                label={t('passportNumber')}
                value={isEditing ? tempUser.passportNumber : `${safeUser.passportSeries || ''} ${safeUser.passportNumber || ''}`}
                onChangeText={t => setTempUser({...tempUser, passportNumber: t})}
                editable={isEditing}
                style={{ marginBottom: 0 }}
            />
        </Card>

        <Card 
            entering={FadeInDown.delay(400)}
            style={styles.card}
        >
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16, color: theme.text }}>{t('languages')}</Text>
            <View>
                {(safeUser.languages && safeUser.languages.length > 0) ? (
                    safeUser.languages.map((lang, index) => (
                        <View key={index} style={styles.langRow}>
                            <Ionicons name="language" size={20} color={theme.primary} style={{ marginRight: 12 }} />
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: '500', color: theme.text }}>{t(`lang_${lang.name}`) || lang.name}</Text>
                                <Text style={{ fontSize: 14, color: theme.textSecondary }}>{t(`proficiency_${lang.level}`)}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={{ color: theme.textSecondary }}>Не указано</Text>
                )}
            </View>
        </Card>

        <Card 
            entering={FadeInDown.delay(500)}
            style={styles.card}
        >
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16, color: theme.text }}>{t('myDocs')}</Text>
            
            {[
                { title: t('docPatent'), icon: 'time-outline', color: '#F57C00' },
                { title: "Регистрация", icon: 'checkmark-circle-outline', color: '#2E7D32' },
                { title: "Страховка", icon: 'checkmark-circle-outline', color: '#2E7D32' }
            ].map((item, idx) => (
                <View key={idx} style={styles.docRow}>
                        <Ionicons name={item.icon as any} size={24} color={item.color} style={{ marginRight: 12 }} />
                        <Text style={{ fontSize: 16, color: theme.text }}>{item.title}</Text>
                </View>
            ))}
        </Card>

        <Animated.View entering={FadeInDown.delay(600)}>
            <PrimaryButton 
                title={t('resetDemo')}
                onPress={handleReset} 
                loading={resetting}
                variant="outline"
                style={{ marginTop: 24, borderColor: theme.error }}
                textStyle={{ color: theme.error }}
            />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700)} style={styles.langContainer}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity 
                key={lang.code} 
                style={[
                  styles.langButton, 
                  i18n.language === lang.code ? 
                    { backgroundColor: theme.primary, borderColor: theme.primary } : 
                    { backgroundColor: theme.surface, borderColor: theme.border }
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[
                  styles.langText,
                  { color: i18n.language === lang.code ? '#FFF' : theme.textSecondary }
                ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
  },
  avatarText: {
      fontSize: 28,
      color: 'white',
      fontWeight: 'bold',
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  logoutBtn: {
      padding: 10,
      borderRadius: 12,
  },
  card: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
  },
  docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
  },
  langContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  langButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
  },
  flag: {
    fontSize: 24,
    marginBottom: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
