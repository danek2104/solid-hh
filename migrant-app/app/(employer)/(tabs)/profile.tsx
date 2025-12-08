import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import api from '@/services/api';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import * as ImagePicker from 'expo-image-picker';

import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import Card from '@/components/Card';

const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
  { code: 'tj', label: 'Тоҷикӣ', flag: '🇹🇯' },
];

export default function EmployerProfileScreen() {
  const { user, updateProfile, logout, reset } = useUserStore();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t, i18n } = useTranslation();
  
  const safeUser = user || {
      firstName: 'Employer',
      lastName: '',
      phone: '',
      companyName: '',
      companyDescription: '',
      website: '',
      avatarUrl: null,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [tempUser, setTempUser] = useState(safeUser);

  const handleSave = async () => {
    try {
        if (user?.id) {
            const apiData = {
                first_name: tempUser.firstName,
                last_name: tempUser.lastName,
                phone: tempUser.phone,
                company_name: tempUser.companyName,
                company_description: tempUser.companyDescription,
                website: tempUser.website,
            };
            const res = await api.put(`/users/${user.id}`, apiData);
            
            // Map response back to camelCase and update store
            const updatedUser = {
                firstName: res.data.first_name,
                lastName: res.data.last_name,
                phone: res.data.phone,
                companyName: res.data.company_name,
                companyDescription: res.data.company_description,
                website: res.data.website,
            };
            updateProfile(updatedUser);
        } else {
             updateProfile(tempUser);
        }
    } catch (error) {
        console.error("Failed to update profile", error);
        Alert.alert(t('error'), "Failed to save profile");
    }
    setIsEditing(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try {
          if (user?.id) {
            await api.put(`/users/${user.id}`, { avatar_url: base64Img });
            updateProfile({ avatarUrl: base64Img });
          }
      } catch (e) {
          console.error(e);
          Alert.alert(t('error'), "Failed to upload image");
      }
    }
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
    Alert.alert(t('logout'), 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: t('logout'), 
        style: 'destructive', 
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        } 
      },
    ]);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                {safeUser.avatarUrl ? (
                    <Image source={{ uri: safeUser.avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>{safeUser.firstName?.[0] || 'E'}</Text>
                    </View>
                )}
                <View style={[styles.editBadge, { backgroundColor: theme.secondary }]}>
                    <Ionicons name="camera" size={14} color={theme.primary} />
                </View>
            </TouchableOpacity>

            <View style={styles.headerText}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.text }}>
                    {safeUser.firstName} {safeUser.lastName}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.textSecondary }}>
                    {safeUser.companyName || t('companyName')}
                </Text>
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
                label={t('firstName')}
                value={isEditing ? tempUser.firstName : safeUser.firstName}
                onChangeText={t => setTempUser({...tempUser, firstName: t})}
                editable={isEditing}
                style={{ marginBottom: 12 }}
            />
            <CustomInput
                label={t('lastName')}
                value={isEditing ? tempUser.lastName : safeUser.lastName}
                onChangeText={t => setTempUser({...tempUser, lastName: t})}
                editable={isEditing}
                style={{ marginBottom: 12 }}
            />
            <CustomInput
                label={t('phone')}
                value={isEditing ? tempUser.phone : safeUser.phone}
                onChangeText={t => setTempUser({...tempUser, phone: t})}
                editable={isEditing} // Phone often read-only, but keeping editable for MVP
                style={{ marginBottom: 0 }}
            />
        </Card>

        <Card 
            entering={FadeInDown.delay(400)}
            style={styles.card}
        >
            <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.text }}>{t('companyInfo')}</Text>
            </View>
             <CustomInput
                label={t('companyName')}
                value={isEditing ? tempUser.companyName : safeUser.companyName}
                onChangeText={t => setTempUser({...tempUser, companyName: t})}
                editable={isEditing}
                style={{ marginBottom: 12 }}
            />
            <CustomInput
                label={t('description') || "Description"}
                value={isEditing ? tempUser.companyDescription : safeUser.companyDescription}
                onChangeText={t => setTempUser({...tempUser, companyDescription: t})}
                editable={isEditing}
                multiline
                numberOfLines={3}
                style={{ marginBottom: 12, height: 80, textAlignVertical: 'top' }}
            />
             <CustomInput
                label={t('website') || "Website"}
                value={isEditing ? tempUser.website : safeUser.website}
                onChangeText={t => setTempUser({...tempUser, website: t})}
                editable={isEditing}
                placeholder="https://example.com"
                style={{ marginBottom: 0 }}
            />
        </Card>

        <Animated.View entering={FadeInDown.delay(500)}>
            <PrimaryButton 
                title={t('resetDemo')}
                onPress={handleReset} 
                loading={resetting}
                variant="outline"
                style={{ marginTop: 24, borderColor: theme.error }}
                textStyle={{ color: theme.error }}
            />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.langContainer}>
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
  avatarContainer: {
      position: 'relative',
  },
  avatarImage: {
      width: 64,
      height: 64,
      borderRadius: 32,
  },
  editBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'white',
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
