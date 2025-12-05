import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import { Text, List, Modal, Portal, PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import PrimaryButton from '@/components/PrimaryButton';
import CustomInput from '@/components/CustomInput';
import { useColorScheme } from '@/components/useColorScheme';

const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
  { code: 'tj', label: 'Тоҷикӣ', flag: '🇹🇯' },
];

const COUNTRY_CODES = [
  { code: '+7', flag: '🇷🇺', mask: '(999) 000-00-00', label: 'Russia' },
  { code: '+998', flag: '🇺🇿', mask: '(99) 000-00-00', label: 'Uzbekistan' },
  { code: '+992', flag: '🇹🇯', mask: '(99) 000-00-00', label: 'Tajikistan' },
];

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]);
  const [visibleModal, setVisibleModal] = useState(false);
  
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleSendCode = () => {
    if (phone.length < 7) return;
    const fullPhone = `${selectedCode.code}${phone}`;
    router.push({ pathname: '/(auth)/verify', params: { phone: fullPhone } });
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <Portal>
            <Modal 
              visible={visibleModal} 
              onDismiss={() => setVisibleModal(false)} 
              contentContainerStyle={[styles.modalContent, { backgroundColor: theme.surface }]}
            >
              <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.text }]}>
                {t('selectCountry', 'Select Country Code')}
              </Text>
              {COUNTRY_CODES.map((c) => (
                <List.Item
                  key={c.code}
                  title={`${c.flag}  ${c.code}`}
                  titleStyle={{ color: theme.text }}
                  onPress={() => {
                    setSelectedCode(c);
                    setVisibleModal(false);
                  }}
                  style={styles.modalItem}
                  right={props => selectedCode.code === c.code ? <List.Icon {...props} icon="check" color={theme.primary}/> : null}
                />
              ))}
            </Modal>
          </Portal>

          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.headerContainer}>
            <View style={styles.logoPlaceholder}>
               <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
                  <Text style={styles.logoText}>M</Text>
               </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.langContainer}>
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

          <View style={styles.content}>
            <Animated.View entering={FadeInDown.delay(600).duration(500)}>
              <Text variant="headlineMedium" style={[styles.title, { color: theme.text }]}>
                {t('welcome')}
              </Text>
              <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.textSecondary }]}>
                {t('enterPhone')}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.phoneRow}>
               <TouchableOpacity 
                  onPress={() => setVisibleModal(true)}
                  style={[
                    styles.codeSelector, 
                    { 
                      backgroundColor: theme.surface, 
                      borderColor: theme.border,
                    }
                  ]}
                >
                   <Text style={{fontSize: 16, color: theme.text, fontWeight: '600'}}>
                     {selectedCode.flag} {selectedCode.code}
                   </Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <CustomInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder={selectedCode.mask}
                    style={{ marginBottom: 0 }}
                  />
                </View>
            </Animated.View>
            
            <Animated.View entering={FadeInDown.delay(1000).duration(500)}>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {t('sendCodeInfo')}
              </Text>

              <PrimaryButton 
                title={t('continue')} 
                onPress={handleSendCode} 
                disabled={phone.length < 5}
                style={styles.button}
              />
            </Animated.View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  logoPlaceholder: {
    marginBottom: 10,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  logoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  langContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  langButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  flag: {
    fontSize: 20,
    marginBottom: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
    marginTop: -40,
  },
  title: {
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 16,
    lineHeight: 24,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  codeSelector: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 24,
    opacity: 0.7,
  },
  button: {
    marginTop: 8,
  },
  modalContent: {
    padding: 24,
    margin: 24,
    borderRadius: 24,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalItem: {
    paddingVertical: 4,
    borderRadius: 12,
  }
});
