import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles as appStyles, theme } from '../AppStyles';
import { Ionicons } from '@expo/vector-icons';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'tj', name: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'kg', name: 'Кыргызча', flag: '🇰🇬' },
  { code: 'kz', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const LanguageSelectScreen = ({ onLanguageSelected }) => {
  const { t, i18n } = useTranslation();

  const handleSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    // Slight delay to let the UI update before navigating/closing
    setTimeout(() => {
        if (onLanguageSelected) onLanguageSelected();
    }, 300);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="globe-outline" size={48} color={theme.primary} />
          </View>
          <Text style={styles.title}>{t('selectLanguage')}</Text>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langButton,
                i18n.language === lang.code && styles.langButtonActive
              ]}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[
                styles.langName,
                i18n.language === lang.code && styles.langNameActive
              ]}>
                {lang.name}
              </Text>
              {i18n.language === lang.code && (
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => onLanguageSelected && onLanguageSelected()}
        >
            <Text style={styles.continueButtonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5', // theme.background
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 500,
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1C', // theme.text
    textAlign: 'center',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  langButtonActive: {
    borderColor: '#C62828', // theme.primary
    backgroundColor: '#FFF0F0',
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  langName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1C',
    flex: 1,
  },
  langNameActive: {
    color: '#C62828',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#C62828',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LanguageSelectScreen;
