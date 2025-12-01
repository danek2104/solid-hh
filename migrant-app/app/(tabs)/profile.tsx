import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Avatar, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/userStore';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
  { code: 'tj', label: 'Тоҷикӣ', flag: '🇹🇯' },
];

export default function ProfileTab() {
  const { user, updateProfile, logout, reset } = useUserStore();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  
  // Fallback if user is null (should not happen if authenticated)
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
          // Clear data on backend so we can "demo" onboarding again
          await api.post(`/users/${user.id}/reset`);
          // Clear local store
          reset();
          // Go to login
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
      router.replace('/'); // Ensure we go back to login
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
            <Avatar.Text size={64} label={safeUser.firstName[0] || 'A'} style={{backgroundColor: '#0066CC'}} />
            <View style={styles.headerText}>
                <Text variant="headlineSmall">{safeUser.firstName} {safeUser.lastName}</Text>
                <Text variant="bodyMedium" style={{color: '#666'}}>{safeUser.citizenship}</Text>
            </View>
            <Button onPress={handleLogout} icon="logout">{t('logout')}</Button>
        </View>

        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium">{t('personalInfo')}</Text>
                    <Button mode="text" onPress={() => isEditing ? handleSave() : setIsEditing(!isEditing)}>
                        {isEditing ? t('save') : t('change')}
                    </Button>
                </View>

                <TextInput
                    label={t('lastName')}
                    value={isEditing ? tempUser.lastName : safeUser.lastName}
                    onChangeText={t => setTempUser({...tempUser, lastName: t})}
                    disabled={!isEditing}
                    mode="outlined"
                    style={styles.input}
                    dense
                />
                 <TextInput
                    label={t('firstName')}
                    value={isEditing ? tempUser.firstName : safeUser.firstName}
                    onChangeText={t => setTempUser({...tempUser, firstName: t})}
                    disabled={!isEditing}
                    mode="outlined"
                    style={styles.input}
                    dense
                />
                 <TextInput
                    label={t('passportNumber')}
                    value={isEditing ? tempUser.passportNumber : `${safeUser.passportSeries || ''} ${safeUser.passportNumber || ''}`}
                    onChangeText={t => setTempUser({...tempUser, passportNumber: t})}
                    disabled={!isEditing}
                    mode="outlined"
                    style={styles.input}
                    dense
                />

                <Text variant="titleMedium" style={{marginTop: 16, marginBottom: 8}}>{t('languages')}</Text>
                <View>
                    {(safeUser.languages && safeUser.languages.length > 0) ? (
                        safeUser.languages.map((lang, index) => (
                            <List.Item 
                                key={index}
                                title={t(`lang_${lang.name}`) || lang.name} // Fallback if translation missing
                                description={t(`proficiency_${lang.level}`)}
                                left={props => <List.Icon {...props} icon="translate" />}
                            />
                        ))
                    ) : (
                        <Text style={{color: '#666'}}>Не указано</Text>
                    )}
                </View>
            </Card.Content>
        </Card>

        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium" style={{marginBottom: 16}}>{t('myDocs')}</Text>
                <List.Item
                    title={t('docPatent')}
                    left={props => <List.Icon {...props} icon="file-clock" color="#F57C00" />}
                />
                <List.Item
                    title="Регистрация"
                    left={props => <List.Icon {...props} icon="file-check" color="#2E7D32" />}
                />
                 <List.Item
                    title="Страховка"
                    left={props => <List.Icon {...props} icon="file-check" color="#2E7D32" />}
                />
            </Card.Content>
        </Card>

        <Button 
            mode="outlined" 
            onPress={handleReset} 
            loading={resetting}
            style={{marginTop: 24, borderColor: '#d32f2f'}}
            textColor="#d32f2f"
        >
            {t('resetDemo')}
        </Button>

        {/* Language Selection Buttons */}
        <View style={styles.langContainer}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity 
                key={lang.code} 
                style={[
                  styles.langButton, 
                  i18n.language === lang.code && styles.langButtonActive
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[
                  styles.langText,
                  i18n.language === lang.code && styles.langTextActive
                ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  // Language Styles
  langContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 16,
    gap: 12,
  },
  langButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc', // Slightly darker than auth for contrast on grey bg
    backgroundColor: '#fff',
    minWidth: 80,
  },
  langButtonActive: {
    borderColor: '#0066CC',
    backgroundColor: '#E3F2FD',
  },
  flag: {
    fontSize: 24,
    marginBottom: 4,
  },
  langText: {
    fontSize: 12,
    color: '#666',
  },
  langTextActive: {
    color: '#0066CC',
    fontWeight: 'bold',
  },
});
